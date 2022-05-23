import { GeoPoint, GeoPointSubject, MagVar, Subject, UnitType } from '../../..';
import { AbstractMapModule } from './AbstractMapModule';
/**
 * A module that acquires the position and rotation of the map via the current aircraft properties.
 */
export class MapPositionModule extends AbstractMapModule {
    constructor() {
        super(...arguments);
        /** The airplane's position. */
        this.position = GeoPointSubject.createFromGeoPoint(new GeoPoint(0, 0));
        /** The airplane's true heading, in degrees. */
        this.hdgTrue = Subject.create(0);
        /** The airplane's true ground track, in degrees. */
        this.trackTrue = Subject.create(0);
        /** Whether the airplane is on the ground. */
        this.isOnGround = Subject.create(true);
        /** The magnetic variation at the airplane's position. */
        this.magVar = Subject.create(0);
        /** Whether or not the map rotation should be degrees true. */
        this.isRotationTrue = Subject.create(false);
        /** The type of map rotation to use. */
        this.rotationType = Subject.create(MapRotation.HeadingUp);
        /** The current source for the map position. */
        this.positionSource = Subject.create(MapPositionSource.OwnAirplane);
        this.projectionParams = {
            target: this.position.get(),
            rotation: 0
        };
        this.positionHandler = (pos) => this.position.set(pos.lat, pos.long);
        this.headingHandler = (v) => this.hdgTrue.set(v);
        this.trackHandler = (v) => this.trackTrue.set(v);
        this.onGroundHandler = (v) => this.isOnGround.set(v);
        this.magVarHandler = (v) => this.magVar.set(v);
        this.subscriber = this.mapSystemContext.bus.getSubscriber();
        this.positionConsumer = this.subscriber.on('gps-position').atFrequency(this.mapSystemContext.refreshRate);
        this.headingConsumer = this.subscriber.on('hdg_deg_true').atFrequency(this.mapSystemContext.refreshRate);
        this.trackConsumer = this.subscriber.on('track_deg_true').atFrequency(this.mapSystemContext.refreshRate);
        this.onGroundConsumer = this.subscriber.on('on_ground').atFrequency(this.mapSystemContext.refreshRate);
        this.magVarConsumer = this.subscriber.on('magvar').atFrequency(this.mapSystemContext.refreshRate);
        this.isBusWired = false;
        /**
         * Handles when the map position source is changed.
         * @param source The new map position source.
         */
        this.onSourceChanged = (source) => {
            if (this.isSyncing) {
                if (source === MapPositionSource.OwnAirplane) {
                    this.wireToBus();
                }
                else {
                    this.unwireFromBus();
                }
            }
        };
        /**
         * Updates the map's projection with the position information.
         */
        this.updateProjection = () => {
            let rotation = 0;
            switch (this.rotationType.get()) {
                case MapRotation.HeadingUp:
                    rotation = this.hdgTrue.get();
                    break;
                case MapRotation.TrackUp:
                    if (this.isOnGround.get()) {
                        rotation = this.hdgTrue.get();
                    }
                    else {
                        rotation = this.trackTrue.get();
                    }
                    break;
            }
            if (this.isRotationTrue.get()) {
                rotation = MagVar.trueToMagnetic(rotation, -this.magVar.get());
            }
            this.projectionParams.rotation = UnitType.DEGREE.convertTo(-rotation, UnitType.RADIAN);
            this.projectionParams.target = this.position.get();
            this.mapSystemContext.projection.setQueued(this.projectionParams);
        };
    }
    /** @inheritdoc */
    startSync() {
        this.stopSync();
        this.positionSource.sub(this.onSourceChanged, true);
        this.rotationType.sub(this.updateProjection, true);
        this.isRotationTrue.sub(this.updateProjection, true);
        this.position.sub(this.updateProjection, true);
        this.hdgTrue.sub(this.updateProjection, true);
        this.trackTrue.sub(this.updateProjection, true);
        this.magVar.sub(this.updateProjection, true);
        this.isOnGround.sub(this.updateProjection, true);
        if (this.positionSource.get() === MapPositionSource.OwnAirplane) {
            this.wireToBus();
        }
        this.isSyncing = true;
    }
    /**
     * Wires the bus handlers to the data subjects.
     */
    wireToBus() {
        if (!this.isBusWired) {
            this.positionConsumer.handle(this.positionHandler);
            this.headingConsumer.handle(this.headingHandler);
            this.trackConsumer.handle(this.trackHandler);
            this.onGroundConsumer.handle(this.onGroundHandler);
            this.magVarConsumer.handle(this.magVarHandler);
            this.isBusWired = true;
            this.updateProjection();
        }
    }
    /**
     * Unwires the bus handlers from the data subjects.
     */
    unwireFromBus() {
        if (this.isBusWired) {
            this.positionConsumer.off(this.positionHandler);
            this.headingConsumer.off(this.headingHandler);
            this.trackConsumer.off(this.trackHandler);
            this.onGroundConsumer.off(this.onGroundHandler);
            this.magVarConsumer.off(this.magVarHandler);
            this.isBusWired = false;
        }
    }
    /** @inheritdoc */
    stopSync() {
        if (!this.isSyncing) {
            return;
        }
        this.positionSource.unsub(this.onSourceChanged);
        this.rotationType.unsub(this.updateProjection);
        this.isRotationTrue.unsub(this.updateProjection);
        this.position.unsub(this.updateProjection);
        this.hdgTrue.unsub(this.updateProjection);
        this.trackTrue.unsub(this.updateProjection);
        this.magVar.unsub(this.updateProjection);
        this.isOnGround.unsub(this.updateProjection);
        this.unwireFromBus();
        this.isSyncing = false;
    }
}
/**
 * An enumeration of possible map rotation types.
 */
export var MapRotation;
(function (MapRotation) {
    /** Map rotation points towards north up. */
    MapRotation["NorthUp"] = "NorthUp";
    /** Map up position points towards the current airplane track. */
    MapRotation["TrackUp"] = "TrackUp";
    /** Map up position points towards the current airplane heading. */
    MapRotation["HeadingUp"] = "HeadingUp";
    /** Map up position points towards the current nav desired track. */
    MapRotation["DtkUp"] = "DtkUp";
})(MapRotation || (MapRotation = {}));
/**
 * An enumeration of possible map position sources.
 */
export var MapPositionSource;
(function (MapPositionSource) {
    /** Map position will be sourced from the player aircraft. */
    MapPositionSource["OwnAirplane"] = "OwnAirplane";
    /** Map position will be supplied externally and player aircraft position updates will be ignored. */
    MapPositionSource["External"] = "External";
})(MapPositionSource || (MapPositionSource = {}));
