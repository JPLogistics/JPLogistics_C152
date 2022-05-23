/**
 * A class that wraps the actual instrumenet implementation and handles the sim's vcockpit lifecycle.
 */
export class FsBaseInstrument extends BaseInstrument {
    /**
     * A callback called when the element is attached to the DOM.
     */
    connectedCallback() {
        super.connectedCallback();
        this.fsInstrument = this.constructInstrument();
    }
    /**
     * Update method called by BaseInstrument
     */
    Update() {
        super.Update();
        if (this.fsInstrument) {
            this.fsInstrument.Update();
        }
    }
    /** @inheritdoc */
    onInteractionEvent(_args) {
        if (this.fsInstrument) {
            this.fsInstrument.onInteractionEvent(_args);
        }
    }
    /** @inheritdoc */
    onGameStateChanged(oldState, newState) {
        super.onGameStateChanged(oldState, newState);
        if (this.fsInstrument) {
            this.fsInstrument.onGameStateChanged(oldState, newState);
        }
    }
    /** @inheritdoc */
    onFlightStart() {
        super.onFlightStart();
        if (this.fsInstrument) {
            this.fsInstrument.onFlightStart();
        }
    }
    /**
     * Whether or not the instrument is interactive (a touchscreen instrument).
     * @returns True
     */
    get isInteractive() {
        return false;
    }
}
