import { Consumer } from '../data/Consumer';
import { EventBus, Publisher } from '../data/EventBus';
import { EventSubscriber } from '../data/EventSubscriber';
import { AbstractSubscribable } from '../sub/AbstractSubscribable';
import { MutableSubscribable } from '../sub/Subscribable';
/** The supported data types for a user setting. */
export declare type UserSettingType = boolean | number | string;
/**
 * A definition for a user setting.
 */
export interface UserSettingDefinition<K, T extends UserSettingType> {
    /** The name of this setting. */
    readonly name: K;
    /** The default value of this setting. */
    readonly defaultValue: T;
}
/**
 * A user setting.
 */
export interface UserSetting<K, T extends UserSettingType> extends MutableSubscribable<T> {
    /** This setting's definition. */
    readonly definition: UserSettingDefinition<K, T>;
    /** This setting's current value. */
    value: T;
}
/**
 * Filters a record of user settings to just those settings whose values extend a certain type.
 */
export declare type UserSettingValueFilter<T extends Record<any, UserSettingType>, V> = {
    [Property in keyof T as (T[Property] extends V ? Property : never)]: T[Property];
};
/**
 * An entry for a user setting in UserSettingManager.
 */
export declare type UserSettingManagerEntry<K, T extends UserSettingType> = {
    /** A user setting. */
    setting: SyncableUserSetting<K, T>;
    /** The event topic used to sync the setting. */
    syncTopic: string;
    /** The timestamp of the most recent sync event. */
    syncTime: number;
};
/**
 * Data provided for a setting sync event.
 */
export declare type UserSettingManagerSyncData<T extends UserSettingType> = {
    /** The synced value of the setting. */
    value: T;
    /** The timestamp of this sync event. */
    syncTime: number;
};
/**
 * An entry that maps one set of setting definitions to another.
 */
export declare type UserSettingMap<Aliased, Original> = {
    [Property in keyof Aliased]?: keyof Original;
};
/**
 * A manager for user settings. Provides settings using their names as keys, publishes value change events on the
 * event bus, and keeps setting values up to date when receiving change events across the bus.
 */
export interface UserSettingManager<T extends Record<any, UserSettingType>> {
    /**
     * Gets a setting from this manager.
     * @param name The name of the setting to get.
     * @returns a setting.
     * @throws Error if no setting with the specified name exists.
     */
    getSetting<K extends keyof T>(name: K): UserSetting<K, T[K]>;
    /**
     * Gets a consumer which notifies handlers when the value of a setting changes.
     * @param name The name of a setting.
     * @returns a consumer which notifies handlers when the value of the setting changes.
     * @throws Error if no setting with the specified name exists.
     */
    whenSettingChanged<K extends keyof T>(name: K): Consumer<T[K]>;
    /**
     * Gets an array of all settings of this manager.
     * @returns an array of all settings of this manager.
     */
    getAllSettings(): UserSetting<keyof T, T[keyof T]>[];
    /**
     * Maps a subset of this manager's settings to ones with aliased names, and creates a new setting manager which
     * supports accessing the settings using their aliases.
     * @param map A map defining the aliases of a subset of this manager's settings, with aliased setting names as keys
     * and original setting names as values.
     * @returns A new setting manager which supports accessing a subset of this manager's settings using aliased names.
     */
    mapTo<M extends Record<any, UserSettingType>>(map: UserSettingMap<M, T>): UserSettingManager<M & T>;
}
/**
 * A manager for user settings. Provides settings using their names as keys, publishes value change events on the
 * event bus, and keeps setting values up to date when receiving change events across the bus.
 */
