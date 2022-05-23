import { FSComponent, NavAngleUnit, NumberUnitInterface, Subject, UnitFamily, UnitType, VNode } from 'msfssdk';
import { NumberFormatter } from 'msfssdk/graphics/text';
import { DurationDisplayDelim, DurationDisplayFormat } from 'msfssdk/components/common';
import { ConsumerSubject } from 'msfssdk/data';
import { UserSettingManager } from 'msfssdk/settings';
import { NavDataBearingField, NavDataDurationField, NavDataGenericField, NavDataNumberUnitField, NavDataTimeField } from '../navdatafield/NavDataField';
import { NavDataFieldType } from '../navdatafield/NavDataFieldType';
import { NavDataBarFieldModel, NavDataBarFieldTypeModelMap } from './NavDataBarFieldModel';
import { UnitsUserSettingManager } from '../../settings/UnitsUserSettings';
import { DateTimeFormatSettingMode, DateTimeUserSettingTypes } from '../../settings/DateTimeUserSettings';
import { TimeDisplayFormat } from '../common/TimeDisplay';

/**
 * Renders data field components for a single type of navigation data bar field.
 */
export interface NavDataBarFieldTypeRenderer<T extends NavDataFieldType> {
  /**
   * Renders a navigation data bar field of this renderer's data field type.
   * @param model The data model to use for the data field.
   * @returns A navigation data bar field of this renderer's data field type, as a VNode.
   */
  render(model: NavDataBarFieldTypeModelMap[T]): VNode;
}

/**
 * A generic implementation of a navigation data bar field renderer. For each data field type, a single-type renderer
 * can be registered. Once registered, the single-type renderer is used to create render data fields for its assigned
 * data field type.
 */
export class GenericNavDataBarFieldRenderer {
  private readonly renderers = new Map<NavDataFieldType, NavDataBarFieldTypeRenderer<NavDataFieldType>>();

  /**
   * Registers a single-type renderer.
   * @param type The data field type of the single-type renderer to register.
   * @param renderer The single-type renderer to register.
   */
  public register<T extends NavDataFieldType>(type: T, renderer: NavDataBarFieldTypeRenderer<T>): void {
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
  public render<T extends NavDataFieldType>(type: T, model: NavDataBarFieldTypeModelMap[T]): VNode {
    const rendered = this.renderers.get(type)?.render(model);

    if (!rendered) {
      throw new Error(`GenericNavDataBarFieldRenderer: no single-type renderer of data field type [${type}] is registered`);
    }

    return rendered;
  }
}

/**
 * An abstract implementation of NavDataBarFieldTypeRenderer which supports display unit settings.
 */
export abstract class DisplayUnitNavDataBarFieldTypeRenderer<T extends NavDataFieldType> implements NavDataBarFieldTypeRenderer<T> {
  protected static readonly BEARING_FORMATTER = NumberFormatter.create({ precision: 1, pad: 3, nanString: '___' });
  protected static readonly DISTANCE_FORMATTER = NumberFormatter.create({ precision: 0.1, maxDigits: 3, forceDecimalZeroes: true, nanString: '__._' });
  protected static readonly SPEED_FORMATTER = NumberFormatter.create({ precision: 1, nanString: '___' });
  protected static readonly FUEL_FORMATTER = NumberFormatter.create({ precision: 1, nanString: '___' });
  protected static readonly ANGLE_FORMATTER = NumberFormatter.create({ precision: 1, nanString: '___' });
  protected static readonly TEMPERATURE_FORMATTER = NumberFormatter.create({ precision: 1, nanString: '___' });
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
  public abstract render(model: NavDataBarFieldTypeModelMap[T]): VNode;
}

/**
 * An abstract implementation of NavDataBarFieldTypeRenderer which supports date/time settings.
 */
export abstract class DateTimeNavDataBarFieldTypeRenderer<T extends NavDataFieldType> implements NavDataBarFieldTypeRenderer<T> {
  protected static readonly FORMAT_SETTING_MAP = {
    [DateTimeFormatSettingMode.Local12]: TimeDisplayFormat.Local12,
    [DateTimeFormatSettingMode.Local24]: TimeDisplayFormat.Local24,
    [DateTimeFormatSettingMode.UTC]: TimeDisplayFormat.UTC
  };

