import { GameStateProvider } from './GameStateProvider';
/**
 * A manager for key intercepts. Allows key events to be intercepted and publishes intercepted key events on the event
 * bus.
 */
export class KeyInterceptManager {
    /**
     * Constructor.
     * @param keyListener The Coherent key intercept view listener.
     * @param bus The event bus.
     */
    constructor(keyListener, bus) {
        this.keyListener = keyListener;
        this.bus = bus;
        Coherent.on('keyIntercepted', this.onKeyIntercepted.bind(this));
    }
    /**
     * Responds to key intercept events.
     * @param key The key that was intercepted.
     * @param index The index of the key event.
     * @param value The value of the key event.
     */
    onKeyIntercepted(key, index, value) {
        // Even though values are uint32, we will do what the sim does and pretend they're actually sint32
        if (value !== undefined && value >= 2147483648) {
            value -= 4294967296;
        }
        this.bus.pub('key_intercept', { key, index, value }, false, false);
    }
    /**
     * Enables interception for a key.
     * @param key The key to intercept.
     * @param passThrough Whether to pass the event through to the sim after it has been intercepted.
     */
    interceptKey(key, passThrough) {
        Coherent.call('INTERCEPT_KEY_EVENT', key, passThrough ? 0 : 1);
    }
    /**
     * Gets an instance of KeyInterceptManager. If an instance does not already exist, a new one will be created.
     * @param bus The event bus.
     * @returns A Promise which will be fulfilled with an instance of KeyInterceptManager.
     */
    static getManager(bus) {
        if (KeyInterceptManager.INSTANCE) {
            return Promise.resolve(KeyInterceptManager.INSTANCE);
        }
        if (!KeyInterceptManager.isCreatingInstance) {
            KeyInterceptManager.createInstance(bus);
        }
        return new Promise(resolve => {
            KeyInterceptManager.pendingPromiseResolves.push(resolve);
        });
    }
    /**
     * Creates an instance of KeyInterceptManager and fulfills all pending Promises to get the manager instance once
     * the instance is created.
     * @param bus The event bus.
     */
    static async createInstance(bus) {
        KeyInterceptManager.isCreatingInstance = true;
        KeyInterceptManager.INSTANCE = await KeyInterceptManager.create(bus);
        KeyInterceptManager.isCreatingInstance = false;
        for (let i = 0; i < KeyInterceptManager.pendingPromiseResolves.length; i++) {
            KeyInterceptManager.pendingPromiseResolves[i](KeyInterceptManager.INSTANCE);
        }
    }
    /**
     * Creates an instance of KeyInterceptManager.
     * @param bus The event bus.
     * @returns A Promise which is fulfilled with a new instance of KeyInterceptManager after it has been created.
     */
    static create(bus) {
        return new Promise((resolve, reject) => {
            const gameState = GameStateProvider.get();
            const sub = gameState.sub(state => {
                if (window['IsDestroying']) {
                    sub.destroy();
                    reject('KeyInterceptManager: cannot create a key intercept manager after the Coherent JS view has been destroyed');
                    return;
                }
                if (state === GameState.briefing || state === GameState.ingame) {
                    sub.destroy();
                    const keyListener = RegisterViewListener('JS_LISTENER_KEYEVENT', () => {
                        if (window['IsDestroying']) {
                            reject('KeyInterceptManager: cannot create a key intercept manager after the Coherent JS view has been destroyed');
                            return;
                        }
                        resolve(new KeyInterceptManager(keyListener, bus));
                    });
                }
            }, false, true);
            sub.resume(true);
        });
    }
}
KeyInterceptManager.isCreatingInstance = false;
KeyInterceptManager.pendingPromiseResolves = [];
