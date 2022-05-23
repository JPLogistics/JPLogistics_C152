import { LegDefinition } from './FlightPlanning';
/**
 * A flight path calculator for turns between legs.
 */
export declare class FlightPathTurnCalculator {
    private static readonly vector3Cache;
    private static readonly geoPointCache;
    private static readonly geoCircleCache;
    private static readonly intersectionVecArrayCache;
    private static readonly intersectionGeoPointArrayCache;
    private readonly procTurnBuilder;
    /**
     * Computes leg to leg turns for a given sequence of legs. Turns will only be calculated between legs with defined
     * flight path vectors and no pre-existing egress/ingress transition (unless it is a leg-to-leg turn) at the junction
     * of the turn.
     * @param legs A sequence of legs.
     * @param startIndex The index of the first leg for which to compute turns.
     * @param count The total number of legs for which to compute turns.
     * @param desiredTurnRadius The desired turn radius, in meters.
     */
    computeTurns(legs: LegDefinition[], startIndex: number, count: number, desiredTurnRadius: number): void;
    /**
     * Calculates a leg-to-leg turn between two track vectors.
     * @param legs The sequence of legs to which the turn belongs.
     * @param fromIndex The index of the leg on which the turn begins.
     * @param toIndex The index of the leg on which the turn ends.
     * @param fromTrack The track vector on which the turn begins.
     * @param toTrack The track vector on which the turn ends.
     * @param desiredTurnRadius The desired turn radius, in meters.
     * @param isRestrictedByPrevTurn Whether turn anticipation is restricted by the previous leg-to-leg turn. If `true`,
     * turn anticipation will be restricted so that the turn does not overlap the previous turn if they share a common
     * flight path vector.
     * @param previousTanTheta The tangent of the theta value of the previous turn. Theta is defined as the (acute)
     * angle between either `fromTrack` or `toTrack` and the great circle passing through the turn vertex (where the two
     * tracks meet) and the center of the turn. If this value is defined and `isRestrictedByPrevTurn` is `true`, the
     * anticipation of both turns will be adjusted if necessary such that the turns do not overlap if they share a common
     * flight path vector. If the value is undefined, the anticipation of the current turn will be restricted by the
     * previous turn, if necessary, without changing the anticipation of the previous turn.
     * @returns The index of the last leg in the sequence for which a turn ending on that leg was computed.
     */
    private computeTrackTrackTurn;
    /**
     * Computes a leg-to-leg course reversal.
     * @param legs The sequence of legs to which the turn belongs.
     * @param fromIndex The index of the leg on which the turn begins.
     * @param toIndex The index of the leg on which the turn ends.
     * @param fromTrack The track vector on which the turn begins.
     * @param toTrack The track vector on which the turn ends.
     * @param fromTrackBearing The true course bearing of the track vector on which the turn begins, at the end of the vector.
     * @param toTrackBearing The true course bearing of the track vector on which the turn ends, at the beginning of the vector.
     * @param desiredTurnRadius The desired turn radius, in meters.
     * @returns The index of the last leg in the sequence for which a turn ending on that leg was computed.
     */
    private computeTrackTrackCourseReversal;
    /**
     * Calculates a leg to leg turn between an arc vector and a track vector.
     * @param legs The sequence of legs to which the turn belongs.
     * @param fromIndex The index of the leg on which the turn begins.
     * @param toIndex The index of the leg on which the turn ends.
     * @param arc The arc vector.
     * @param track The track vector.
     * @param isArcFirst Whether the arc vector precedes the track vector (i.e. whether the arc vector is the vector on
     * which the turn begins).
     * @param desiredTurnRadius The desired turn radius, in meters.
     * @returns the index of the last leg in the sequence for which a turn ending on that leg was computed.
     */
    private computeArcTrackTurn;
    /**
     * Removes all ingress and egress flight path vectors from a pair of legs at their junction.
     * @param fromLegCalc The calculations for the leg on which the turn begins.
     * @param toLegCalc The calculations for the leg on which the turn ends.
     */
    private setEmptyTurn;
    private static readonly setAnticipatedTurnCache;
    /**
     * Adds flight path vectors to a pair of legs for an anticipated leg to leg turn.
     * @param fromLegCalc The calculations for the leg on which the turn begins.
     * @param toLegCalc The calculations for the leg on which the turn ends.
     * @param direction The direction of the turn.
     * @param radius The radius of the turn, in meters.
     * @param center The location of the center of the turn.
     * @param start The location of the start of the turn.
     * @param middle The location of the midpoint of the turn.
     * @param end The location of the end of the turn.
     */
    private setAnticipatedTurn;
}
//# sourceMappingURL=FlightPathTurnCalculator.d.ts.map