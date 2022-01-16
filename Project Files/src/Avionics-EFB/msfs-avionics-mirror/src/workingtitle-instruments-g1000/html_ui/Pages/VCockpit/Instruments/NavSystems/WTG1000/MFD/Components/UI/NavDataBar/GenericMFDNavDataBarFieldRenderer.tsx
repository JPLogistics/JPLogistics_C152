import { FSComponent, NavAngleUnit, NumberFormatter, NumberUnitInterface, Subject, UnitFamily, UnitType, VNode } from 'msfssdk';
import { DurationDisplayDelim, DurationDisplayFormat } from 'msfssdk/components/common';
import { NavDataBearingField, NavDataDurationField, NavDataGenericField, NavDataNumberUnitField } from '../../../../Shared/UI/NavDataField/NavDataField';
import { NavDataFieldType } from '../../../../Shared/UI/NavDataField/NavDataFieldType';
import { UnitsUserSettingManager } from '../../../../Shared/Units/UnitsUserSettings';
import { MFDNavDataBarFieldModel, MFDNavDataBarFieldTypeModelMap } from './MFDNavDataBarFieldModel';

/**
 * Renders data field components for a single type of navigation data bar field.
 */
export interface MFDNavDataBarFieldTypeRenderer<T extends NavDataFieldType> {
  /**
   * Renders a navigation data bar field of this renderer's data field type.
   * @param model The data model to use for the data field.
   * @returns A navigation data bar field of this renderer's data field type, as a VNode.
   */
  render(model: MFDNavDataBarFieldTypeModelMap[T]): VNode;
}

/**
 * A generic implementation of an MFD navigation data bar field renderer. For each data field type, a single-type
 * renderer can be registered. Once registered, the single-type renderer is used to create render data fields for its
 * assigned data field type.
 */
export class GenericMFDNavDataBarFieldRenderer {
  private readonly renderers = new Map<NavDataFieldType, MFDNavDataBarFieldTypeRenderer<NavDataFieldType>>();

  /**
   * Registers a single-type renderer.
   * @param type The data field type of the single-type renderer to register.
   * @param renderer The single-type renderer to register.
   */
  public register<T extends NavDataFieldType>(type: T, renderer: MFDNavDataBarFieldTypeRenderer<T>): void {
    this.renderers.set(type, renderer);
  }

  /**
   * Deregisters a single-type renderer.
   * @param type The data field type of the single-type renderer to deregister.
   * @returns Whether a single-type renderer was deregistered.
   */
  public deregister<T extends NavDataFieldType>(type: T): boolean {
    return this.renderers.delete(type);
  }

  /**
   * Renders a navigation data bar field of a given type.
   * @param type A data bar field type.
   * @param model The data model for the field.
   * @returns A navigation data bar field of the given type, as a VNode.
   * @throws Error if an unsupported field type is specified.
   */
  public render<T extends NavDataFieldType>(type: T, model: MFDNavDataBarFieldTypeModelMap[T]): VNode {
    const rendered = this.renderers.get(type)?.render(model);

    if (!rendered) {
      throw new Error(`DefaultMFDNavDataBarFieldRenderer: no single-type renderer of data field type [${type}] is registered`);
    }

    return rendered;
  }
}

/**
 * An abstract implementation of MFDNavDataBarFieldTypeRenderer which supports display unit settings.
 */
export abstract class AbstractMFDNavDataBarFieldTypeRenderer<T extends NavDataFieldType> implements MFDNavDataBarFieldTypeRenderer<T> {
  protected static readonly BEARING_FORMATTER = NumberFormatter.create({ precision: 1, pad: 3, nanString: '___' });
  protected static readonly DISTANCE_FORMATTER = NumberFormatter.create({ precision: 0.1, maxDigits: 3, forceDecimalZeroes: true, nanString: '__._' });
  protected static readonly SPEED_FORMATTER = NumberFormatter.create({ precision: 1, nanString: '___' });
  protected static readonly FUEL_FORMATTER = NumberFormatter.create({ precision: 1, nanString: '___' });
  protected static readonly ANGLE_FORMATTER = NumberFormatter.create({ precision: 1, nanString: '___' });
  protected static readonly DURATION_OPTIONS = {
    pad: 0,
    format: DurationDisplayFormat.hh_mm_or_mm_ss,
    delim: DurationDisplayDelim.ColonOrCross,
    nanString: '__:__'
  };

  /**
   * Constructor.
   * @param unitsSettingManager A user setting manager for measurement units.
   */
  constructor(protected readonly unitsSettingManager: UnitsUserSettingManager) {
  }

  /** @inheritdoc */
  public abstract render(model: MFDNavDataBarFieldTypeModelMap[T]): VNode;
}

/**
 * Renders Bearing to Waypoint navigation data bar fields.
 */
