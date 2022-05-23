import { Subject, ArraySubject } from 'msfssdk';
import { IntersectionFacility, AirwayObject, FacilityLoader } from 'msfssdk/navigation';
import { LegDefinition } from 'msfssdk/flightplan';

import { Fms } from 'garminsdk/flightplan';

/** The data store for SelectProcedure pages */
export class SelectAirwayStore {
  public selectedFacility: IntersectionFacility | undefined;
  public selectedAirway: AirwayObject | undefined;
  public selectedExit: IntersectionFacility | undefined;
  public inputSegment = -1;
  public inputLeg = -1;

  public readonly airways = ArraySubject.create<string>();
  public readonly exits = ArraySubject.create<IntersectionFacility>();

  public readonly sequence = ArraySubject.create<Subject<LegDefinition>>();


  /**
   * Gets the airways array for this facility.
   * @returns The an array of unique airway names.
   */
  public getFacilityAirways(): string[] {
    const airways: string[] = [];
    airways.push('NONE');
    if (this.selectedFacility !== undefined && this.selectedFacility.routes.length > 0) {
      this.selectedFacility.routes.forEach((route) => {
        airways.push(route.name);
      });
      const uniqueAirways = airways.filter((v, i, a) => a.indexOf(v) === i);
      return uniqueAirways;
    }
    return [];
  }

  /**
   * Gets the airway.
   * @param airwayName is the name of the airway as a string.
   * @param facLoader is an instance of the facility loader.
   */
  public async loadAirway(airwayName: string, facLoader: FacilityLoader): Promise<void> {
    const route = this.selectedFacility?.routes.find((r) => r.name === airwayName);
    if (route !== undefined && this.selectedFacility !== undefined) {
      this.selectedAirway = await facLoader.getAirway(airwayName, route.type, this.selectedFacility?.icao);
    }
  }

  /**
   * Builds the sequence list for the approach preview
   * @param fms is an instance of the FMS
   */
  public buildSequence(fms: Fms): void {
    if (this.selectedFacility !== undefined && this.selectedAirway !== undefined && this.selectedExit !== undefined) {
      const legs: Subject<LegDefinition>[] = [];
      const previewPlanIndex = fms.buildAirwayPreviewSegment(this.selectedAirway, this.selectedFacility, this.selectedExit);
      const previewPlan = fms.getFlightPlan(previewPlanIndex);
      previewPlan.getSegment(0).legs.forEach((l) => {
        legs.push(Subject.create(l));
      });
      this.sequence.set(legs);
    }
  }

  /**
   * Sets the data to display the facility.
   * @param facility The airport facility to be shown.
   */
  public loadFacility(facility: IntersectionFacility): void {
    this.selectedFacility = facility;
    this.airways.clear();
    this.exits.clear();
    this.sequence.clear();
    this.airways.set(this.getFacilityAirways());
  }

  /**
   * Empties the display content when no facility is selected
   */
  public clearFacility(): void {
    this.selectedFacility = undefined;
    this.airways.clear();
    this.exits.clear();
    this.sequence.clear();
  }

  /**
   * Gets the exits of the selected airway.
   * @returns The airway exits.
   */
  public getExits(): IntersectionFacility[] {
    const exits: IntersectionFacility[] = [];
    if (this.selectedAirway !== undefined && this.selectedAirway.waypoints.length > 1) {
      this.selectedAirway?.waypoints.forEach((waypoint) => {
        exits.push(waypoint);
      });
    }
    return exits;
  }

}