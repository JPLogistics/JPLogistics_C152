import { Coordinates, DegreesTrue } from './common';
import { atan2, cos, sin } from './trig';

/**
 * Calculates the bearing from one point to another (referenced at the first coordinate, bearing can be different at different points between the two)
 * @param from
 * @param to
 */
export function bearingTo(from: Coordinates, to: Coordinates): DegreesTrue {
    return (atan2(
        sin(to.long - from.long)
                * cos(to.lat),
        cos(from.lat) * sin(to.lat)
                - sin(from.lat)
                * cos(to.lat)
                * cos(to.long - from.long),
    ) + 360)
    % 360;
}
