import { DisplayComponent } from '../FSComponent';
/**
 * A component which displays a number with units.
 */
export class AbstractNumberUnitDisplay extends DisplayComponent {
    constructor() {
        super(...arguments);
        this.valueChangedHandler = this.onValueChanged.bind(this);
        this.displayUnitChangedHandler = this.onDisplayUnitChanged.bind(this);
    }
    /** @inheritdoc */
    onAfterRender() {
        this.props.value.sub(this.valueChangedHandler, true);
        this.props.displayUnit.sub(this.displayUnitChangedHandler, true);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    destroy() {
        this.props.value.unsub(this.valueChangedHandler);
        this.props.displayUnit.unsub(this.displayUnitChangedHandler);
    }
}
