import { Degrees } from './common';
import { DegToRad, RadToDeg } from './constants';

export const sin = (angle: Degrees) => Math.sin(DegToRad(angle));
export const cos = (angle: Degrees) => Math.cos(DegToRad(angle));
export const tan = (angle: Degrees) => Math.tan(DegToRad(angle));

export function asin(angle: number): Degrees {
    return RadToDeg(Math.asin(angle));
}
export function acos(angle: number): Degrees {
    return RadToDeg(Math.acos(angle));
}
export function atan(angle: number): Degrees {
    return RadToDeg(Math.atan(angle));
}

export function atan2(y: number, x: number): Degrees {
    return RadToDeg(Math.atan2(y, x));
}
