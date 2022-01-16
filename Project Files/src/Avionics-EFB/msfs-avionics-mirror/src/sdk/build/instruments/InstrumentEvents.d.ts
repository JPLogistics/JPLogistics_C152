/// <reference types="msfstypes/pages/vcockpit/instruments/shared/baseinstrument" />
/**
 * An event fired when the screen state changes.
 */
export interface ScreenStateEvent {
    /** The current screen state. */
    current: ScreenState;
    /** The previous screen state. */
    previous: ScreenState | undefined;
}
/**
 * Events from the VCockpit BaseInstrument framework.
 */
export interface InstrumentEvents {
    /** An event fired when the instrument is powered on or off. */
    'vc_powered': boolean;
    /** An event fired when the screen state changes. */
    'vc_screen_state': ScreenStateEvent;
    /** An event fired when the game state changes. */
    'vc_game_state': GameState;
}
//# sourceMappingURL=InstrumentEvents.d.ts.map