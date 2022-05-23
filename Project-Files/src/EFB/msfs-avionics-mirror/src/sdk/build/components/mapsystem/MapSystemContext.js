import { EventBus } from '../../data';
import { MapCullableTextLabelManager, MapModel, MapProjection } from '../map';
import { MapSystemPlanRenderer } from './MapSystemPlanRenderer';
import { MapSystemIconFactory, MapSystemLabelFactory, MapSystemWaypointsRenderer } from './MapSystemWaypointsRenderer';
/**
 * A data context for building map systems.
 */
export class MapSystemContext {
    /**
     * Creates an instance of a MapSystemContext.
     * @param bus The event bus to use with this instance.
     * @param projection The map projection to use with this instance.
     * @param refreshRate The refresh rate, in Hz, for the map system.
     */
    constructor(bus = new EventBus(), projection, refreshRate = 30) {
        this.bus = bus;
        this.refreshRate = refreshRate;
        /** The map system data modules currently installed in this context. */
        this.moduleFactories = new Map();
        /** The map layers currently added to this map system. */
        this.layerFactories = [];
        /** The built model containing all map data modules after construction. */
        this.model = new MapModel();
        /** The built set of registered layers. */
        this.layers = new Map();
        /** The controllers to construct after the map has rendered. */
        this.controllers = [];
        /** The unique BingMap ID to tie this map to. */
        this.bingId = 'defaultmap';
        /** The size, in pixels, of this map. */
        this.size = new Float64Array([256, 256]);
        /** How long to delay binding the map in ms. Default to 3000. */
        this.delay = 3000;
        /** The text manager to use for waypoint label layers. */
        this.textManager = new MapCullableTextLabelManager(false);
        /** The waypoint renderer to use to render to waypoint label layers. */
        this.waypointRenderer = new MapSystemWaypointsRenderer(this.textManager);
        /** The waypoint icon factory to use to render to waypoint icon layers. */
        this.iconFactory = new MapSystemIconFactory();
        /** The waypoint label factory to use to render to waypoint label layers. */
        this.labelFactory = new MapSystemLabelFactory();
        /** The flight plan renderer to use to render the flight plan. */
        this.planRenderer = new MapSystemPlanRenderer(1);
        if (projection === undefined) {
            this.projection = new MapProjection(this.size[0], this.size[1]);
        }
        else {
            this.projection = projection;
        }
    }
    /**
     * Builds a map data module model.
     * @throws An error if all required modules were not registered.
     */
    buildModel() {
        const requirements = [];
        const modules = [];
        this.moduleFactories.forEach((c, k) => {
            const module = c(this);
            this.model.addModule(k, module);
            modules.push(module);
        });
        modules.forEach(m => requirements.push(...m.requirements()));
        const missingRequirements = [];
        requirements.forEach(r => {
            if (!this.moduleFactories.has(r)) {
                missingRequirements.push(r);
            }
        });
        if (missingRequirements.length > 0) {
            throw new Error(`Requested map modules (${missingRequirements.join(', ')}) were not found.`);
        }
        modules.forEach(m => {
            m.onInstall();
            m.startSync();
        });
    }
}
/**
 * An empty map system context.
 */
MapSystemContext.Empty = new MapSystemContext();
