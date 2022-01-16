/// <reference types="msfstypes/pages/vcockpit/instruments/shared/baseinstrument" />
/// <reference types="msfstypes/js/common" />
import { EventBus, PublishPacer } from '../data/EventBus';
import { BasePublisher } from '../instruments/BasePublishers';
/** Events related to sound playback. */
export interface SoundEvents {
    /** Request to play a sound once. */
    play_sound: string;
    /** Start playing a sound repeatedly. */
    start_sound: string;
    /** Stop playing a repeated sound.*/
    stop_sound: string;
    /** Notification that sound playback has been triggered..  */
    sound_queued: string;
    /** Notification that sound playback has ended. */
    sound_played: string;
}
/** A publisher for sound events. */
export declare class SoundPublisher extends BasePublisher<SoundEvents> {
    /**
     * Create a SoundPublisher.
     * @param bus An event bus.
     * @param pacer An optional pacer to controle the rate of publishing.
     */
    constructor(bus: EventBus, pacer?: PublishPacer<SoundEvents>);
    /**
     * Request that a sound be played.
     * @param soundId The id of the sound to play.
     */
    playSound(soundId: string): void;
    /**
     * Request that a continuous sound be started.
     * @param soundId The id of the sound to play.
     */
    startSound(soundId: string): void;
    /**
     * Request that a continuous sound be stopped.
     * @param soundId The id of the sound to play.
     */
    stopSound(soundId: string): void;
    /**
     * Send a notification that play has been requested.
     * @param soundId The id of the sound requested.
     */
    soundQueued(soundId: string): void;
    /**
     * Send a notification that play has completed.
     * @param soundId The id of the sound played.
     */
    soundPlayed(soundId: string): void;
}
/**
 * A event-drive sound server that manages both one-shot and continuous sound playback.
 */
export declare class SoundServer {
    private instrument;
    private playing;
    private subscriber;
    private publisher;
    /**
     * Create a sound server.
     * @param bus An event bus.
     * @param publisher A sound publisher.
     * @param instrument The hosting instance of BaseInstrument.
     */
    constructor(bus: EventBus, publisher: SoundPublisher, instrument: BaseInstrument);
    /**
     * Play a requested sound once or continuously.
     * @param soundId The id of the sound to play.
     * @param continuous Whether to play it continuously.
     */
    protected playSound(soundId: string, continuous?: boolean): void;
    /**
     * Stop a continuously played sound.
     * @param soundId The id of the sound to stop.
     */
    protected stopSound(soundId: string): void;
    /**
     * Handle a sound end event.  This needs to be called by the parent device,
     * and it takes a Name_Z, as sent from VCockpit.js in the master onSoundEnd call.
     * @param soundEventId The id of the sound event.
     */
    onSoundEnd(soundEventId: Name_Z): void;
}
//# sourceMappingURL=SoundServer.d.ts.map