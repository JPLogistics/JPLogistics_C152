import { MapSystemContext } from '../MapSystemContext';
/**
 * A data module for the map system that provides subscribable data.
 */
export class AbstractMapModule {
    /**
     * Creates an instance of a MapModule.
     * @param mapSystemContext The map system context that will be used by this module.
     */
    constructor(mapSystemContext = MapSystemContext.Empty) {
        this.mapSystemContext = mapSystemContext;
        /** Whether or not this data module is currently syncing. */
        this.isSyncing = false;
    }
    /**
     * The list of IDs of other modules that are required by this data module.
     * @returns A list of other required data modules' IDs.
     */
    requirements() {
        return [];
    }
    /**
     * Binds a peice of module data to a user setting via a settings manager.
     * @param dataKey The key of the data in this module to bind.
     * @param manager The settings manager to use to bind the setting.
     * @param settingKey The key of the setting to bind to the data.
     */
    bindSetting(dataKey, manager, settingKey) {
        const sub = this[dataKey];
        sub.sub((v) => manager.getSetting(settingKey).value = v);
        manager.whenSettingChanged(settingKey).handle((v) => sub.set(v));
    }
    /**
     * Called when the module is installed into the map system.
     */
    onInstall() { }
    /**
     * Starts the synchronization of module data from the event bus or other sources.
     */
    startSync() {
        this.isSyncing = true;
    }
    /**
     * Stops the synchronization of module data from the event bus or other sources.
     */
    stopSync() {
        this.isSyncing = false;
    }
}
