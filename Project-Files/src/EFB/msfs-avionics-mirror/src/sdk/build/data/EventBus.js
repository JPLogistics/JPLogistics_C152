/// <reference types="msfstypes/JS/common" />
import { HandlerSubscription } from '../sub/HandlerSubscription';
import { EventSubscriber } from './EventSubscriber';
/**
 * An event bus that can be used to publish data from backend
 * components and devices to consumers.
 */
export class EventBus {
    /**
     * Creates an instance of an EventBus.
     * @param useCoherentEventSync Whether or not to use coherent event sync (optional, default false)
     */
    constructor(useCoherentEventSync) {
        this._topicSubsMap = new Map();
        this._wildcardSubs = new Array();
        this._notifyDepthMap = new Map();
        this._wildcardNotifyDepth = 0;
        this._eventCache = new Map();
        this.onWildcardSubDestroyedFunc = this.onWildcardSubDestroyed.bind(this);
        this._busId = Math.floor(Math.random() * 2147483647);
        const syncFunc = useCoherentEventSync ? EventBusCoherentSync : EventBusFlowEventSync;
        this._busSync = new syncFunc(this.pub.bind(this), this._busId);
        this.syncEvent('event_bus', 'resync_request', false);
        this.on('event_bus', (data) => {
            if (data == 'resync_request') {
                this.resyncEvents();
            }
        });
    }
    /**
     * Subscribes to a topic on the bus.
     * @param topic The topic to subscribe to.
     * @param handler The handler to be called when an event happens.
     * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
     * @returns The new subscription.
     */
    on(topic, handler, paused = false) {
        let subs = this._topicSubsMap.get(topic);
        if (subs === undefined) {
            this._topicSubsMap.set(topic, subs = []);
            this.pub('event_bus_topic_first_sub', topic, false);
        }
        const initialNotifyFunc = (sub) => {
            const lastState = this._eventCache.get(topic);
            if (lastState !== undefined) {
                sub.handler(lastState.data);
            }
        };
        const onDestroyFunc = (sub) => {
            var _a;
            // If we are not in the middle of a notify operation, remove the subscription.
            // Otherwise, do nothing and let the post-notify clean-up code handle it.
            if (((_a = this._notifyDepthMap.get(topic)) !== null && _a !== void 0 ? _a : 0) === 0) {
                const subsToSplice = this._topicSubsMap.get(topic);
                if (subsToSplice) {
                    subsToSplice.splice(subsToSplice.indexOf(sub), 1);
                }
            }
        };
        const sub = new HandlerSubscription(handler, initialNotifyFunc, onDestroyFunc);
        subs.push(sub);
        if (paused) {
            sub.pause();
        }
        else {
            sub.initialNotify();
        }
        return sub;
    }
    /**
     * Unsubscribes a handler from the topic's events.
     * @param topic The topic to unsubscribe from.
     * @param handler The handler to unsubscribe from topic.
     * @deprecated This method has been deprecated in favor of using the {@link Subscription} object returned by `.on()`
     * to manage subscriptions.
     */
    off(topic, handler) {
        const handlers = this._topicSubsMap.get(topic);
        const toDestroy = handlers === null || handlers === void 0 ? void 0 : handlers.find(sub => sub.handler === handler);
        toDestroy === null || toDestroy === void 0 ? void 0 : toDestroy.destroy();
    }
    /**
     * Subscribes to all topics.
     * @param handler The handler to subscribe to all events.
     * @returns The new subscription.
     */
    onAll(handler) {
        const sub = new HandlerSubscription(handler, undefined, this.onWildcardSubDestroyedFunc);
        this._wildcardSubs.push(sub);
        return sub;
    }
    /**
     * Unsubscribe the handler from all topics.
     * @param handler The handler to unsubscribe from all events.
     * @deprecated This method has been deprecated in favor of using the {@link Subscription} object returned by
     * `.onAll()` to manage subscriptions.
     */
    offAll(handler) {
        const toDestroy = this._wildcardSubs.find(sub => sub.handler === handler);
        toDestroy === null || toDestroy === void 0 ? void 0 : toDestroy.destroy();
    }
    /**
     * Publishes an event to the topic on the bus.
     * @param topic The topic to publish to.
     * @param data The data portion of the event.
     * @param sync Whether or not this message needs to be synced on local stoage.
     * @param isCached Whether or not this message will be resync'd across the bus on load.
     */
    pub(topic, data, sync = false, isCached = true) {
        var _a;
        if (isCached) {
            this._eventCache.set(topic, { data: data, synced: sync });
        }
        const subs = this._topicSubsMap.get(topic);
        if (subs !== undefined) {
            let needCleanUpSubs = false;
            const notifyDepth = (_a = this._notifyDepthMap.get(topic)) !== null && _a !== void 0 ? _a : 0;
            this._notifyDepthMap.set(topic, notifyDepth + 1);
            const len = subs.length;
            for (let i = 0; i < len; i++) {
                try {
                    const sub = subs[i];
                    if (sub.isAlive && !sub.isPaused) {
                        sub.handler(data);
                    }
                    needCleanUpSubs || (needCleanUpSubs = !sub.isAlive);
                }
                catch (error) {
                    console.error(`EventBus: error in handler: ${error}`);
                    if (error instanceof Error) {
                        console.error(error.stack);
                    }
                }
            }
            this._notifyDepthMap.set(topic, notifyDepth);
            if (needCleanUpSubs && notifyDepth === 0) {
                const filteredSubs = subs.filter(sub => sub.isAlive);
                this._topicSubsMap.set(topic, filteredSubs);
            }
        }
        // We don't know if anything is subscribed on busses in other instruments,
        // so we'll unconditionally sync if sync is true and trust that the
        // publisher knows what it's doing.
        if (sync) {
            this.syncEvent(topic, data, isCached);
        }
        // always push to wildcard handlers
        let needCleanUpSubs = false;
        this._wildcardNotifyDepth++;
        const wcLen = this._wildcardSubs.length;
        for (let i = 0; i < wcLen; i++) {
            const sub = this._wildcardSubs[i];
            if (sub.isAlive && !sub.isPaused) {
                sub.handler(topic, data);
            }
            needCleanUpSubs || (needCleanUpSubs = !sub.isAlive);
        }
        this._wildcardNotifyDepth--;
        if (needCleanUpSubs && this._wildcardNotifyDepth === 0) {
            this._wildcardSubs = this._wildcardSubs.filter(sub => sub.isAlive);
        }
    }
    /**
     * Responds to when a wildcard subscription is destroyed.
     * @param sub The destroyed subscription.
     */
    onWildcardSubDestroyed(sub) {
        // If we are not in the middle of a notify operation, remove the subscription.
        // Otherwise, do nothing and let the post-notify clean-up code handle it.
        if (this._wildcardNotifyDepth === 0) {
            this._wildcardSubs.splice(this._wildcardSubs.indexOf(sub), 1);
        }
    }
    /**
     * Re-sync all synced events
     */
    resyncEvents() {
        for (const [topic, event] of this._eventCache) {
            if (event.synced) {
                this.syncEvent(topic, event.data, true);
            }
        }
    }
    /**
     * Publish an event to the sync bus.
     * @param topic The topic to publish to.
     * @param data The data to publish.
     * @param isCached Whether or not this message will be resync'd across the bus on load.
     */
    syncEvent(topic, data, isCached) {
        this._busSync.sendEvent(topic, data, isCached);
    }
    /**
     * Gets a typed publisher from the event bus..
     * @returns The typed publisher.
     */
    getPublisher() {
        return this;
    }
    /**
     * Gets a typed subscriber from the event bus.
     * @returns The typed subscriber.
     */
    getSubscriber() {
        return new EventSubscriber(this);
    }
    /**
     * Get the number of subscribes for a given topic.
     * @param topic The name of the topic.
     * @returns The number of subscribers.
     **/
    getTopicSubsciberCount(topic) {
        var _a, _b;
        return (_b = (_a = this._topicSubsMap.get(topic)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
    }
}
/**
 * An abstract class for bus sync implementations.
 */
class EventBusSyncBase {
    /**
     * Creates an instance of EventBusFlowEventSync.
     * @param recvEventCb A callback to execute when an event is received on the bus.
     * @param busId The ID of the bus.
     */
    constructor(recvEventCb, busId) {
        this.lastEventSynced = -1;
        this.dataPackageQueue = [];
        this.recvEventCb = recvEventCb;
        this.busId = busId;
        this.hookReceiveEvent();
        /** Sends the queued up data packages */
        const sendFn = () => {
            if (this.dataPackageQueue.length > 0) {
                // console.log(`Sending ${this.dataPackageQueue.length} packages`);
                const syncDataPackage = {
                    busId: this.busId,
                    packagedId: Math.floor(Math.random() * 1000000000),
                    data: this.dataPackageQueue
                };
                this.executeSync(syncDataPackage);
                this.dataPackageQueue.length = 0;
            }
            requestAnimationFrame(sendFn);
        };
        requestAnimationFrame(sendFn);
    }
    /**
     * Processes events received and sends them onto the local bus.
     * @param syncData The data package to process.
     */
    processEventsReceived(syncData) {
        if (this.busId !== syncData.busId) {
            // HINT: coherent events are still received twice, so check for this
            if (this.lastEventSynced !== syncData.packagedId) {
                this.lastEventSynced = syncData.packagedId;
                syncData.data.forEach((data) => {
                    try {
                        this.recvEventCb(data.topic, data.data !== undefined ? JSON.parse(data.data) : undefined, false, data.isCached);
                    }
                    catch (e) {
                        console.error(e);
                        if (e instanceof Error) {
                            console.error(e.stack);
                        }
                    }
                });
            }
            else {
                //console.warn('Same event package received twice: ' + syncData.packagedId);
            }
        }
    }
    /**
     * Sends an event via flow events.
     * @param topic The topic to send data on.
     * @param data The data to send.
     * @param isCached Whether or not this event is cached.
     */
    sendEvent(topic, data, isCached) {
        // stringify data
        const dataObj = JSON.stringify(data);
        // build a data package
        const dataPackage = {
            topic: topic,
            data: dataObj,
            isCached: isCached
        };
        // queue data package
        this.dataPackageQueue.push(dataPackage);
    }
}
/**
 * A class that manages event bus synchronization via Flow Event Triggers.
 */
class EventBusCoherentSync extends EventBusSyncBase {
    /** @inheritdoc */
    executeSync(syncDataPackage) {
        // HINT: Stringifying the data again to circumvent the bad perf on Coherent interop
        this.listener.triggerToAllSubscribers(EventBusCoherentSync.EB_KEY, JSON.stringify(syncDataPackage));
    }
    /** @inheritdoc */
    hookReceiveEvent() {
        this.listener = RegisterViewListener(EventBusCoherentSync.EB_LISTENER_KEY, undefined, true);
        this.listener.on(EventBusCoherentSync.EB_KEY, (e) => {
            try {
                const evt = JSON.parse(e);
                this.processEventsReceived(evt);
            }
            catch (error) {
                console.error(error);
            }
        });
    }
}
EventBusCoherentSync.EB_KEY = 'eb.evt';
EventBusCoherentSync.EB_LISTENER_KEY = 'JS_LISTENER_SIMVARS';
/**
 * A class that manages event bus synchronization via Flow Event Triggers.
 */
class EventBusFlowEventSync extends EventBusSyncBase {
    /** @inheritdoc */
    executeSync(syncDataPackage) {
        // console.log('Sending sync package: ' + syncDataPackage.packagedId);
        LaunchFlowEvent('ON_MOUSERECT_HTMLEVENT', EventBusFlowEventSync.EB_LISTENER_KEY, this.busId.toString(), JSON.stringify(syncDataPackage));
    }
    /** @inheritdoc */
    hookReceiveEvent() {
        Coherent.on('OnInteractionEvent', (target, args) => {
            // identify if its a busevent
            if (args.length === 0 || args[0] !== EventBusFlowEventSync.EB_LISTENER_KEY || !args[2]) {
                return;
            }
            this.processEventsReceived(JSON.parse(args[2]));
        });
    }
}
EventBusFlowEventSync.EB_LISTENER_KEY = 'EB_EVENTS';
