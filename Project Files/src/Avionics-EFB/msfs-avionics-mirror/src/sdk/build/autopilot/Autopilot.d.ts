import { EventBus } from '../data';
import { NavSourceId } from '../instruments';
import { FlightPlanner } from '../flightplan';
import { APAltitudeModes, APConfig, APLateralModes, APValues, APVerticalModes } from './APConfig';
import { APStateManager } from './APStateManager';
import { NavToNavManager } from './NavToNavManager';
import { PlaneDirector } from './PlaneDirector';
import { VNavAltCaptureType } from './VerticalNavigation';
/**
 * A collection of autopilot plane directors.
 */
export declare type APDirectors = {
    /** The autopilot's heading mode director. */
    readonly headingDirector?: PlaneDirector;
    /** The autopilot's roll mode director. */
    readonly rollDirector?: PlaneDirector;
    /** The autopilot's wings level mode director. */
    readonly wingLevelerDirector?: PlaneDirector;
    /** The autopilot's GPS LNAV mode director. */
    readonly gpssDirector?: PlaneDirector;
    /** The autopilot's VOR mode director. */
    readonly vorDirector?: PlaneDirector;
    /** The autopilot's LOC  mode director. */
    readonly locDirector?: PlaneDirector;
    /** The autopilot's back-course mode director. */
    readonly bcDirector?: PlaneDirector;
    /** The autopilot's pitch mode director. */
    readonly pitchDirector?: PlaneDirector;
    /** The autopilot's vertical speed mode director. */
    readonly vsDirector?: PlaneDirector;
    /** The autopilot's flight level change mode director. */
    readonly flcDirector?: PlaneDirector;
    /** The autopilot's altitude hold mode director. */
    readonly altHoldDirector?: PlaneDirector;
    /** The autopilot's wings altitude capture director. */
    readonly altCapDirector?: PlaneDirector;
    /** The autopilot's VNAV mode director. */
    readonly vnavDirector?: PlaneDirector;
    /** The autopilot's GPS glidepath mode director. */
    readonly gpDirector?: PlaneDirector;
    /** The autopilot's ILS glideslope mode director. */
    readonly gsDirector?: PlaneDirector;
};
/**
 * An Autopilot.
 */
export declare class Autopilot {
    protected readonly bus: EventBus;
    protected readonly flightPlanner: FlightPlanner;
    protected readonly config: APConfig;
    readonly stateManager: APStateManager;
    /** This autopilot's plane directors. */
    readonly directors: APDirectors;
    /** This autopilot's nav-to-nav transfer manager. */
    readonly navToNavManager: NavToNavManager | undefined;
    protected cdiSource: NavSourceId;
    protected lateralModes: Map<APLateralModes, PlaneDirector>;
    protected lateralActive: APLateralModes;
    protected lateralArmed: APLateralModes;
    protected verticalModes: Map<APVerticalModes, PlaneDirector>;
    protected verticalActive: APVerticalModes;
    protected verticalArmed: APVerticalModes;
    protected verticalAltitudeArmed: APAltitudeModes;
    protected verticalApproachArmed: APVerticalModes;
    protected altCapArmed: boolean;
    protected lateralModeFailed: boolean;
    protected inClimb: boolean;
    protected currentAltitude: number;
    protected vnavCaptureType: VNavAltCaptureType;
    readonly apValues: APValues;
    protected autopilotInitialized: boolean;
    /**
     * Creates an instance of the Autopilot.
     * @param bus The event bus.
     * @param flightPlanner This autopilot's associated flight planner.
     * @param config This autopilot's configuration.
     * @param stateManager This autopilot's state manager.
     */
    constructor(bus: EventBus, flightPlanner: FlightPlanner, config: APConfig, stateManager: APStateManager);
    /**
     * Creates this autopilot's directors.
     * @param config This autopilot's configuration.
     * @returns This autopilot's directors.
     */
    private createDirectors;
    /**
     * Update method for the Autopilot.
     */
    update(): void;
    /**
     * This method runs each update cycle before the update occurs.
     */
    protected onBeforeUpdate(): void;
    /**
     * This method runs each update cycle after the update occurs.
     */
    protected onAfterUpdate(): void;
    /**
     * This method runs whenever the initialized state of the Autopilot changes.
     */
    protected onInitialized(): void;
    /**
     * Handles input from the State Manager when a lateral mode button is pressed.
     * @param data is the AP Lateral Mode Event Data
     */
    private lateralPressed;
    /**
     * Handles input from the State Manager when a vertical mode button is pressed.
     * @param data is the AP Vertical Mode Event Data
     */
    private verticalPressed;
    /**
     * Checks if a mode is active or armed and optionally deactivates it.
     * @param mode is the AP Mode to check.
     * @returns whether this mode was active or armed and subsequently disabled.
     */
    private isLateralModeActivatedOrArmed;
    /**
     * Checks if a mode is active or armed and deactivates it.
     * @param mode is the AP Mode to check.
     * @returns whether this mode was active or armed and subsequently disabled.
     */
    private isVerticalModeActivatedOrArmed;
    /**
     * Handles input from the State Manager when the APPR button is pressed.
     * @param set is whether this event commands a specific set
     */
    private approachPressed;
    /**
     * A method to check whether an approach can arm.
     * @returns The AP Lateral Mode that can be armed.
     */
    private canApproachArm;
    /**
     * Callback to set the lateral active mode.
     * @param mode is the mode being set.
     */
    private setLateralActive;
    /**
     * Callback to set the lateral armed mode.
     * @param mode is the mode being set.
     */
    private setLateralArmed;
    /**
     * Callback to set the vertical active mode.
     * @param mode is the mode being set.
     */
    private setVerticalActive;
    /**
     * Callback to set the vertical armed mode.
     * @param mode is the mode being set.
     */
    private setVerticalArmed;
    /**
     * Callback to set the vertical approach armed mode.
     * @param mode is the mode being set.
     */
    private setVerticalApproachArmed;
    /**
     * Method called when the ALT button is pressed.
     */
    private setAltHold;
    /**
     * Initializes the Autopilot with the available lateral modes from the config.
     */
    private initLateralModes;
    /**
     * Initializes the Autopilot with the available Nav To Nav Manager.
     */
    private initNavToNavManager;
    /**
     * Initializes the Autopilot with the available vertical modes from the config.
     */
    private initVerticalModes;
    /**
     * Checks if all the active and armed modes are still in their proper state
     * and takes corrective action if not.
     */
    private checkModes;
    /**
     * Runs update on each of the active and armed modes.
     */
    private updateModes;
    /**
     * Checks and sets the proper armed altitude mode.
     */
    private manageAltitudeCapture;
    /**
     * Monitors subevents and bus events.
     */
    private monitorEvents;
    /**
     * Additional events to be monitored (to be overridden).
     */
    protected monitorAdditionalEvents(): void;
    /**
     * Manages the FD state and the modes when AP/FD are off.
     */
    protected handleApFdStateChange(): void;
    /**
     * Sets a sim AP mode.
     * @param mode The mode to set.
     * @param enabled Whether or not the mode is enabled or disabled.
     */
    private setSimAP;
    /**
     * Checks if the sim AP is in roll mode and sets it if not.
     */
    private checkRollModeActive;
    /**
     * Checks if the sim AP is in pitch mode and sets it if not.
     */
    private checkPitchModeActive;
}
//# sourceMappingURL=Autopilot.d.ts.map