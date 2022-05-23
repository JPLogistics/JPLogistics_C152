import { AbstractFlightPathLegRenderer } from './AbstractFlightPathLegRenderer';
import { FlightPathVectorPatternRenderer } from './FlightPathVectorPatternRenderer';
/**
 * Renders flight plan leg paths as repeating patterns, with support for different patterns for each flight path vector
 * in the leg.
 */
export class FlightPathLegPatternRenderer extends AbstractFlightPathLegRenderer {
    /**
     * Constructor.
     * @param styleSelector A function which selects a style for each rendered vector.
     */
    constructor(styleSelector) {
        super();
        this.styleSelector = styleSelector;
        this.pathRenderer = new FlightPathVectorPatternRenderer();
        this.style = {
            pattern: null,
            isContinuous: false
        };
        this.isAtLegStart = false;
    }
    /** @inheritdoc */
    render(leg, context, streamStack, partsToRender, ...args) {
        this.isAtLegStart = true;
        super.render(leg, context, streamStack, partsToRender, ...args);
    }
    /** @inheritdoc */
    renderVector(vector, isIngress, isEgress, leg, context, streamStack, ...args) {
        const style = this.styleSelector(vector, isIngress, isEgress, leg, streamStack.getProjection(), this.style, ...args);
        const continuePath = !this.isAtLegStart && style.isContinuous;
        if (style.pattern) {
            this.pathRenderer.render(vector, context, streamStack, style.pattern, continuePath);
            this.isAtLegStart = false;
        }
    }
}
