import {
    Coordinates,
    DegreesTrue,
    diffAngle,
    NauticalMiles,
} from './common';
import { EARTH_RADIUS } from './constants';
import { distanceTo } from './distanceTo';
import { bearingTo } from './bearingTo';

function xyzToCoordinates(x: number, y: number, z: number): Coordinates {
    const theta = Math.atan2(Math.sqrt(x ** 2 + y ** 2), z);

    let phi = Math.PI / 2;
    if (x > 0) phi = Math.atan(y / x);
    else if (x < 0) phi = Math.PI + Math.atan(y / x);

    return {
        lat: thetaToLat(theta),
        long: phiToLong(phi),
    };
}

function thetaToLat(theta: number) {
    return 90 - (theta * 180) / Math.PI;
}

function phiToLong(phi: number) {
    if (phi > Math.PI) return 180 - (phi * 180) / Math.PI;

    return (phi * 180) / Math.PI;
}

function latToTheta(lat: number) {
    return ((90 - lat) * Math.PI) / 180;
}

function longToPhi(long: number) {
    if (long < 0) return ((long + 360) * Math.PI) / 180;

    return (long * Math.PI) / 180;
}

function coordinatesToXyz(coordinates: Coordinates, radius: number): [number, number, number] {
    const theta = latToTheta(coordinates.lat);
    const phi = longToPhi(coordinates.long);

    return [
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(theta),
    ];
}

function crossProduct(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): [number, number, number] {
    return [y1 * z2 - z1 * y2, z1 * x2 - x1 * z2, x1 * y2 - y1 * x2];
}

function thetaUnitVector(theta: number, phi: number) {
    return [Math.cos(theta) * Math.cos(phi), Math.cos(theta) * Math.sin(phi), -Math.sin(theta)];
}

function phiUnitVector(theta: number, phi: number) {
    return [-Math.sin(phi), Math.cos(phi), 0];
}

function calculateV(course: number, theta: number, phi: number) {
    const [thetaUnitX, thetaUnitY, thetaUnitZ] = thetaUnitVector(theta, phi);
    const [phiUnitX, phiUnitY, phiUnitZ] = phiUnitVector(theta, phi);

    return [
        -Math.cos(course) * thetaUnitX + Math.sin(course) * phiUnitX,
        -Math.cos(course) * thetaUnitY + Math.sin(course) * phiUnitY,
        -Math.cos(course) * thetaUnitZ + Math.sin(course) * phiUnitZ,
    ];
}

function solveWithPermutations(smallCircleCoordinates: [number, number, number], ns: [number, number, number], smallCircleRadius: NauticalMiles, permutations: number[][]) {
    let permutation = permutations[0];
    let denominator = ns[permutation[2]] * smallCircleCoordinates[permutation[1]] - ns[permutation[1]] * smallCircleCoordinates[permutation[2]];

    for (let i = 1; Math.abs(denominator) < 1e-4 && i < 3; i++) {
        permutation = permutations[i];
        denominator = ns[permutation[2]] * smallCircleCoordinates[permutation[1]] - ns[permutation[1]] * smallCircleCoordinates[permutation[2]];
    }

    const A = (-ns[permutation[2]] * (smallCircleRadius ** 2 - 2 * EARTH_RADIUS ** 2)) / 2 / denominator;
    const B = -(ns[permutation[2]] * smallCircleCoordinates[permutation[0]] - ns[permutation[0]] * smallCircleCoordinates[permutation[2]]) / denominator;
    const C = (ns[permutation[1]] * (smallCircleRadius ** 2 - 2 * EARTH_RADIUS ** 2)) / 2 / denominator;
    const D = -(-ns[permutation[1]] * smallCircleCoordinates[permutation[0]] + ns[permutation[0]] * smallCircleCoordinates[permutation[1]]) / denominator;

    const discriminant = -(C ** 2) * (1 + B ** 2) + 2 * A * B * C * D - A ** 2 * (1 + D ** 2) + (1 + B ** 2 + D ** 2) * EARTH_RADIUS ** 2;

    if (discriminant < 0) {
        return null;
    }

    const result1 = [0, 0, 0];
    const result2 = [0, 0, 0];

    result1[permutation[0]] = (-A * B - C * D - Math.sqrt(discriminant)) / (1 + B ** 2 + D ** 2);
    result2[permutation[0]] = (-A * B - C * D + Math.sqrt(discriminant)) / (1 + B ** 2 + D ** 2);

    result1[permutation[1]] = A + B * result1[permutation[0]];
    result2[permutation[1]] = A + B * result2[permutation[0]];

    result1[permutation[2]] = C + D * result1[permutation[0]];
    result2[permutation[2]] = C + D * result2[permutation[0]];

    return [xyzToCoordinates(result1[0], result1[1], result1[2]), xyzToCoordinates(result2[0], result2[1], result2[2])];
}

