import { BasePublisher } from '../instruments';
/** A publisher for VNAV-related data events */
export class VNavDataEventPublisher extends BasePublisher {
    /**
     * Create a publisher for VNAV-related data.
     * @param bus The EventBus to publish to.
     */
    constructor(bus) {
        super(bus);
    }
    /**
     * Publish a control event.
     * @param event The event from ControlEvents.
     * @param value The value of the event.
     */
    publishEvent(event, value) {
        this.publish(event, value, true);
    }
}
