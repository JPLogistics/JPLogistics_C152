import { GeoPoint, GeoPointSubject, Subject } from '../../..';
import { AbstractMapModule } from './AbstractMapModule';
/**
 * A map data module that controls the display of the map ownship icon.
 */
export class MapOwnshipModule extends AbstractMapModule {
    constructor() {
        super(...arguments);
        /** Whether or not the icon is visible. */
        this.isVisible = Subject.create(true);
        /** The geographical postion of the ownship icon. */
        this.position = GeoPointSubject.createFromGeoPoint(new GeoPoint(0, 0));
        /** The heading, in degrees true, that the icon should be pointing. */
        this.hdgTrue = Subject.create(0);
        this.subscriber = this.mapSystemContext.bus.getSubscriber();
        this.positionConsumer = this.subscriber.on('gps-position').atFrequency(this.mapSystemContext.refreshRate);
        this.headingConsumer = this.subscriber.on('hdg_deg_true').atFrequency(this.mapSystemContext.refreshRate);
        this.positionHandler = (p) => this.position.set(p.lat, p.long);
        this.headingHandler = (v) => this.hdgTrue.set(v);
    }
    /** @inheritdoc */
    startSync() {
        this.positionConsumer.handle(this.positionHandler);
        this.headingConsumer.handle(this.headingHandler);
    }
    /** @inheritdoc */
    stopSync() {
        this.positionConsumer.off(this.positionHandler);
        this.headingConsumer.off(this.headingHandler);
    }
}
