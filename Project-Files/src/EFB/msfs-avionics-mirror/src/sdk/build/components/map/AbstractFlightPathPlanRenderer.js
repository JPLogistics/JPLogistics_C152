/**
 * Renders flight plan paths one leg at a time in either forward or reverse order. Optionally forces the rendering of
 * the active flight plan leg to be last.
 */
export class AbstractFlightPathPlanRenderer {
    /**
     * Constructor.
     * @param renderOrder The order which this renderer renders the flight plan legs. Forward order renders the legs in
     * a first-to-last fashion. Reverse order renders the legs in a last-to-first fashion. Defaults to forward.
     * @param renderActiveLegLast Whether to render the active leg last. Defaults to true.
     */
    constructor(renderOrder = 'forward', renderActiveLegLast = true) {
        this.renderOrder = renderOrder;
        this.renderActiveLegLast = renderActiveLegLast;
    }
    /**
     * Renders a flight plan path to a canvas.
     * @param plan The flight plan to render.
     * @param startIndex The global index of the first flight plan leg to render, inclusive. Defaults to `0`.
     * @param endIndex The global index of the last flight plan leg to render, inclusive. Defaults to `plan.length - 1`.
     * @param context The canvas 2D rendering context to which to render.
     * @param streamStack The path stream stack to which to render.
     * @param args Additional arguments.
     */
    render(plan, startIndex, endIndex, context, streamStack, ...args) {
        startIndex !== null && startIndex !== void 0 ? startIndex : (startIndex = 0);
        endIndex !== null && endIndex !== void 0 ? endIndex : (endIndex = plan.length - 1);
        const activeLegIndex = plan.activeLateralLeg < plan.length ? plan.activeLateralLeg : -1;
        const activeLeg = plan.activeLateralLeg < plan.length ? plan.getLeg(plan.activeLateralLeg) : undefined;
        const isReverse = this.renderOrder === 'reverse';
        if (isReverse) {
            const oldEndIndex = endIndex;
            endIndex = startIndex;
            startIndex = oldEndIndex;
        }
        let index = startIndex;
        const delta = isReverse ? -1 : 1;
        for (const leg of plan.legs(isReverse, startIndex)) {
            if ((index - endIndex) * delta > 0) {
                break;
            }
            if (this.renderActiveLegLast && index === activeLegIndex) {
                index += delta;
                continue;
            }
            this.renderLeg(leg, plan, activeLeg, index, activeLegIndex, context, streamStack, ...args);
            index += delta;
        }
        if (this.renderActiveLegLast && activeLeg) {
            this.renderLeg(activeLeg, plan, activeLeg, activeLegIndex, activeLegIndex, context, streamStack, ...args);
        }
    }
}
