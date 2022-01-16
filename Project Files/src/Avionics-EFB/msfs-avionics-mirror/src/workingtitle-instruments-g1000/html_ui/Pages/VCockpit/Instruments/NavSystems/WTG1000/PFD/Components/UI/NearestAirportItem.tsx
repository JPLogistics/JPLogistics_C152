import { FSComponent, VNode, Subject, ComputedSubject, UnitType, NumberFormatter, NumberUnitSubject, Subscribable, NavMath } from 'msfssdk';
import { AirportFacility, FacilityFrequencyType, ICAO } from 'msfssdk/navigation';

import { NearbyAirport } from '../../../Shared/UI/Controllers/NearestStore';
import { GenericControl } from '../../../Shared/UI/UIControls/GenericControl';
import { UiControlGroup, UiControlGroupProps } from '../../../Shared/UI/UiControlGroup';
import { WaypointIcon } from '../../../Shared/UI/Waypoint/WaypointIcon';
import { FacilityWaypointCache } from '../../../Shared/Navigation/FacilityWaypointCache';
import { NumberUnitDisplay } from '../../../Shared/UI/Common/NumberUnitDisplay';

/**
 * The properties for the Nearest Airport component.
 */
interface NearestAirportItemProps extends UiControlGroupProps {
  /**
   * The actual data object for this fix
   * @type {NearbyAirport}
   */
  data: Subject<NearbyAirport>

  /**
   * A subscribable which provides the airplane's current true heading.
   */
  planeHeading: Subscribable<number>;

  /**
   * A function which handles DRCT input events on the nearest airport item's ident control.
   * @param airport The airport facility associated with the control.
   * @returns Whether the event was handled.
   */
  directToHandler(airport: AirportFacility | null): boolean;

  /**
   * A function which handles ENTER input events on the nearest airport item's frequency control.
   * @param freq The frequency associated with the control.
   * @returns Whether the event was handled.
   */
  frequencyHandler(freq: string): boolean;
}

/** The Nearest Airport component. */
export class NearestAirportItem extends UiControlGroup<NearestAirportItemProps> {
  private readonly fixEl = FSComponent.createRef<HTMLDivElement>();

  private readonly facWaypointCache = FacilityWaypointCache.getCache();

  private readonly ident = ComputedSubject.create(this.props.data.get().facility?.icao, (v): string => {
    if (v) {
      return ICAO.getIdent(v);
    } else {
      return '____';
    }
  });

  private readonly bearing = ComputedSubject.create(this.props.data.get().bearing ?? -1, (v): string => {
    if (isNaN(v)) {
      return '___';
    } else {
      const norm = NavMath.normalizeHeading(Math.round(v));
      return (norm === 0 ? 360 : norm).toString().padStart(3, '0');
    }
  });

  private readonly distance = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(NaN));

  private readonly approach = ComputedSubject.create(this.props.data.get().bestApproach, (v): string => {
    if (v) {
      return v;
    } else {
      return 'VFR';
    }
  })

  private readonly freqType = ComputedSubject.create(this.props.data.get().frequency, (v): string => {
    switch (v?.type) {
      case FacilityFrequencyType.Tower:
        return 'TOWER';
      case FacilityFrequencyType.Unicom:
        return 'UNICOM';
      case FacilityFrequencyType.Multicom:
      case FacilityFrequencyType.CTAF:
        return 'MULTICOM';
      default:
        return '';
    }
  })

  private readonly frequency = ComputedSubject.create(this.props.data.get().frequency, (v): string => {
    if (v?.freqMHz) {
      return v.freqMHz.toFixed(3);
    } else {
      return '';
    }
  });

  private readonly rwyLength = NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(NaN));

  private readonly frequencyControlRef = FSComponent.createRef<GenericControl>();

  private isVisible = true;

  /**
   * Gets a boolean indicating if this control is able to be focused.
   * @returns true
   */
  public getIsFocusable(): boolean {
    return this.isVisible && super.getIsFocusable();
  }

  /**
   * Hide this after render, until we get our first update, to avoid showing empty fields.
   */
  public onAfterRender(): void {
    this.props.data.sub((v: NearbyAirport) => { this.updateData(v); }, true);
  }

  /** @inheritdoc */
  public getHighlightElement(): Element | null {
    return this.fixEl.instance.firstElementChild;
  }

  /**
   * Update our data when the subbed item changes.
   * @param v The new data.
   */
  private updateData(v: NearbyAirport): void {
    this.ident.set(v.facility?.icao);

    if (v.facility) {
      this.bearing.set(v.bearing);
      this.distance.set(v.distance, UnitType.METER);
      this.approach.set(v.bestApproach);
      this.freqType.set(v.frequency);
      this.frequency.set(v.frequency);
      if (v.frequency) {
        this.frequencyControlRef.instance.setIsEnabled(true);
      } else {
        this.frequencyControlRef.instance.setIsEnabled(false);
      }

      this.rwyLength.set(v.bestLength, UnitType.METER);

      this.setVisibility(true);
    } else {
      this.setVisibility(false);
    }
  }

  /**
   * Sets the visibility of this item.
   * @param value Whether this item should be visible.
   */
  private setVisibility(value: boolean): void {
    if (this.isVisible === value) {
      return;
    }

    if (value) {
      this.fixEl.instance.style.display = '';
    } else {
      this.blur();
      this.fixEl.instance.style.display = 'none';
    }

    this.isVisible = value;
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class='nearest-airport-item' ref={this.fixEl}>
        <div class='nearest-airport-row nearest-airport-row1'>
          <GenericControl
            onRegister={this.register}
            onDirectTo={(): boolean => this.props.directToHandler(this.props.data.get().facility)}
            class='nearest-airport-name'
          >
            <span>{this.ident}</span>
          </GenericControl>
          <WaypointIcon
            waypoint={this.props.data.map(v => v.facility ? this.facWaypointCache.get(v.facility) : null)}
            planeHeading={this.props.planeHeading}
            class='nearest-airport-symbol'
          />
          <span class='nearest-airport-bearing'>{this.bearing}°</span>
          <NumberUnitDisplay
            value={this.distance}
            displayUnit={Subject.create(UnitType.NMILE)}
            formatter={NumberFormatter.create({ precision: 0.1, maxDigits: 3, forceDecimalZeroes: false, nanString: '__._' })}
            class='nearest-airport-distance'
          />
          <span class='nearest-airport-approach'>{this.approach}</span>
        </div>
        <div class='nearest-airport-row nearest-airport-row2'>
          <span class='nearest-airport-freqtype'>{this.freqType}</span>
          <GenericControl
            ref={this.frequencyControlRef} onRegister={this.register}
            onEnter={(): boolean => this.props.frequencyHandler(this.frequency.get())}
          >
            <span class='nearest-airport-frequency cyan'>{this.frequency}</span>
          </GenericControl>
          <div class='nearest-airport-rwy'><span class='nearest-airport-rwy-title'>RWY</span> <NumberUnitDisplay
            value={this.rwyLength}
            displayUnit={Subject.create(UnitType.FOOT)}
            formatter={NumberFormatter.create({ precision: 1, nanString: '_____' })}
            class='nearest-airport-rwy-number'
          />
          </div>
        </div>
      </div>
    );
  }
}