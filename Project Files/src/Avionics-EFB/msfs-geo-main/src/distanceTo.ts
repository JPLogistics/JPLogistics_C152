import { Coordinates, NauticalMiles, robustAcos } from './common';
import { EARTH_RADIUS } from './constants';
import { cos, sin } from './trig';

/**
 * Calculates the distance between two coordinates on the globe
 * @param from
 * @param to
 */
export function distanceTo(from: Coordinates, to: Coordinates): NauticalMiles {
    return Math.acos(
        robustAcos(
            sin(to.lat) * sin(from.lat)
                + cos(to.lat)
                * cos(from.lat)
                * cos(from.long - to.long),
        ),
    ) * EARTH_RADIUS;
}