export declare class DefaultUserSettingManager<T extends Record<any, UserSettingType>> implements UserSettingManager<T> {
    protected readonly bus: EventBus;
    private static readonly SYNC_TOPIC_PREFIX;
    protected readonly settings: Map<keyof T, UserSettingManagerEntry<keyof T, T[keyof T]>>;
    protected readonly publisher: Publisher<any>;
    protected readonly subscriber: EventSubscriber<any>;
    /**
     * Constructor.
     * @param bus The bus used by this manager to publish setting change events.
     * @param settingDefs The setting definitions used to initialize this manager's settings.
     */
    constructor(bus: EventBus, settingDefs: readonly UserSettingDefinition<keyof T, T[keyof T]>[]);
    /**
     * Gets a setting from this manager.
     * @param name The name of the setting to get.
     * @returns a setting.
     * @throws Error if no setting with the specified name exists.
     */
    getSetting<K extends keyof T>(name: K): UserSetting<K, T[K]>;
    /**
     * Gets an array of all settings of this manager.
     * @returns an array of all settings of this manager.
     */
    getAllSettings(): UserSetting<keyof T, T[keyof T]>[];
    /**
     * Gets a consumer which notifies handlers when the value of a setting changes.
     * @param name The name of a setting.
     * @returns a consumer which notifies handlers when the value of the setting changes.
     * @throws Error if no setting with the specified name exists.
     */
    whenSettingChanged<K extends keyof T>(name: K): Consumer<T[K]>;
    /** @inheritdoc */
    mapTo<M extends Record<any, UserSettingType>>(map: UserSettingMap<M, T>): MappedUserSettingManager<M, T>;
    /**
     * A callback which is called when one of this manager's settings has its value changed locally.
     * @param entry The entry for the setting that was changed.
     * @param value The new value of the setting.
     */
    protected onSettingValueChanged<K extends keyof T>(entry: UserSettingManagerEntry<K, T[K]>, value: T[K]): void;
    /**
     * A callback which is called when a setting changed event is received over the event bus.
     * @param entry The entry for the setting that was changed.
     * @param data The sync data.
     */
    protected onSettingValueSynced<K extends keyof T>(entry: UserSettingManagerEntry<K, T[K]>, data: UserSettingManagerSyncData<T[K]>): void;
}
/**
 * A manager for user settings. Provides settings using their names as keys, publishes value change events on the
 * event bus, and keeps setting values up to date when receiving change events across the bus, using a mapping from
 * abstracted settings keys to true underlying settings keys.
 */
export declare class MappedUserSettingManager<T extends Record<any, UserSettingType>, O extends Record<any, UserSettingType>> implements UserSettingManager<T & O> {
    private readonly parent;
    private readonly map;
    /**
     * Creates an instance of a MappedUserSettingManager.
     * @param parent The parent setting manager.
     * @param map The map of abstracted keys to true underlying keys.
     */
    constructor(parent: UserSettingManager<O>, map: UserSettingMap<T, O>);
    /** @inheritdoc */
    getSetting<K extends keyof (T & O)>(name: K): UserSetting<K, (T & O)[K]>;
    /** @inheritdoc */
    whenSettingChanged<K extends keyof (T & O)>(name: K): Consumer<(T & O)[K]>;
    /** @inheritdoc */
    getAllSettings(): UserSetting<keyof (T & O), (T & O)[keyof (T & O)]>[];
    /** @inheritdoc */
    mapTo<M extends Record<any, UserSettingType>>(map: UserSettingMap<M, T & O>): MappedUserSettingManager<M, T & O>;
}
/**
 * An implementation of a user setting which can be synced across multiple instances.
 */
declare class SyncableUserSetting<K, T extends boolean | number | string> extends AbstractSubscribable<T> implements UserSetting<K, T> {
    readonly definition: UserSettingDefinition<K, T>;
    private readonly valueChangedCallback;
    readonly isMutableSubscribable = true;
    private _value;
    /** This setting's current value. */
    get value(): T;
    set value(v: T);
    /**
     * Constructor.
     * @param definition This setting's definition.
     * @param valueChangedCallback A function to be called whenever the value of this setting changes.
     */
    constructor(definition: UserSettingDefinition<K, T>, valueChangedCallback: (value: T) => void);
    /**
     * Syncs this setting to a value. This will not trigger a call to valueChangedCallback.
     * @param value The value to which to sync.
     */
    syncValue(value: T): void;
    /** @inheritdoc */
    get(): T;
    /**
     * Sets the value of this setting.
     * @param value The new value.
     */
    set(value: T): void;
}
export {};
//# sourceMappingURL=UserSetting.d.ts.map