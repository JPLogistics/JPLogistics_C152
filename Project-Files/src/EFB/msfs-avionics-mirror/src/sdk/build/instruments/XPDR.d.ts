import { EventBus, IndexedEventType, PublishPacer } from '../data';
import { SimVarPublisher } from './BasePublishers';
/** Simvar definitions related to a transponder. */
export interface XPDRSimVarEvents {
    /** Transponder code. */
    [xpdr_code: IndexedEventType<'xpdr_code'>]: number;
    /** Transponder mode. */
    [xpdr_mode: IndexedEventType<'xpdr_mode'>]: XPDRMode;
    /** Whether the transponder is sending ident. */
    [xpdr_ident: IndexedEventType<'xpdr_ident'>]: boolean;
}
/** Transponder modes. */
export declare enum XPDRMode {
    OFF = 0,
    STBY = 1,
    TEST = 2,
    ON = 3,
    ALT = 4,
    GROUND = 5
}
/** A publiher to poll transponder simvars. */
export declare class XPDRSimVarPublisher extends SimVarPublisher<XPDRSimVarEvents> {
    /**
     * Create an XPDRSimVarPublisher.
     * @param bus The EventBus to publish to.
     * @param pacer An optional pacer to use to control the pace of publishing.
     * @param transponderCount The number of transponders supported by this publisher.
     */
    constructor(bus: EventBus, pacer?: PublishPacer<XPDRSimVarEvents> | undefined, transponderCount?: number);
}
/** A transponder. */
export declare class XPDRInstrument {
    private readonly bus;
    private readonly transponderCount;
    private simVarPublisher;
    private controlSubscriber;
    private readonly identDebounceTimers;
    /**
     * Create an XPDRInstrument.
     * @param bus The event bus to publish to.
     * @param transponderCount The number of transponders supported by this instrument. Defaults to `1`.
     */
    constructor(bus: EventBus, transponderCount?: number);
    /** Initialize the instrument. */
    init(): void;
    /**
     * Perform events for the update loop.
     */
    onUpdate(): void;
    /**
     * Set the transponder code in the sim.
     * @param index The index of the transponder.
     * @param code The xpdr code.
     */
    private setXpdrCode;
    /**
     * Set the transponder mode in the sim.
     * @param index The index of the transponder.
     * @param mode The transponder mode.
     */
    private setXpdrMode;
    /**
     * Gets xpdr mode from the sim.
     * @param index The index of the transponder.
     * @returns The xpdr mode.
     */
    private getXpdrMode;
    /**
     * Sends ident to ATC for 18 seconds.
     * @param index The index of the transponder.
     */
    private sendIdent;
}
//# sourceMappingURL=XPDR.d.ts.map