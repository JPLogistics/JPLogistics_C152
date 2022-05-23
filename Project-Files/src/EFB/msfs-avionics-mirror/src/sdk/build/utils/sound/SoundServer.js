import { BasePublisher } from '../../instruments/BasePublishers';
/** A publisher for sound events. */
export class SoundPublisher extends BasePublisher {
    /**
     * Create a SoundPublisher.
     * @param bus An event bus.
     * @param pacer An optional pacer to controle the rate of publishing.
     */
    constructor(bus, pacer) {
        super(bus, pacer);
    }
    /**
     * Request that a sound be played.
     * @param soundId The id of the sound to play.
     */
    playSound(soundId) {
        this.publish('play_sound', soundId, true, false);
    }
    /**
     * Request that a continuous sound be started.
     * @param soundId The id of the sound to play.
     */
    startSound(soundId) {
        this.publish('start_sound', soundId, true, false);
    }
    /**
     * Request that a continuous sound be stopped.
     * @param soundId The id of the sound to play.
     */
    stopSound(soundId) {
        this.publish('stop_sound', soundId, true, false);
    }
    /**
     * Send a notification that play has been requested.
     * @param soundId The id of the sound requested.
     */
    soundQueued(soundId) {
        this.publish('sound_queued', soundId, true, false);
    }
    /**
     * Send a notification that play has completed.
     * @param soundId The id of the sound played.
     */
    soundPlayed(soundId) {
        this.publish('sound_played', soundId, true, false);
    }
}
/**
 * A event-drive sound server that manages both one-shot and continuous sound playback.
 */
export class SoundServer {
    /**
     * Create a sound server.
     * @param bus An event bus.
     * @param publisher A sound publisher.
     * @param instrument The hosting instance of BaseInstrument.
     */
    constructor(bus, publisher, instrument) {
        this.instrument = instrument;
        this.playing = new Map();
        this.subscriber = bus.getSubscriber();
        this.publisher = publisher;
        this.subscriber.on('play_sound').handle((soundId) => { this.playSound(soundId, false); });
        this.subscriber.on('start_sound').handle((soundId) => { this.playSound(soundId, true); });
        this.subscriber.on('stop_sound').handle((soundId) => { this.stopSound(soundId); });
    }
    /**
     * Play a requested sound once or continuously.
     * @param soundId The id of the sound to play.
     * @param continuous Whether to play it continuously.
     */
    playSound(soundId, continuous = false) {
        if (!this.playing.has(soundId)) {
            this.instrument.playInstrumentSound(soundId);
            this.playing.set(soundId, { soundEventId: new Name_Z(soundId), continuous: continuous });
            this.publisher.soundQueued(soundId);
        }
    }
    /**
     * Stop a continuously played sound.
     * @param soundId The id of the sound to stop.
     */
    stopSound(soundId) {
        const record = this.playing.get(soundId);
        if (record) {
            // Setting continuous to false means it won't be retriggered next time it ends.
            record.continuous = false;
            this.playing.set(soundId, record);
        }
    }
    /**
     * Handle a sound end event.  This needs to be called by the parent device,
     * and it takes a Name_Z, as sent from VCockpit.js in the master onSoundEnd call.
     * @param soundEventId The id of the sound event.
     */
    onSoundEnd(soundEventId) {
        for (const entry of this.playing.entries()) {
            // Name_Z can't be compared with ==, you need to use the in-built function.
            if (Name_Z.compare(entry[1].soundEventId, soundEventId)) {
                if (entry[1].continuous) {
                    this.instrument.playInstrumentSound(entry[0]);
                    return;
                }
                else {
                    this.publisher.soundPlayed(entry[0]);
                    this.playing.delete(entry[0]);
                    return;
                }
            }
        }
    }
}
