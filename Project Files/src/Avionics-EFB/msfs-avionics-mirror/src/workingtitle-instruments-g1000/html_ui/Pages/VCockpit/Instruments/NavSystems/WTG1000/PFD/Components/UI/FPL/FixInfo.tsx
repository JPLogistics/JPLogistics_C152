import { FSComponent, VNode, Subject, ComputedSubject, Units, BitFlags, UnitType } from 'msfssdk';
import { FacilityType, FixTypeFlags, ICAO, LegType } from 'msfssdk/navigation';
import { LegDefinitionFlags } from 'msfssdk/flightplan';
import { FixLegInfo } from '../../../../Shared/UI/FPL/FPLTypesAndProps';
import { ViewService } from '../../../../Shared/UI/ViewService';
import { UiControl2, UiControl2Props } from '../../../../Shared/UI/UiControl2';
import { UiControl } from '../../../../Shared/UI/UiControl';
import { ConstraintSelector } from '../../../../MFD/Components/UI/FPL/ConstraintSelector';

/**
 * The properties for the FixInfo component.
 */
interface FixInfoProps extends UiControl2Props {
  /**
   * The actual data object for this fix
   * @type {Subject<FixLegInfo>}
   * @memberof FixInfoComponentProps
   */
  data: Subject<FixLegInfo>;
  /** whether this is an extended view including altitude */
  isExtended?: boolean;

  /** An instance of the view service. */
  viewService: ViewService;

  /** A callback called when a user changes the VNAV altitude. */
  onAltitudeChanged: (altitude: number) => void;

  /** A callback called when an altitude is removed. */
  onAltitudeRemoved: () => void;
}

/** The FixInfo component. */
export class FixInfo extends UiControl2<FixInfoProps> {

  private static viewableLegTypes = [LegType.AF, LegType.CF, LegType.DF, LegType.IF, LegType.RF, LegType.TF];

  private readonly fixEl = FSComponent.createRef<HTMLDivElement>();
  private readonly highlightElementRef = FSComponent.createRef<HTMLSpanElement>();
  private readonly altitudeRef = FSComponent.createRef<HTMLDivElement>();
  private readonly ACTIVE_WPT_CLASS = 'active-wpt';

  private readonly isUserConstraint = Subject.create<boolean>(false);
  private readonly hasInvalidAltitude = Subject.create<boolean>(false);
  private readonly isAltitudeHidden = Subject.create<boolean>(false);

  private _dtk = ComputedSubject.create(this.props.data.get().legDefinition.calculated?.initialDtk ?? -1, (v): string => {
    if (v < 0 || this.props.data.get().legIsBehind) {
      return '___';
    } else {
      const rounded = Math.round(v);
      return (rounded === 0 ? 360 : rounded).toFixed(0).padStart(3, '0');
    }
  });

  private _distance = ComputedSubject.create(this.props.data.get().legDefinition.calculated?.distance ?? -1, (v): string => {
    if (v < 0.1 || this.props.data.get().legIsBehind) {
      return '____';
    } else {
      // const dis = (v / 1852);
      const dis = Units.Meters.toNauticalMiles(v);
      return dis.toFixed((dis < 100) ? 1 : 0);
    }
  });

  private _altitude = Subject.create(Math.round(UnitType.METER.convertTo(this.props.data.get().targetAltitude ?? -1, UnitType.FOOT)));

  private _altitudeUnits = ComputedSubject.create(this.props.data.get().targetAltitude ?? -1, (v): string => {
    if (v < 1 || isNaN(v) || this.props.data.get().legIsBehind) {
      return ' ';
    } else {
      return 'FT';
    }
  });

  private _fixType = ComputedSubject.create(this.props.data.get().legDefinition.leg.fixTypeFlags ?? FixTypeFlags.None, (v): string => {
    const leg = this.props.data.get().legDefinition;
    if (leg.name === 'MANSEQ' && (leg.leg.type === LegType.FM || leg.leg.type === LegType.VM)) {
      return ' hdg';
    }
    switch (v) {
      case FixTypeFlags.FAF:
        return ' faf';
      case FixTypeFlags.IAF:
        return ' iaf';
      case FixTypeFlags.MAP:
        return ' map';
      case FixTypeFlags.MAHP:
        return ' mahp';
      default:
        return '';
    }
  });

  /**
   * Resets highlight animation when the leg goes to/from active so the right color variable is used.
   * We need to trigger a reflow so the browser parses the animation again.
   */
  private resetHighlightAnimation(): void {
    const animName = this.highlightElementRef.instance.style.animationName;
    this.highlightElementRef.instance.style.animationName = 'none';
    this.highlightElementRef.instance.offsetHeight;
    this.highlightElementRef.instance.style.animationName = animName;
  }

  /**
   * Gets the container element location
   * @returns An array of x,y.
   */
  public getContainerElementLocation(): [number, number] {
    return [this.fixEl.instance.offsetLeft, this.fixEl.instance.offsetTop];
  }

  /** @inheritdoc */
  public getHighlightElement(): Element | null {
    return this.highlightElementRef.instance;
  }

