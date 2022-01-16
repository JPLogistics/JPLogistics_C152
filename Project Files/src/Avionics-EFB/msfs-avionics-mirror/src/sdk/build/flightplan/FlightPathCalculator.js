/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { GeoPoint, NavMath, UnitType, MagVar } from '..';
import { SimVarValueType } from '../data';
import { ICAO, LegType } from '../navigation';
import { ArcToFixLegCalculator, CourseToAltitudeLegCalculator, CourseToDMELegCalculator, CourseToFixLegCalculator, CourseToManualLegCalculator, CourseToRadialLegCalculator, DirectToFixLegCalculator, FixToDMELegCalculator, CourseToInterceptLegCalculator as CourseToInterceptLegCalculator, RadiusToFixLegCalculator, TrackFromFixLegCalculator, TrackToFixLegCalculator, ProcedureTurnLegCalculator, HoldLegCalculator, DiscontinuityLegCalculator } from './FlightPathLegCalculator';
import { FlightPathTurnCalculator } from './FlightPathTurnCalculator';
import { FlightPathUtils } from './FlightPathUtils';
/**
 * Calculates the flight path vectors for a given set of legs.
 */
export class FlightPathCalculator {
    /**
     * Creates an instance of the FlightPathCalculator.
     * @param facilityLoader The facility loader to use with this instance.
     * @param options The options to use with this flight path calculator.
     */
    constructor(facilityLoader, options) {
        this.facilityLoader = facilityLoader;
        this.options = options;
        this.facilityCache = new Map();
        this.legCalculatorMap = this.createLegCalculatorMap();
        this.turnCalculator = new FlightPathTurnCalculator();
        this.state = new FlightPathStateClass();
    }
    /**
     * Creates a map from leg types to leg calculators.
     * @returns A map from leg types to leg calculators.
     */
    createLegCalculatorMap() {
        let calc;
        return {
            [LegType.Unknown]: calc = new TrackToFixLegCalculator(this.facilityCache),
            [LegType.IF]: calc,
            [LegType.TF]: calc,
            [LegType.AF]: new ArcToFixLegCalculator(this.facilityCache),
            [LegType.CD]: calc = new CourseToDMELegCalculator(this.facilityCache),
            [LegType.VD]: calc,
            [LegType.CF]: new CourseToFixLegCalculator(this.facilityCache),
            [LegType.CR]: calc = new CourseToRadialLegCalculator(this.facilityCache),
            [LegType.VR]: calc,
            [LegType.FC]: new TrackFromFixLegCalculator(this.facilityCache),
            [LegType.FD]: new FixToDMELegCalculator(this.facilityCache),
            [LegType.RF]: new RadiusToFixLegCalculator(this.facilityCache),
            [LegType.DF]: new DirectToFixLegCalculator(this.facilityCache),
            [LegType.FA]: calc = new CourseToAltitudeLegCalculator(this.facilityCache),
            [LegType.CA]: calc,
            [LegType.VA]: calc,
            [LegType.FM]: calc = new CourseToManualLegCalculator(this.facilityCache),
            [LegType.VM]: calc,
            [LegType.CI]: calc = new CourseToInterceptLegCalculator(this.facilityCache),
            [LegType.VI]: calc,
            [LegType.PI]: new ProcedureTurnLegCalculator(this.facilityCache),
            [LegType.HA]: calc = new HoldLegCalculator(this.facilityCache),
            [LegType.HM]: calc,
            [LegType.HF]: calc,
            [LegType.Discontinuity]: new DiscontinuityLegCalculator(this.facilityCache)
        };
    }
    /**
     * Calculates a flight path for a given set of flight plan legs.
     * @param legs The legs of the flight plan and/or procedure.
     * @param activeLegIndex The index of the active leg.
     * @param initialIndex The index of the leg to start at.
     * @param count The number of legs to calculate.
     */
    async calculateFlightPath(legs, activeLegIndex, initialIndex = 0, count = Number.POSITIVE_INFINITY) {
        count = Math.min(legs.length - initialIndex, count);
        this.state.updatePlaneState(this.options);
        await this.loadFacilities(legs, initialIndex, count);
        this.initCurrentLatLon(legs, initialIndex);
        this.initCurrentCourse(legs, initialIndex);
        this.calculateLegPaths(legs, activeLegIndex, initialIndex, count);
        this.turnCalculator.computeTurns(legs, initialIndex, count, this.state.desiredTurnRadius.asUnit(UnitType.METER));
        this.resolveLegsIngressToEgress(legs, initialIndex, count);
        this.updateLegDistances(legs, initialIndex, count);
    }
    /**
     * Loads facilities required for flight path calculations from the flight plan.
     * @param legs The legs of the flight plan to calculate.
     * @param initialIndex The index of the first leg to calculate.
     * @param count The number of legs to calculate.
     */
    async loadFacilities(legs, initialIndex, count) {
        const facilityPromises = [];
        for (let i = initialIndex; i < initialIndex + count; i++) {
            this.stageFacilityLoad(legs[i].leg.fixIcao, facilityPromises);
            this.stageFacilityLoad(legs[i].leg.originIcao, facilityPromises);
            this.stageFacilityLoad(legs[i].leg.arcCenterFixIcao, facilityPromises);
        }
        if (facilityPromises.length > 0) {
            await Promise.all(facilityPromises);
        }
    }
    /**
     * Initializes the current lat/lon.
     * @param legs The legs of the flight plan to calculate.
     * @param initialIndex The index of the first leg to calculate.
     */
    initCurrentLatLon(legs, initialIndex) {
        var _a;
        var _b;
        let index = Math.min(initialIndex, legs.length);
        while (--index >= 0) {
            const leg = legs[index];
            if (leg.leg.type === LegType.Discontinuity) {
                break;
            }
            const calc = leg.calculated;
            if (calc && calc.endLat !== undefined && calc.endLon !== undefined) {
                ((_a = (_b = this.state).currentPosition) !== null && _a !== void 0 ? _a : (_b.currentPosition = new GeoPoint(0, 0))).set(calc.endLat, calc.endLon);
                return;
            }
        }
        this.state.currentPosition = undefined;
    }
    /**
     * Initializes the current course.
     * @param legs The legs of the flight plan to calculate.
     * @param initialIndex The index of the first leg to calculate.
     */
    initCurrentCourse(legs, initialIndex) {
        let index = Math.min(initialIndex, legs.length);
        while (--index >= 0) {
            const leg = legs[index];
            if (leg.leg.type === LegType.Discontinuity) {
                return;
            }
            const legCalc = leg.calculated;
            if (legCalc && legCalc.flightPath.length > 0) {
                this.state.currentCourse = FlightPathUtils.getLegFinalCourse(legCalc);
                if (this.state.currentCourse !== undefined) {
                    return;
                }
            }
        }
        this.state.currentCourse = undefined;
    }
    /**
     * Calculates flight paths for a sequence of flight plan legs.
     * @param legs A sequence of flight plan legs.
     * @param activeLegIndex The index of the active leg.
     * @param initialIndex The index of the first leg to calculate.
     * @param count The number of legs to calculate.
     */
    calculateLegPaths(legs, activeLegIndex, initialIndex, count) {
        const end = initialIndex + count;
        for (let i = initialIndex; i < end; i++) {
            this.calculateLegPath(legs, i, activeLegIndex);
        }
    }
    /**
     * Calculates a flight path for a leg in a sequence of legs.
     * @param legs A sequence of flight plan legs.
     * @param calculateIndex The index of the leg to calculate.
     * @param activeLegIndex The index of the active leg.
     */
    calculateLegPath(legs, calculateIndex, activeLegIndex) {
        const definition = legs[calculateIndex];
        const calcs = this.legCalculatorMap[definition.leg.type].calculate(legs, calculateIndex, activeLegIndex, this.state, false);
        const start = calcs.flightPath[0];
        const end = calcs.flightPath[calcs.flightPath.length - 1];
        calcs.initialDtk = undefined;
        if (start !== undefined) {
            const trueDtk = FlightPathUtils.getVectorInitialCourse(start);
            if (!isNaN(trueDtk)) {
                calcs.initialDtk = MagVar.trueToMagnetic(trueDtk, start.startLat, start.startLon);
            }
        }
        calcs.startLat = start === null || start === void 0 ? void 0 : start.startLat;
        calcs.startLon = start === null || start === void 0 ? void 0 : start.startLon;
        calcs.endLat = end === null || end === void 0 ? void 0 : end.endLat;
        calcs.endLon = end === null || end === void 0 ? void 0 : end.endLon;
        if (!end && this.state.currentPosition) {
            calcs.endLat = this.state.currentPosition.lat;
            calcs.endLon = this.state.currentPosition.lon;
        }
    }
    /**
     * Resolves the ingress to egress vectors for a set of flight plan legs.
     * @param legs A sequence of flight plan legs.
     * @param initialIndex The index of the first leg to resolve.
     * @param count The number of legs to resolve.
     */
    resolveLegsIngressToEgress(legs, initialIndex, count) {
        const end = initialIndex + count;
        for (let i = initialIndex; i < end; i++) {
            const legCalc = legs[i].calculated;
            legCalc && FlightPathUtils.resolveIngressToEgress(legCalc);
        }
    }
    /**
     * Updates leg distances with turn anticipation.
     * @param legs A sequence of flight plan legs.
     * @param initialIndex The index of the first leg to update.
     * @param count The number of legs to update.
     */
    updateLegDistances(legs, initialIndex, count) {
        var _a, _b, _c, _d, _e, _f;
        const end = initialIndex + count;
        for (let i = initialIndex; i < end; i++) {
            const leg = legs[i];
            const calc = leg.calculated;
            // Calculate distance without transitions
            calc.distance = 0;
            const len = calc.flightPath.length;
            for (let j = 0; j < len; j++) {
                calc.distance += calc.flightPath[j].distance;
            }
            calc.cumulativeDistance = calc.distance + ((_c = (_b = (_a = legs[i - 1]) === null || _a === void 0 ? void 0 : _a.calculated) === null || _b === void 0 ? void 0 : _b.cumulativeDistance) !== null && _c !== void 0 ? _c : 0);
            // Calculate distance with transitions
            calc.distanceWithTransitions = 0;
            const ingressLen = calc.ingress.length;
            for (let j = 0; j < ingressLen; j++) {
                calc.distanceWithTransitions += calc.ingress[j].distance;
            }
            const ingressToEgressLen = calc.ingressToEgress.length;
            for (let j = 0; j < ingressToEgressLen; j++) {
                calc.distanceWithTransitions += calc.ingressToEgress[j].distance;
            }
            const egressLen = calc.egress.length;
            for (let j = 0; j < egressLen; j++) {
                calc.distanceWithTransitions += calc.egress[j].distance;
            }
            calc.cumulativeDistanceWithTransitions = calc.distanceWithTransitions + ((_f = (_e = (_d = legs[i - 1]) === null || _d === void 0 ? void 0 : _d.calculated) === null || _e === void 0 ? void 0 : _e.cumulativeDistanceWithTransitions) !== null && _f !== void 0 ? _f : 0);
        }
    }
    /**
     * Stages a facility to be loaded.
     * @param icao The ICAO of the facility.
     * @param facilityPromises The array of facility load promises to push to.
     */
    stageFacilityLoad(icao, facilityPromises) {
        if (icao !== ICAO.emptyIcao && !this.facilityCache.has(icao)) {
            let facilityType;
            try {
                facilityType = ICAO.getFacilityType(icao);
            }
            catch (err) {
                //console.log(err);
            }
            if (facilityType !== undefined) {
                try {
                    facilityPromises.push(this.facilityLoader.getFacility(ICAO.getFacilityType(icao), icao)
                        .then(facility => {
                        this.facilityCache.set(facility.icao, facility);
                        return true;
                    })
                        .catch(() => false));
                }
                catch (err) {
                    //console.log(err);
                }
            }
        }
    }
}
/**
 *
 */
