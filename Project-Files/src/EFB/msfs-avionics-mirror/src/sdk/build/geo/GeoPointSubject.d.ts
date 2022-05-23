import { Subject } from '../sub/Subject';
import { GeoPoint, GeoPointInterface } from './GeoPoint';
/**
 * A Subject which provides a GeoPointInterface value.
 */
export declare class GeoPointSubject extends Subject<GeoPointInterface> {
    /**
     * Sets the new value and notifies the subscribers if the value changed.
     * @param value The new value.
     */
    set(value: GeoPointInterface): void;
    /**
     * Sets the new value and notifies the subscribers if the value changed.
     * @param lat The latitude of the new value.
     * @param lon The longitude of the new value.
     */
    set(lat: number, lon: number): void;
    /**
     * Creates a GeoPointSubject.
     * @param initialVal The initial value.
     * @returns a GeoPointSubject.
     */
    static createFromGeoPoint(initialVal: GeoPoint): GeoPointSubject;
}
//# sourceMappingURL=GeoPointSubject.d.ts.map