import { Consumer, EventBus } from '../data';
import { UserSettingMap, UserSetting, UserSettingDefinition, UserSettingManager, UserSettingType } from './UserSetting';
/**
 * A manager for user settings capable of handling aliased settings whose aliases are known ahead of time, but
 * whose true names are not defined until some arbitrary time after the manager has been created. Until the mappings
 * between aliases and true names are defined, all settings have their values fixed to their default values.
 */
export declare class DeferredUserSettingManager<T extends Record<any, UserSettingType>> implements UserSettingManager<T> {
    private readonly bus;
    private readonly deferredSettings;
    private readonly mapEvent;
    protected manager?: UserSettingManager<T>;
    /**
     * Constructor.
     * @param bus The bus used by this manager to publish setting change events.
     * @param settingDefs The setting definitions used to initialize this manager's settings. For those settings with
     * aliased names, these definitions should define the aliases rather than the true names.
     */
    constructor(bus: EventBus, settingDefs: readonly UserSettingDefinition<keyof T, T[keyof T]>[]);
    /**
     * Defines the mappings for this manager's aliased setting names. If a mapping has already been defined, then this
     * method does nothing.
     * @param masterManager The manager hosting the original settings from which this manager's settings are aliased.
     * @param map The mappings for this manager's aliased setting names, as a set of key-value pairs where the keys are
     * the setting name aliases and the values are the true setting names. For any setting whose name does not appear as
     * a key in the mapping, the setting's true name is assumed to be the same as its alias.
     */
    defineAliases<O extends Record<any, UserSettingType>>(masterManager: UserSettingManager<O>, map: UserSettingMap<T, O>): void;
    /** @inheritdoc */
    getSetting<K extends keyof T>(name: K): UserSetting<K, T[K]>;
    /** @inheritdoc */
    whenSettingChanged<K extends keyof T>(name: K): Consumer<T[K]>;
    /** @inheritdoc */
    getAllSettings(): UserSetting<keyof T, T[keyof T]>[];
    /** @inheritdoc */
    mapTo<M extends Record<any, UserSettingType>>(map: UserSettingMap<M, T>): UserSettingManager<M & T>;
}
//# sourceMappingURL=DeferredUserSettingManager.d.ts.map