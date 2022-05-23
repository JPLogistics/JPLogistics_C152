import { LegDefinition } from '../flightplan';
/**
 * The state of a given plane director.
 */
export declare enum DirectorState {
    /** The plane director is not currently armed or active. */
    Inactive = "Inactive",
    /** The plane director is currently armed. */
    Armed = "Armed",
    /** The plane director is currently active. */
    Active = "Active"
}
/**
 * An autopilot plane director guidance mode.
 */
export interface PlaneDirector {
    /**
     * Activates the guidance mode.
     */
    activate(): void;
    /**
     * Arms the guidance mode.
     */
    arm(): void;
    /**
     * Deactivates the guidance mode.
     */
    deactivate(): void;
    /**
     * Updates the guidance mode control loops.
     */
    update(): void;
    /**
     * A callback called when a mode signals it should
     * be activated.
     */
    onActivate?: () => void;
    /**
     * A callback called when a mode signals it should
     * be armed.
     */
    onArm?: () => void;
    /**
     * A callback called when a mode signals it should
     * be deactivated.
     */
    onDeactivate?: () => void;
    /** The current director state. */
    state: DirectorState;
}
/**
 * A director that handles OBS Lateral Navigation.
 */
export interface ObsDirector extends PlaneDirector {
    /** Whether or not OBS mode is active. */
    readonly obsActive: boolean;
    /**
     * Sets the flight plan leg whose terminator defines this director's OBS fix.
     * @param index The global leg index of the leg.
     * @param leg The leg to track.
     */
    setLeg(index: number, leg: LegDefinition | null): void;
    /** Whether or not OBS mode can be activated currently. */
    canActivate(): boolean;
    /** Starts tracking the OBS course. */
    startTracking(): void;
    /** Stops tracking the OBS course. */
    stopTracking(): void;
}
/**
 * A plane director that provides no behavior.
 */
export declare class EmptyDirector implements PlaneDirector {
    /** No-op. */
    activate(): void;
    /** No-op. */
    deactivate(): void;
    /** No-op. */
    update(): void;
    /** No-op. */
    onActivate: () => void;
    /** No-op */
    onArm: () => void;
    /** No-op. */
    arm(): void;
    state: DirectorState;
    /** An instance of the empty plane director. */
    static instance: EmptyDirector;
}
//# sourceMappingURL=PlaneDirector.d.ts.map