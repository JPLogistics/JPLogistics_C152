import { LegType, FacilityLoader } from '../navigation';
import { FlightPathLegCalculator } from './FlightPathLegCalculator';
import { LegDefinition } from './FlightPlanning';
/**
 * Options for the flight path calculator.
 */
export interface FlightPathCalculatorOptions {
    /** The default climb rate, if the plane is not yet at flying speed. */
    defaultClimbRate: number;
    /** The default speed, if the plane is not yet at flying speed. */
    defaultSpeed: number;
    /** The bank angle with which to calculated turns. */
    bankAngle: number;
}
/**
 * Calculates the flight path vectors for a given set of legs.
 */
export declare class FlightPathCalculator {
    private readonly facilityLoader;
    protected readonly options: FlightPathCalculatorOptions;
    private readonly facilityCache;
    private readonly legCalculatorMap;
    private readonly turnCalculator;
    private readonly state;
    /**
     * Creates an instance of the FlightPathCalculator.
     * @param facilityLoader The facility loader to use with this instance.
     * @param options The options to use with this flight path calculator.
     */
    constructor(facilityLoader: FacilityLoader, options: FlightPathCalculatorOptions);
    /**
     * Creates a map from leg types to leg calculators.
     * @returns A map from leg types to leg calculators.
     */
    protected createLegCalculatorMap(): Record<LegType, FlightPathLegCalculator>;
    /**
     * Calculates a flight path for a given set of flight plan legs.
     * @param legs The legs of the flight plan and/or procedure.
     * @param activeLegIndex The index of the active leg.
     * @param initialIndex The index of the leg to start at.
     * @param count The number of legs to calculate.
     */
    calculateFlightPath(legs: LegDefinition[], activeLegIndex: number, initialIndex?: number, count?: number): Promise<void>;
    /**
     * Loads facilities required for flight path calculations from the flight plan.
     * @param legs The legs of the flight plan to calculate.
     * @param initialIndex The index of the first leg to calculate.
     * @param count The number of legs to calculate.
     */
    private loadFacilities;
    /**
     * Initializes the current lat/lon.
     * @param legs The legs of the flight plan to calculate.
     * @param initialIndex The index of the first leg to calculate.
     */
    private initCurrentLatLon;
    /**
     * Initializes the current course.
     * @param legs The legs of the flight plan to calculate.
     * @param initialIndex The index of the first leg to calculate.
     */
    private initCurrentCourse;
    /**
     * Calculates flight paths for a sequence of flight plan legs.
     * @param legs A sequence of flight plan legs.
     * @param activeLegIndex The index of the active leg.
     * @param initialIndex The index of the first leg to calculate.
     * @param count The number of legs to calculate.
     */
    private calculateLegPaths;
    /**
     * Calculates a flight path for a leg in a sequence of legs.
     * @param legs A sequence of flight plan legs.
     * @param calculateIndex The index of the leg to calculate.
     * @param activeLegIndex The index of the active leg.
     */
    private calculateLegPath;
    /**
     * Resolves the ingress to egress vectors for a set of flight plan legs.
     * @param legs A sequence of flight plan legs.
     * @param initialIndex The index of the first leg to resolve.
     * @param count The number of legs to resolve.
     */
    private resolveLegsIngressToEgress;
    /**
     * Updates leg distances with turn anticipation.
     * @param legs A sequence of flight plan legs.
     * @param initialIndex The index of the first leg to update.
     * @param count The number of legs to update.
     */
    private updateLegDistances;
    /**
     * Stages a facility to be loaded.
     * @param icao The ICAO of the facility.
     * @param facilityPromises The array of facility load promises to push to.
     */
    private stageFacilityLoad;
}
//# sourceMappingURL=FlightPathCalculator.d.ts.map