import { EventBus } from '../data';
/** Simvar definitions related to a transponder. */
export interface XPDRSimVars {
    /** Transponder1 code */
    xpdrCode1: number;
    /** Transponder1 Mode */
    xpdrMode1: XPDRMode;
    /** Sending Ident */
    xpdrIdent: boolean;
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
/** A transponder. */
export declare class XPDRInstrument {
    private readonly bus;
    private simVarPublisher;
    private controlSubscriber;
    private isSendingIdent;
    /**
     * Create an XPDRInstrument.
     * @param bus The event bus to publish to.
     */
    constructor(bus: EventBus);
    /** Initialize the instrument. */
    init(): void;
    /**
     * Perform events for the update loop.
     */
    onUpdate(): void;
    /**
     * Set the XPDR code in the sim.
     * @param code The xpdr code.
     */
    private setXpdrCode;
    /**
     * Set the xpdr mode in the sim.
     * @param mode The xpdr mode..
     */
    private setXpdrMode;
    /**
     * Gets xpdr mode from the sim.
     * @returns the xpdr mode
     */
    private getXpdrMode;
    /**
     * Sends ident to ATC for 18 seconds.
     */
    private sendIdent;
}
//# sourceMappingURL=XPDR.d.ts.map