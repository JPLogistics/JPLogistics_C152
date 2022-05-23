import { SimVarValueType } from '../data';
import { DebounceTimer } from '../utils/time/DebounceTimer';
import { SimVarPublisher } from './BasePublishers';
/** Transponder modes. */
export var XPDRMode;
(function (XPDRMode) {
    XPDRMode[XPDRMode["OFF"] = 0] = "OFF";
    XPDRMode[XPDRMode["STBY"] = 1] = "STBY";
    XPDRMode[XPDRMode["TEST"] = 2] = "TEST";
    XPDRMode[XPDRMode["ON"] = 3] = "ON";
    XPDRMode[XPDRMode["ALT"] = 4] = "ALT";
    XPDRMode[XPDRMode["GROUND"] = 5] = "GROUND";
})(XPDRMode || (XPDRMode = {}));
/** A publiher to poll transponder simvars. */
export class XPDRSimVarPublisher extends SimVarPublisher {
    /**
     * Create an XPDRSimVarPublisher.
     * @param bus The EventBus to publish to.
     * @param pacer An optional pacer to use to control the pace of publishing.
     * @param transponderCount The number of transponders supported by this publisher.
     */
    constructor(bus, pacer = undefined, transponderCount = 1) {
        const vars = [];
        for (let i = 0; i < transponderCount; i++) {
            vars.push([`xpdr_mode_${i + 1}`, { name: `TRANSPONDER STATE:${i + 1}`, type: SimVarValueType.Number }]);
            vars.push([`xpdr_code_${i + 1}`, { name: `TRANSPONDER CODE:${i + 1}`, type: SimVarValueType.Number }]);
            vars.push([`xpdr_ident_${i + 1}`, { name: `TRANSPONDER IDENT:${i + 1}`, type: SimVarValueType.Bool }]);
        }
        super(new Map(vars), bus, pacer);
    }
}
/** A transponder. */
export class XPDRInstrument {
    /**
     * Create an XPDRInstrument.
     * @param bus The event bus to publish to.
     * @param transponderCount The number of transponders supported by this instrument. Defaults to `1`.
     */
    constructor(bus, transponderCount = 1) {
        this.bus = bus;
        this.transponderCount = transponderCount;
        this.identDebounceTimers = Array.from({ length: this.transponderCount }, () => new DebounceTimer());
        this.bus = bus;
        this.simVarPublisher = new XPDRSimVarPublisher(bus);
        this.controlSubscriber = bus.getSubscriber();
    }
    /** Initialize the instrument. */
    init() {
        this.simVarPublisher.startPublish();
        for (let i = 0; i < this.transponderCount; i++) {
            this.controlSubscriber.on(`publish_xpdr_code_${i + 1}`).handle(this.setXpdrCode.bind(this, i + 1));
            this.controlSubscriber.on(`publish_xpdr_mode_${i + 1}`).handle(this.setXpdrMode.bind(this, i + 1));
            this.controlSubscriber.on(`xpdr_send_ident_${i + 1}`).handle(this.sendIdent.bind(this, i + 1));
            // force standby on plane load when off
            if (this.getXpdrMode(i + 1) === XPDRMode.OFF) {
                this.setXpdrMode(i + 1, XPDRMode.STBY);
            }
        }
    }
    /**
     * Perform events for the update loop.
     */
    onUpdate() {
        // Currently, we just need to update our simvar publisher so it polls.
        this.simVarPublisher.onUpdate();
    }
    /**
     * Set the transponder code in the sim.
     * @param index The index of the transponder.
     * @param code The xpdr code.
     */
    setXpdrCode(index, code) {
        const bcdCode = Avionics.Utils.make_xpndr_bcd16(code);
        SimVar.SetSimVarValue(`K:${index}:XPNDR_SET`, 'Frequency BCD16', bcdCode);
    }
    /**
     * Set the transponder mode in the sim.
     * @param index The index of the transponder.
     * @param mode The transponder mode.
     */
    setXpdrMode(index, mode) {
        SimVar.SetSimVarValue(`TRANSPONDER STATE:${index}`, 'number', mode);
    }
    /**
     * Gets xpdr mode from the sim.
     * @param index The index of the transponder.
     * @returns The xpdr mode.
     */
    getXpdrMode(index) {
        return SimVar.GetSimVarValue(`TRANSPONDER STATE:${index}`, 'number');
    }
    /**
     * Sends ident to ATC for 18 seconds.
     * @param index The index of the transponder.
     */
    sendIdent(index) {
        if (this.getXpdrMode(index) > XPDRMode.STBY) {
            SimVar.SetSimVarValue(`K:${index}:XPNDR_IDENT_ON`, 'number', 1);
            this.identDebounceTimers[index - 1].schedule(() => {
                SimVar.SetSimVarValue(`K:${index}:XPNDR_IDENT_OFF`, 'number', 0);
            }, 18000);
        }
    }
}
