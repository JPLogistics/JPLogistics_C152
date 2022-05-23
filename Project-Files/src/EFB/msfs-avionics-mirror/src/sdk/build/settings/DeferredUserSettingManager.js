import { Consumer } from '../data';
import { AbstractSubscribable } from '../sub/AbstractSubscribable';
import { SubEvent } from '../sub/SubEvent';
import { MappedUserSettingManager } from './UserSetting';
/**
 * A manager for user settings capable of handling aliased settings whose aliases are known ahead of time, but
 * whose true names are not defined until some arbitrary time after the manager has been created. Until the mappings
 * between aliases and true names are defined, all settings have their values fixed to their default values.
 */
export class DeferredUserSettingManager {
    /**
     * Constructor.
     * @param bus The bus used by this manager to publish setting change events.
     * @param settingDefs The setting definitions used to initialize this manager's settings. For those settings with
     * aliased names, these definitions should define the aliases rather than the true names.
     */
    constructor(bus, settingDefs) {
        this.bus = bus;
        this.mapEvent = new SubEvent();
        this.deferredSettings = new Map(settingDefs.map(def => [def.name, new DeferredUserSetting(def)]));
    }
    /**
     * Defines the mappings for this manager's aliased setting names. If a mapping has already been defined, then this
     * method does nothing.
     * @param masterManager The manager hosting the original settings from which this manager's settings are aliased.
     * @param map The mappings for this manager's aliased setting names, as a set of key-value pairs where the keys are
     * the setting name aliases and the values are the true setting names. For any setting whose name does not appear as
     * a key in the mapping, the setting's true name is assumed to be the same as its alias.
     */
    defineAliases(masterManager, map) {
        if (this.manager) {
            return;
        }
        this.manager = masterManager.mapTo(map);
        for (const deferredSetting of this.deferredSettings.values()) {
            deferredSetting.init(this.manager.getSetting(deferredSetting.definition.name));
        }
        this.mapEvent.notify(this, map);
    }
    /** @inheritdoc */
    getSetting(name) {
        const setting = this.deferredSettings.get(name);
        if (!setting) {
            throw new Error(`Could not find setting with name ${name}`);
        }
        return setting;
    }
    /** @inheritdoc */
    whenSettingChanged(name) {
        var _a;
        const setting = this.deferredSettings.get(name);
        if (!setting) {
            throw new Error(`Could not find setting with name ${name}`);
        }
        return new DeferredUserSettingConsumer(this.bus, name.toString(), (_a = this.manager) === null || _a === void 0 ? void 0 : _a.getSetting(name).definition.name.toString(), setting.definition.defaultValue, this.mapEvent).whenChanged();
    }
    /** @inheritdoc */
    getAllSettings() {
        return Array.from(this.deferredSettings.values());
    }
    /** @inheritdoc */
    mapTo(map) {
        return new MappedUserSettingManager(this, map);
    }
}
/**
 * A user setting with a value that is deferred until the setting is initialized to be backed by another user setting.
 * Before intialization, the deferred setting's value is always equal to its default value.
 */
