import { Coordinates, DegreesTrue, NauticalMiles } from './common';
import { EARTH_RADIUS, MAX_LON, MIN_LON } from './constants';
import { asin, atan2, cos, sin } from './trig';

/**
 * Calculates a Coordinate at a bearing and distance from a reference point
 * @param place - Point to reference from
 * @param bearing
 * @param distance
 */
export function placeBearingDistance(place: Coordinates, bearing: DegreesTrue, distance: NauticalMiles): Coordinates {
    const delta = distance / EARTH_RADIUS;

    const lat = asin(
        sin(place.lat) * Math.cos(delta)
        + cos(place.lat) * Math.sin(delta) * cos(bearing),
    );

    let long = place.long
        + atan2(
            sin(bearing) * Math.sin(delta) * cos(place.lat),
            Math.cos(delta) - sin(place.lat) * sin(lat),
        );

    if (long < MIN_LON || long > MAX_LON) {
        long = ((long + 540) % (360)) - 180;
    }

    return {
        lat,
        long,
    };
}
