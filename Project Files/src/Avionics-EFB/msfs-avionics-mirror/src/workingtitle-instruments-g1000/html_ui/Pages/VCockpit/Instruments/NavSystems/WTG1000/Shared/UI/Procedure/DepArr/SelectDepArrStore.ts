import { ArraySubject, Subject } from 'msfssdk';
import { AirportFacility, ArrivalProcedure, DepartureProcedure, EnrouteTransition, OneWayRunway, RunwayTransition, RunwayUtils } from 'msfssdk/navigation';
import { SelectProcedureStore } from '../SelectProcedureStore';

/**
 * A data store for departure and arrival selection components.
 */
export abstract class SelectDepArrStore<T extends DepartureProcedure | ArrivalProcedure> extends SelectProcedureStore<T> {
  public readonly selectedProcIndex = Subject.create(-1);
  public readonly selectedRwyTransIndex = Subject.create(-1);
  public readonly selectedTransIndex = Subject.create(-1);

  public readonly runways = ArraySubject.create<RunwayTransition>();
  public readonly transitions = ArraySubject.create<EnrouteTransition>();

  /** @inheritdoc */
  protected onSelectedFacilityChanged(facility: AirportFacility | undefined): void {
    this.selectedProcedure.set(undefined);
    this._procedures.set(this.getProcedures(facility));
  }

  /**
   * Gets the procedures array from an airport.
   * @param airport An airport facility.
   * @returns The procedures array from the specified airport.
   */
  protected abstract getProcedures(airport: AirportFacility | undefined): readonly T[];

  /** @inheritdoc */
  protected onSelectedProcedureChanged(proc: T | undefined): void {
    this.runways.set(proc ? this.getRunways(proc) : []);
    this.transitions.set(proc ? this.getTransitions(proc) : []);
  }

  /**
   * Gets the one-way runway of a procedure runway transition.
   * @param airport The airport of the procedure for which to get the runway.
   * @param procedure A procedure for which to get the runway.
   * @param rwyTransIndex The index of the runway transition for which to get the runway.
   * @returns The one-way runway of the specified procedure runway transition, or undefined if there is no such runway.
   */
  public getOneWayRunway(airport: AirportFacility, procedure: T, rwyTransIndex: number): OneWayRunway | undefined {
    if (rwyTransIndex > -1) {
      const procRunway = this.getRunwayString(procedure.runwayTransitions[rwyTransIndex]);
      return RunwayUtils.matchOneWayRunwayFromDesignation(airport, procRunway);
    }

    return undefined;
  }

  /**
   * Gets a runway designation string from a runway transition.
   * @param runwayTransition A runway transition.
   * @returns The runway designation string of the runway transition.
   */
  public getRunwayString(runwayTransition: RunwayTransition | undefined): string {
    if (runwayTransition !== undefined) {
      return RunwayUtils.getRunwayNameString(runwayTransition.runwayNumber, runwayTransition.runwayDesignation);
    }
    return '';
  }

  /**
   * Gets the runway transitions of a procedure.
   * @param procedure A procedure.
   * @returns The runway transitions of the procedure.
   */
  protected getRunways(procedure: T): readonly RunwayTransition[] {
    return procedure.runwayTransitions;
  }

  /**
   * Gets the enroute transitions of a procedure.
   * @param procedure A procedure.
   * @returns The enroute transitions of the procedure.
   */
  protected getTransitions(procedure: T): readonly EnrouteTransition[] {
    const selectedRwyTransitionIndex = this.selectedRwyTransIndex.get();

    const transitions: EnrouteTransition[] = [];

    const defaultTransition: EnrouteTransition = { name: this.getTransitionName(procedure, -1, selectedRwyTransitionIndex), legs: [] };
    transitions.push(defaultTransition);

    const procedureTransitions = procedure.enRouteTransitions;
    for (let i = 0; i < procedureTransitions.length; i++) {
      const transition = procedureTransitions[i];
      transitions.push({ name: this.getTransitionName(procedure, i, selectedRwyTransitionIndex), legs: transition.legs });
    }

    return transitions;
  }

  /**
   * Gets the transition name and creates a default transition when the procedure has no transitions.
   * @param transitionIndex is the index of the transition in the procedure
   * @returns The transition name string.
   */
  protected abstract getTransitionName(procedure: T, transitionIndex: number, rwyTransitionIndex: number): string;
}