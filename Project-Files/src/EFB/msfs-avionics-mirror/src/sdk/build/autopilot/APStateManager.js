import { SubEvent, Subject } from '..';
import { KeyInterceptManager, SimVarValueType } from '../data';
import { APLockType } from '../instruments';
import { MSFSAPStates } from '../navigation';
/** AP Mode Types */
export var APModeType;
(function (APModeType) {
    APModeType[APModeType["LATERAL"] = 0] = "LATERAL";
    APModeType[APModeType["VERTICAL"] = 1] = "VERTICAL";
    APModeType[APModeType["APPROACH"] = 2] = "APPROACH";
})(APModeType || (APModeType = {}));
/**
 * A class that manages the autopilot modes and autopilot mode states.
 */
export class APStateManager {
    /**
     * Creates an instance of the APStateManager.
     * @param bus An instance of the event bus.
     */
    constructor(bus) {
        this.bus = bus;
        this.apListenerRegistered = false;
        this.managedModeSet = false;
        this.stateManagerInitialized = Subject.create(false);
        this.lateralPressed = new SubEvent();
        this.verticalPressed = new SubEvent();
        this.approachPressed = new SubEvent();
        this.vnavPressed = new SubEvent();
        this.apMasterOn = Subject.create(false);
        this.fdMasterOn = Subject.create(false);
        KeyInterceptManager.getManager(bus).then(manager => {
            this.keyInterceptManager = manager;
            this.setupKeyIntercepts(manager);
            this.bus.getSubscriber().on('key_intercept').handle(this.handleKeyIntercepted.bind(this));
        });
        this.apListener = RegisterViewListener('JS_LISTENER_AUTOPILOT', () => {
            this.onAPListenerRegistered();
            this.apListenerRegistered = true;
        });
    }
    /**
     * A callback which is called when the autopilot listener has been registered.
     */
    onAPListenerRegistered() {
        const ap = this.bus.getSubscriber();
        ap.on('ap_lock_set').handle(lock => {
            if (lock === APLockType.VNav) {
                this.vnavPressed.notify(this, true);
            }
        });
        ap.on('ap_lock_release').handle(lock => {
            if (lock === APLockType.VNav) {
                this.vnavPressed.notify(this, false);
            }
        });
        ap.on('ap_master_disengage').handle(() => {
            this.apMasterOn.set(false);
        });
        ap.on('ap_master_engage').handle(() => {
            this.apMasterOn.set(true);
        });
        ap.on('flight_director_is_active').whenChanged().handle((fd) => {
            this.fdMasterOn.set(fd);
        });
    }
    /**
     * Checks whether the AP State Manager has completed listerner steps,
     * and if so, finishes initializing and then notifies Autopilot of the same.
     * @param force forces the initialize
     */
    initialize(force = false) {
        this.onBeforeInitialize();
        if (force || (this.keyInterceptManager && this.apListenerRegistered)) {
            this.setManagedMode(true).then(() => {
                SimVar.SetSimVarValue('AUTOPILOT ALTITUDE LOCK VAR', SimVarValueType.Feet, 0);
                if (this.fdMasterOn.get()) {
                    this.setFlightDirector(false);
                }
                this.stateManagerInitialized.set(true);
            });
        }
    }
    /**
     * Sets the Flight Director State
     * @param on is wheter to set the FD On.
     */
    setFlightDirector(on) {
        if (on !== this.fdMasterOn.get()) {
            SimVar.SetSimVarValue('K:TOGGLE_FLIGHT_DIRECTOR', 'number', 0);
        }
    }
    /**
     * Sets Managed Mode.
     * @param set is wheter to set or unset managed mode.
     */
    async setManagedMode(set) {
        return new Promise(resolve => {
            setTimeout(() => {
                if (set) {
                    Coherent.call('apSetAutopilotMode', MSFSAPStates.AvionicsManaged, 1).then(() => resolve());
                }
                else {
                    Coherent.call('apSetAutopilotMode', MSFSAPStates.AvionicsManaged, 0).then(() => resolve());
                }
                this.managedModeSet = set;
            }, 1000);
        });
    }
    /**
     * Toggles VNAV L Var value.
     */
    toggleVnav() {
        const vnavXmlVarValue = SimVar.GetSimVarValue('L:XMLVAR_VNAVButtonValue', 'Bool');
        SimVar.SetSimVarValue('L:XMLVAR_VNAVButtonValue', 'Bool', vnavXmlVarValue ? 0 : 1);
    }
    /**
     * Sends AP Mode Events from the Intercept to the Autopilot.
     * @param type is the AP Mode Type for this event
     * @param mode is the mode to set/unset.
     * @param set is whether to actively set or unset this mode.
     */
    sendApModeEvent(type, mode, set) {
        switch (type) {
            case APModeType.LATERAL:
                if (mode !== undefined) {
                    this.lateralPressed.notify(this, { mode: mode, set: set });
                }
                break;
            case APModeType.VERTICAL:
                if (mode !== undefined) {
                    this.verticalPressed.notify(this, { mode: mode, set: set });
                }
                break;
            case APModeType.APPROACH:
                this.approachPressed.notify(this, set);
                break;
        }
    }
    /**
     * Method to override with steps to run before initialze method is run.
     */
    onBeforeInitialize() {
        //noop
    }
}
