import { Subject, ArraySubject } from 'msfssdk';
import { AirportFacility, Procedure, RunwayTransition, EnrouteTransition, OneWayRunway, RunwayUtils } from 'msfssdk/navigation';
import { LegDefinition } from 'msfssdk/flightplan';


/** The data store for SelectProcedure pages */
export abstract class SelectProcedureStore {
  public selectedFacility: AirportFacility | undefined;

  public readonly selectedProcIndex = Subject.create(-1);
  public readonly selectedRwyIndex = Subject.create(-1);
  public readonly selectedTransIndex = Subject.create(-1);

  public readonly procedures = ArraySubject.create<Procedure>();
  public readonly runways = ArraySubject.create<RunwayTransition>();
  public readonly transitions = ArraySubject.create<EnrouteTransition>();

  public readonly sequence = ArraySubject.create<Subject<LegDefinition>>();


  /**
   * Gets the procedures array.
   * @returns The procedures array.
   */
  public abstract getProcedures(): readonly Procedure[];

  /**
   * Sets the data to display the facility.
   * @param facility The airport facility to be shown.
   */
  public loadFacility(facility: AirportFacility): void {
    this.selectedFacility = facility;
    this.procedures.clear();
    this.runways.clear();
    this.transitions.clear();
    this.procedures.set(this.getProcedures());
  }

  /**
   * Empties the display content when no facility is selected
   */
  public clearFacility(): void {
    this.selectedFacility = undefined;
    this.procedures.clear();
    this.runways.clear();
    this.transitions.clear();
  }

  /**
   * Gets the one-way runway from the selected procedure runway
   * @returns the OneWayRunway object or undefined
   */
  public getOneWayRunway(): OneWayRunway | undefined {
    if (this.selectedFacility !== undefined && this.selectedRwyIndex.get() > -1) {
      const procRunway = this.getRunwayString(this.procedures.get(this.selectedProcIndex.get()).runwayTransitions[this.selectedRwyIndex.get()]);
      const oneWayRunway = RunwayUtils.matchOneWayRunwayFromDesignation(this.selectedFacility, procRunway);
      if (oneWayRunway !== undefined) {
        return oneWayRunway;
      }
    }
    return undefined;
  }

  /**
   * Gets a runway designation string from the runway transition.
   * @param runwayTransition is the runway transition object
   * @returns The runway designation string.
   */
  public getRunwayString(runwayTransition: RunwayTransition | undefined): string {
    if (runwayTransition !== undefined) {
      return RunwayUtils.getRunwayNameString(runwayTransition.runwayNumber, runwayTransition.runwayDesignation);
    }
    return '';
  }

  /**
   * Gets the transition name and creates a default transition when the procedure has no transitions.
   * @param transitionIndex is the index of the transition in the procedure
   * @returns The transition name string.
   */
  public abstract getTransitionName(transitionIndex: number): string;

  /**
   * Gets the runways of the selected procedure.
   * @returns The runways.
   */
  public getRunways(): readonly RunwayTransition[] {
    const rwys = this.procedures.get(this.selectedProcIndex.get()).runwayTransitions;
    return rwys;
  }

  /**
   * Gets the enroute transitions of the selected procedure.
   * @returns The enroute transitions.
   */
  public getTransitions(): readonly EnrouteTransition[] {
    const transitions: EnrouteTransition[] = [];

    const defaultTranstion: EnrouteTransition = { name: this.getTransitionName(-1), legs: [] };
    transitions.push(defaultTranstion);

    const procedureTransitions = this.procedures.get(this.selectedProcIndex.get()).enRouteTransitions;
    for (let i = 0; i < procedureTransitions.length; i++) {
      const transition = procedureTransitions[i];
      transitions.push({ name: this.getTransitionName(i), legs: transition.legs });
    }

    return transitions;
  }

  // /**
  //  * Gets the enroute transitions of the selected procedure.
  //  * @returns The enroute transitions.
  //  */
  // public abstract getTransitions(): readonly EnrouteTransition[];
}