import { Subject } from '../sub/Subject';
/**
 * A utility class which provides the current game state.
 */
export class GameStateProvider {
    /**
     * Constructor.
     */
    constructor() {
        this.gameState = Subject.create(undefined);
        window.document.addEventListener('OnVCockpitPanelAttributesChanged', this.onAttributesChanged.bind(this));
        this.onAttributesChanged();
    }
    /**
     * Responds to changes in document attributes.
     */
    onAttributesChanged() {
        var _a;
        if ((_a = window.parent) === null || _a === void 0 ? void 0 : _a.document.body.hasAttribute('gamestate')) {
            const attribute = window.parent.document.body.getAttribute('gamestate');
            if (attribute !== null) {
                this.gameState.set(GameState[attribute]);
                return;
            }
        }
        this.gameState.set(undefined);
    }
    /**
     * Gets a subscribable which provides the current game state.
     * @returns A subscribable which provides the current game state.
     */
    static get() {
        var _a;
        return ((_a = GameStateProvider.INSTANCE) !== null && _a !== void 0 ? _a : (GameStateProvider.INSTANCE = new GameStateProvider())).gameState;
    }
}
