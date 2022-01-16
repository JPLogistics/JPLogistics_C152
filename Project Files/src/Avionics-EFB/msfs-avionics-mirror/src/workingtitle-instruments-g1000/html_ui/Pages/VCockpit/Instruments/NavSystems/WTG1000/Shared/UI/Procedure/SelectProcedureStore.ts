import { ArraySubject, Subject, SubscribableArray } from 'msfssdk';
import { FlightPlan, LegDefinition } from 'msfssdk/flightplan';
import { AirportFacility } from 'msfssdk/navigation';

/**
 * A data store for procedure selection components.
 */
export abstract class SelectProcedureStore<T> {
  public readonly selectedFacility = Subject.create<AirportFacility | undefined>(undefined);

  protected readonly _procedures = ArraySubject.create<T>();
  public readonly procedures = this._procedures as SubscribableArray<T>;

  public readonly selectedProcedure = Subject.create<T | undefined>(undefined);

  public readonly previewPlan = Subject.create<FlightPlan | null>(null);

  public readonly sequence = ArraySubject.create<Subject<LegDefinition>>();

  /** Constructor. */
  constructor() {
    this.selectedFacility.sub(this.onSelectedFacilityChanged.bind(this));
    this.selectedProcedure.sub(this.onSelectedProcedureChanged.bind(this));
  }

  /**
   * Responds to changes in the selected airport facility.
   * @param facility The selected airport facility.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onSelectedFacilityChanged(facility: AirportFacility | undefined): void {
    // noop
  }

  /**
   * Responds to changes in the selected procedure.
   * @param proc The selected procedure.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onSelectedProcedureChanged(proc: T | undefined): void {
    // noop
  }
}