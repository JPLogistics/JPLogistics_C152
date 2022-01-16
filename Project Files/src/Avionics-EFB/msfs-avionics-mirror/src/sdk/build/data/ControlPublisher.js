import { BasePublisher } from '../instruments/BasePublishers';
/**
 * A publisher for control interactions.
 * This is meant to handle the events for which there aren't existing HEvents
 * in the sim to allow us to maintain a decoupled, event-driven architecture.
 */
export class ControlPublisher extends BasePublisher {
    /**
     * Create a ControlPublisher.
     * @param bus The EventBus to publish to.
     * @param pacer An optional pacer to use to control the rate of publishing.
     */
    constructor(bus, pacer = undefined) {
        super(bus, pacer);
    }
    /**
     * Publish a control event.
     * @param event The event from ControlEvents.
     * @param value The value of the event.
     */
    publishEvent(event, value) {
        this.publish(event, value, true);
    }
    /** debug logger */
    startPublish() {
        super.startPublish();
        // console.log('control publisher started.');
    }
}
