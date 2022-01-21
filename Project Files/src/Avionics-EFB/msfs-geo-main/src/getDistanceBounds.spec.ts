import { getDistanceBounds } from './getDistanceBounds';

describe('getDistanceBounds', () => {
    it('should be correct', () => {
        const [southWest, northEast] = getDistanceBounds({
            lat: 0,
            long: 0,
        }, 60);
        expect(southWest.long).toBeLessThan(-0.99);
        expect(southWest.long).toBeGreaterThan(-1.01);
        expect(northEast.long).toBeLessThan(1.01);
        expect(northEast.long).toBeGreaterThan(0.99);
    });
});