  protected readonly timeFormat = ConsumerSubject.create(this.dateTimeSettingManager.whenSettingChanged('dateTimeFormat'), this.dateTimeSettingManager.getSetting('dateTimeFormat').value);
  protected readonly localOffset = ConsumerSubject.create(this.dateTimeSettingManager.whenSettingChanged('dateTimeLocalOffset'), this.dateTimeSettingManager.getSetting('dateTimeLocalOffset').value);

  /**
   * Constructor.
   * @param dateTimeSettingManager A date/time user setting manager.
   */
  constructor(protected readonly dateTimeSettingManager: UserSettingManager<DateTimeUserSettingTypes>) {
  }

  /** @inheritdoc */
  public abstract render(model: NavDataBarFieldTypeModelMap[T]): VNode;
}

/**
 * Renders Bearing to Waypoint navigation data bar fields.
 */
export class NavDataBarFieldBrgRenderer extends DisplayUnitNavDataBarFieldTypeRenderer<NavDataFieldType.BearingToWaypoint> {
  /** @inheritdoc */
  public render(model: NavDataBarFieldModel<NumberUnitInterface<typeof NavAngleUnit.FAMILY>>): VNode {
    return (
      <NavDataBearingField
        title='BRG'
        model={model as NavDataBarFieldTypeModelMap[NavDataFieldType.BearingToWaypoint]}
        displayUnit={this.unitsSettingManager.navAngleUnits}
        formatter={DisplayUnitNavDataBarFieldTypeRenderer.BEARING_FORMATTER}
        class='nav-data-field-magenta'
      />
    );
  }
}

/**
 * Renders Distance to Waypoint navigation data bar fields.
 */
export class NavDataBarFieldDestRenderer extends DisplayUnitNavDataBarFieldTypeRenderer<NavDataFieldType.Destination> {
  /** @inheritdoc */
  public render(model: NavDataBarFieldModel<string>): VNode {
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
        class='nav-data-field-white'
      >
        <div>{textSub}</div>
      </NavDataGenericField>
    );
  }
}

/**
 * Renders Distance to Waypoint navigation data bar fields.
 */
export class NavDataBarFieldDisRenderer extends DisplayUnitNavDataBarFieldTypeRenderer<NavDataFieldType.DistanceToWaypoint> {
  /** @inheritdoc */
  public render(model: NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Distance>>): VNode {
    return (
      <NavDataNumberUnitField
        title='DIS'
        model={model}
        displayUnit={this.unitsSettingManager.distanceUnitsLarge}
        formatter={DisplayUnitNavDataBarFieldTypeRenderer.DISTANCE_FORMATTER}
        class='nav-data-field-magenta'
      />
    );
  }
}

/**
 * Renders Distance to Destination navigation data bar fields.
 */
export class NavDataBarFieldDtgRenderer extends DisplayUnitNavDataBarFieldTypeRenderer<NavDataFieldType.DistanceToDestination> {
  /** @inheritdoc */
  public render(model: NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Distance>>): VNode {
    return (
      <NavDataNumberUnitField
        title='DTG'
        model={model}
        displayUnit={this.unitsSettingManager.distanceUnitsLarge}
        formatter={DisplayUnitNavDataBarFieldTypeRenderer.DISTANCE_FORMATTER}
        class='nav-data-field-magenta'
      />
    );
  }
}

/**
 * Renders Desired Track navigation data bar fields.
 */
export class NavDataBarFieldDtkRenderer extends DisplayUnitNavDataBarFieldTypeRenderer<NavDataFieldType.DesiredTrack> {
  /** @inheritdoc */
  public render(model: NavDataBarFieldModel<NumberUnitInterface<typeof NavAngleUnit.FAMILY>>): VNode {
    return (
      <NavDataBearingField
        title='DTK'
        model={model}
        displayUnit={this.unitsSettingManager.navAngleUnits}
        formatter={DisplayUnitNavDataBarFieldTypeRenderer.BEARING_FORMATTER}
        class='nav-data-field-magenta'
      />
    );
  }
}

/**
 * Renders Endurance navigation data bar fields.
 */
