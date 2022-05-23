import { EventBus, IndexedEventType } from '../data';
/**
 * Virtual throttle lever events.
 */
export interface VirtualThrottleLeverEvents {
    /** The position of an indexed virtual throttle lever. Ranges from 0 to 1. */
    [v_throttle_lever_pos: IndexedEventType<'v_throttle_lever_pos'>]: number;
}
/**
 * A manager for virtual throttle levers. Intercepts key events that control engine throttle settings and uses them
 * to move virtual throttle levers instead. The positions of the virtual throttle levers are published on the event
 * bus.
 */
export declare class ThrottleLeverManager {
    private readonly bus;
    private static readonly THROTTLE_COUNT;
    private static readonly RAW_MIN;
    private static readonly RAW_MAX;
    private static readonly RAW_RANGE;
    private static readonly RAW_STEP;
    private keyInterceptManager?;
    private readonly throttleLeverRawPositions;
    /**
     * Constructor.
     * @param bus The event bus.
     * @param onInitCallback A callback function to be executed once this manager is initialized.
     */
    constructor(bus: EventBus, onInitCallback?: () => void);
    /**
     * Responds to key intercept events.
     * @param data The event data.
     * @param data.key The key that was intercepted.
     * @param data.value The value of the intercepted key event.
     */
    private onKeyIntercepted;
    /**
     * Sets the raw throttle lever position.
     * @param rawPosition The raw position to set.
     * @param index The index of the throttle lever to set. If undefined, the positions of all throttle levers will be
     * set.
     */
    private setRawThrottleLeverPosition;
    /**
     * Publishes a virtual throttle lever position.
     * @param position The position to publish.
     * @param index The index of the throttle lever for which to publish. If undefined, positions will be published for
     * all throttle levers.
     */
    private publishThrottleLeverPosition;
}
//# sourceMappingURL=ThrottleLeverManager.d.ts.map