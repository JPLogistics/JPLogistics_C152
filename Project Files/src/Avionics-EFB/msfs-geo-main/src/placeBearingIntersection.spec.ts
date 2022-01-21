import { placeBearingIntersection } from './placeBearingIntersection';

describe('greatCircleIntersection', () => {
    it('should return the north pole first then south pole when both bearings are (directly north)', () => {
        const a = placeBearingIntersection(
            { lat: 39.778889, long: -104.9825 },
            0,
            { lat: 43.778889, long: -102.9825 },
            0,
        );
        expect(
            a[0].lat,
        ).toEqual(90);
        expect(
            a[1].lat,
        ).toEqual(-90);
    });
    it('should return the south pole first then north pole when both bearings are 180 (directly south)', () => {
        const a = placeBearingIntersection(
            { lat: 39.778889, long: -104.9825 },
            180,
            { lat: 43.778889, long: -102.9825 },
            180,
        );
        expect(
            a[0].lat,
        ).toEqual(-90);
        expect(
            a[1].lat,
        ).toEqual(90);
    });
    it('should return a coordinate on the equator when both points are the same longitude and equidistant from equator', () => {
        const a = placeBearingIntersection(
            { lat: 43, long: -104.9825 },
            175,
            { lat: -43, long: -104.9825 },
            5,
        );
        expect(
            a[0].lat,
        ).toEqual(0);
        expect(
            a[1].lat,
        ).toEqual(-0);
    });
    it('should return a coordinate half way between longitude wise when both bearings are part of isosceles triangle and both coordinates are same latitude', () => {
        const a = placeBearingIntersection(
            { lat: -43, long: 0 },
            -45,
            { lat: -43, long: -90 },
            45,
        );
        expect(
            a[0].long,
        ).toBeGreaterThan(-45.01);
        expect(
            a[0].long,
        ).toBeLessThan(-44.99);
        expect(
            a[1].long,
        ).toBeLessThan(135.01);
        expect(
            a[1].long,
        ).toBeGreaterThan(134.99);
    });
});
