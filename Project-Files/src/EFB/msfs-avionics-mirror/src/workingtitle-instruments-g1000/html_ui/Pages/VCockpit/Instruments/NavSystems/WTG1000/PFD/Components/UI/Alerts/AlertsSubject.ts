import { ArraySubject, SubscribableArray, SubscribableArrayHandler, Subscription } from 'msfssdk';
import { EventBus, Publisher } from 'msfssdk/data';

/**
 * A message to be displayed in the Alerts pane.
 */
export interface AlertMessage {
  /** The key of the message. */
  key: string;

  /** The title of the message to display. */
  title: string;

  /** The body of the message. */
  message: string;
}

/**
 * Events for the G1000 alert system.
 */
export interface AlertMessageEvents {
  /** An alert has been pushed. */
  'alerts_push': AlertMessage;

  /** An alert has been removed. */
  'alerts_remove': string;

  /** Whether or not there are any alerts currently avaiable to read. */
  'alerts_available': boolean;
}

/**
 * A subject that tracks G1000 alert messages.
 */
export class AlertsSubject implements SubscribableArray<AlertMessage> {

  private readonly data = ArraySubject.create<AlertMessage>([]);
  private readonly publisher: Publisher<AlertMessageEvents>;

  /**
   * Creates an instance of a AlertsSubject.
   * @param bus An instance of the event bus.
   */
  constructor(bus: EventBus) {
    const sub = bus.getSubscriber<AlertMessageEvents>();
    sub.on('alerts_push').handle(this.onAlertPushed.bind(this));
    sub.on('alerts_remove').handle(this.onAlertRemoved.bind(this));

    this.publisher = bus.getPublisher<AlertMessageEvents>();
  }

  /**
   * A callback called when an alert is pushed on the bus.
   * @param message The alert message that was pushed.
   */
  private onAlertPushed(message: AlertMessage): void {
    const index = this.data.getArray().findIndex(x => x.key === message.key);
    if (index < 0) {
      this.data.insert(message, 0);
      this.publisher.pub('alerts_available', true, false, true);
    }
  }

  /**
   * A callback called when an alert is removed from the bus.
   * @param key The key of the alert that was removed.
   */
  private onAlertRemoved(key: string): void {
    const index = this.data.getArray().findIndex(x => x.key === key);
    if (index >= 0) {
      this.data.removeAt(index);

      if (this.data.length === 0) {
        this.publisher.pub('alerts_available', false, false, true);
      }
    }
  }

  /** @inheritdoc */
  public get length(): number {
    return this.data.length;
  }

  /** @inheritdoc */
  public get(index: number): AlertMessage {
    return this.data.get(index);
  }

  /** @inheritdoc */
  public tryGet(index: number): AlertMessage | undefined {
    return this.data.tryGet(index);
  }

  /** @inheritdoc */
  public getArray(): readonly AlertMessage[] {
    return this.data.getArray();
  }

  /** @inheritdoc */
  public sub(handler: SubscribableArrayHandler<AlertMessage>, initialNotify = false, paused = false): Subscription {
    return this.data.sub(handler, initialNotify, paused);
  }

  /** @inheritdoc */
  public unsub(handler: SubscribableArrayHandler<AlertMessage>): void {
    this.data.unsub(handler);
  }
}