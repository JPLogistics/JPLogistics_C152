/**
 * A bank angle controller that maintains a constant radius turn.
 */
export declare class ArcTurnController {
    private readonly bankController;
    private readonly precessionController;
    private previousTime;
    private previousRadiusError?;
    private filter;
    /**
     * Gets the bank angle output for a given radius error.
     * @param radiusError The radius error.
     * @returns The bank angle output.
     */
    getOutput(radiusError: number): number;
    /**
     * Resets the controller.
     */
    reset(): void;
}
//# sourceMappingURL=ArcTurnController.d.ts.map