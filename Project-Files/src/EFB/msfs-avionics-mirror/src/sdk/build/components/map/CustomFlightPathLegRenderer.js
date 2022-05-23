import { AbstractFlightPathLegRenderer } from './AbstractFlightPathLegRenderer';
/**
 * Renders flight plan leg paths one vector at a time, optionally excluding the ingress and/or egress transition
 * vectors. The rendering behavior for each vector is controlled by a function passed to the class constructor.
 */
export class CustomFlightPathLegRenderer extends AbstractFlightPathLegRenderer {
    /**
     * Constructor.
     * @param renderVector A function which renders individual flight path vectors.
     */
    constructor(renderVector) {
        super();
        this.renderVector = renderVector;
    }
}