export class MFDNavDataBarFieldBrgRenderer extends AbstractMFDNavDataBarFieldTypeRenderer<NavDataFieldType.BearingToWaypoint> {
  /** @inheritdoc */
  public render(model: MFDNavDataBarFieldModel<NumberUnitInterface<typeof NavAngleUnit.FAMILY>>): VNode {
    return (
      <NavDataBearingField
        title='BRG'
        model={model as MFDNavDataBarFieldTypeModelMap[NavDataFieldType.BearingToWaypoint]}
        displayUnit={this.unitsSettingManager.navAngleUnits}
        formatter={AbstractMFDNavDataBarFieldTypeRenderer.BEARING_FORMATTER}
        class='magenta'
      />
    );
  }
}

/**
 * Renders Distance to Waypoint navigation data bar fields.
 */
export class MFDNavDataBarFieldDestRenderer extends AbstractMFDNavDataBarFieldTypeRenderer<NavDataFieldType.Destination> {
  /** @inheritdoc */
  public render(model: MFDNavDataBarFieldModel<string>): VNode {
    // This seems silly but we need to create our own subscribable in order to be able unsubscribe from it when the
    // component is destroyed.
    const textSub = model.value.map(val => val);

    return (
      <NavDataGenericField
        title='DEST'
        model={model}
        onDestroy={(): void => {
          textSub.destroy();
        }}
        class='white'
      >
        <div>{textSub}</div>
      </NavDataGenericField>
    );
  }
}

/**
 * Renders Distance to Waypoint navigation data bar fields.
 */
export class MFDNavDataBarFieldDisRenderer extends AbstractMFDNavDataBarFieldTypeRenderer<NavDataFieldType.DistanceToWaypoint> {
  /** @inheritdoc */
  public render(model: MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Distance>>): VNode {
    return (
      <NavDataNumberUnitField
        title='DIS'
        model={model}
        displayUnit={this.unitsSettingManager.distanceUnitsLarge}
        formatter={AbstractMFDNavDataBarFieldTypeRenderer.DISTANCE_FORMATTER}
        class='magenta'
      />
    );
  }
}

/**
 * Renders Distance to Destination navigation data bar fields.
 */
export class MFDNavDataBarFieldDtgRenderer extends AbstractMFDNavDataBarFieldTypeRenderer<NavDataFieldType.DistanceToDestination> {
  /** @inheritdoc */
  public render(model: MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Distance>>): VNode {
    return (
      <NavDataNumberUnitField
        title='DTG'
        model={model}
        displayUnit={this.unitsSettingManager.distanceUnitsLarge}
        formatter={AbstractMFDNavDataBarFieldTypeRenderer.DISTANCE_FORMATTER}
        class='magenta'
      />
    );
  }
}

/**
 * Renders Desired Track navigation data bar fields.
 */
export class MFDNavDataBarFieldDtkRenderer extends AbstractMFDNavDataBarFieldTypeRenderer<NavDataFieldType.DesiredTrack> {
  /** @inheritdoc */
  public render(model: MFDNavDataBarFieldModel<NumberUnitInterface<typeof NavAngleUnit.FAMILY>>): VNode {
    return (
      <NavDataBearingField
        title='DTK'
        model={model}
        displayUnit={this.unitsSettingManager.navAngleUnits}
        formatter={AbstractMFDNavDataBarFieldTypeRenderer.BEARING_FORMATTER}
        class='magenta'
      />
    );
  }
}

/**
 * Renders Endurance navigation data bar fields.
 */
export class MFDNavDataBarFieldEndRenderer extends AbstractMFDNavDataBarFieldTypeRenderer<NavDataFieldType.Endurance> {
  /** @inheritdoc */
  public render(model: MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Duration>>): VNode {
    return (
      <NavDataDurationField
        title='END'
        model={model}
        options={AbstractMFDNavDataBarFieldTypeRenderer.DURATION_OPTIONS}
        class='magenta'
      />
    );
  }
}

/**
 * Renders Time to Destination navigation data bar fields.
 */
export class MFDNavDataBarFieldEtaRenderer extends AbstractMFDNavDataBarFieldTypeRenderer<NavDataFieldType.TimeToDestination> {
  /** @inheritdoc */
  public render(model: MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Duration>>): VNode {
    return (
      <NavDataDurationField
        title='ETA'
        model={model}
        options={AbstractMFDNavDataBarFieldTypeRenderer.DURATION_OPTIONS}
        class='magenta'
      />
    );
  }
}

/**
 * Renders Time to Waypoint navigation data bar fields.
 */
export class MFDNavDataBarFieldEteRenderer extends AbstractMFDNavDataBarFieldTypeRenderer<NavDataFieldType.TimeToWaypoint> {
  /** @inheritdoc */
  public render(model: MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Duration>>): VNode {
    return (
      <NavDataDurationField
        title='ETE'
        model={model}
        options={AbstractMFDNavDataBarFieldTypeRenderer.DURATION_OPTIONS}
        class='magenta'
      />
    );
  }
}

/**
 * Renders Fuel on Board navigation data bar fields.
 */
