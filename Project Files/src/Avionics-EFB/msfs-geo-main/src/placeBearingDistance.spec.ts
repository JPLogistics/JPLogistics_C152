import { placeBearingDistance } from './placeBearingDistance';

describe('placeBearingDistance', () => {
    it('should get the destination point to a given point, distance and bearing', () => {
        expect(
            placeBearingDistance(
                { lat: 52.518611, long: 13.408056 },
                180,
                8.09935205184,
            ),
        ).toEqual({
            lat: 52.383863707381906,
            long: 13.408056,
        });

        expect(
            placeBearingDistance(
                { lat: 52.518611, long: 13.408056 },
                135,
                8.09935205184,
            ),
        ).toEqual({
            lat: 52.4232272267234,
            long: 13.564299057246314,
        });
    });

    it('should not exceed maxLon or fall below minLon', () => {
        expect(
            placeBearingDistance(
                { lat: 18.5075232, long: 73.8047121 },
                0,
                26997.8401728,
            ),
        ).toEqual({
            lat: 72.33483473966008,
            long: -106.19528790000004,
        });
    });

    it('should leave long untouched if bearing is 0 or 180', () => {
        expect(
            placeBearingDistance(
                { lat: 18.5075232, long: 73.8047121 },
                0,
                0.26997840172,
            ),
        ).toEqual({
            lat: 18.512014776420475,
            long: 73.8047121,
        });

        expect(
            placeBearingDistance(
                { lat: 18.5075232, long: 73.8047121 },
                180,
                0.26997840172,
            ),
        ).toEqual({
            lat: 18.50303162357953,
            long: 73.8047121,
        });
    });
});
