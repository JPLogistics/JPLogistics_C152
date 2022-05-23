/// <reference types="msfstypes/JS/common" />
/// <reference types="msfstypes/JS/Types" />
/// <reference types="msfstypes/JS/NetBingMap" />
import { FSComponent, DisplayComponent } from '../..';
import { BingComponent } from '../bing/BingComponent';
/**
 * A FSComponent that display the MSFS Bing Map, weather radar, and 3D terrain.
 */
export class SynVisComponent extends DisplayComponent {
    constructor() {
        super(...arguments);
        this.bingRef = FSComponent.createRef();
        /**
         * A callback which is called when the Bing component is bound.
         */
        this.onBingBound = () => {
            // noop
        };
    }
    /**
     * Renders the syn vis component.
     * @returns A component VNode.
     */
    render() {
        return (FSComponent.buildComponent(BingComponent, { ref: this.bingRef, id: this.props.bingId, mode: EBingMode.HORIZON, onBoundCallback: this.onBingBound, resolution: this.props.resolution, earthColors: this.props.earthColors, skyColor: this.props.skyColor }));
    }
}
