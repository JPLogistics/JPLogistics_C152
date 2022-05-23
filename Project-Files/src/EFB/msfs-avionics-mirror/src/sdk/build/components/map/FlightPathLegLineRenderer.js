import { FlightPathUtils } from '../../flightplan';
import { GeoCircle } from '../../geo';
import { AbstractFlightPathLegRenderer } from './AbstractFlightPathLegRenderer';
import { GeoCirclePathRenderer } from './GeoCirclePathRenderer';
/**
 * Renders flight plan leg paths as lines, with support for different styles for each flight path vector in the leg.
 */
export class FlightPathLegLineRenderer extends AbstractFlightPathLegRenderer {
    /**
     * Constructor.
     * @param styleSelector A function which selects a style for each rendered vector.
     */
    constructor(styleSelector) {
        super();
        this.styleSelector = styleSelector;
        this.pathRenderer = new GeoCirclePathRenderer();
        this.styleBuffer = [
            {
                strokeWidth: 1,
                strokeStyle: 'white',
                strokeDash: null,
                outlineWidth: 0,
                outlineStyle: 'black',
                outlineDash: null,
                isContinuous: false
            },
            {
                strokeWidth: 1,
                strokeStyle: 'white',
                strokeDash: null,
                outlineWidth: 0,
                outlineStyle: 'black',
                outlineDash: null,
                isContinuous: false
            }
        ];
        this.activeStyleIndex = 0;
        this.isAtLegStart = false;
        this.needStrokeLineAtLegEnd = false;
    }
    /** @inheritdoc */
    render(leg, context, streamStack, partsToRender, ...args) {
        this.isAtLegStart = true;
        this.needStrokeLineAtLegEnd = false;
        super.render(leg, context, streamStack, partsToRender, ...args);
        if (this.needStrokeLineAtLegEnd) {
            this.strokeLine(context, this.styleBuffer[(this.activeStyleIndex + 1) % 2]);
            this.needStrokeLineAtLegEnd = false;
        }
    }
    /** @inheritdoc */
    renderVector(vector, isIngress, isEgress, leg, context, streamStack, ...args) {
        const style = this.styleSelector(vector, isIngress, isEgress, leg, streamStack.getProjection(), this.styleBuffer[this.activeStyleIndex], ...args);
        const previousStyle = this.styleBuffer[(this.activeStyleIndex + 1) % 2];
        const didStyleChange = !this.isAtLegStart && !FlightPathLegLineRenderer.areStylesEqual(style, previousStyle);
        const continuePath = !this.isAtLegStart && style.isContinuous && !didStyleChange;
        if (didStyleChange) {
            this.strokeLine(context, previousStyle);
            this.needStrokeLineAtLegEnd = false;
        }
        const circle = FlightPathUtils.setGeoCircleFromVector(vector, FlightPathLegLineRenderer.geoCircleCache[1]);
        this.pathRenderer.render(circle, vector.startLat, vector.startLon, vector.endLat, vector.endLon, streamStack, continuePath);
        this.activeStyleIndex = (this.activeStyleIndex + 1) % 2;
        this.isAtLegStart = false;
        this.needStrokeLineAtLegEnd = true;
    }
    /**
     * Applies a stroke to a canvas context.
     * @param context A canvas 2D rendering context.
     * @param style The style of the line to stroke.
     */
    strokeLine(context, style) {
        var _a, _b;
        if (style.outlineWidth > 0) {
            const outlineWidth = style.strokeWidth + 2 * style.outlineWidth;
            context.lineWidth = outlineWidth;
            context.strokeStyle = style.outlineStyle;
            context.setLineDash((_a = style.outlineDash) !== null && _a !== void 0 ? _a : FlightPathLegLineRenderer.EMPTY_DASH);
            context.stroke();
        }
        if (style.strokeWidth > 0) {
            context.lineWidth = style.strokeWidth;
            context.strokeStyle = style.strokeStyle;
            context.setLineDash((_b = style.strokeDash) !== null && _b !== void 0 ? _b : FlightPathLegLineRenderer.EMPTY_DASH);
            context.stroke();
        }
    }
    /**
     * Checks if two line styles are equal. Styles are considered equal if and only if their stroke and outline widths
     * are zero, or their stroke and outline widths, styles, and dash arrays are the same.
     * @param style1 The first style.
     * @param style2 The second style.
     * @returns Whether the two line styles are equal.
     */
    static areStylesEqual(style1, style2) {
        return (((style1.strokeWidth === 0 && style2.strokeWidth === 0)
            || (style1.strokeWidth === style2.strokeWidth
                && style1.strokeStyle === style2.strokeStyle
                && style1.strokeDash === style2.strokeDash)) && ((style1.outlineWidth === 0 && style2.outlineWidth === 0)
            || (style1.outlineWidth === style2.outlineWidth
                && style1.outlineStyle === style2.outlineStyle
                && style1.outlineDash === style2.outlineDash)));
    }
}
FlightPathLegLineRenderer.EMPTY_DASH = [];
FlightPathLegLineRenderer.geoCircleCache = [new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0)];
