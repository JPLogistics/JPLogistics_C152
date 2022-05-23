import { ArraySubject, Subject } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { FacilityLoader, FacilityRepository } from 'msfssdk/navigation';
import { FlightPlanSegment } from 'msfssdk/flightplan';

import { FacilityInfo } from './FPLTypesAndProps';
import { ActiveLegDefinition, ActiveLegStates } from '../UIControls/FplActiveLegArrow';

/**
 * The store class for FPLDetails
 */
export class FPLDetailsStore {
  public readonly loader;
  /** Information on our origin, arrival and destination facilities to save lookups. */
  public facilityInfo: FacilityInfo = {
    originFacility: undefined,
    destinationFacility: undefined,
    arrivalFacility: undefined
  };

  public readonly segments = ArraySubject.create<FlightPlanSegment>();
  public readonly activeLeg = Subject.create({ segmentIndex: 0, legIndex: 0 } as ActiveLegDefinition);
  public readonly activeLegState = Subject.create(ActiveLegStates.NONE);

  public currentAltitude = 0;
  public selectedAltitude = 0;

  /**
   * Constructor.
   * @param bus The event bus.
   */
  constructor(bus: EventBus) {
    this.loader = new FacilityLoader(FacilityRepository.getRepository(bus));
  }
}