export class MFDNavDataBarFieldFobRenderer extends AbstractMFDNavDataBarFieldTypeRenderer<NavDataFieldType.FuelOnBoard> {
  /** @inheritdoc */
  public render(model: MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Weight>>): VNode {
    return (
      <NavDataNumberUnitField
        title='FOB'
        model={model}
        displayUnit={Subject.create(UnitType.GALLON_FUEL)}
        formatter={AbstractMFDNavDataBarFieldTypeRenderer.FUEL_FORMATTER}
        class='magenta'
      />
    );
  }
}

/**
 * Renders Fuel Over Destination navigation data bar fields.
 */
export class MFDNavDataBarFieldFodRenderer extends AbstractMFDNavDataBarFieldTypeRenderer<NavDataFieldType.FuelOverDestination> {
  /** @inheritdoc */
  public render(model: MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Weight>>): VNode {
    return (
      <NavDataNumberUnitField
        title='FOD'
        model={model}
        displayUnit={Subject.create(UnitType.GALLON_FUEL)}
        formatter={AbstractMFDNavDataBarFieldTypeRenderer.FUEL_FORMATTER}
        class='magenta'
      />
    );
  }
}

/**
 * Renders Ground Speed navigation data bar fields.
 */
export class MFDNavDataBarFieldGsRenderer extends AbstractMFDNavDataBarFieldTypeRenderer<NavDataFieldType.GroundSpeed> {
  /** @inheritdoc */
  public render(model: MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Speed>>): VNode {
    return (
      <NavDataNumberUnitField
        title='GS'
        model={model}
        displayUnit={this.unitsSettingManager.speedUnits}
        formatter={AbstractMFDNavDataBarFieldTypeRenderer.SPEED_FORMATTER}
        class='magenta'
      />
    );
  }
}

/**
 * Renders True Airspeed navigation data bar fields.
 */
export class MFDNavDataBarFieldTasRenderer extends AbstractMFDNavDataBarFieldTypeRenderer<NavDataFieldType.TrueAirspeed> {
  /** @inheritdoc */
  public render(model: MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Speed>>): VNode {
    return (
      <NavDataNumberUnitField
        title='TAS'
        model={model}
        displayUnit={this.unitsSettingManager.speedUnits}
        formatter={AbstractMFDNavDataBarFieldTypeRenderer.SPEED_FORMATTER}
        class='magenta'
      />
    );
  }
}

/**
 * Renders Track Angle Error navigation data bar fields.
 */
export class MFDNavDataBarFieldTkeRenderer extends AbstractMFDNavDataBarFieldTypeRenderer<NavDataFieldType.TrackAngleError> {
  /** @inheritdoc */
  public render(model: MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Angle>>): VNode {
    return (
      <NavDataNumberUnitField
        title='TKE'
        model={model}
        displayUnit={Subject.create(UnitType.DEGREE)}
        formatter={AbstractMFDNavDataBarFieldTypeRenderer.ANGLE_FORMATTER}
        class='magenta'
      />
    );
  }
}

/**
 * Renders Ground Track navigation data bar fields.
 */
export class MFDNavDataBarFieldTrkRenderer extends AbstractMFDNavDataBarFieldTypeRenderer<NavDataFieldType.GroundTrack> {
  /** @inheritdoc */
  public render(model: MFDNavDataBarFieldModel<NumberUnitInterface<typeof NavAngleUnit.FAMILY>>): VNode {
    return (
      <NavDataBearingField
        title='TRK'
        model={model}
        displayUnit={this.unitsSettingManager.navAngleUnits}
        formatter={AbstractMFDNavDataBarFieldTypeRenderer.BEARING_FORMATTER}
        class='magenta'
      />
    );
  }
}

/**
 * Renders Vertical Speed Required navigation data bar fields.
 */
export class MFDNavDataBarFieldVsrRenderer extends AbstractMFDNavDataBarFieldTypeRenderer<NavDataFieldType.VerticalSpeedRequired> {
  /** @inheritdoc */
  public render(model: MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Speed>>): VNode {
    return (
      <NavDataNumberUnitField
        title='VSR'
        model={model as MFDNavDataBarFieldTypeModelMap[NavDataFieldType.VerticalSpeedRequired]}
        displayUnit={this.unitsSettingManager.verticalSpeedUnits}
        formatter={AbstractMFDNavDataBarFieldTypeRenderer.SPEED_FORMATTER}
        class='magenta'
      />
    );
  }
}

/**
 * Renders Cross Track navigation data bar fields.
 */
export class MFDNavDataBarFieldXtkRenderer extends AbstractMFDNavDataBarFieldTypeRenderer<NavDataFieldType.CrossTrack> {
  /** @inheritdoc */
  public render(model: MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Distance>>): VNode {
    return (
      <NavDataNumberUnitField
        title='XTK'
        model={model}
        displayUnit={this.unitsSettingManager.distanceUnitsLarge}
        formatter={AbstractMFDNavDataBarFieldTypeRenderer.DISTANCE_FORMATTER}
        class='magenta'
      />
    );
  }
}