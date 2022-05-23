import { Subject } from '..';
import { NavSourceType } from '../instruments';
import { APController, MSFSAPStates } from '../navigation';
import { APAltitudeModes, APLateralModes, APVerticalModes } from './APConfig';
import { DirectorState } from './PlaneDirector';
import { VNavAltCaptureType, VNavState } from './VerticalNavigation';
/**
 * An Autopilot.
 */
export class Autopilot {
    /**
     * Creates an instance of the Autopilot.
     * @param bus The event bus.
     * @param flightPlanner This autopilot's associated flight planner.
     * @param config This autopilot's configuration.
     * @param stateManager This autopilot's state manager.
     */
    constructor(bus, flightPlanner, config, stateManager) {
        var _a;
        this.bus = bus;
        this.flightPlanner = flightPlanner;
        this.config = config;
        this.stateManager = stateManager;
        this.cdiSource = { type: NavSourceType.Nav, index: 0 };
        this.lateralModes = new Map();
        this.verticalModes = new Map();
        this.verticalAltitudeArmed = APAltitudeModes.NONE;
        this.verticalApproachArmed = APVerticalModes.NONE;
        this.altCapArmed = false;
        this.lateralModeFailed = false;
        this.inClimb = false;
        this.currentAltitude = 0;
        this.vnavCaptureType = VNavAltCaptureType.None;
        this.flightPlanSynced = false;
        /** Can be set to false in child classes to override behavior for certain aircraft. */
        this.requireApproachIsActiveForNavToNav = true;
        this.apValues = {
            selectedAltitude: Subject.create(0),
            selectedVerticalSpeed: Subject.create(0),
            selectedIas: Subject.create(0),
            selectedMach: Subject.create(0),
            isSelectedSpeedInMach: Subject.create(false),
            selectedPitch: Subject.create(0),
            selectedHeading: Subject.create(0),
            capturedAltitude: Subject.create(0),
            approachIsActive: Subject.create(false),
            approachHasGP: Subject.create(false),
            nav1HasGs: Subject.create(false),
            nav2HasGs: Subject.create(false),
            lateralActive: Subject.create(APLateralModes.NONE),
            verticalActive: Subject.create(APVerticalModes.NONE),
            lateralArmed: Subject.create(APLateralModes.NONE),
            verticalArmed: Subject.create(APVerticalModes.NONE),
        };
        this.autopilotInitialized = false;
        this.directors = this.createDirectors(config);
        this.vnavManager = config.createVNavManager(this.apValues);
        this.navToNavManager = config.createNavToNavManager(this.apValues);
        this.apValues.navToNavLocArm = (_a = this.navToNavManager) === null || _a === void 0 ? void 0 : _a.canLocArm;
        this.stateManager.stateManagerInitialized.sub((v) => {
            if (v) {
                this.autopilotInitialized = true;
            }
            else {
                this.autopilotInitialized = false;
            }
            this.onInitialized();
        });
        this.flightPlanner.flightPlanSynced.on((sender, v) => {
            if (!this.flightPlanSynced && v) {
                this.stateManager.stateManagerInitialized.set(false);
                this.stateManager.initialize(true);
                this.flightPlanSynced = true;
            }
        });
        this.initLateralModes();
        this.initVerticalModes();
        this.initNavToNavManager();
        this.initVNavManager();
        this.monitorEvents();
    }
    /**
     * Creates this autopilot's directors.
     * @param config This autopilot's configuration.
     * @returns This autopilot's directors.
     */
    createDirectors(config) {
        return {
            headingDirector: config.createHeadingDirector(this.apValues),
            rollDirector: config.createRollDirector(this.apValues),
            wingLevelerDirector: config.createWingLevelerDirector(this.apValues),
            gpssDirector: config.createGpssDirector(this.apValues),
            vorDirector: config.createVorDirector(this.apValues),
            locDirector: config.createLocDirector(this.apValues),
            bcDirector: config.createBcDirector(this.apValues),
            pitchDirector: config.createPitchDirector(this.apValues),
            vsDirector: config.createVsDirector(this.apValues),
            flcDirector: config.createFlcDirector(this.apValues),
            altHoldDirector: config.createAltHoldDirector(this.apValues),
            altCapDirector: config.createAltCapDirector(this.apValues),
            vnavPathDirector: config.createVNavPathDirector(this.apValues),
            gpDirector: config.createGpDirector(this.apValues),
            gsDirector: config.createGsDirector(this.apValues)
        };
    }
    /**
     * Update method for the Autopilot.
     */
    update() {
        if (this.autopilotInitialized) {
            this.onBeforeUpdate();
            this.checkModes();
            this.manageAltitudeCapture();
            this.updateModes();
            this.onAfterUpdate();
        }
    }
    /**
     * This method runs each update cycle before the update occurs.
     */
    onBeforeUpdate() {
        // noop
    }
    /**
     * This method runs each update cycle after the update occurs.
     */
    onAfterUpdate() {
        // noop
    }
    /**
     * This method runs whenever the initialized state of the Autopilot changes.
     */
    onInitialized() {
        // noop
    }
    /**
     * Handles input from the State Manager when a lateral mode button is pressed.
     * @param data is the AP Lateral Mode Event Data
     */
    lateralPressed(data) {
        var _a, _b, _c, _d;
        const mode = data.mode;
        if (mode !== APLateralModes.NAV && !this.lateralModes.has(mode)) {
            return;
        }
        const set = data.set;
        if (set === undefined || set === false) {
            if (this.isLateralModeActivatedOrArmed(mode)) {
                return;
            }
        }
        if (set === undefined || set === true) {
            if (!this.stateManager.fdMasterOn.get()) {
                this.stateManager.setFlightDirector(true);
            }
            switch (mode) {
                case APLateralModes.NONE:
                    break;
                case APLateralModes.LEVEL:
                case APLateralModes.ROLL:
                case APLateralModes.HEADING:
                case APLateralModes.LOC:
                case APLateralModes.BC:
                    (_a = this.lateralModes.get(mode)) === null || _a === void 0 ? void 0 : _a.arm();
                    break;
                case APLateralModes.NAV:
                    if (this.cdiSource.type === NavSourceType.Gps) {
                        (_b = this.lateralModes.get(APLateralModes.GPSS)) === null || _b === void 0 ? void 0 : _b.arm();
                    }
                    else {
                        (_c = this.lateralModes.get(APLateralModes.VOR)) === null || _c === void 0 ? void 0 : _c.arm();
                        (_d = this.lateralModes.get(APLateralModes.LOC)) === null || _d === void 0 ? void 0 : _d.arm();
                    }
                    break;
            }
        }
    }
    /**
     * Handles input from the State Manager when a vertical mode button is pressed.
     * @param data is the AP Vertical Mode Event Data
     */
    verticalPressed(data) {
        var _a, _b, _c, _d, _e;
        const mode = data.mode;
        if (!this.verticalModes.has(mode)) {
            return;
        }
        const set = data.set;
        if (set === undefined || set === false) {
            if (this.isVerticalModeActivatedOrArmed(mode)) {
                return;
            }
        }
        if (set === undefined || set === true) {
            if (!this.stateManager.fdMasterOn.get()) {
                this.stateManager.setFlightDirector(true);
            }
            switch (mode) {
                case APVerticalModes.NONE:
                case APVerticalModes.PATH:
                    break;
                case APVerticalModes.ALT:
                    if (((_a = this.vnavManager) === null || _a === void 0 ? void 0 : _a.state) !== VNavState.Enabled_Active ||
                        (this.vnavManager && this.vnavManager.state === VNavState.Enabled_Active && this.vnavManager.canVerticalModeActivate(mode))) {
                        this.setAltHold();
                    }
                    break;
                case APVerticalModes.PITCH:
                case APVerticalModes.VS:
                case APVerticalModes.FLC:
                    if (((_b = this.vnavManager) === null || _b === void 0 ? void 0 : _b.state) === VNavState.Enabled_Active && !this.vnavManager.canVerticalModeActivate(mode)) {
                        // If the VNav Manager is active, don't activate the mode until VNav Approves.
                        (_c = this.verticalModes.get(mode)) === null || _c === void 0 ? void 0 : _c.arm();
                    }
                    else {
                        (_d = this.verticalModes.get(mode)) === null || _d === void 0 ? void 0 : _d.activate();
                    }
                    break;
                case APVerticalModes.GP:
                case APVerticalModes.GS:
                    (_e = this.verticalModes.get(mode)) === null || _e === void 0 ? void 0 : _e.arm();
            }
        }
    }
    /**
     * Checks if a mode is active or armed and optionally deactivates it.
     * @param mode is the AP Mode to check.
     * @returns whether this mode was active or armed and subsequently disabled.
     */
    isLateralModeActivatedOrArmed(mode) {
        var _a, _b, _c, _d, _e, _f;
        const { lateralActive, lateralArmed } = this.apValues;
        switch (mode) {
            case lateralActive.get():
                (_a = this.lateralModes.get(mode)) === null || _a === void 0 ? void 0 : _a.deactivate();
                (_b = this.lateralModes.get(this.config.defaultLateralMode)) === null || _b === void 0 ? void 0 : _b.arm();
                return true;
            case lateralArmed.get():
                (_c = this.lateralModes.get(mode)) === null || _c === void 0 ? void 0 : _c.deactivate();
                lateralArmed.set(APLateralModes.NONE);
                return true;
            case APLateralModes.NAV: {
                const activeNavMode = lateralActive.get() === APLateralModes.LOC ? APLateralModes.LOC
                    : lateralActive.get() === APLateralModes.VOR ? APLateralModes.VOR
                        : lateralActive.get() === APLateralModes.GPSS ? APLateralModes.GPSS
                            : APLateralModes.NONE;
                if (activeNavMode !== APLateralModes.NONE) {
                    (_d = this.lateralModes.get(activeNavMode)) === null || _d === void 0 ? void 0 : _d.deactivate();
                    (_e = this.lateralModes.get(this.config.defaultLateralMode)) === null || _e === void 0 ? void 0 : _e.arm();
                    lateralActive.set(this.config.defaultLateralMode);
                }
                const armedNavMode = lateralArmed.get() === APLateralModes.LOC ? APLateralModes.LOC
                    : lateralArmed.get() === APLateralModes.VOR ? APLateralModes.VOR
                        : lateralArmed.get() === APLateralModes.GPSS ? APLateralModes.GPSS
                            : APLateralModes.NONE;
                if (armedNavMode !== APLateralModes.NONE) {
                    (_f = this.lateralModes.get(armedNavMode)) === null || _f === void 0 ? void 0 : _f.deactivate();
                    lateralArmed.set(APLateralModes.NONE);
                }
                if (armedNavMode !== APLateralModes.NONE || activeNavMode !== APLateralModes.NONE) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Checks if a mode is active or armed and deactivates it.
     * @param mode is the AP Mode to check.
     * @returns whether this mode was active or armed and subsequently disabled.
     */
    isVerticalModeActivatedOrArmed(mode) {
        var _a, _b, _c, _d;
        const { verticalActive, verticalArmed } = this.apValues;
        switch (mode) {
            case verticalActive.get():
                (_a = this.verticalModes.get(mode)) === null || _a === void 0 ? void 0 : _a.deactivate();
                verticalActive.set(this.config.defaultVerticalMode);
                (_b = this.verticalModes.get(verticalActive.get())) === null || _b === void 0 ? void 0 : _b.arm();
                return true;
            case verticalArmed.get():
                if (mode !== APVerticalModes.ALT) {
                    (_c = this.verticalModes.get(mode)) === null || _c === void 0 ? void 0 : _c.deactivate();
                    verticalArmed.set(APVerticalModes.NONE);
                    return true;
                }
                break;
            case this.verticalApproachArmed:
                (_d = this.verticalModes.get(mode)) === null || _d === void 0 ? void 0 : _d.deactivate();
                this.verticalApproachArmed = APVerticalModes.NONE;
                return true;
        }
        return false;
    }
    /**
     * Handles input from the State Manager when the APPR button is pressed.
     * @param set is whether this event commands a specific set
     */
    approachPressed(set) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if ((set === undefined || set === false) && this.isVerticalModeActivatedOrArmed(APVerticalModes.GP)) {
            (_a = this.lateralModes.get(APLateralModes.GPSS)) === null || _a === void 0 ? void 0 : _a.deactivate();
            return;
        }
        if ((set === undefined || set === false) && this.isVerticalModeActivatedOrArmed(APVerticalModes.GS)) {
            (_b = this.lateralModes.get(APLateralModes.LOC)) === null || _b === void 0 ? void 0 : _b.deactivate();
            return;
        }
        if (set === undefined || set === true) {
            switch (this.getArmableApproachType()) {
                case APLateralModes.LOC:
                    if (((_c = this.lateralModes.get(APLateralModes.LOC)) === null || _c === void 0 ? void 0 : _c.state) === DirectorState.Inactive) {
                        (_d = this.lateralModes.get(APLateralModes.LOC)) === null || _d === void 0 ? void 0 : _d.arm();
                    }
                    (_e = this.verticalModes.get(APVerticalModes.GS)) === null || _e === void 0 ? void 0 : _e.arm();
                    break;
                case APLateralModes.GPSS:
                    if (((_f = this.lateralModes.get(APLateralModes.GPSS)) === null || _f === void 0 ? void 0 : _f.state) === DirectorState.Inactive) {
                        (_g = this.lateralModes.get(APLateralModes.GPSS)) === null || _g === void 0 ? void 0 : _g.arm();
                    }
                    (_h = this.verticalModes.get(APVerticalModes.GP)) === null || _h === void 0 ? void 0 : _h.arm();
                    break;
            }
        }
    }
    /**
     * Returns the AP Lateral Mode that can be armed.
     * @returns The AP Lateral Mode that can be armed.
     */
    getArmableApproachType() {
        switch (this.cdiSource.type) {
            case NavSourceType.Nav:
                if (this.cdiSource.index === 1 && this.apValues.nav1HasGs.get()) {
                    return APLateralModes.LOC;
                }
                else if (this.cdiSource.index === 2 && this.apValues.nav2HasGs.get()) {
                    return APLateralModes.LOC;
                }
                break;
            case NavSourceType.Gps:
                if (this.apValues.approachIsActive.get() && this.apValues.approachHasGP.get()) {
                    return APLateralModes.GPSS;
                }
                else if (this.navToNavManager && this.navToNavManager.canLocArm()) {
                    return APLateralModes.LOC;
                }
        }
        return APLateralModes.NONE;
    }
    /**
     * Callback to set the lateral active mode.
     * @param mode is the mode being set.
     */
    setLateralActive(mode) {
        const { lateralActive, lateralArmed } = this.apValues;
        this.checkRollModeActive();
        if (mode !== lateralActive.get()) {
            const currentMode = this.lateralModes.get(lateralActive.get());
            currentMode === null || currentMode === void 0 ? void 0 : currentMode.deactivate();
            lateralActive.set(mode);
        }
        if (lateralArmed.get() === mode) {
            lateralArmed.set(APLateralModes.NONE);
        }
    }
    /**
     * Callback to set the lateral armed mode.
     * @param mode is the mode being set.
     */
    setLateralArmed(mode) {
        const { lateralArmed } = this.apValues;
        const currentMode = this.lateralModes.get(lateralArmed.get());
        currentMode === null || currentMode === void 0 ? void 0 : currentMode.deactivate();
        lateralArmed.set(mode);
    }
    /**
     * Callback to set the vertical active mode.
     * @param mode is the mode being set.
     */
    setVerticalActive(mode) {
        const { verticalActive, verticalArmed } = this.apValues;
        this.checkPitchModeActive();
        if (mode !== verticalActive.get()) {
            const currentMode = this.verticalModes.get(verticalActive.get());
            if ((currentMode === null || currentMode === void 0 ? void 0 : currentMode.state) !== DirectorState.Inactive) {
                currentMode === null || currentMode === void 0 ? void 0 : currentMode.deactivate();
            }
            verticalActive.set(mode);
        }
        if (verticalArmed.get() === mode) {
            verticalArmed.set(APVerticalModes.NONE);
        }
        else if (this.verticalApproachArmed === mode) {
            this.verticalApproachArmed = APVerticalModes.NONE;
        }
    }
    /**
     * Callback to set the vertical armed mode.
     * @param mode is the mode being set.
     */
    setVerticalArmed(mode) {
        const { verticalArmed } = this.apValues;
        if (mode !== verticalArmed.get()) {
            const currentMode = this.verticalModes.get(verticalArmed.get());
            if ((currentMode === null || currentMode === void 0 ? void 0 : currentMode.state) !== DirectorState.Inactive) {
                currentMode === null || currentMode === void 0 ? void 0 : currentMode.deactivate();
            }
        }
        verticalArmed.set(mode);
    }
    /**
     * Callback to set the vertical approach armed mode.
     * @param mode is the mode being set.
     */
    setVerticalApproachArmed(mode) {
        const currentMode = this.verticalModes.get(this.verticalApproachArmed);
        currentMode === null || currentMode === void 0 ? void 0 : currentMode.deactivate();
        this.verticalApproachArmed = mode;
    }
    /**
     * Method called when the ALT button is pressed.
     */
    setAltHold() {
        var _a;
        if (this.verticalModes.has(APVerticalModes.ALT)) {
            const currentAlt = 10 * (this.inClimb ? Math.ceil(this.currentAltitude / 10) : Math.floor(this.currentAltitude / 10));
            this.apValues.capturedAltitude.set(currentAlt);
            (_a = this.verticalModes.get(APVerticalModes.ALT)) === null || _a === void 0 ? void 0 : _a.activate();
        }
    }
    /**
     * Initializes the Autopilot with the available lateral modes from the config.
     */
    initLateralModes() {
        if (this.directors.rollDirector) {
            this.lateralModes.set(APLateralModes.ROLL, this.directors.rollDirector);
            this.directors.rollDirector.onActivate = () => {
                this.setLateralActive(APLateralModes.ROLL);
            };
        }
        if (this.directors.wingLevelerDirector) {
            this.lateralModes.set(APLateralModes.LEVEL, this.directors.wingLevelerDirector);
            this.directors.wingLevelerDirector.onActivate = () => {
                this.setLateralActive(APLateralModes.LEVEL);
            };
        }
        if (this.directors.headingDirector) {
            this.lateralModes.set(APLateralModes.HEADING, this.directors.headingDirector);
            this.directors.headingDirector.onActivate = () => {
                this.setLateralActive(APLateralModes.HEADING);
            };
        }
        if (this.directors.gpssDirector) {
            this.lateralModes.set(APLateralModes.GPSS, this.directors.gpssDirector);
            this.directors.gpssDirector.onArm = () => {
                this.setLateralArmed(APLateralModes.GPSS);
            };
            this.directors.gpssDirector.onActivate = () => {
                this.setLateralActive(APLateralModes.GPSS);
            };
        }
        if (this.directors.vorDirector) {
            this.lateralModes.set(APLateralModes.VOR, this.directors.vorDirector);
            this.directors.vorDirector.onArm = () => {
                this.setLateralArmed(APLateralModes.VOR);
            };
            this.directors.vorDirector.onActivate = () => {
                this.setLateralActive(APLateralModes.VOR);
            };
        }
        if (this.directors.locDirector) {
            this.lateralModes.set(APLateralModes.LOC, this.directors.locDirector);
            this.directors.locDirector.onArm = () => {
                this.setLateralArmed(APLateralModes.LOC);
            };
            this.directors.locDirector.onActivate = () => {
                this.setLateralActive(APLateralModes.LOC);
            };
        }
    }
    /**
     * Initializes the Autopilot with the available Nav To Nav Manager.
     */
    initNavToNavManager() {
        if (this.navToNavManager) {
            this.navToNavManager.onTransferred = () => {
                var _a;
                if (this.apValues.lateralActive.get() === APLateralModes.GPSS) {
                    (_a = this.lateralModes.get(APLateralModes.LOC)) === null || _a === void 0 ? void 0 : _a.activate();
                }
            };
        }
    }
    /**
     * Initializes the Autopilot with the available VNav Manager.
     */
    initVNavManager() {
        if (this.vnavManager) {
            this.vnavManager.armMode = (mode) => {
                var _a;
                if (mode === APVerticalModes.NONE && this.apValues.verticalArmed.get() === APVerticalModes.PATH) {
                    this.setVerticalArmed(mode);
                }
                else {
                    (_a = this.verticalModes.get(mode)) === null || _a === void 0 ? void 0 : _a.arm();
                }
            };
            this.vnavManager.activateMode = (mode) => {
                var _a, _b;
                if (mode === APVerticalModes.NONE && this.apValues.verticalActive.get() === APVerticalModes.PATH) {
                    (_a = this.verticalModes.get(this.config.defaultVerticalMode)) === null || _a === void 0 ? void 0 : _a.activate();
                }
                else {
                    (_b = this.verticalModes.get(mode)) === null || _b === void 0 ? void 0 : _b.activate();
                }
            };
        }
    }
    /**
     * Initializes the Autopilot with the available vertical modes from the config.
     */
    initVerticalModes() {
        if (this.directors.pitchDirector) {
            this.verticalModes.set(APVerticalModes.PITCH, this.directors.pitchDirector);
            this.directors.pitchDirector.onActivate = () => {
                this.setVerticalActive(APVerticalModes.PITCH);
            };
        }
        if (this.directors.vsDirector) {
            this.verticalModes.set(APVerticalModes.VS, this.directors.vsDirector);
            this.directors.vsDirector.onActivate = () => {
                this.setVerticalActive(APVerticalModes.VS);
            };
        }
        if (this.directors.flcDirector) {
            this.verticalModes.set(APVerticalModes.FLC, this.directors.flcDirector);
            this.directors.flcDirector.onActivate = () => {
                this.setVerticalActive(APVerticalModes.FLC);
            };
        }
        if (this.directors.altHoldDirector) {
            this.verticalModes.set(APVerticalModes.ALT, this.directors.altHoldDirector);
            this.directors.altHoldDirector.onArm = () => {
                this.setVerticalArmed(APVerticalModes.ALT);
            };
            this.directors.altHoldDirector.onActivate = () => {
                this.altCapArmed = false;
                this.setVerticalActive(APVerticalModes.ALT);
            };
        }
        if (this.directors.altCapDirector) {
            this.verticalModes.set(APVerticalModes.CAP, this.directors.altCapDirector);
            this.directors.altCapDirector.onArm = () => {
                var _a;
                this.altCapArmed = true;
                const verticalArmed = this.apValues.verticalArmed.get();
                if (verticalArmed === APVerticalModes.ALT) {
                    (_a = this.verticalModes.get(verticalArmed)) === null || _a === void 0 ? void 0 : _a.deactivate();
                }
            };
            this.directors.altCapDirector.onActivate = () => {
                var _a;
                this.altCapArmed = false;
                this.setVerticalActive(APVerticalModes.CAP);
                (_a = this.verticalModes.get(APVerticalModes.ALT)) === null || _a === void 0 ? void 0 : _a.arm();
            };
        }
        if (this.directors.vnavPathDirector) {
            this.verticalModes.set(APVerticalModes.PATH, this.directors.vnavPathDirector);
            this.directors.vnavPathDirector.onArm = () => {
                this.setVerticalArmed(APVerticalModes.PATH);
            };
            this.directors.vnavPathDirector.onDeactivate = () => {
                var _a;
                (_a = this.vnavManager) === null || _a === void 0 ? void 0 : _a.onPathDirectorDeactivated();
            };
            this.directors.vnavPathDirector.onActivate = () => {
                this.setVerticalActive(APVerticalModes.PATH);
            };
        }
        if (this.directors.gpDirector) {
            this.verticalModes.set(APVerticalModes.GP, this.directors.gpDirector);
            this.directors.gpDirector.onArm = () => {
                this.setVerticalApproachArmed(APVerticalModes.GP);
            };
            this.directors.gpDirector.onActivate = () => {
                var _a;
                (_a = this.vnavManager) === null || _a === void 0 ? void 0 : _a.tryDeactivate(APVerticalModes.NONE);
                this.setVerticalActive(APVerticalModes.GP);
            };
        }
        if (this.directors.gsDirector) {
            this.verticalModes.set(APVerticalModes.GS, this.directors.gsDirector);
            this.directors.gsDirector.onArm = () => {
                this.setVerticalApproachArmed(APVerticalModes.GS);
            };
            this.directors.gsDirector.onActivate = () => {
                var _a;
                this.setVerticalActive(APVerticalModes.GS);
                (_a = this.verticalModes.get(APVerticalModes.PATH)) === null || _a === void 0 ? void 0 : _a.deactivate();
                this.setVerticalArmed(APVerticalModes.NONE);
                this.setVerticalApproachArmed(APVerticalModes.NONE);
            };
        }
    }
    /**
     * Checks if all the active and armed modes are still in their proper state
     * and takes corrective action if not.
     */
    checkModes() {
        var _a, _b, _c, _d, _e, _f, _g;
        if (this.lateralModeFailed) {
            this.lateralModeFailed = false;
        }
        if (!this.stateManager.apMasterOn.get() && !this.stateManager.fdMasterOn.get()) {
            return;
        }
        const { lateralActive, lateralArmed, verticalActive, verticalArmed } = this.apValues;
        if (!this.lateralModes.has(lateralActive.get()) || ((_a = this.lateralModes.get(lateralActive.get())) === null || _a === void 0 ? void 0 : _a.state) !== DirectorState.Active) {
            if (lateralActive.get() !== APLateralModes.NONE) {
                this.lateralModeFailed = true;
            }
            (_b = this.lateralModes.get(this.config.defaultLateralMode)) === null || _b === void 0 ? void 0 : _b.arm();
        }
        if (lateralArmed.get() !== APLateralModes.NONE
            && (!this.lateralModes.has(lateralArmed.get()) || ((_c = this.lateralModes.get(lateralArmed.get())) === null || _c === void 0 ? void 0 : _c.state) !== DirectorState.Armed)) {
            this.setLateralArmed(APLateralModes.NONE);
        }
        if (!this.verticalModes.has(verticalActive.get()) || ((_d = this.verticalModes.get(verticalActive.get())) === null || _d === void 0 ? void 0 : _d.state) !== DirectorState.Active) {
            (_e = this.verticalModes.get(APVerticalModes.PITCH)) === null || _e === void 0 ? void 0 : _e.arm();
        }
        if (verticalArmed.get() !== APVerticalModes.NONE
            && (!this.verticalModes.has(verticalArmed.get()) || ((_f = this.verticalModes.get(verticalArmed.get())) === null || _f === void 0 ? void 0 : _f.state) !== DirectorState.Armed)) {
            this.setVerticalArmed(APVerticalModes.NONE);
        }
        if (this.verticalApproachArmed !== APVerticalModes.NONE &&
            (!this.verticalModes.has(this.verticalApproachArmed) || ((_g = this.verticalModes.get(this.verticalApproachArmed)) === null || _g === void 0 ? void 0 : _g.state) !== DirectorState.Armed)) {
            this.setVerticalApproachArmed(APVerticalModes.NONE);
        }
    }
    /**
     * Runs update on each of the active and armed modes.
     */
    updateModes() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const { lateralActive, lateralArmed, verticalActive, verticalArmed } = this.apValues;
        if (lateralActive.get() !== APLateralModes.NONE && lateralActive.get() !== APLateralModes.GPSS && this.lateralModes.has(lateralActive.get())) {
            (_a = this.lateralModes.get(lateralActive.get())) === null || _a === void 0 ? void 0 : _a.update();
        }
        if (lateralArmed.get() !== APLateralModes.NONE && lateralArmed.get() !== APLateralModes.GPSS && this.lateralModes.has(lateralArmed.get())) {
            (_b = this.lateralModes.get(lateralArmed.get())) === null || _b === void 0 ? void 0 : _b.update();
        }
        if (verticalActive.get() !== APVerticalModes.NONE && this.verticalModes.has(verticalActive.get())) {
            (_c = this.verticalModes.get(verticalActive.get())) === null || _c === void 0 ? void 0 : _c.update();
        }
        if (verticalArmed.get() !== APVerticalModes.NONE && this.verticalModes.has(verticalArmed.get())) {
            (_d = this.verticalModes.get(verticalArmed.get())) === null || _d === void 0 ? void 0 : _d.update();
        }
        if (this.verticalApproachArmed !== APVerticalModes.NONE && this.verticalModes.has(this.verticalApproachArmed)) {
            (_e = this.verticalModes.get(this.verticalApproachArmed)) === null || _e === void 0 ? void 0 : _e.update();
        }
        if (this.altCapArmed) {
            (_f = this.verticalModes.get(APVerticalModes.CAP)) === null || _f === void 0 ? void 0 : _f.update();
        }
        //while vnav and vnav director are one in the same we always want to
        //run the vnav update cycle no matter the director state
        (_g = this.vnavManager) === null || _g === void 0 ? void 0 : _g.update();
        //while lnav and lnav director are one in the same we always want to
        //run the lnav update cycle no matter the director state
        (_h = this.lateralModes.get(APLateralModes.GPSS)) === null || _h === void 0 ? void 0 : _h.update();
    }
    /**
     * Checks and sets the proper armed altitude mode.
     */
    manageAltitudeCapture() {
        var _a, _b, _c;
        let altCapType = APAltitudeModes.NONE;
        let armAltCap = false;
        switch (this.apValues.verticalActive.get()) {
            case APVerticalModes.VS:
            case APVerticalModes.FLC:
            case APVerticalModes.PITCH:
                if (this.inClimb && this.apValues.selectedAltitude.get() > this.currentAltitude) {
                    altCapType = APAltitudeModes.ALTS;
                    armAltCap = true;
                }
                else if (!this.inClimb && this.apValues.selectedAltitude.get() < this.currentAltitude) {
                    altCapType = APAltitudeModes.ALTS;
                    armAltCap = true;
                }
                break;
            case APVerticalModes.PATH: {
                if (!this.inClimb) {
                    altCapType = this.vnavCaptureType === VNavAltCaptureType.VNAV ? APAltitudeModes.ALTV : APAltitudeModes.ALTS;
                }
                break;
            }
            case APVerticalModes.CAP:
                altCapType = this.verticalAltitudeArmed;
                break;
        }
        if (this.verticalAltitudeArmed !== altCapType) {
            this.verticalAltitudeArmed = altCapType;
        }
        if (armAltCap && (!this.altCapArmed || ((_a = this.verticalModes.get(APVerticalModes.CAP)) === null || _a === void 0 ? void 0 : _a.state) === DirectorState.Inactive)) {
            (_b = this.verticalModes.get(APVerticalModes.CAP)) === null || _b === void 0 ? void 0 : _b.arm();
        }
        else if (!armAltCap && this.altCapArmed) {
            (_c = this.verticalModes.get(APVerticalModes.CAP)) === null || _c === void 0 ? void 0 : _c.deactivate();
            this.altCapArmed = false;
        }
    }
    /**
     * Monitors subevents and bus events.
     */
    monitorEvents() {
        this.stateManager.lateralPressed.on((sender, data) => {
            if (this.autopilotInitialized && data !== undefined) {
                this.lateralPressed(data);
            }
        });
        this.stateManager.verticalPressed.on((sender, data) => {
            if (this.autopilotInitialized && data !== undefined) {
                this.verticalPressed(data);
            }
        });
        this.stateManager.approachPressed.on((sender, data) => {
            if (this.autopilotInitialized) {
                this.approachPressed(data);
            }
        });
        this.stateManager.vnavPressed.on((sender, data) => {
            var _a, _b;
            if (this.autopilotInitialized) {
                if (data === true) {
                    (_a = this.vnavManager) === null || _a === void 0 ? void 0 : _a.tryActivate();
                }
                else {
                    (_b = this.vnavManager) === null || _b === void 0 ? void 0 : _b.tryDeactivate();
                }
            }
        });
        const ap = this.bus.getSubscriber();
        ap.on('ap_altitude_selected').withPrecision(0).handle((alt) => {
            this.apValues.selectedAltitude.set(alt);
        });
        ap.on('ap_heading_selected').withPrecision(0).handle((hdg) => {
            this.apValues.selectedHeading.set(hdg);
        });
        ap.on('ap_ias_selected').withPrecision(0).handle((ias) => {
            this.apValues.selectedIas.set(ias);
        });
        ap.on('ap_mach_selected').withPrecision(3).handle((mach) => {
            this.apValues.selectedMach.set(mach);
        });
        ap.on('ap_selected_speed_is_mach').whenChanged().handle((inMach) => {
            this.apValues.isSelectedSpeedInMach.set(inMach);
        });
        ap.on('ap_pitch_selected').withPrecision(1).handle((pitch) => {
            this.apValues.selectedPitch.set(pitch);
        });
        ap.on('ap_vs_selected').withPrecision(0).handle((ias) => {
            this.apValues.selectedVerticalSpeed.set(ias);
        });
        const nav = this.bus.getSubscriber();
        nav.on('cdi_select').handle((src) => {
            this.cdiSource = src;
        });
        const navproc = this.bus.getSubscriber();
        navproc.on('nav_glideslope_1').whenChanged().handle((hasgs) => {
            this.apValues.nav1HasGs.set(hasgs);
        });
        navproc.on('nav_glideslope_2').whenChanged().handle((hasgs) => {
            this.apValues.nav2HasGs.set(hasgs);
        });
        const adc = this.bus.getSubscriber();
        adc.on('vs').withPrecision(0).handle((vs) => {
            this.inClimb = vs < 1 ? false : true;
        });
        adc.on('alt').withPrecision(0).handle(alt => {
            this.currentAltitude = alt;
        });
        const vnav = this.bus.getSubscriber();
        vnav.on('vnav_altitude_capture_type').whenChanged().handle((v) => {
            this.vnavCaptureType = v;
        });
        this.stateManager.apMasterOn.sub(() => {
            if (this.autopilotInitialized) {
                this.handleApFdStateChange();
            }
        });
        this.stateManager.fdMasterOn.sub(() => {
            if (this.autopilotInitialized) {
                this.handleApFdStateChange();
            }
        });
        this.bus.getSubscriber().on('approach_available').handle(available => {
            this.apValues.approachIsActive.set(available);
        });
    }
    /**
     * Additional events to be monitored (to be overridden).
     */
    monitorAdditionalEvents() {
        //noop
    }
    /**
     * Manages the FD state and the modes when AP/FD are off.
     */
    handleApFdStateChange() {
        const ap = this.stateManager.apMasterOn.get();
        const fd = this.stateManager.fdMasterOn.get();
        if (ap && !fd) {
            SimVar.SetSimVarValue('K:TOGGLE_FLIGHT_DIRECTOR', 'number', 0);
        }
        else if (!ap && !fd) {
            this.lateralModes.forEach((mode) => {
                if (mode.state !== DirectorState.Inactive) {
                    mode.deactivate();
                }
            });
            this.verticalModes.forEach((mode) => {
                if (mode.state !== DirectorState.Inactive) {
                    mode.deactivate();
                }
            });
            this.apValues.lateralActive.set(APLateralModes.NONE);
            this.apValues.lateralArmed.set(APLateralModes.NONE);
            this.apValues.verticalActive.set(APVerticalModes.NONE);
            this.apValues.verticalArmed.set(APVerticalModes.NONE);
            this.verticalApproachArmed = APVerticalModes.NONE;
            this.verticalAltitudeArmed = APAltitudeModes.NONE;
            this.altCapArmed = false;
        }
    }
    /**
     * Sets a sim AP mode.
     * @param mode The mode to set.
     * @param enabled Whether or not the mode is enabled or disabled.
     */
    setSimAP(mode, enabled) {
        Coherent.call('apSetAutopilotMode', mode, enabled ? 1 : 0);
    }
    /**
     * Checks if the sim AP is in roll mode and sets it if not.
     */
    checkRollModeActive() {
        if (!APController.apGetAutopilotModeActive(MSFSAPStates.Bank)) {
            // console.log('checkRollModeActive had to set Bank mode');
            this.setSimAP(MSFSAPStates.Bank, true);
        }
    }
    /**
     * Checks if the sim AP is in pitch mode and sets it if not.
     */
    checkPitchModeActive() {
        if (!APController.apGetAutopilotModeActive(MSFSAPStates.Pitch)) {
            // console.log('checkPitchModeActive had to set Pitch mode');
            this.setSimAP(MSFSAPStates.Pitch, true);
        }
    }
}
