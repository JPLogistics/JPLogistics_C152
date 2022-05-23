import { GeoPointInterface } from '../../geo/GeoPoint';
import { Subscribable } from '../../sub/Subscribable';
import { ComponentProps, DisplayComponent, VNode } from '../FSComponent';
import { SubscribableSet } from '../../sub/SubscribableSet';
/**
 * Component props for WaypointComponent.
 */
export interface LatLonDisplayProps extends ComponentProps {
    /** A subscribable which provides a location to bind. */
    location: Subscribable<GeoPointInterface>;
    /** CSS class(es) to add to the root of the icon component. */
    class?: string | SubscribableSet<string>;
}
/**
 * A component which displays lat/lon coordinates.
 */
export declare class LatLonDisplay extends DisplayComponent<LatLonDisplayProps> {
    private locationSub?;
    private readonly latPrefix;
    private readonly latNum;
    private readonly lonPrefix;
    private readonly lonNum;
    private readonly formatter;
    /** @inheritdoc */
    onAfterRender(): void;
    /**
     * A callback which is called when this component's bound location changes.
     * @param location The new location.
     */
    private onLocationChanged;
    /**
     * Displays the formatted lat/lon coordinates of a location.
     * @param location A location.
     */
    private setDisplay;
    /**
     * Sets coordinate subjects for a given set of coordinate values.
     * @param prefixSub The coordinate prefix subject.
     * @param numSub The coordinate number subject.
     * @param coordValues The DMS values of the coordinate.
     * @param padDeg The number of digits to which to pad the degrees value.
     */
    private setCoordSub;
    /**
     * Displays the blank default value.
     */
    private clearDisplay;
    /** @inheritdoc */
    render(): VNode;
    /** @inheritdoc */
    destroy(): void;
}
//# sourceMappingURL=LatLonDisplay.d.ts.map