import { ArrayTaskQueue, ThrottledTaskQueueProcess } from '../..';
/**
 * An abstract implementation of MapAirspaceRenderManager.
 */
export class AbstractMapAirspaceRenderManager {
    constructor() {
        this.airspaces = new Map();
        this.airspaceRenderSorter = this.getRenderOrder.bind(this);
    }
    /** @inheritdoc */
    getRegisteredAirspaces() {
        return Array.from(this.airspaces.values());
    }
    /** @inheritdoc */
    registerAirspace(airspace) {
        if (this.airspaces.has(airspace.facility.id)) {
            return false;
        }
        this.airspaces.set(airspace.facility.id, airspace);
        return true;
    }
    /** @inheritdoc */
    deregisterAirspace(airspace) {
        return this.airspaces.delete(airspace.facility.id);
    }
    /** @inheritdoc */
    replaceRegisteredAirspaces(airspaces) {
        let changed = false;
        let numMatched = 0;
        for (const airspace of airspaces) {
            changed || (changed = !this.airspaces.has(airspace.facility.id));
            if (changed) {
                break;
            }
            else {
                numMatched++;
            }
        }
        changed || (changed = numMatched !== this.airspaces.size);
        if (!changed) {
            return false;
        }
        this.airspaces.clear();
        for (const airspace of airspaces) {
            this.registerAirspace(airspace);
        }
        return true;
    }
    /** @inheritdoc */
    clearRegisteredAirspaces() {
        if (this.airspaces.size === 0) {
            return false;
        }
        this.airspaces.clear();
        return true;
    }
    /** @inheritdoc */
    prepareRenderProcess(projection, context, taskQueueHandler, lod = 0, stream) {
        const sorted = Array.from(this.airspaces.values()).sort(this.airspaceRenderSorter);
        const tasks = sorted.map(airspace => {
            const renderer = this.getAirspaceRenderer(airspace);
            // The explicit cast is to avoid a bogus typescript error
            return renderer.render.bind(renderer, airspace, projection, context, lod, stream);
        });
        return new ThrottledTaskQueueProcess(new ArrayTaskQueue(tasks), taskQueueHandler);
    }
}
