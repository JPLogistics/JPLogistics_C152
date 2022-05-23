import { BasePublisher } from './BasePublishers';
/**
 * any kind of initable instrument
 */
export interface Instrument {
    /** the init function */
    init: () => void;
    /** the update function */
    onUpdate: () => void;
}
/**
 * InstrumentBackplane provides a common control point for aggregating and
 * managing any number of publishers.  This can be used as an "update loop"
 * corral", amongst other things.
 */
export declare class InstrumentBackplane {
    private publishers;
    private instruments;
    /**
     * Create an InstrumentBackplane
     */
    constructor();
    /**
     * Initialize all the things. This is initially just a proxy for the
     * private initPublishers() and initInstruments() methods.
     *
     * This should be simplified.
     */
    init(): void;
    /**
     * Update all the things.  This is initially just a proxy for the private
     * updatePublishers() and updateInstruments() methods.
     *
     * This should be simplified.
     */
    onUpdate(): void;
    /**
     * Add a publisher to the backplane.
     * @param name - a symbolic name for the publisher for reference
     * @param publisher - a publisher extending BasePublisher
     */
    addPublisher(name: string, publisher: BasePublisher<any>): void;
    /**
     * Add an instrument to the backplane.
     * @param name - a symbolic name for the publisher for reference
     * @param instrument - an instrument implementing Instrment
     */
    addInstrument(name: string, instrument: Instrument): void;
    /**
     * Initialize all of the publishers that you hold.
     */
    private initPublishers;
    /**
     * Initialize all of the instruments that you hold.
     */
    private initInstruments;
    /**
     * Update all of the publishers that you hold.
     */
    private updatePublishers;
    /**
     * Update all of the instruments that you hold.
     */
    private updateInstruments;
}
//# sourceMappingURL=Backplane.d.ts.map