import { ArraySubject, BitFlags, ComputedSubject, Subject, SubscribableArray, Unit, UnitFamily, UnitType } from 'msfssdk';
import { AdditionalApproachType, AirportFacility, ApproachProcedure, FacilityFrequency, FixTypeFlags, ICAO, OneWayRunway, RnavTypeFlags, RunwayUtils } from 'msfssdk/navigation';
import { FmsUtils, TransitionListItem } from 'garminsdk/flightplan';
import { SelectProcedureStore } from '../SelectProcedureStore';

/**
 * An approach paired with its index in the faciliy info.
 */
export type ApproachListItem = {
  /** The approach procedure. */
  approach: ApproachProcedure;
  /** The index in the facility info the approach. */
  index: number;
  /** Whether the approach is a visual approach. */
  isVisualApproach: boolean;
}

/**
 * A data store for SelectApproach.
 */
export class SelectApproachStore extends SelectProcedureStore<ApproachListItem> {
  public readonly minimumsUnit = ComputedSubject.create<Unit<UnitFamily.Distance>, string>(
    UnitType.FOOT, (u) => { return u === UnitType.METER ? 'M' : 'FT'; }
  );
  public readonly minimumsSubject = Subject.create(0);
  public readonly frequencySubject = ComputedSubject.create<FacilityFrequency | undefined, string>(undefined, (v): string => {
    if (v !== undefined && v.freqMHz) {
      return v.freqMHz.toFixed(2);
    }
    return '___.__';
  });

  public readonly minsToggleOptions = ['Off', 'BARO']; //, 'TEMP COMP'];

  public readonly minimumsMode = Subject.create(0);
  public readonly selectedTransition = Subject.create<TransitionListItem | undefined>(undefined);

  private readonly _transitions = ArraySubject.create<TransitionListItem>();
  public readonly transitions = this._transitions as SubscribableArray<TransitionListItem>;

  public readonly inputValue = Subject.create('');
  public readonly currentMinFeet = Subject.create(0);

  /** @inheritdoc */
  protected onSelectedFacilityChanged(facility: AirportFacility | undefined): void {
    this.selectedProcedure.set(undefined);
    this._procedures.set(this.getApproaches(facility));
  }

  /**
   * Gets an array of approaches from an airport.
   * @param airport An airport.
   * @returns An array of approaches.
   */
  private getApproaches(airport: AirportFacility | undefined): readonly ApproachListItem[] {
    if (airport !== undefined) {
      const ilsFound = new Set();
      for (const approach of airport.approaches) {
        if (approach.approachType == ApproachType.APPROACH_TYPE_ILS) {
          ilsFound.add(approach.runway);
        }
      }

      const approaches: ApproachListItem[] = [];
      airport.approaches.forEach((approach, index) => {
        if (approach.approachType !== ApproachType.APPROACH_TYPE_LOCALIZER || !ilsFound.has(approach.runway)) {
          approaches.push({
            approach,
            index,
            isVisualApproach: false
          });
        }
      });
      this.getVisualApproaches(airport).forEach(va => {
        approaches.push({
          approach: va,
          index: -1,
          isVisualApproach: true
        });
      });
      return approaches;
    }
    return [];
  }

  /**
   * Gets the visual approaches for the facility.
   * @param facility is the facility.
   * @returns The Approach Procedures.
   */
  private getVisualApproaches(facility: AirportFacility): ApproachProcedure[] {
    const runways: OneWayRunway[] = [];
    for (let i = 0; i < facility.runways.length; i++) {
      RunwayUtils.getOneWayRunways(facility.runways[i], i).forEach(rw => { runways.push(rw); });
    }
    const approaches: ApproachProcedure[] = [];
    runways.forEach(r => {
      approaches.push({
        name: `VISUAL ${r.designation}`,
        runway: r.designation,
        icaos: [],
        transitions: [{ name: 'STRAIGHT', legs: [] }],
        finalLegs: [],
        missedLegs: [],
        approachType: AdditionalApproachType.APPROACH_TYPE_VISUAL,
        approachSuffix: '',
        runwayDesignator: r.runwayDesignator,
        runwayNumber: r.direction,
        rnavTypeFlags: RnavTypeFlags.None
      });
    });
    return approaches;
  }

  /** @inheritdoc */
  protected onSelectedProcedureChanged(): void {
    this.refreshTransitions();
    this.refreshApproachFrequencyText();
  }

  /**
   * Refreshes the transitions array to reflect the transition list of the currently selected approach.
   */
  private refreshTransitions(): void {
    const approachItem = this.selectedProcedure.get();
    const approach = approachItem?.approach;
    const transitions: TransitionListItem[] = [];

    if (approach) {
      for (let i = 0; i < approach.transitions.length; i++) {
        const transition = approach.transitions[i];
        const firstLeg = transition.legs[0];
        const name = transition.name ?? (firstLeg ? ICAO.getIdent(firstLeg.fixIcao) : '');
        const suffix = BitFlags.isAll(firstLeg?.fixTypeFlags ?? 0, FixTypeFlags.IAF) ? ' iaf' : '';
        transitions.push({
          name: name + suffix,
          transitionIndex: i
        });
      }

      transitions.unshift({ name: 'VECTORS', transitionIndex: -1 });

      // If approach has no transitions in the nav data, create a default one beginning at the start of finalLegs
      if (!approachItem.isVisualApproach && approach.transitions.length === 0 && approach.finalLegs.length > 0) {
        transitions.push({
          name: ICAO.getIdent(approach.finalLegs[0].fixIcao),
          transitionIndex: 0
        });
      }
    }

    this._transitions.set(transitions);
  }

  /**
   * Refreshes the approach frequency text to reflect the frequency of the currently selected approach.
   */
  private refreshApproachFrequencyText(): void {
    const selectedApproach = this.selectedProcedure.get();
    if (this.selectedFacility && selectedApproach) {
      this.frequencySubject.set(FmsUtils.getApproachFrequency(this.selectedFacility.get(), selectedApproach.index));
    } else {
      this.frequencySubject.set(undefined);
    }
  }
}