import { GeoPointSubject, Subject } from '../../..';
import { AbstractMapModule } from './AbstractMapModule';
/**
 * A module that acquires the position and rotation of the map via the current aircraft properties.
 */
export declare class MapPositionModule extends AbstractMapModule {
    /** The airplane's position. */
    readonly position: GeoPointSubject;
    /** The airplane's true heading, in degrees. */
    readonly hdgTrue: Subject<number>;
    /** The airplane's true ground track, in degrees. */
    readonly trackTrue: Subject<number>;
    /** Whether the airplane is on the ground. */
    readonly isOnGround: Subject<boolean>;
    /** The magnetic variation at the airplane's position. */
    readonly magVar: Subject<number>;
    /** Whether or not the map rotation should be degrees true. */
    readonly isRotationTrue: Subject<boolean>;
    /** The type of map rotation to use. */
    readonly rotationType: Subject<MapRotation>;
    /** The current source for the map position. */
    readonly positionSource: Subject<MapPositionSource>;
    private readonly projectionParams;
    private readonly positionHandler;
    private readonly headingHandler;
    private readonly trackHandler;
    private readonly onGroundHandler;
    private readonly magVarHandler;
    private readonly subscriber;
    private positionConsumer;
    private headingConsumer;
    private trackConsumer;
    private onGroundConsumer;
    private magVarConsumer;
    private isBusWired;
    /**
     * Handles when the map position source is changed.
     * @param source The new map position source.
     */
    private onSourceChanged;
    /** @inheritdoc */
    startSync(): void;
    /**
     * Wires the bus handlers to the data subjects.
     */
    private wireToBus;
    /**
     * Unwires the bus handlers from the data subjects.
     */
    private unwireFromBus;
    /**
     * Updates the map's projection with the position information.
     */
    private updateProjection;
    /** @inheritdoc */
    stopSync(): void;
}
/**
 * An enumeration of possible map rotation types.
 */
export declare enum MapRotation {
    /** Map rotation points towards north up. */
    NorthUp = "NorthUp",
    /** Map up position points towards the current airplane track. */
    TrackUp = "TrackUp",
    /** Map up position points towards the current airplane heading. */
    HeadingUp = "HeadingUp",
    /** Map up position points towards the current nav desired track. */
    DtkUp = "DtkUp"
}
/**
 * An enumeration of possible map position sources.
 */
export declare enum MapPositionSource {
    /** Map position will be sourced from the player aircraft. */
    OwnAirplane = "OwnAirplane",
    /** Map position will be supplied externally and player aircraft position updates will be ignored. */
    External = "External"
}
//# sourceMappingURL=MapPositionModule.d.ts.map