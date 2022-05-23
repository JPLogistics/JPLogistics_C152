/// <reference types="msfstypes/Pages/VCockpit/Instruments/Shared/BaseInstrument" />
import { BasePublisher } from './BasePublishers';
/**
 * A publisher for VCockpit BaseInstrument events.
 */
export class BaseInstrumentPublisher extends BasePublisher {
    /**
     * Creates an instance of BasePublisher.
     * @param instrument The BaseInstrument instance.
     * @param bus The common event bus.
     * @param pacer An optional pacer to control the rate of publishing.
     */
    constructor(instrument, bus, pacer = undefined) {
        super(bus, pacer);
        this.instrument = instrument;
        this.lastGameState = undefined;
        this.lastIsPowered = undefined;
        this.lastScreenState = undefined;
        this.hasFlightStarted = false;
    }
    /** @inheritdoc */
    startPublish() {
        super.startPublish();
    }
    /** @inheritdoc */
    stopPublish() {
        super.stopPublish();
    }
    /** @inheritdoc */
    onUpdate() {
        if (!this.isPublishing()) {
            return;
        }
        this.updateFromGameState(this.instrument.getGameState());
        this.updateFromPowered(this.instrument.isStarted); // Big hack here since there is no other way to get the isStarted state from BaseInstrument
        this.updateFromScreenState(this.instrument.screenState); // Another big hack
    }
    /**
     * Updates this publisher from the current game state.
     * @param gameState The current game state.
     */
    updateFromGameState(gameState) {
        if (this.lastGameState === gameState) {
            return;
        }
        this.lastGameState = gameState;
        this.publish('vc_game_state', gameState);
        if (!this.hasFlightStarted && gameState === GameState.ingame) {
            this.publish('vc_flight_start', true);
        }
    }
    /**
     * Updates this publisher from the current powered state.
     * @param isPowered The current powered state.
     */
    updateFromPowered(isPowered) {
        if (this.lastIsPowered === isPowered) {
            return;
        }
        this.lastIsPowered = isPowered;
        this.publish('vc_powered', isPowered);
    }
    /**
     * Updates this publisher from the current screen state.
     * @param screenState The current screen state.
     */
    updateFromScreenState(screenState) {
        if (this.lastScreenState === screenState) {
            return;
        }
        const lastScreenState = this.lastScreenState;
        this.lastScreenState = screenState;
        this.publish('vc_screen_state', { current: screenState, previous: lastScreenState });
    }
}
