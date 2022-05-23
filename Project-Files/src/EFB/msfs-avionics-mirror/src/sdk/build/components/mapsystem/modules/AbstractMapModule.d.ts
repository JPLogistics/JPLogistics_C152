import { UserSettingManager, UserSettingType } from '../../../settings';
import { MapSystemContext } from '../MapSystemContext';
import { MapModuleSubjectKeys } from './MapModule';
/**
 * A data module for the map system that provides subscribable data.
 */
export declare abstract class AbstractMapModule {
    protected readonly mapSystemContext: MapSystemContext;
    /** Whether or not this data module is currently syncing. */
    isSyncing: boolean;
    /**
     * Creates an instance of a MapModule.
     * @param mapSystemContext The map system context that will be used by this module.
     */
    constructor(mapSystemContext?: MapSystemContext);
    /**
     * The list of IDs of other modules that are required by this data module.
     * @returns A list of other required data modules' IDs.
     */
    requirements(): string[];
    /**
     * Binds a peice of module data to a user setting via a settings manager.
     * @param dataKey The key of the data in this module to bind.
     * @param manager The settings manager to use to bind the setting.
     * @param settingKey The key of the setting to bind to the data.
     */
    bindSetting<K extends MapModuleSubjectKeys<this, T[S]>, T extends Record<any, UserSettingType>, S extends keyof T>(dataKey: K, manager: UserSettingManager<T>, settingKey: S): void;
    /**
     * Called when the module is installed into the map system.
     */
    onInstall(): void;
    /**
     * Starts the synchronization of module data from the event bus or other sources.
     */
    startSync(): void;
    /**
     * Stops the synchronization of module data from the event bus or other sources.
     */
    stopSync(): void;
}
//# sourceMappingURL=AbstractMapModule.d.ts.map