class FlightPathStateClass {
    constructor() {
        this._planePosition = new GeoPoint(0, 0);
        this.planePosition = this._planePosition.readonly;
        this._planeHeading = 0;
        this._planeAltitude = UnitType.FOOT.createNumber(0);
        this.planeAltitude = this._planeAltitude.readonly;
        this._planeSpeed = UnitType.KNOT.createNumber(0);
        this.planeSpeed = this._planeSpeed.readonly;
        this._planeClimbRate = UnitType.FPM.createNumber(0);
        this.planeClimbRate = this._planeClimbRate.readonly;
        this._desiredTurnRadius = UnitType.METER.createNumber(0);
        this.desiredTurnRadius = this._desiredTurnRadius.readonly;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    get planeHeading() {
        return this._planeHeading;
    }
    /**
     * Updates this state with the latest information on the airplane.
     * @param options Flight path calculator options.
     */
    updatePlaneState(options) {
        this._planePosition.set(SimVar.GetSimVarValue('PLANE LATITUDE', SimVarValueType.Degree), SimVar.GetSimVarValue('PLANE LONGITUDE', SimVarValueType.Degree));
        this._planeAltitude.set(SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet'));
        this._planeHeading = SimVar.GetSimVarValue('PLANE HEADING DEGREES TRUE', 'degree');
        this._planeSpeed.set(Math.max(SimVar.GetSimVarValue('GROUND VELOCITY', SimVarValueType.Knots), options.defaultSpeed));
        this._planeClimbRate.set(Math.max(SimVar.GetSimVarValue('VERTICAL SPEED', 'feet per minute'), options.defaultClimbRate));
        this._desiredTurnRadius.set(NavMath.turnRadius(this._planeSpeed.asUnit(UnitType.KNOT), options.bankAngle));
    }
}
