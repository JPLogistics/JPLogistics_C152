import { CircleVector, LegDefinition } from '../../flightplan';
import { GeoProjection } from '../../geo';
import { PathPattern } from '../../graphics/path';
import { AbstractFlightPathLegRenderer } from './AbstractFlightPathLegRenderer';
import { GeoProjectionPathStreamStack } from './GeoProjectionPathStreamStack';
/**
 * A style definition for a pattern rendered by {@link FlightPathLegPatternRenderer}.
 */
export declare type FlightPathLegPatternStyle = {
    /** The pattern to render. */
    pattern: PathPattern | null;
    /** Whether the pattern is continuous with the previous vector. */
    isContinuous: boolean;
};
/**
 * A function which selects a pattern style for a rendered vector.
 * @param vector The vector for which to select a style.
 * @param isIngress Whether the vector is part of the ingress transition.
 * @param isEgress Whether the vector is part of the egress transition.
 * @param leg The flight plan leg containing the vector to render.
 * @param projection The map projection to use when rendering.
 * @param out The pattern style object to which to write the selected style.
 * @param args Additional arguments.
 * @returns The selected pattern style for the vector.
 */
export declare type FlightPathLegPatternStyleSelector<Args extends any[]> = (vector: CircleVector, isIngress: boolean, isEgress: boolean, leg: LegDefinition, projection: GeoProjection, out: FlightPathLegPatternStyle, ...args: Args) => FlightPathLegPatternStyle;
/**
 * Renders flight plan leg paths as repeating patterns, with support for different patterns for each flight path vector
 * in the leg.
 */
export declare class FlightPathLegPatternRenderer<Args extends any[] = any[]> extends AbstractFlightPathLegRenderer<Args> {
    private readonly styleSelector;
    private readonly pathRenderer;
    private readonly style;
    private isAtLegStart;
    /**
     * Constructor.
     * @param styleSelector A function which selects a style for each rendered vector.
     */
    constructor(styleSelector: FlightPathLegPatternStyleSelector<Args>);
    /** @inheritdoc */
    render(leg: LegDefinition, context: CanvasRenderingContext2D, streamStack: GeoProjectionPathStreamStack, partsToRender: number, ...args: Args): void;
    /** @inheritdoc */
    protected renderVector(vector: CircleVector, isIngress: boolean, isEgress: boolean, leg: LegDefinition, context: CanvasRenderingContext2D, streamStack: GeoProjectionPathStreamStack, ...args: Args): void;
}
//# sourceMappingURL=FlightPathLegPatternRenderer.d.ts.map