export function smallCircleGreatCircleIntersection(
    smallCircleCentre: Coordinates,
    smallCircleRadius: NauticalMiles,
    greatCircleReference: Coordinates,
    greatCircleBearing: DegreesTrue,
) {
    const smallCircleCoords = coordinatesToXyz(
        smallCircleCentre,
        EARTH_RADIUS,
    );

    const [greatCircleX, greatCircleY, greatCircleZ] = coordinatesToXyz(
        greatCircleReference,
        EARTH_RADIUS,
    );

    const [vx, vy, vz] = calculateV(
        (greatCircleBearing * Math.PI) / 180,
        latToTheta(greatCircleReference.lat),
        longToPhi(greatCircleReference.long),
    );

    const normalVector = crossProduct(greatCircleX, greatCircleY, greatCircleZ, vx, vy, vz);

    return solveWithPermutations(smallCircleCoords, normalVector, smallCircleRadius, [[0, 1, 2], [2, 0, 1], [1, 2, 0]]);
}

/**
 * Returns the first small circle intersection to occur on a given bearing
 * @param smallCircleCentre
 * @param smallCircleRadius
 * @param greatCircleReference
 * @param greatCircleBearing
 */
export function firstSmallCircleIntersection(
    smallCircleCentre: Coordinates,
    smallCircleRadius: NauticalMiles,
    greatCircleReference: Coordinates,
    greatCircleBearing: DegreesTrue,
): Coordinates | null {
    const intercepts = smallCircleGreatCircleIntersection(smallCircleCentre, smallCircleRadius, greatCircleReference, greatCircleBearing);
    if (!intercepts) return null;

    if (distanceTo(greatCircleReference, smallCircleCentre) <= smallCircleRadius) {
        // The great circle reference is inside the circle, use the intercept which is in-front of the great circle reference as per the great circle bearing
        if (diffAngle(greatCircleBearing, bearingTo(greatCircleReference, intercepts[0])) <= 90) {
            return intercepts[0];
        }
        return intercepts[1];
    } if (diffAngle(greatCircleBearing, bearingTo(greatCircleReference, smallCircleCentre)) <= 90) {
        // The small circle centre is in-front of the great circle reference, use the closest intercept
        if (distanceTo(greatCircleReference, intercepts[0]) < distanceTo(greatCircleReference, intercepts[1])) {
            return intercepts[0];
        }
        return intercepts[1];
    }
    // The small circle centre is behind the great circle reference, use the furthest intercept
    if (distanceTo(greatCircleReference, intercepts[0]) > distanceTo(greatCircleReference, intercepts[1])) {
        return intercepts[0];
    }
    return intercepts[1];
}

/**
 * Returns the closest to greatCircleReference of two intercepts between a great circle and a small circle
 * @param smallCircleCentre
 * @param smallCircleRadius
 * @param greatCircleReference
 * @param greatCircleBearing
 */
export function closestSmallCircleIntersection(
    smallCircleCentre: Coordinates,
    smallCircleRadius: NauticalMiles,
    greatCircleReference: Coordinates,
    greatCircleBearing: DegreesTrue,
): Coordinates | null {
    const intercepts = smallCircleGreatCircleIntersection(smallCircleCentre, smallCircleRadius, greatCircleReference, greatCircleBearing);
    if (!intercepts) return null;
    if (distanceTo(greatCircleReference, intercepts[0]) < distanceTo(greatCircleReference, intercepts[1])) {
        return intercepts[0];
    }
    return intercepts[1];
}
