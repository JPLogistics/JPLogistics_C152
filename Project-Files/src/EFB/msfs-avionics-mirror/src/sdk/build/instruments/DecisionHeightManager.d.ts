import { EventBus } from '../data';
/** Events related to DH/DA */
export interface DHEvents {
    /** The current decision height  */
    decision_height: number;
    /** The current decision altitude */
    decision_altitude: number;
}
/**
 * A class that manages decision height and altitude data and events.
 */
export declare class DHManager {
    private bus;
    private simVarPublisher;
    private simVarSubscriber;
    private controlSubscriber;
    private publisher;
    private currentDH;
    private currentDA;
    private daDistanceUnit;
    private dhDistanceUnit;
    /**
     * Create a DHManager
     * @param bus The event bus
     */
    constructor(bus: EventBus);
    /** Initialize the instrument. */
    init(): void;
    /** Update our simvar publisher. */
    onUpdate(): void;
}
//# sourceMappingURL=DecisionHeightManager.d.ts.map