  /** @inheritdoc */
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.data.sub((v) => {
      if (v.isAirwayExitFix && v.isCollapsed) {
        this._dtk.set(-1);
        this._distance.set(v.airwayDistance ?? -1);
      } else if (v.legDefinition.leg.type === LegType.HF || v.legDefinition.leg.type === LegType.HM || v.legDefinition.leg.type === LegType.HA) {
        this._dtk.set(v.legDefinition.leg.course);
        const lastVectorIndex = v.legDefinition.calculated?.flightPath.length ? v.legDefinition.calculated?.flightPath.length - 1 : 0;
        this._distance.set(v.legDefinition.calculated?.flightPath[lastVectorIndex].distance ?? 0);
      } else {
        this._dtk.set(v.legDefinition.calculated?.initialDtk ?? -1);
        this._distance.set(v.legDefinition.calculated?.distance ?? 0);
      }
      this._altitude.set(Math.round(UnitType.METER.convertTo(v.invalidConstraintAltitude ?? v.targetAltitude ?? -1, UnitType.FOOT)));
      this._altitudeUnits.set(v.targetAltitude ?? -1);

      if (v.isActive) {
        this.fixEl.instance.classList.add(this.ACTIVE_WPT_CLASS);
        this.highlightElementRef.instance.classList.remove('fix-hold');
      } else {
        this.fixEl.instance.classList.remove(this.ACTIVE_WPT_CLASS);
      }

      if (this.isFocused) {
        this.resetHighlightAnimation();
      }

      if (
        (v.isCollapsed && !v.isAirwayExitFix)
        || v.legDefinition.leg.type === LegType.Discontinuity
        || BitFlags.isAny(v.legDefinition.flags, LegDefinitionFlags.DirectTo | LegDefinitionFlags.VectorsToFinal)
      ) {
        this.setIsVisible(false);
        this.setDisabled(true);
      } else {
        this.setIsVisible(true);
        this.setDisabled(false);
      }

      if (v.isAirwayFix) {
        this.highlightElementRef.instance.style.marginLeft = v.isAirwayExitFix ? '5px' : '10px';
      } else {
        this.highlightElementRef.instance.style.marginLeft = '0px';
      }

      this._fixType.set(v.legDefinition.leg.fixTypeFlags ?? FixTypeFlags.None);

      if (v.legDefinition.leg.type === LegType.HF || v.legDefinition.leg.type === LegType.HM || v.legDefinition.leg.type === LegType.HA) {
        this.highlightElementRef.instance.classList.add('fix-hold');
      } else {
        this.highlightElementRef.instance.classList.remove('fix-hold');
      }

      if (v.isUserConstraint) {
        this.isUserConstraint.set(true);
      } else {
        this.isUserConstraint.set(false);
      }

      if (v.legIsBehind || this._altitude.get() <= 0 || isNaN(this._altitude.get())) {
        this.isAltitudeHidden.set(true);
      } else {
        this.isAltitudeHidden.set(false);
        if (this.props.isExtended && v.isAdvisory && v.invalidConstraintAltitude === undefined) {
          this.altitudeRef.instance.classList.add('alt-advisory');
        } else if (this.props.isExtended) {
          this.altitudeRef.instance.classList.remove('alt-advisory');
        }
        if (v.invalidConstraintAltitude !== undefined) {
          this.hasInvalidAltitude.set(true);
        } else {
          this.hasInvalidAltitude.set(false);
        }
      }
    });
  }

  /** @inheritdoc */
  public onEnter(): boolean {
    const leg = this.props.data.get().legDefinition.leg;
    if (FixInfo.viewableLegTypes.indexOf(leg.type) >= 0) {
      try {
        const facilityType = ICAO.getFacilityType(leg.fixIcao);
        switch (facilityType) {
          case FacilityType.Airport:
            this.props.viewService.open('AirportInformation').setInput(leg.fixIcao);
            return true;
          case FacilityType.Intersection:
            this.props.viewService.open('IntersectionInformation').setInput(leg.fixIcao);
            return true;
          case FacilityType.VOR:
            this.props.viewService.open('VorInformation').setInput(leg.fixIcao);
            return true;
          case FacilityType.NDB:
            this.props.viewService.open('NdbInformation').setInput(leg.fixIcao);
            return true;
        }
      } catch { /* Continue */ }
    }

    return false;
  }

  /**
   * Sets whether or not the FixInfo control is visible.
   * @param isVisible Whether or not the control is visible.
   */
  private setIsVisible(isVisible: boolean): void {
    if (isVisible) {
      this.fixEl.instance.classList.remove(UiControl.HIDE_CLASS);
    } else {
      this.fixEl.instance.classList.add(UiControl.HIDE_CLASS);
    }
  }

  /** @inheritdoc */
  protected onNameFocused(): void {
    this.highlightElementRef.instance.classList.add(UiControl.FOCUS_CLASS);
  }

  /** @inheritdoc */
  protected onNameBlurred(): void {
    this.highlightElementRef.instance.classList.remove(UiControl.FOCUS_CLASS);
  }

  /** @inheritdoc */
  render(): VNode {
    return (
      <div class='fix-container' ref={this.fixEl}>
        <UiControl2 onFocused={this.onNameFocused.bind(this)} onBlurred={this.onNameBlurred.bind(this)}>
          <div class='fix-name'><span ref={this.highlightElementRef}>{this.props.data.get().legDefinition.name}<span class='fix-type'>{this._fixType}</span></span></div>
        </UiControl2>
        <div class={this.props.isExtended ? 'mfd-dtk-value' : 'dtk-value'}>{this._dtk}°</div>
        <div class={this.props.isExtended ? 'mfd-dis-value' : 'dis-value'}>{this._distance}<span class="smallText">NM</span></div>
        {this.props.isExtended ? <div ref={this.altitudeRef} class='mfd-alt-value'>
          <ConstraintSelector data={this._altitude} onSelected={(a): void => this.props.onAltitudeChanged(a)} isHidden={this.isAltitudeHidden}
            onRemoved={(): void => this.props.onAltitudeRemoved()} isEdited={this.isUserConstraint} isInvalid={this.hasInvalidAltitude} />
        </div> : null}
      </div>
    );
  }
}