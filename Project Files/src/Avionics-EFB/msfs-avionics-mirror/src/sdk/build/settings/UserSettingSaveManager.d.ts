import { EventBus } from '../data/EventBus';
import { UserSetting, UserSettingType } from './UserSetting';
/**
 * A manager for user settings that are saved and persistent across flight sessions. The manager facilitates saving
 * and loading setting values to and from multiple keyed save slots and also supports auto-saving. Uses Data Store to
 * store saved setting values.
 */
export declare class UserSettingSaveManager {
    private static readonly DATASTORE_PREFIX;
    private readonly entries;
    private readonly autoSaveKeys;
    /**
     * Constructor.
     * @param settings This manager's managed settings.
     * @param bus The event bus.
     */
    constructor(settings: UserSetting<any, UserSettingType>[], bus: EventBus);
    /**
     * A callback which is called when a setting's value changes.
     * @param autoSaveDataStoreKeys The data store keys to which the setting's value should be automatically saved.
     * @param value The new value of the setting.
     */
    private onSettingChanged;
    /**
     * Loads the saved values of this manager's settings.
     * @param key The key from which to load the values.
     */
    load(key: string): void;
    /**
     * Saves the current values of this manager's settings.
     * @param key The key to which to save the values.
     */
    save(key: string): void;
    /**
     * Starts automatically saving this manager's settings when their values change.
     * @param key The key to which to save the values.
     */
    startAutoSave(key: string): void;
    /**
     * Stops automatically saving this manager's settings when their values change.
     * @param key The key to which to stop saving the values.
     */
    stopAutoSave(key: string): void;
    /**
     * Gets a data store key for a specific setting and save key.
     * @param setting A user setting.
     * @param saveKey The save key.
     * @returns the data store key for the setting and save key.
     */
    private static getDataStoreKey;
}
//# sourceMappingURL=UserSettingSaveManager.d.ts.map