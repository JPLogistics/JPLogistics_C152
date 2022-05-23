import { BitFlags, GeoCircle, GeoPoint } from '../..';
import { FlightPathUtils } from '../../flightplan';
/**
 * Parts of a flight plan leg path to render.
 */
export var FlightPathLegRenderPart;
(function (FlightPathLegRenderPart) {
    /** None. */
    FlightPathLegRenderPart[FlightPathLegRenderPart["None"] = 0] = "None";
    /** The ingress transition. */
    FlightPathLegRenderPart[FlightPathLegRenderPart["Ingress"] = 1] = "Ingress";
    /** The base path. */
    FlightPathLegRenderPart[FlightPathLegRenderPart["Base"] = 2] = "Base";
    /** The egress transition. */
    FlightPathLegRenderPart[FlightPathLegRenderPart["Egress"] = 4] = "Egress";
    /** The entire leg path. */
    FlightPathLegRenderPart[FlightPathLegRenderPart["All"] = 7] = "All";
})(FlightPathLegRenderPart || (FlightPathLegRenderPart = {}));
/**
 * Renders flight plan leg paths one vector at a time, optionally excluding the ingress and/or egress transition
 * vectors.
 */
export class AbstractFlightPathLegRenderer {
    constructor() {
        this.tempVector = FlightPathUtils.createEmptyCircleVector();
    }
    /**
     * Renders a flight plan leg path to a canvas.
     * @param leg The flight plan leg to render.
     * @param context The canvas 2D rendering context to which to render.
     * @param streamStack The path stream stack to which to render.
     * @param partsToRender The parts of the leg to render, as a combination of {@link FlightPathLegRenderPart}
     * values.
     * @param args Additional arguments.
     */
    render(leg, context, streamStack, partsToRender, ...args) {
        const legCalc = leg.calculated;
        if (!legCalc || !BitFlags.isAny(partsToRender, FlightPathLegRenderPart.Ingress | FlightPathLegRenderPart.Base | FlightPathLegRenderPart.Egress)) {
            return;
        }
        const excludeIngress = !BitFlags.isAll(partsToRender, FlightPathLegRenderPart.Ingress);
        const excludeBase = !BitFlags.isAll(partsToRender, FlightPathLegRenderPart.Base);
        const excludeEgress = !BitFlags.isAll(partsToRender, FlightPathLegRenderPart.Egress);
        let mainVectors = legCalc.ingressToEgress;
        let mainVectorStartIndex = 0;
        let mainVectorEndIndex = legCalc.ingressToEgress.length;
        if (excludeIngress || excludeEgress) {
            mainVectors = legCalc.flightPath;
            mainVectorEndIndex = excludeEgress || legCalc.egressJoinIndex < 0 || legCalc.egress.length === 0 ? legCalc.flightPath.length : legCalc.egressJoinIndex;
        }
        if (!excludeIngress) {
            for (let i = 0; i < legCalc.ingress.length; i++) {
                this.renderVector(legCalc.ingress[i], true, false, leg, context, streamStack, ...args);
            }
            if (excludeEgress && !excludeBase) {
                mainVectorStartIndex = Math.max(0, legCalc.ingressJoinIndex);
                const lastIngressVector = legCalc.ingress[legCalc.ingress.length - 1];
                const ingressJoinVector = legCalc.flightPath[legCalc.ingressJoinIndex];
                if (lastIngressVector && ingressJoinVector) {
                    const ingressEnd = AbstractFlightPathLegRenderer.geoPointCache[0].set(lastIngressVector.endLat, lastIngressVector.endLon);
                    const vectorEnd = AbstractFlightPathLegRenderer.geoPointCache[1].set(ingressJoinVector.endLat, ingressJoinVector.endLon);
                    if (!ingressEnd.equals(vectorEnd)) {
                        const ingressJoinVectorCircle = FlightPathUtils.setGeoCircleFromVector(ingressJoinVector, AbstractFlightPathLegRenderer.geoCircleCache[0]);
                        FlightPathUtils.setCircleVector(this.tempVector, ingressJoinVectorCircle, ingressEnd, vectorEnd, ingressJoinVector.flags);
                        this.renderVector(this.tempVector, false, false, leg, context, streamStack, ...args);
                    }
                    mainVectorStartIndex++;
                }
            }
        }
        if (!excludeBase) {
            const len = Math.min(mainVectorEndIndex, mainVectors.length);
            for (let i = mainVectorStartIndex; i < len; i++) {
                this.renderVector(mainVectors[i], false, false, leg, context, streamStack, ...args);
            }
        }
        if (!excludeEgress) {
            if (excludeIngress && !excludeBase) {
                const firstEgressVector = legCalc.egress[0];
                const egressJoinVector = legCalc.flightPath[legCalc.egressJoinIndex];
                if (firstEgressVector && egressJoinVector) {
                    const egressStart = AbstractFlightPathLegRenderer.geoPointCache[0].set(firstEgressVector.startLat, firstEgressVector.startLon);
                    const egressJoinVectorStart = AbstractFlightPathLegRenderer.geoPointCache[1].set(egressJoinVector.startLat, egressJoinVector.startLon);
                    if (!egressStart.equals(egressJoinVectorStart)) {
                        const egressJoinVectorCircle = FlightPathUtils.setGeoCircleFromVector(egressJoinVector, AbstractFlightPathLegRenderer.geoCircleCache[0]);
                        FlightPathUtils.setCircleVector(this.tempVector, egressJoinVectorCircle, egressJoinVectorStart, egressStart, egressJoinVector.flags);
                        this.renderVector(this.tempVector, false, false, leg, context, streamStack, ...args);
                    }
                }
            }
            for (let i = 0; i < legCalc.egress.length; i++) {
                this.renderVector(legCalc.egress[i], false, true, leg, context, streamStack, ...args);
            }
        }
    }
}
AbstractFlightPathLegRenderer.geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0)];
AbstractFlightPathLegRenderer.geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];