export class NavDataBarFieldEndRenderer extends DisplayUnitNavDataBarFieldTypeRenderer<NavDataFieldType.Endurance> {
  /** @inheritdoc */
  public render(model: NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Duration>>): VNode {
    return (
      <NavDataDurationField
        title='END'
        model={model}
        options={DisplayUnitNavDataBarFieldTypeRenderer.DURATION_OPTIONS}
        class='nav-data-field-magenta'
      />
    );
  }
}

/**
 * Renders Time to Destination navigation data bar fields.
 */
export class NavDataBarFieldEnrRenderer extends DisplayUnitNavDataBarFieldTypeRenderer<NavDataFieldType.TimeToDestination> {
  /** @inheritdoc */
  public render(model: NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Duration>>): VNode {
    return (
      <NavDataDurationField
        title='ENR'
        model={model}
        options={DisplayUnitNavDataBarFieldTypeRenderer.DURATION_OPTIONS}
        class='nav-data-field-magenta'
      />
    );
  }
}

/**
 * Renders Estimated Time of Arrival navigation data bar fields.
 */
export class NavDataBarFieldEtaRenderer extends DateTimeNavDataBarFieldTypeRenderer<NavDataFieldType.TimeOfWaypointArrival> {
  /** @inheritdoc */
  public render(model: NavDataBarFieldModel<number>): VNode {
    return (
      <NavDataTimeField
        title='ETA'
        model={model}
        format={this.timeFormat.map(format => DateTimeNavDataBarFieldTypeRenderer.FORMAT_SETTING_MAP[format])}
        localOffset={this.localOffset}
        class='nav-data-field-magenta'
      />
    );
  }
}

/**
 * Renders Time to Waypoint navigation data bar fields.
 */
export class NavDataBarFieldEteRenderer extends DisplayUnitNavDataBarFieldTypeRenderer<NavDataFieldType.TimeToWaypoint> {
  /** @inheritdoc */
  public render(model: NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Duration>>): VNode {
    return (
      <NavDataDurationField
        title='ETE'
        model={model}
        options={DisplayUnitNavDataBarFieldTypeRenderer.DURATION_OPTIONS}
        class='nav-data-field-magenta'
      />
    );
  }
}

/**
 * Renders Fuel on Board navigation data bar fields.
 */
export class NavDataBarFieldFobRenderer extends DisplayUnitNavDataBarFieldTypeRenderer<NavDataFieldType.FuelOnBoard> {
  /** @inheritdoc */
  public render(model: NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Weight>>): VNode {
    return (
      <NavDataNumberUnitField
        title='FOB'
        model={model}
        displayUnit={Subject.create(UnitType.GALLON_FUEL)}
        formatter={DisplayUnitNavDataBarFieldTypeRenderer.FUEL_FORMATTER}
        class='nav-data-field-magenta'
      />
    );
  }
}

/**
 * Renders Fuel Over Destination navigation data bar fields.
 */
export class NavDataBarFieldFodRenderer extends DisplayUnitNavDataBarFieldTypeRenderer<NavDataFieldType.FuelOverDestination> {
  /** @inheritdoc */
  public render(model: NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Weight>>): VNode {
    return (
      <NavDataNumberUnitField
        title='FOD'
        model={model}
        displayUnit={Subject.create(UnitType.GALLON_FUEL)}
        formatter={DisplayUnitNavDataBarFieldTypeRenderer.FUEL_FORMATTER}
        class='nav-data-field-magenta'
      />
    );
  }
}

/**
 * Renders Ground Speed navigation data bar fields.
 */
export class NavDataBarFieldGsRenderer extends DisplayUnitNavDataBarFieldTypeRenderer<NavDataFieldType.GroundSpeed> {
  /** @inheritdoc */
  public render(model: NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Speed>>): VNode {
    return (
      <NavDataNumberUnitField
        title='GS'
        model={model}
        displayUnit={this.unitsSettingManager.speedUnits}
        formatter={DisplayUnitNavDataBarFieldTypeRenderer.SPEED_FORMATTER}
        class='nav-data-field-magenta'
      />
    );
  }
}

/**
 * Renders ISA navigation data bar fields.
 */
