import {
    closestSmallCircleIntersection,
    firstSmallCircleIntersection,
    smallCircleGreatCircleIntersection,
} from './smallCircleGreatCircleIntersection';

describe('smallCircleGreatCircleIntersection', () => {
    it('Check that intersection is null when different longitudes and facing north with enough spacing', () => {
        const intersections = smallCircleGreatCircleIntersection({
            lat: 0,
            long: 0,
        }, 59, {
            lat: 0,
            long: 1,
        }, 0);
        expect(intersections).toBeNull();
    });
    it('Check that intersection is same longitude when both references are same longitude and bearing is north', () => {
        const intersections = smallCircleGreatCircleIntersection({
            lat: 90,
            long: 0,
        }, 5, {
            lat: 85,
            long: 10,
        }, 0);
        expect(intersections).not.toBeNull();
        expect(intersections![0].long).toBeLessThan(-9.999);
        expect(intersections![0].long).toBeGreaterThan(-10.01);
        expect(intersections![1].long).toBeLessThan(10.01);
        expect(intersections![1].long).toBeGreaterThan(9.999);
    });
    it('Check that the first intercept is returned when inside the circle', () => {
        // Test when great circle reference is inside the circle
        const intersection1 = firstSmallCircleIntersection({
            lat: 0,
            long: 0,
        }, 60, {
            lat: 0,
            long: 0.5,
        }, 270);
        expect(intersection1).not.toBeNull();
        expect(intersection1!.long).toBeLessThan(-0.99);
        expect(intersection1!.long).toBeGreaterThan(-1.01);
        const intersection2 = firstSmallCircleIntersection({
            lat: 0,
            long: 0,
        }, 60, {
            lat: 0,
            long: 0.5,
        }, 90);
        expect(intersection2).not.toBeNull();
        expect(intersection2!.long).toBeGreaterThan(0.99);
        expect(intersection2!.long).toBeLessThan(1.01);
    });
    it('Check that the first intercept is returned when east of the circle', () => {
        const intersection1 = firstSmallCircleIntersection({
            lat: 0,
            long: 0,
        }, 60, {
            lat: 0,
            long: 1.5,
        }, 270);
        expect(intersection1).not.toBeNull();
        expect(intersection1!.long).toBeGreaterThan(0.99);
        expect(intersection1!.long).toBeLessThan(1.01);
        const intersection2 = firstSmallCircleIntersection({
            lat: 0,
            long: 0,
        }, 60, {
            lat: 0,
            long: 1.5,
        }, 90);
        expect(intersection2).not.toBeNull();
        expect(intersection2!.long).toBeLessThan(-0.99);
        expect(intersection2!.long).toBeGreaterThan(-1.01);
    });

    it('Check that the first intercept is returned when west of the circle', () => {
        const intersection1 = firstSmallCircleIntersection({
            lat: 0,
            long: 0,
        }, 60, {
            lat: 0,
            long: -1.5,
        }, 270);
        expect(intersection1).not.toBeNull();
        expect(intersection1!.long).toBeGreaterThan(0.99);
        expect(intersection1!.long).toBeLessThan(1.01);
        const intersection2 = firstSmallCircleIntersection({
            lat: 0,
            long: 0,
        }, 60, {
            lat: 0,
            long: -1.5,
        }, 90);
        expect(intersection2).not.toBeNull();
        expect(intersection2!.long).toBeLessThan(-0.99);
        expect(intersection2!.long).toBeGreaterThan(-1.01);
    });

    it('Check that the closest intercept is returned inside the circle', () => {
        const intersection1 = closestSmallCircleIntersection({
            lat: 0,
            long: 0,
        }, 60, {
            lat: 0,
            long: 0.5,
        }, 270);
        expect(intersection1).not.toBeNull();
        expect(intersection1!.long).toBeGreaterThan(0.99);
        expect(intersection1!.long).toBeLessThan(1.01);
        const intersection2 = closestSmallCircleIntersection({
            lat: 0,
            long: 0,
        }, 60, {
            lat: 0,
            long: 0.5,
        }, 90);
        expect(intersection2).not.toBeNull();
        expect(intersection2!.long).toBeGreaterThan(0.99);
        expect(intersection2!.long).toBeLessThan(1.01);

        const intersection3 = closestSmallCircleIntersection({
            lat: 0,
            long: 0,
        }, 60, {
            lat: 0,
            long: -0.5,
        }, 270);
        expect(intersection3).not.toBeNull();
        expect(intersection3!.long).toBeLessThan(-0.99);
        expect(intersection3!.long).toBeGreaterThan(-1.01);
        const intersection4 = closestSmallCircleIntersection({
            lat: 0,
            long: 0,
        }, 60, {
            lat: 0,
            long: -0.5,
        }, 90);
        expect(intersection4).not.toBeNull();
        expect(intersection4!.long).toBeLessThan(-0.99);
        expect(intersection4!.long).toBeGreaterThan(-1.01);
    });

    it('Check that intercepts work across poles', () => {
        const intersection1 = smallCircleGreatCircleIntersection({
            lat: 90,
            long: 0,
        }, 0.1, {
            lat: 89,
            long: 0,
        }, 0);
        expect(intersection1).not.toBeNull();
        expect(intersection1![0].lat).toBeGreaterThan(89.98);
        expect(intersection1![0].lat).toBeLessThan(90.02);
        expect(intersection1![1].lat).toBeGreaterThan(89.98);
        expect(intersection1![1].lat).toBeLessThan(90.02);

        expect(intersection1![1].long).toBeGreaterThan(-0.1);
        expect(intersection1![1].long).toBeLessThan(0.1);
        expect(intersection1![0].long).toBeGreaterThan(179.9);
        expect(intersection1![0].long).toBeLessThan(180.1);
    });
});
