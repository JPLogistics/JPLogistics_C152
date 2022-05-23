/// <reference types="msfstypes/pages/vcockpit/instruments/shared/baseinstrument" />
/**
 * An interface to be implemented by instrument classes.
 */
export interface FsInstrument {
    /**
     * A reference to the BaseInstrument loaded by the sim
     */
    readonly instrument: BaseInstrument;
    Update(): void;
    onInteractionEvent(_args: Array<string>): void;
    onFlightStart(): void;
    onGameStateChanged(oldState: GameState, newState: GameState): void;
}
/**
 * A class that wraps the actual instrumenet implementation and handles the sim's vcockpit lifecycle.
 */
export declare abstract class FsBaseInstrument<T extends FsInstrument> extends BaseInstrument {
    protected fsInstrument: T;
    /**
     * The instrument template ID.
     * @returns The instrument template ID.
     */
    abstract get templateID(): string;
    /**
     * Called during connectedCallback to construct the actual instrument class.
     */
    abstract constructInstrument(): T;
    /**
     * A callback called when the element is attached to the DOM.
     */
    connectedCallback(): void;
    /**
     * Update method called by BaseInstrument
     */
    protected Update(): void;
    /** @inheritdoc */
    onInteractionEvent(_args: Array<string>): void;
    /** @inheritdoc */
    protected onGameStateChanged(oldState: GameState, newState: GameState): void;
    /** @inheritdoc */
    onFlightStart(): void;
    /**
     * Whether or not the instrument is interactive (a touchscreen instrument).
     * @returns True
     */
    get isInteractive(): boolean;
}
//# sourceMappingURL=FsInstrument.d.ts.map