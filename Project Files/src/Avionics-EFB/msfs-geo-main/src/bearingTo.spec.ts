import { bearingTo } from './bearingTo';

describe('bearingTo', () => {
    it('should return a bearing between two points', () => {
        expect(
            bearingTo(
                { lat: 39.778889, long: -104.9825 },
                { lat: 43.778889, long: -102.9825 },
            ),
        ).toEqual(19.787524850709246);
        expect(
            bearingTo(
                { lat: 51.5104, long: 7.3256 },
                { lat: 43.778889, long: 7.491 },
            ),
        ).toEqual(179.11237166124715);
    });
});
