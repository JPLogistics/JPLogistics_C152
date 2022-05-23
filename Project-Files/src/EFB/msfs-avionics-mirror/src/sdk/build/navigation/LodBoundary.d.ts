import { GeoCircle, GeoPointInterface } from '..';
import { BoundaryFacility } from './Facilities';
/**
 * A vector describing one edge of a boundary shape.
 */
export declare type LodBoundaryVector = {
    /** The path of this vector, or undefined if this is a starting vector. */
    circle?: GeoCircle;
    /** The end point of this vector. */
    end: GeoPointInterface;
};
/**
 * A single contiguous boundary shape.
 */
export declare type LodBoundaryShape = LodBoundaryVector[];
/**
 * A boundary (airspace) with pre-processed LODs.
 */
export declare class LodBoundary {
    readonly facility: BoundaryFacility;
    private static readonly geoCircleCache;
    private static readonly edgeCache;
    private static readonly queue;
    /** The Douglas-Peucker thresholds, in great-arc radians, used by each of this boundary's LOD levels. */
    readonly lodDistanceThresholds: readonly number[];
    private readonly lodVectorCountTargets;
    /** This boundary's LOD levels. Each LOD level contains one or more boundary shapes. */
    readonly lods: readonly (readonly Readonly<LodBoundaryShape>[])[];
    /**
     * Constructor.
     * @param facility This boundary's facility object.
     * @param lodDistanceThresholds The Douglas-Peucker thresholds, in great-arc radians, used by each LOD level. If
     * undefined or an empty array, only one LOD level (LOD0) will be created with a distance threshold of 0.
     * @param lodVectorCountTargets The vector count targets for each LOD level. The number of vectors per shape after
     * simplification will not exceed the LOD levels' target. Non-positive targets are interpreted as unlimited.
     * If undefined, all LOD levels will be assigned an unlimited vector count target.
     */
    constructor(facility: BoundaryFacility, lodDistanceThresholds?: readonly number[], lodVectorCountTargets?: readonly number[]);
    /**
     * Processes this boundary's LOD levels.
     * @returns This boundary's processed LOD levels.
     */
    private processLods;
    /**
     * Processes this boundary's facility's vectors into boundary shapes.
     * @returns Boundary shapes corresponding to this boundary's facility's vectors.
     */
    private processShapes;
    /**
     * Processes a single, non-circle boundary shape from this boundary's facility's vectors.
     * @param shape The shape to be processed.
     * @param index The index of the first facility boundary vector which makes up the shape.
     * @returns The index of the last facility boundary vector which makes up the shape.
     */
    private processShape;
    /**
     * Processes a single circle boundary shape from this boundary's facility's vectors.
     * @param shape The shape to be processed.
     * @param index The index of the first facility boundary vector which makes up the shape.
     * @returns The index of the last facility boundary vector which makes up the shape.
     */
    private processCircle;
    /**
     * Simplifies boundary shapes using the Douglas-Peucker algorithm.
     * @param shapes The boundary shapes to simplify.
     * @param distanceThreshold The Douglas-Peucker distance threshold, in great-arc radians.
     * @param vectorCountTarget The vector count target for the simplified shapes. An undefined value is interpreted as
     * an unlimited target.
     * @returns The simplified boundary shapes.
     */
    private simplifyShapes;
    /**
     * Simplifies a boundary shape using the Douglas-Peucker algorithm.
     * @param shape The boundary shape to simplify.
     * @param distanceThreshold The Douglas-Peucker distance threshold, in great-arc radians.
     * @param vectorCountTarget The vector count target for the simplified shape. An undefined value is interpreted as
     * an unlimited target.
     * @returns The simplified boundary shape.
     */
    private simplifyShape;
    /**
     * Simplifies a sequence of vectors in a boundary shape using the Douglas-Peucker algorithm.
     * @param distanceThreshold The Douglas-Peucker distance threshold, in great-arc radians.
     * @param shape The boundary shape containing the vectors to simplify.
     * @param startIndex The index of the first vector in the sequence to simplify, inclusive.
     * @param endIndex The index of the last vector in the sequence to simplify, exclusive.
     * @param retain An array of boolean values indicating which vectors in the shape to retain after simplification.
     */
    private simplify;
    /**
     * Simplifies a sequence of vectors in a boundary shape using the Douglas-Peucker algorithm to a target vector count.
     * @param distanceThreshold The Douglas-Peucker distance threshold, in great-arc radians.
     * @param vectorCountTarget The vector count target for the simplified shape.
     * @param shape The boundary shape containing the vectors to simplify.
     * @param startIndex The index of the first vector in the sequence to simplify, inclusive.
     * @param endIndex The index of the last vector in the sequence to simplify, exclusive.
     * @param retain An array of boolean values indicating which vectors in the shape to retain after simplification.
     */
    private simplifyToVectorCount;
    /**
     * Computes an edge and inserts it into a priority queue if the distance from the edge to the farthest vector is
     * greater than a specified distance threshold.
     * @param distanceThreshold The Douglas-Peucker distance threshold, in great-arc radians.
     * @param shape The boundary shape containing the vectors to simplify.
     * @param startIndex The index of the vector at the start of the edge.
     * @param endIndex The index of the vector at the end of the edge.
     * @param queue The priority queue into which to insert the edge.
     * @param edgeIndex The index from which to retrieve an edge from the edge cache, if needed.
     */
    private computeAndInsertEdgeToQueue;
    /**
     * Finds the vector in a boundary shape containing the farthest point from a reference.
     * @param shape The shape containing the vectors to search.
     * @param startIndex The index of the first vector to search, inclusive.
     * @param endIndex The index of the last vector to search, exclusive.
     * @param reference The reference to which to measure distance.
     * @returns The index of the vector containing the farthest point from a reference, and the corresponding distance in great-arc radians.
     */
    private findFarthestVector;
    /**
     * Calculates the maximum distance from a vector in a boundary shape to a reference.
     * @param shape The shape containing the vector to query.
     * @param index The index of the vector to query.
     * @param reference The reference to which to measure the distance.
     * @returns The maximum distance from the vector to the reference, in great-arc radians.
     */
    private getDistanceFromReference;
    /**
     * Rebuilds vectors for a simplified shape.
     * @param shape The original shape.
     * @param retain An array of boolean values indicating which vectors in the shape to retain after simplification.
     * @param simplified The simplified shape to which to add the rebuilt vectors.
     */
    private rebuildSimplifiedVectors;
    /**
     * Copies a boundary shape vector.
     * @param source The vector to copy.
     * @returns A copy of `source`.
     */
    private static copyVector;
    /**
     * Creates an edge.
     * @returns An edge.
     */
    private static createEdge;
}
//# sourceMappingURL=LodBoundary.d.ts.map