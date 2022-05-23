import { NumberUnitSubject, Subject, UnitType } from 'msfssdk';
import { Waypoint } from 'msfssdk/navigation';

import { Fms } from 'garminsdk/flightplan';

import { HoldInputData } from './Hold';

/**
 * A store for the Hold page data.
 */
export class HoldStore {
  /** The indexes for the hold. */
  public readonly indexes = Subject.create<HoldInputData>({ planIndex: Fms.PRIMARY_PLAN_INDEX, segmentIndex: -1, legIndex: -1 });

  /** The course for the hold. */
  public readonly course = Subject.create<number>(0);

  /** Whether or not the course is inbound or outbound. */
  public readonly isInbound = Subject.create<number>(0);

  /** Whether or not the hold is based on time or distance. */
  public readonly isTime = Subject.create<number>(0);

  /** The time that the hold legs should be. */
  public readonly time = NumberUnitSubject.createFromNumberUnit(UnitType.SECOND.createNumber(60));

  /** The distance of the hold legs. */
  public readonly distance = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(4));

  /** The direction of the hold. */
  public readonly turnDirection = Subject.create<number>(0);

  /** The current leg waypoint. */
  public readonly waypoint = Subject.create<Waypoint | null>(null);

  public readonly fixIcao = Subject.create<string>('');
}