class DeferredUserSetting extends AbstractSubscribable {
    /**
     * Constructor.
     * @param aliasedDefinition This setting's aliased definition.
     */
    constructor(aliasedDefinition) {
        super();
        this.aliasedDefinition = aliasedDefinition;
        this.isMutableSubscribable = true;
    }
    /** @inheritdoc */
    get definition() {
        var _a, _b;
        return (_b = (_a = this.setting) === null || _a === void 0 ? void 0 : _a.definition) !== null && _b !== void 0 ? _b : this.aliasedDefinition;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** This setting's current value. */
    get value() {
        var _a, _b;
        return (_b = (_a = this.setting) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : this.definition.defaultValue;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    set value(v) {
        this.setting && (this.setting.value = v);
    }
    /**
     * Initializes this deferred setting to be backed by another user setting. Once initialized, any changes to this
     * setting's value will be reflected in the backing setting, and vice versa.
     * @param setting The user setting backing this deferred setting.
     */
    init(setting) {
        this.setting = setting;
        setting.sub(() => { this.notify(); });
        if (this.definition.defaultValue !== setting.value) {
            this.notify();
        }
    }
    /** @inheritdoc */
    get() {
        return this.value;
    }
    /**
     * Sets the value of this setting.
     * @param value The new value.
     */
    set(value) {
        this.value = value;
    }
}
/**
 * A consumer of value-change events of user settings with deferred aliased names.
 */
class DeferredUserSettingConsumer extends Consumer {
    /**
     * Constructor.
     * @param bus The event bus.
     * @param aliasTopic The topic associated with this consumer's setting's alias name.
     * @param trueTopic The topic associated with this consumer's setting's true name, or undefined if the true name is
     * unknown.
     * @param defaultValue This consumer's setting's default value.
     * @param mapEvent A subscribable event that notifies when a mapping has been defined between this consumer's
     * setting's alias name and its true name.
     * @param deferredState The state for the consumer to track.
     * @param deferredCurrentHandler The current build filter handler stack, if any.
     */
    constructor(bus, aliasTopic, trueTopic, defaultValue, mapEvent, deferredState = {}, deferredCurrentHandler) {
        super(bus, aliasTopic, deferredState, deferredCurrentHandler);
        this.trueTopic = trueTopic;
        this.defaultValue = defaultValue;
        this.mapEvent = mapEvent;
        this.deferredState = deferredState;
        this.deferredCurrentHandler = deferredCurrentHandler;
        this.deferredActiveSubs = new Map();
        if (trueTopic === undefined) {
            this.mapEventSub = mapEvent.on(this.onMap.bind(this));
        }
    }
    /** @inheritdoc */
    handle(handler, paused = false) {
        let activeHandler;
        if (this.deferredCurrentHandler !== undefined) {
            /**
             * The handler reference to store.
             * @param data The input data to the handler.
             */
            activeHandler = (data) => {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                this.deferredCurrentHandler(data, this.deferredState, handler);
            };
        }
        else {
            activeHandler = handler;
        }
        let activeSubArray = this.deferredActiveSubs.get(handler);
        if (!activeSubArray) {
            activeSubArray = [];
            this.deferredActiveSubs.set(handler, activeSubArray);
        }
        const onDestroyed = (destroyed) => {
            // If we are not in the middle of a mapping operation, remove the subscription.
            // Otherwise, do nothing and let the post-mapping clean-up code handle it.
            if (this.currentMappingHandler === handler) {
                return;
            }
            const activeSubsArray = this.deferredActiveSubs.get(handler);
            if (activeSubsArray) {
                activeSubsArray.splice(activeSubsArray.indexOf(destroyed), 1);
                if (activeSubsArray.length === 0) {
                    this.deferredActiveSubs.delete(handler);
                }
            }
        };
        const sub = new DeferredSubscription(this.defaultValue, activeHandler, onDestroyed);
        if (paused) {
            sub.pause();
        }
        if (this.trueTopic !== undefined) {
            // init() will take care of the initial notify for us, including not notifying if the subscription is paused.
            sub.init(this.bus, this.trueTopic);
        }
        else if (!paused) {
            sub.initialNotify();
        }
        // Need to handle the case where the subscription is destroyed immediately
        if (sub.isAlive) {
            activeSubArray.push(sub);
        }
        else if (activeSubArray.length === 0) {
            this.deferredActiveSubs.delete(handler);
        }
        return sub;
    }
    /** @inheritdoc */
    off(handler) {
        var _a, _b;
        const activeSubsArray = this.deferredActiveSubs.get(handler);
        if (activeSubsArray) {
            // If we are not in the middle of a mapping operation, remove the subscription.
            // Otherwise, do nothing and let the post-mapping clean-up code handle it.
            if (this.currentMappingHandler === handler) {
                (_a = activeSubsArray[0]) === null || _a === void 0 ? void 0 : _a.destroy();
            }
            else {
                (_b = activeSubsArray.shift()) === null || _b === void 0 ? void 0 : _b.destroy();
                if (activeSubsArray.length === 0) {
                    this.deferredActiveSubs.delete(handler);
                }
            }
        }
    }
    /** @inheritdoc */
    atFrequency(frequency, immediateFirstPublish = true) {
        const initialState = {
            previousTime: Date.now(),
            firstRun: immediateFirstPublish
        };
        return new DeferredUserSettingConsumer(this.bus, this.topic, this.trueTopic, this.defaultValue, this.mapEvent, initialState, this.getAtFrequencyHandler(frequency));
    }
    /** @inheritdoc */
    withPrecision(precision) {
        return new DeferredUserSettingConsumer(this.bus, this.topic, this.trueTopic, this.defaultValue, this.mapEvent, { lastValue: 0 }, this.getWithPrecisionHandler(precision));
    }
    /** @inheritdoc */
    whenChangedBy(amount) {
        return new DeferredUserSettingConsumer(this.bus, this.topic, this.trueTopic, this.defaultValue, this.mapEvent, { lastValue: 0 }, this.getWhenChangedByHandler(amount));
    }
    /** @inheritdoc */
    whenChanged() {
        return new DeferredUserSettingConsumer(this.bus, this.topic, this.trueTopic, this.defaultValue, this.mapEvent, { lastValue: '' }, this.getWhenChangedHandler());
    }
    /** @inheritdoc */
    onlyAfter(deltaTime) {
        return new DeferredUserSettingConsumer(this.bus, this.topic, this.trueTopic, this.defaultValue, this.mapEvent, { previousTime: Date.now() }, this.getOnlyAfterHandler(deltaTime));
    }
    /**
     * Responds to when a mapping has been defined between this consumer's setting's alias name and its true name.
     * @param sender The sender of the mapping event.
     * @param map A set of mappings that includes the mapping between this consumer's setting's alias name and its true
     * name.
     */
    onMap(sender, map) {
        var _a, _b, _c;
        this.trueTopic = (_a = map[this.topic]) !== null && _a !== void 0 ? _a : this.topic;
        const needCleanUpHandlers = [];
        // Initialize all deferred subscriptions that are still alive.
        for (const [handler, activeSubArray] of this.deferredActiveSubs.entries()) {
            let needCleanUpSubs = false;
            this.currentMappingHandler = handler;
            for (const activeSub of activeSubArray) {
                if (activeSub.isAlive) {
                    if (activeSub instanceof DeferredSubscription) {
                        activeSub.init(this.bus, this.trueTopic);
                    }
                }
                needCleanUpSubs || (needCleanUpSubs = !activeSub.isAlive);
            }
            this.currentMappingHandler = undefined;
            if (needCleanUpSubs) {
                needCleanUpHandlers.push(handler);
            }
        }
        // Remove all dead subscriptions.
        for (let i = 0; i < needCleanUpHandlers.length; i++) {
            const handler = needCleanUpHandlers[i];
            const filtered = (_b = this.deferredActiveSubs.get(handler)) === null || _b === void 0 ? void 0 : _b.filter(sub => sub.isAlive);
            if ((filtered === null || filtered === void 0 ? void 0 : filtered.length) === 0) {
                this.deferredActiveSubs.delete(handler);
            }
            else if (filtered) {
                this.deferredActiveSubs.set(handler, filtered);
            }
        }
        (_c = this.mapEventSub) === null || _c === void 0 ? void 0 : _c.destroy();
    }
}
/**
 * A {@link Subscription} for a {@link DeferredUserSettingConsumer}.
 */
class DeferredSubscription {
    /**
     * Constructor.
     * @param defaultValue This default value of this subscription's source.
     * @param handler This subscription's handler. The handler will be called each time this subscription receives a
     * notification from its source.
     * @param onDestroy A function which is called when this subscription is destroyed.
     */
    constructor(defaultValue, handler, onDestroy) {
        this.defaultValue = defaultValue;
        this.handler = handler;
        this.onDestroy = onDestroy;
        this._isAlive = true;
        this._isPaused = false;
        /** @inheritdoc */
        this.canInitialNotify = true;
    }
    /** @inheritdoc */
    get isAlive() {
        return this._isAlive;
    }
    /** @inheritdoc */
    get isPaused() {
        return this._isPaused;
    }
    /**
     * Initializes this deferred subscription with an event bus topic. Once initialized, this subscription will receive
     * notifications from events for the given topic.
     * @param bus The event bus.
     * @param topic The topic to which to subscribe.
     * @throws Error if this subscription is not alive.
     */
    init(bus, topic) {
        if (!this._isAlive) {
            throw new Error('DeferredSubscription: cannot initialize a dead Subscription.');
        }
        this.sub = bus.on(topic, (data) => {
            if (!this._isPaused) {
                this.handler(data);
            }
        });
        // Need to handle the case where this subscription is destroyed immediately
        if (!this._isAlive) {
            this.sub.destroy();
        }
    }
    /**
     * Sends an initial notification to this subscription.
     * @throws Error if this subscription is not alive.
     */
    initialNotify() {
        if (!this._isAlive) {
            throw new Error('DeferredSubscription: cannot notify a dead Subscription.');
        }
        this.handler(this.defaultValue);
    }
    /** @inheritdoc */
    pause() {
        var _a;
        if (!this._isAlive) {
            throw new Error('Subscription: cannot pause a dead Subscription.');
        }
        (_a = this.sub) === null || _a === void 0 ? void 0 : _a.pause();
        this._isPaused = true;
    }
    /** @inheritdoc */
    resume(initialNotify = false) {
        if (!this._isAlive) {
            throw new Error('Subscription: cannot resume a dead Subscription.');
        }
        if (!this._isPaused) {
            return;
        }
        this._isPaused = false;
        if (this.sub) {
            this.sub.resume(initialNotify);
        }
        else if (initialNotify) {
            this.initialNotify();
        }
    }
    /** @inheritdoc */
    destroy() {
        var _a;
        (_a = this.sub) === null || _a === void 0 ? void 0 : _a.destroy();
        this._isAlive = false;
        this.onDestroy(this);
    }
}
