/// <reference types="msfstypes/pages/vcockpit/instruments/shared/baseinstrument" />
import { Subscribable } from '../sub/Subscribable';
/**
 * A utility class which provides the current game state.
 */
export declare class GameStateProvider {
    private static INSTANCE?;
    private readonly gameState;
    /**
     * Constructor.
     */
    private constructor();
    /**
     * Responds to changes in document attributes.
     */
    private onAttributesChanged;
    /**
     * Gets a subscribable which provides the current game state.
     * @returns A subscribable which provides the current game state.
     */
    static get(): Subscribable<GameState | undefined>;
}
//# sourceMappingURL=GameStateProvider.d.ts.map