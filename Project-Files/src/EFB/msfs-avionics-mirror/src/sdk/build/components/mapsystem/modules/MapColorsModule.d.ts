/// <reference types="msfstypes/js/netbingmap" />
import { ArraySubject, Subject } from '../../..';
import { AbstractMapModule } from './AbstractMapModule';
/**
 * A map data module that controls the terrain color reference point.
 */
export declare class MapColorsModule extends AbstractMapModule {
    /** The current map terrain colors reference point. */
    terrainReference: Subject<EBingReference>;
    /** The current map colors array. */
    colors: ArraySubject<number>;
}
//# sourceMappingURL=MapColorsModule.d.ts.map