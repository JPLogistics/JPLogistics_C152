import { GeoPointSubject, Subject } from '../../..';
import { AbstractMapModule } from './AbstractMapModule';
/**
 * A map data module that controls the display of the map ownship icon.
 */
export declare class MapOwnshipModule extends AbstractMapModule {
    /** Whether or not the icon is visible. */
    readonly isVisible: Subject<boolean>;
    /** The geographical postion of the ownship icon. */
    readonly position: GeoPointSubject;
    /** The heading, in degrees true, that the icon should be pointing. */
    readonly hdgTrue: Subject<number>;
    private readonly subscriber;
    private readonly positionConsumer;
    private readonly headingConsumer;
    private readonly positionHandler;
    private readonly headingHandler;
    /** @inheritdoc */
    startSync(): void;
    /** @inheritdoc */
    stopSync(): void;
}
//# sourceMappingURL=MapOwnshipModule.d.ts.map