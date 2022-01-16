import { SimVarValueType } from '../data';
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
class XPDRSimVarPublisher extends SimVarPublisher {
    /**
     * Create an XPDRSimVarPublisher
     * @param bus The EventBus to publish to
     * @param pacer An optional pacer to use to control the pace of publishing
     */
    constructor(bus, pacer = undefined) {
        super(XPDRSimVarPublisher.simvars, bus, pacer);
    }
}
XPDRSimVarPublisher.simvars = new Map([
    ['xpdrMode1', { name: 'TRANSPONDER STATE:1', type: SimVarValueType.Number }],
    ['xpdrCode1', { name: 'TRANSPONDER CODE:1', type: SimVarValueType.Number }],
    ['xpdrIdent', { name: 'TRANSPONDER IDENT:1', type: SimVarValueType.Bool }]
]);
/** A transponder. */
export class XPDRInstrument {
    /**
     * Create an XPDRInstrument.
     * @param bus The event bus to publish to.
     */
    constructor(bus) {
        this.bus = bus;
        this.isSendingIdent = false;
        this.bus = bus;
        this.simVarPublisher = new XPDRSimVarPublisher(bus);
        this.controlSubscriber = bus.getSubscriber();
        this.simVarPublisher.subscribe('xpdrCode1');
        this.simVarPublisher.subscribe('xpdrMode1');
        this.simVarPublisher.subscribe('xpdrIdent');
    }
    /** Initialize the instrument. */
    init() {
        this.simVarPublisher.startPublish();
        this.controlSubscriber.on('publish_xpdr_code').handle(this.setXpdrCode.bind(this));
        this.controlSubscriber.on('publish_xpdr_mode').handle(this.setXpdrMode.bind(this));
        this.controlSubscriber.on('xpdr_send_ident').handle(this.sendIdent.bind(this));
        // force standby on plane load when off
        if (this.getXpdrMode() === XPDRMode.OFF) {
            this.setXpdrMode(XPDRMode.STBY);
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
     * Set the XPDR code in the sim.
     * @param code The xpdr code.
     */
    setXpdrCode(code) {
        const bcdCode = Avionics.Utils.make_xpndr_bcd16(code);
        SimVar.SetSimVarValue('K:XPNDR_SET', 'Frequency BCD16', bcdCode);
    }
    /**
     * Set the xpdr mode in the sim.
     * @param mode The xpdr mode..
     */
    setXpdrMode(mode) {
        SimVar.SetSimVarValue('TRANSPONDER STATE:1', 'number', mode);
    }
    /**
     * Gets xpdr mode from the sim.
     * @returns the xpdr mode
     */
    getXpdrMode() {
        return SimVar.GetSimVarValue('TRANSPONDER STATE:1', 'number');
    }
    /**
     * Sends ident to ATC for 18 seconds.
     */
    sendIdent() {
        if (this.getXpdrMode() > XPDRMode.STBY) {
            this.isSendingIdent = true;
            SimVar.SetSimVarValue('K:XPNDR_IDENT_ON', 'number', 1);
            setTimeout(() => {
                this.isSendingIdent = false;
                SimVar.SetSimVarValue('K:XPNDR_IDENT_OFF', 'number', 0);
            }, 18000);
        }
    }
}
