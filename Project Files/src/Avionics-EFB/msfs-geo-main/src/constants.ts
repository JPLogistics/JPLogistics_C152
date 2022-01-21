import { Degrees, Latitude, Longitude, Metres, NauticalMiles, Radians } from './common';

export function DegToRad(value: Degrees): Radians {
    return value * (Math.PI / 180);
}
export function RadToDeg(value: Radians): Degrees {
    return value * (180 / Math.PI);
}
export function NmToMetres(value: NauticalMiles): Metres {
    return value * 1852;
}
export function MetresToNm(value: Metres): NauticalMiles {
    return value / 1852;
}

export const MIN_LAT: Latitude = -90;
export const MAX_LAT: Latitude = 90;
export const MIN_LON: Longitude = -180;
export const MAX_LON: Longitude = 180;

export const EARTH_RADIUS: NauticalMiles = 3443.91846652;
