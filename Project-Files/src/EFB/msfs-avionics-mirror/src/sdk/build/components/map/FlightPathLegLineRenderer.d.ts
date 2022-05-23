import { CircleVector, LegDefinition } from '../../flightplan';
import { GeoCircle, GeoProjection } from '../../geo';
import { AbstractFlightPathLegRenderer } from './AbstractFlightPathLegRenderer';
import { GeoProjectionPathStreamStack } from './GeoProjectionPathStreamStack';
/**
 * A style definition for a line rendered by {@link FlightPathLegLineRenderer}.
 */
export declare type FlightPathLegLineStyle = {
    /** The width of the line stroke, in pixels. A width of zero or less will cause the stroke to not be rendered. */
    strokeWidth: number;
    /** The style of the line stroke. */
    strokeStyle: string | CanvasPattern | CanvasGradient;
    /** The dash array of the line stroke, or `null` if the stroke is solid. */
    strokeDash: readonly number[] | null;
    /** The width of the line outline, in pixels. A width of zero or less will cause the outline to not be rendered. */
    outlineWidth: number;
    /** The style of the line outline. */
    outlineStyle: string | CanvasPattern | CanvasGradient;
    /** The dash array of the line outline, or `null` if the outline is solid. */
    outlineDash: readonly number[] | null;
    /** Whether the line is continuous with the last vector. */
    isContinuous: boolean;
};
/**
 * A function which selects a line style for a rendered vector.
 * @param vector The vector for which to select a style.
 * @param isIngress Whether the vector is part of the ingress transition.
 * @param isEgress Whether the vector is part of the egress transition.
 * @param leg The flight plan leg containing the vector to render.
 * @param projection The map projection to use when rendering.
 * @param out The line style object to which to write the selected style.
 * @param args Additional arguments.
 * @returns The selected line style for the vector.
 */
export declare type FlightPathLegLineStyleSelector<Args extends any[]> = (vector: CircleVector, isIngress: boolean, isEgress: boolean, leg: LegDefinition, projection: GeoProjection, out: FlightPathLegLineStyle, ...args: Args) => FlightPathLegLineStyle;
/**
 * Renders flight plan leg paths as lines, with support for different styles for each flight path vector in the leg.
 */
export declare class FlightPathLegLineRenderer<Args extends any[] = any[]> extends AbstractFlightPathLegRenderer<Args> {
    private readonly styleSelector;
    private static readonly EMPTY_DASH;
    protected static readonly geoCircleCache: GeoCircle[];
    private readonly pathRenderer;
    private readonly styleBuffer;
    private activeStyleIndex;
    private isAtLegStart;
    private needStrokeLineAtLegEnd;
    /**
     * Constructor.
     * @param styleSelector A function which selects a style for each rendered vector.
     */
    constructor(styleSelector: FlightPathLegLineStyleSelector<Args>);
    /** @inheritdoc */
    render(leg: LegDefinition, context: CanvasRenderingContext2D, streamStack: GeoProjectionPathStreamStack, partsToRender: number, ...args: Args): void;
    /** @inheritdoc */
    protected renderVector(vector: CircleVector, isIngress: boolean, isEgress: boolean, leg: LegDefinition, context: CanvasRenderingContext2D, streamStack: GeoProjectionPathStreamStack, ...args: Args): void;
    /**
     * Applies a stroke to a canvas context.
     * @param context A canvas 2D rendering context.
     * @param style The style of the line to stroke.
     */
    private strokeLine;
    /**
     * Checks if two line styles are equal. Styles are considered equal if and only if their stroke and outline widths
     * are zero, or their stroke and outline widths, styles, and dash arrays are the same.
     * @param style1 The first style.
     * @param style2 The second style.
     * @returns Whether the two line styles are equal.
     */
    private static areStylesEqual;
}
//# sourceMappingURL=FlightPathLegLineRenderer.d.ts.map