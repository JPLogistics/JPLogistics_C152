import { EventBus } from 'msfssdk/data';
import { VNavEvents, VNavAvailability } from 'msfssdk/autopilot';
import { AlertMessageEvents } from './UI/Alerts/AlertsSubject';

/**
 * A class that watches VNAV state and builds alert messages from them.
 */
export class VNavAlertForwarder {

  /**
   * Creates an instance of VNavAlertForwarder.
   * @param bus The EventBus to use with this instance.
   */
  constructor(private readonly bus: EventBus) {
    const sub = bus.getSubscriber<VNavEvents>();
    sub.on('vnav_availability').handle(availability => {
      if (availability === VNavAvailability.InvalidLegs) {
        this.bus.getPublisher<AlertMessageEvents>().pub('alerts_push', {
          key: 'vnv-unavailable-legs',
          title: 'VNV UNAVAILABLE',
          message: 'Unsupported leg type in flight plan.'
        }, true, false);
      } else {
        this.bus.getPublisher<AlertMessageEvents>().pub('alerts_remove', 'vnv-unavailable-legs', true, false);
      }
    });
  }
}