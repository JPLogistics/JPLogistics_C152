import { SubEvent, Subject } from '..';
import { EventBus, KeyEventData, KeyInterceptManager } from '../data';
import { APLateralModes, APVerticalModes } from './APConfig';
/** AP Mode Types */
export declare enum APModeType {
    LATERAL = 0,
    VERTICAL = 1,
    APPROACH = 2
}
/** Interface for APModePressEvents */
export interface APModePressEvent {
    /** The Mode */
    mode: APLateralModes | APVerticalModes;
    /** The Set Value, if any */
    set?: boolean;
}
/**
 * A class that manages the autopilot modes and autopilot mode states.
 */
export declare abstract class APStateManager {
    protected readonly bus: EventBus;
    private keyInterceptManager?;
    private readonly apListener;
    private apListenerRegistered;
    private managedModeSet;
    stateManagerInitialized: Subject<boolean>;
    lateralPressed: SubEvent<this, APModePressEvent>;
    verticalPressed: SubEvent<this, APModePressEvent>;
    approachPressed: SubEvent<this, boolean | undefined>;
    vnavPressed: SubEvent<this, boolean>;
    apMasterOn: Subject<boolean>;
    fdMasterOn: Subject<boolean>;
    /**
     * Creates an instance of the APStateManager.
     * @param bus An instance of the event bus.
     */
    constructor(bus: EventBus);
    /**
     * A callback which is called when the autopilot listener has been registered.
     */
    protected onAPListenerRegistered(): void;
    /**
     * Sets up key intercepts for the simulation autopilot key events.
     * @param manager The key intercept manager.
     */
    protected abstract setupKeyIntercepts(manager: KeyInterceptManager): void;
    /**
     * Handles an intercepted key event.
     * @param data The event data.
     */
    protected abstract handleKeyIntercepted(data: KeyEventData): void;
    /**
     * Checks whether the AP State Manager has completed listerner steps,
     * and if so, finishes initializing and then notifies Autopilot of the same.
     * @param force forces the initialize
     */
    initialize(force?: boolean): void;
    /**
     * Sets the Flight Director State
     * @param on is wheter to set the FD On.
     */
    setFlightDirector(on: boolean): void;
    /**
     * Sets Managed Mode.
     * @param set is wheter to set or unset managed mode.
     */
    private setManagedMode;
    /**
     * Toggles VNAV L Var value.
     */
    protected toggleVnav(): void;
    /**
     * Sends AP Mode Events from the Intercept to the Autopilot.
     * @param type is the AP Mode Type for this event
     * @param mode is the mode to set/unset.
     * @param set is whether to actively set or unset this mode.
     */
    protected sendApModeEvent(type: APModeType, mode?: APLateralModes | APVerticalModes, set?: boolean): void;
    /**
     * Method to override with steps to run before initialze method is run.
     */
    protected onBeforeInitialize(): void;
}
//# sourceMappingURL=APStateManager.d.ts.map