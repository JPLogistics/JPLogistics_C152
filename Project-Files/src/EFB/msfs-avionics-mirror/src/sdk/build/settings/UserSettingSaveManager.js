import { DataStore } from '../data/DataStore';
/**
 * A manager for user settings that are saved and persistent across flight sessions. The manager facilitates saving
 * and loading setting values to and from multiple keyed save slots and also supports auto-saving. Uses Data Store to
 * store saved setting values.
 */
export class UserSettingSaveManager {
    /**
     * Constructor.
     * @param settings This manager's managed settings.
     * @param bus The event bus.
     */
    constructor(settings, bus) {
        this.autoSaveKeys = new Set();
        this.isAlive = true;
        const subscriber = bus.getSubscriber();
        this.entries = Array.from(settings, setting => {
            const autoSaveDataStoreKeys = [];
            return {
                setting,
                subscription: subscriber.on(setting.definition.name).whenChanged().handle(this.onSettingChanged.bind(this, autoSaveDataStoreKeys), true),
                autoSaveDataStoreKeys
            };
        });
    }
    /**
     * A callback which is called when a setting's value changes.
     * @param autoSaveDataStoreKeys The data store keys to which the setting's value should be automatically saved.
     * @param value The new value of the setting.
     */
    onSettingChanged(autoSaveDataStoreKeys, value) {
        const len = autoSaveDataStoreKeys.length;
        for (let i = 0; i < len; i++) {
            DataStore.set(autoSaveDataStoreKeys[i], value);
        }
    }
    /**
     * Loads the saved values of this manager's settings.
     * @param key The key from which to load the values.
     * @throws Error if this manager has been destroyed.
     */
    load(key) {
        if (!this.isAlive) {
            throw new Error('UserSettingSaveManager: cannot load using a destroyed manager.');
        }
        for (let i = 0; i < this.entries.length; i++) {
            const entry = this.entries[i];
            const dataStoreKey = UserSettingSaveManager.getDataStoreKey(entry.setting, key);
            const storedValue = DataStore.get(dataStoreKey);
            if (storedValue !== undefined) {
                entry.setting.value = storedValue;
            }
        }
    }
    /**
     * Saves the current values of this manager's settings.
     * @param key The key to which to save the values.
     * @throws Error if this manager has been destroyed.
     */
    save(key) {
        if (!this.isAlive) {
            throw new Error('UserSettingSaveManager: cannot save using a destroyed manager.');
        }
        for (let i = 0; i < this.entries.length; i++) {
            const entry = this.entries[i];
            const dataStoreKey = UserSettingSaveManager.getDataStoreKey(entry.setting, key);
            DataStore.set(dataStoreKey, entry.setting.value);
        }
    }
    /**
     * Starts automatically saving this manager's settings when their values change.
     * @param key The key to which to save the values.
     * @throws Error if this manager has been destroyed.
     */
    startAutoSave(key) {
        if (!this.isAlive) {
            throw new Error('UserSettingSaveManager: cannot start autosave using a destroyed manager.');
        }
        if (this.autoSaveKeys.has(key)) {
            return;
        }
        for (let i = 0; i < this.entries.length; i++) {
            const entry = this.entries[i];
            entry.autoSaveDataStoreKeys.push(UserSettingSaveManager.getDataStoreKey(entry.setting, key));
            if (entry.autoSaveDataStoreKeys.length === 1) {
                entry.subscription.resume();
            }
        }
    }
    /**
     * Stops automatically saving this manager's settings when their values change.
     * @param key The key to which to stop saving the values.
     * @throws Error if this manager has been destroyed.
     */
    stopAutoSave(key) {
        if (!this.isAlive) {
            throw new Error('UserSettingSaveManager: cannot stop autosave using a destroyed manager.');
        }
        if (!this.autoSaveKeys.has(key)) {
            return;
        }
        for (let i = 0; i < this.entries.length; i++) {
            const entry = this.entries[i];
            entry.autoSaveDataStoreKeys.splice(entry.autoSaveDataStoreKeys.indexOf(UserSettingSaveManager.getDataStoreKey(entry.setting, key)), 1);
            if (entry.autoSaveDataStoreKeys.length === 0) {
                entry.subscription.pause();
            }
        }
    }
    /**
     * Destroys this manager. Once this manager is destroyed, all active autosaves will be stopped, and attempting to
     * save, load, or start another autosave from this manager will cause an error to be thrown.
     */
    destroy() {
        const len = this.entries.length;
        for (let i = 0; i < len; i++) {
            this.entries[i].subscription.destroy();
        }
        this.entries.length = 0;
        this.isAlive = false;
    }
    /**
     * Gets a data store key for a specific setting and save key.
     * @param setting A user setting.
     * @param saveKey The save key.
     * @returns the data store key for the setting and save key.
     */
    static getDataStoreKey(setting, saveKey) {
        return `${UserSettingSaveManager.DATASTORE_PREFIX}.${saveKey}.${setting.definition.name}`;
    }
}
UserSettingSaveManager.DATASTORE_PREFIX = 'persistent-setting';