export class NavDataBarFieldIsaRenderer extends DisplayUnitNavDataBarFieldTypeRenderer<NavDataFieldType.ISA> {
  /** @inheritdoc */
  public render(model: NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Temperature>>): VNode {
    return (
      <NavDataNumberUnitField
        title='ISA'
        model={model}
        displayUnit={this.unitsSettingManager.temperatureUnits}
        formatter={DisplayUnitNavDataBarFieldTypeRenderer.TEMPERATURE_FORMATTER}
        class='nav-data-field-white'
      />
    );
  }
}

/**
 * Renders Estimated Time of Arrival at Destination navigation data bar fields.
 */
export class NavDataBarFieldLdgRenderer extends DateTimeNavDataBarFieldTypeRenderer<NavDataFieldType.TimeOfDestinationArrival> {
  /** @inheritdoc */
  public render(model: NavDataBarFieldModel<number>): VNode {
    return (
      <NavDataTimeField
        title='LDG'
        model={model}
        format={this.timeFormat.map(format => DateTimeNavDataBarFieldTypeRenderer.FORMAT_SETTING_MAP[format])}
        localOffset={this.localOffset}
        class='nav-data-field-magenta'
      />
    );
  }
}

/**
 * Renders True Airspeed navigation data bar fields.
 */
export class NavDataBarFieldTasRenderer extends DisplayUnitNavDataBarFieldTypeRenderer<NavDataFieldType.TrueAirspeed> {
  /** @inheritdoc */
  public render(model: NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Speed>>): VNode {
    return (
      <NavDataNumberUnitField
        title='TAS'
        model={model}
        displayUnit={this.unitsSettingManager.speedUnits}
        formatter={DisplayUnitNavDataBarFieldTypeRenderer.SPEED_FORMATTER}
        class='nav-data-field-magenta'
      />
    );
  }
}

/**
 * Renders Track Angle Error navigation data bar fields.
 */
export class NavDataBarFieldTkeRenderer extends DisplayUnitNavDataBarFieldTypeRenderer<NavDataFieldType.TrackAngleError> {
  /** @inheritdoc */
  public render(model: NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Angle>>): VNode {
    return (
      <NavDataNumberUnitField
        title='TKE'
        model={model}
        displayUnit={Subject.create(UnitType.DEGREE)}
        formatter={DisplayUnitNavDataBarFieldTypeRenderer.ANGLE_FORMATTER}
        class='nav-data-field-magenta'
      />
    );
  }
}

/**
 * Renders Ground Track navigation data bar fields.
 */
export class NavDataBarFieldTrkRenderer extends DisplayUnitNavDataBarFieldTypeRenderer<NavDataFieldType.GroundTrack> {
  /** @inheritdoc */
  public render(model: NavDataBarFieldModel<NumberUnitInterface<typeof NavAngleUnit.FAMILY>>): VNode {
    return (
      <NavDataBearingField
        title='TRK'
        model={model}
        displayUnit={this.unitsSettingManager.navAngleUnits}
        formatter={DisplayUnitNavDataBarFieldTypeRenderer.BEARING_FORMATTER}
        class='nav-data-field-magenta'
      />
    );
  }
}

/**
 * Renders Vertical Speed Required navigation data bar fields.
 */
export class NavDataBarFieldVsrRenderer extends DisplayUnitNavDataBarFieldTypeRenderer<NavDataFieldType.VerticalSpeedRequired> {
  /** @inheritdoc */
  public render(model: NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Speed>>): VNode {
    return (
      <NavDataNumberUnitField
        title='VSR'
        model={model as NavDataBarFieldTypeModelMap[NavDataFieldType.VerticalSpeedRequired]}
        displayUnit={this.unitsSettingManager.verticalSpeedUnits}
        formatter={DisplayUnitNavDataBarFieldTypeRenderer.SPEED_FORMATTER}
        class='nav-data-field-magenta'
      />
    );
  }
}

/**
 * Renders Cross Track navigation data bar fields.
 */
export class NavDataBarFieldXtkRenderer extends DisplayUnitNavDataBarFieldTypeRenderer<NavDataFieldType.CrossTrack> {
  /** @inheritdoc */
  public render(model: NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Distance>>): VNode {
    return (
      <NavDataNumberUnitField
        title='XTK'
        model={model}
        displayUnit={this.unitsSettingManager.distanceUnitsLarge}
        formatter={DisplayUnitNavDataBarFieldTypeRenderer.DISTANCE_FORMATTER}
        class='nav-data-field-magenta'
      />
    );
  }
}