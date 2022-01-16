/// <reference types="msfstypes/pages/vcockpit/instruments/shared/utils/xmllogic" />
/// <reference types="msfstypes/js/common" />
import { CompositeLogicXMLHost } from '../../data/';
/** The acceptable priority types for a given warning. */
export declare enum WarningType {
    Warning = 0,
    Caution = 1,
    Test = 2,
    SoundOnly = 3
}
/** The main logic for a system warning. */
export declare class Warning {
    /** The category of the warnining. */
    readonly type: WarningType;
    /** The short-form text. */
    readonly shortText?: string;
    /** The long-form text. */
    readonly longText?: string;
    /** The name of a sound to play along with the visual warning. */
    readonly soundId?: string;
    /** The XML logic element triggering this warning if true. */
    readonly condition: CompositeLogicXMLElement;
    /** Does this only fire once? */
    readonly once?: boolean;
    /** If a one-shot, has this been triggered already? */
    private _triggered;
    /** The event ID for this sound. */
    private _soundEventId?;
    /**
     * Creates an instance of a Warning.
     * @param type The type of warning this is.
     * @param condition An XML logic element with the trigger logic.
     * @param shortText The warning message in short form.
     * @param longText The warning message in long form.
     * @param soundId The sound name to use with this warning.
     * @param once True if this warning only fires once
     */
    constructor(type: WarningType, condition: CompositeLogicXMLElement, shortText?: string, longText?: string, soundId?: string, once?: boolean);
    /**
     * Whether or not we have any text at all.
     * @returns True if any non-empty text strings are set.
     */
    get hasText(): boolean;
    /**
     * The alert is being fired, take action.
     */
    trigger(): void;
    /**
     * A text description for the warning, for debugging purposes.
     * @returns A string
     */
    get description(): string;
    /**
     * Whether or not the warning has been triggered in this session.
     * @returns True if the warning has been triggered.
     */
    get triggered(): boolean;
    /**
     * Can this alert fire?
     * @returns True if the current configuration allows the alert to fire.
     */
    get canTrigger(): boolean;
    /**
     * The event ID Coherent returns when this sound has been played.
     * @returns A Name_Z based on the sound ID.
     */
    get eventId(): Name_Z | undefined;
}
/** The basic component for handling warning logic. */
export declare class WarningManager {
    private warnings;
    private warnActiveStates;
    private logicHost;
    private textCb;
    private soundCb?;
    private curSndIdx;
    private curTxtIdx;
    /**
     * Create a WarningManager.
     * @param warnings An array of warnings to manage.
     * @param logicHost An event bus.
     * @param textCb A callback to display new warning text.
     * @param soundCb A callback to play an instrument sound from a sound ID.
     */
    constructor(warnings: Array<Warning>, logicHost: CompositeLogicXMLHost, textCb: (warning: Warning | undefined) => void, soundCb?: (warning: Warning, active: boolean) => void);
    /**
     * Handle a warning firing.  This is rather complex, but it basically keeps
     * track of every warning that is active, both for text and for sound, and
     * makes sure that the highest priority version of each is played or
     * displayed, masking and restoring lower priority warnings as needed.
     * @param warnIndex The index of our warnings array that's firing.
     * @param active 1 if the warning is active, 0 otherwise.
     */
    private handleWarning;
}
//# sourceMappingURL=Warning.d.ts.map