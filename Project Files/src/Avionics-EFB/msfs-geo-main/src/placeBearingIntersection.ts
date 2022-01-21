import * as math from 'mathjs';
import { clampAngle, Coordinates, coordinatesToSpherical, DegreesTrue, sphericalToCoordinates } from './common';
import { placeBearingDistance } from './placeBearingDistance';
import { bearingTo } from './bearingTo';

/**
 * Calculates the intercept points of two Coordinates and two bearings
 * @param point1
 * @param bearing1
 * @param point2
 * @param bearing2
 */
export function placeBearingIntersection(point1: Coordinates, bearing1: DegreesTrue, point2: Coordinates, bearing2: DegreesTrue): [Coordinates, Coordinates] {
    const Pa11 = coordinatesToSpherical(point1);
    const point12 = placeBearingDistance(point1, clampAngle(bearing1), 500);
    const Pa12 = coordinatesToSpherical(point12);
    const Pa21 = coordinatesToSpherical(point2);
    const point22 = placeBearingDistance(point2, clampAngle(bearing2), 500);
    const Pa22 = coordinatesToSpherical(point22);

    const N1 = math.cross(Pa11, Pa12);
    const N2 = math.cross(Pa21, Pa22);

    const L = math.cross(N1, N2);
    const l = math.norm(L);

    const I1 = math.divide(L, l);

    const I2 = math.multiply(I1, -1);

    const s1 = sphericalToCoordinates(I1 as [number, number, number]);
    const s2 = sphericalToCoordinates(I2 as [number, number, number]);

    const brgTos1 = bearingTo(point1, s1);
    const brgTos2 = bearingTo(point1, s2);

    const delta1 = Math.abs(clampAngle(bearing1) - brgTos1);
    const delta2 = Math.abs(clampAngle(bearing1) - brgTos2);

    return [delta1 < delta2 ? s1 : s2, delta1 < delta2 ? s2 : s1];
}
