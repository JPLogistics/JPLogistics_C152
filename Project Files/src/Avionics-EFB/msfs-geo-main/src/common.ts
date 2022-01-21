import { asin, atan2, cos, sin } from './trig';

export type Radians = number;

export type Degrees = number;
export type DegreesMagnetic = Degrees;
export type DegreesTrue = Degrees;
export type Feet = number;
export type Knots = number;
export type Latitude = Degrees;
export type Longitude = Degrees;
export type Metres = number;
export type Minutes = number;
export type NauticalMiles = number;

export interface Coordinates {
    lat: Latitude;
    long: Longitude;
}

export const robustAcos = (value: number): number => {
    if (value > 1) {
        return 1;
    }
    if (value < -1) {
        return -1;
    }

    return value;
};

export function clampAngle(a: DegreesTrue): DegreesTrue {
    while (a >= 360) {
        a -= 360;
    }
    while (a < 0) {
        a += 360;
    }
    return a;
}

export function diffAngle(a: DegreesTrue, b: DegreesTrue): DegreesTrue {
    let diff = b - a;
    while (diff > 180) {
        diff -= 360;
    }
    while (diff <= -180) {
        diff += 360;
    }
    return diff;
}

export function coordinatesToSpherical(location: Coordinates) {
    return [
        cos(location.lat) * cos(location.long),
        cos(location.lat) * sin(location.long),
        sin(location.lat),
    ];
}

export function sphericalToCoordinates(spherical: [number, number, number]): Coordinates {
    return {
        lat: asin(spherical[2]),
        long: atan2(spherical[1], spherical[0]),
    };
}
