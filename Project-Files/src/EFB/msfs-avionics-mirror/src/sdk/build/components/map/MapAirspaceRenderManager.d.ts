import { GeoProjection } from '../..';
import { LodBoundary } from '../../navigation';
import { PathStream } from '../../graphics/path';
import { ThrottledTaskQueueHandler, ThrottledTaskQueueProcess } from '../../utils/task';
import { MapAirspaceRenderer } from './MapAirspaceRenderer';
/**
 * A manager which facilitates the rendering of multiple airspaces.
 */
export interface MapAirspaceRenderManager {
    /**
     * Gets all airspaces registered to this render manager.
     * @returns All airspaces registered to this render manager.
     */
    getRegisteredAirspaces(): readonly LodBoundary[];
    /**
     * Registers an airspace with this render manager. An airspace may only be registered once.
     * @param airspace The airspace to register.
     * @returns Whether the airspace was successfully registered.
     */
    registerAirspace(airspace: LodBoundary): boolean;
    /**
     * Deregisters an airspace with this render manager.
     * @param airspace The airspace to deregister.
     * @returns Whether the airspace was successfully deregistered.
     */
    deregisterAirspace(airspace: LodBoundary): boolean;
    /**
     * Replace all airspaces currently registered with this render manager with a new list of airspaces.
     * @param airspaces The new list of airspaces.
     * @returns Whether the replace operation changed the set of registered airspaces.
     */
    replaceRegisteredAirspaces(airspaces: LodBoundary[]): boolean;
    /**
     * Deregisters all airspaces currently registered with this render manager.
     * @returns Whether any airspaces were deregistered.
     */
    clearRegisteredAirspaces(): boolean;
    /**
     * Generates a throttled task queue process, which when started will render all the airspaces registered with this
     * manager.
     * @param projection The projection to use when rendering.
     * @param context The canvas rendering context to which to render.
     * @param taskQueueHandler The handler to assign to the task queue process.
     * @param lod The LOD to render. Defaults to 0.
     * @param stream The path stream to which to render. If undefined, the path will be rendered directly to the canvas
     * rendering context.
     * @returns A throttled task queue process.
     */
    prepareRenderProcess(projection: GeoProjection, context: CanvasRenderingContext2D, taskQueueHandler: ThrottledTaskQueueHandler, lod?: number, stream?: PathStream): ThrottledTaskQueueProcess;
}
/**
 * An abstract implementation of MapAirspaceRenderManager.
 */
export declare abstract class AbstractMapAirspaceRenderManager implements MapAirspaceRenderManager {
    private airspaces;
    private readonly airspaceRenderSorter;
    /** @inheritdoc */
    getRegisteredAirspaces(): readonly LodBoundary[];
    /** @inheritdoc */
    registerAirspace(airspace: LodBoundary): boolean;
    /** @inheritdoc */
    deregisterAirspace(airspace: LodBoundary): boolean;
    /** @inheritdoc */
    replaceRegisteredAirspaces(airspaces: Iterable<LodBoundary>): boolean;
    /** @inheritdoc */
    clearRegisteredAirspaces(): boolean;
    /** @inheritdoc */
    prepareRenderProcess(projection: GeoProjection, context: CanvasRenderingContext2D, taskQueueHandler: ThrottledTaskQueueHandler, lod?: number, stream?: PathStream): ThrottledTaskQueueProcess;
    /**
     * Gets the relative rendering order of two airspaces. This method should return -1 if a is to be rendered before b,
     * 1 if a is to be rendered after b, and 0 if the rendering order between a and b does not matter.
     * @param a The first airspace.
     * @param b The second airspace.
     * @returns the relative rendering order of two airspaces.
     */
    protected abstract getRenderOrder(a: LodBoundary, b: LodBoundary): number;
    /**
     * Gets a renderer for an airspace.
     * @param airspace The airspace for which to get the renderer.
     * @returns an airspace renderer.
     */
    protected abstract getAirspaceRenderer(airspace: LodBoundary): MapAirspaceRenderer;
}
//# sourceMappingURL=MapAirspaceRenderManager.d.ts.map