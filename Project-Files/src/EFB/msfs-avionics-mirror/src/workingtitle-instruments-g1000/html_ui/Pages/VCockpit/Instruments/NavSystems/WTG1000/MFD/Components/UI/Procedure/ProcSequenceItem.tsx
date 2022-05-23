import { FSComponent, VNode, BitFlags, Subscribable, NumberUnit, UnitType, MappedSubscribable, NumberUnitInterface, UnitFamily, NavAngleUnit } from 'msfssdk';
import { FixTypeFlags, LegType } from 'msfssdk/navigation';
import { LegDefinition, LegDefinitionFlags } from 'msfssdk/flightplan';
import { NumberFormatter } from 'msfssdk/graphics/text';
import { UiControl, UiControlProps } from '../../../../Shared/UI/UiControl';
import { NumberUnitDisplay } from '../../../../Shared/UI/Common/NumberUnitDisplay';
import { BearingDisplay } from '../../../../Shared/UI/Common/BearingDisplay';
import { UnitsUserSettingManager } from '../../../../Shared/Units/UnitsUserSettings';

import './ProcSequenceItem.css';

/**
 * The properties for the ProcSequenceItem component.
 */
interface ProcSequenceItemProps extends UiControlProps {
  /**
   * The actual data object for this fix
   * @type {LegDefinition}
   */
  data: Subscribable<LegDefinition>;

  /** A display units user setting manager. */
  unitsSettingManager: UnitsUserSettingManager;
}

/** The Procedure Sequence component. */
export class ProcSequenceItem extends UiControl<ProcSequenceItemProps> {
  private static readonly DISTANCE_FORMATTER = NumberFormatter.create({ precision: 0.1, forceDecimalZeroes: true, maxDigits: 3, nanString: '__._' });
  private static readonly BEARING_FORMATTER = NumberFormatter.create({ precision: 1, nanString: '___' });

  private static readonly nmCache = [UnitType.NMILE.createNumber(0)];
  private static readonly magBearingCache = [NavAngleUnit.create(true).createNumber(0)];

  private readonly nameRef = FSComponent.createRef<HTMLDivElement>();

  private readonly fixTypeSub = this.props.data.map(leg => {
    if (leg.name === 'MANSEQ') {
      return ' hdg';
    }

    if (BitFlags.isAll(leg.leg.fixTypeFlags, FixTypeFlags.FAF)) {
      return ' faf';
    } else if (BitFlags.isAll(leg.leg.fixTypeFlags, FixTypeFlags.IAF)) {
      return ' iaf';
    } else if (BitFlags.isAll(leg.leg.fixTypeFlags, FixTypeFlags.MAP)) {
      return ' map';
    } else if (BitFlags.isAll(leg.leg.fixTypeFlags, FixTypeFlags.MAHP)) {
      return ' mahp';
    }

    return '';
  });

  private readonly dtkSub = this.props.data.map(
    leg => {
      const bearing = ProcSequenceItem.magBearingCache[0];
      const dtk = leg.calculated?.initialDtk ?? -1;
      if (dtk < 0) {
        bearing.unit.location.set(0, 0);
        return bearing.set(NaN);
      } else {
        if (leg.calculated?.startLat !== undefined && leg.calculated?.startLon !== undefined) {
          bearing.unit.location.set(leg.calculated.startLat, leg.calculated.startLon);
        }
        return bearing.set(dtk);
      }
    },
    (a: NumberUnit<typeof NavAngleUnit.FAMILY>, b: NumberUnit<typeof NavAngleUnit.FAMILY>) => a.equals(b),
    (oldVal: NumberUnit<typeof NavAngleUnit.FAMILY, NavAngleUnit>, newVal: NumberUnit<typeof NavAngleUnit.FAMILY, NavAngleUnit>) => {
      oldVal.unit.location.set(newVal.unit.location);
      oldVal.set(newVal);
    },
    NavAngleUnit.create(true).createNumber(NaN)
  ) as MappedSubscribable<NumberUnitInterface<typeof NavAngleUnit.FAMILY>>;

  private readonly distanceSub = this.props.data.map(
    leg => {
      return ProcSequenceItem.nmCache[0].set(leg.calculated?.distance ?? NaN, UnitType.METER);
    },
    (a: NumberUnit<UnitFamily.Distance>, b: NumberUnit<UnitFamily.Distance>) => a.equals(b),
    (oldVal: NumberUnit<UnitFamily.Distance>, newVal: NumberUnit<UnitFamily.Distance>) => { oldVal.set(newVal); },
    UnitType.NMILE.createNumber(NaN)
  ) as MappedSubscribable<NumberUnitInterface<UnitFamily.Distance>>;

  private readonly visibilityHandler = (leg: LegDefinition): void => {
    this.setIsVisible(leg.leg.type !== LegType.Discontinuity && leg.leg.type !== LegType.ThruDiscontinuity && !BitFlags.isAny(leg.flags, LegDefinitionFlags.VectorsToFinal));
  };

  private readonly distanceVisibilityHandler = (distance: NumberUnitInterface<UnitFamily.Distance>): void => {
    const isDistanceVis = !distance.isNaN() && distance.number >= 0.1;
    if (isDistanceVis) {
      this.containerRef.instance.classList.remove('proc-sequence-item-hide-distance');
    } else {
      this.containerRef.instance.classList.add('proc-sequence-item-hide-distance');
    }
  };

  private readonly dtkVisibilityHandler = (bearing: NumberUnitInterface<typeof NavAngleUnit.FAMILY>): void => {
    const isDtkVis = !bearing.isNaN();
    if (isDtkVis) {
      this.containerRef.instance.classList.remove('proc-sequence-item-hide-dtk');
    } else {
      this.containerRef.instance.classList.add('proc-sequence-item-hide-dtk');
    }
  };

  /**
   * Creates an instance of FixInfo.
   * @param props The props of the component.
   */
  constructor(props: ProcSequenceItemProps) {
    super(props);

    if (props.class === undefined) {
      props.class = 'proc-sequence-item';
    } else {
      props.class += ' proc-sequence-item';
    }

    props.data.sub(this.visibilityHandler, true);
  }

  /** @inheritdoc */
  public onAfterRender(): void {
    super.onAfterRender();

    this.distanceSub.sub(this.distanceVisibilityHandler, true);
    this.dtkSub.sub(this.dtkVisibilityHandler, true);
  }

  /**
   * Gets the container element location
   * @returns An array of x,y.
   */
  public getContainerElementLocation(): [number, number] {
    return [this.containerRef.instance.offsetLeft, this.containerRef.instance.offsetTop];
  }

  /** @inheritdoc */
  public getHighlightElement(): Element | null {
    return this.nameRef.instance;
  }

  /** @inheritdoc */
  protected renderControl(): VNode {
    return (
      <>
        <div ref={this.nameRef} class='proc-sequence-name'>{this.props.data.get().name}<span class='proc-sequence-fix-type'>{this.fixTypeSub}</span></div>
        <BearingDisplay
          value={this.dtkSub}
          formatter={ProcSequenceItem.BEARING_FORMATTER}
          displayUnit={this.props.unitsSettingManager.navAngleUnits}
          class='proc-sequence-dtk'
        />
        <NumberUnitDisplay
          value={this.distanceSub}
          displayUnit={this.props.unitsSettingManager.distanceUnitsLarge}
          formatter={ProcSequenceItem.DISTANCE_FORMATTER}
          class='proc-sequence-distance'
        />
      </>
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    this.fixTypeSub.destroy();
    this.dtkSub.destroy();
    this.distanceSub.destroy();
    this.props.data.unsub(this.visibilityHandler);
  }
}