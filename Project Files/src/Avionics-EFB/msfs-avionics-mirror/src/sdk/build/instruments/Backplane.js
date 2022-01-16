/**
 * InstrumentBackplane provides a common control point for aggregating and
 * managing any number of publishers.  This can be used as an "update loop"
 * corral", amongst other things.
 */
export class InstrumentBackplane {
    /**
     * Create an InstrumentBackplane
     */
    constructor() {
        this.publishers = new Map();
        this.instruments = new Map();
    }
    /**
     * Initialize all the things. This is initially just a proxy for the
     * private initPublishers() and initInstruments() methods.
     *
     * This should be simplified.
     */
    init() {
        this.initPublishers();
        this.initInstruments();
    }
    /**
     * Update all the things.  This is initially just a proxy for the private
     * updatePublishers() and updateInstruments() methods.
     *
     * This should be simplified.
     */
    onUpdate() {
        this.updatePublishers();
        this.updateInstruments();
    }
    /**
     * Add a publisher to the backplane.
     * @param name - a symbolic name for the publisher for reference
     * @param publisher - a publisher extending BasePublisher
     */
    addPublisher(name, publisher) {
        this.publishers.set(name, publisher);
    }
    /**
     * Add an instrument to the backplane.
     * @param name - a symbolic name for the publisher for reference
     * @param instrument - an instrument implementing Instrment
     */
    addInstrument(name, instrument) {
        this.instruments.set(name, instrument);
    }
    /**
     * Initialize all of the publishers that you hold.
     */
    initPublishers() {
        for (const publisher of this.publishers.values()) {
            publisher.startPublish();
        }
    }
    /**
     * Initialize all of the instruments that you hold.
     */
    initInstruments() {
        for (const instrument of this.instruments.values()) {
            instrument.init();
        }
    }
    /**
     * Update all of the publishers that you hold.
     */
    updatePublishers() {
        for (const publisher of this.publishers.values()) {
            publisher.onUpdate();
        }
    }
    /**
     * Update all of the instruments that you hold.
     */
    updateInstruments() {
        for (const instrument of this.instruments.values()) {
            instrument.onUpdate();
        }
    }
}
