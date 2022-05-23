import { DisplayComponent, VNode, ComponentProps, Subscribable, SubscribableArray, ReadonlyFloat64Array } from '../..';
/**
 * Component props for the MapComponent.
 */
export interface SynVisProps extends ComponentProps {
    /** The unique ID to assign to this Bing map. */
    bingId: string;
    /**
     * A subscribable which provides the internal resolution for the Bing component.
     */
    resolution: Subscribable<ReadonlyFloat64Array>;
    /**
     * A subscribable array which provides the earth colors. The array should have a length of exactly 61, with index 0
     * defining the water color and indexes 1 through 60 defining terrain colors from 0 to 60000 feet.
     */
    earthColors?: SubscribableArray<number>;
    /**
     * A subscribable which provides the sky color.
     */
    skyColor: Subscribable<number>;
}
/**
 * A FSComponent that display the MSFS Bing Map, weather radar, and 3D terrain.
 */
export declare class SynVisComponent extends DisplayComponent<SynVisProps> {
    protected readonly bingRef: import("../FSComponent").NodeReference<HTMLImageElement>;
    /**
     * A callback which is called when the Bing component is bound.
     */
    protected onBingBound: () => void;
    /**
     * Renders the syn vis component.
     * @returns A component VNode.
     */
    render(): VNode;
}
//# sourceMappingURL=SynVisComponent.d.ts.map