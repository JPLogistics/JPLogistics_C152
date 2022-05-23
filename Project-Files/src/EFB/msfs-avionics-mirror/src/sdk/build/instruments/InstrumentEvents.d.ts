/// <reference types="msfstypes/pages/vcockpit/instruments/shared/baseinstrument" />
import { EventBus } from '../data/EventBus';
import { PublishPacer } from '../data/EventBusPacer';
import { BasePublisher } from './BasePublishers';
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
    /** An event fired when the flight is started */
    'vc_flight_start': boolean;
}
/**
 * A publisher for VCockpit BaseInstrument events.
 */
export declare class BaseInstrumentPublisher extends BasePublisher<InstrumentEvents> {
    private readonly instrument;
    private lastGameState;
    private lastIsPowered;
    private lastScreenState;
    private hasFlightStarted;
    /**
     * Creates an instance of BasePublisher.
     * @param instrument The BaseInstrument instance.
     * @param bus The common event bus.
     * @param pacer An optional pacer to control the rate of publishing.
     */
    constructor(instrument: BaseInstrument, bus: EventBus, pacer?: PublishPacer<InstrumentEvents> | undefined);
    /** @inheritdoc */
    startPublish(): void;
    /** @inheritdoc */
    stopPublish(): void;
    /** @inheritdoc */
    onUpdate(): void;
    /**
     * Updates this publisher from the current game state.
     * @param gameState The current game state.
     */
    private updateFromGameState;
    /**
     * Updates this publisher from the current powered state.
     * @param isPowered The current powered state.
     */
    private updateFromPowered;
    /**
     * Updates this publisher from the current screen state.
     * @param screenState The current screen state.
     */
    private updateFromScreenState;
}
//# sourceMappingURL=InstrumentEvents.d.ts.map