import { Subject } from '../../sub/Subject';
import { DisplayComponent } from '../FSComponent';
/**
 * A component which displays a number with units.
 */
export class AbstractNumberUnitDisplay extends DisplayComponent {
    constructor() {
        super(...arguments);
        /** A subscribable which provides the value to display. */
        this.value = ('isSubscribable' in this.props.value)
            ? this.props.value
            : Subject.create(this.props.value);
        /** A subscribable which provides the unit type in which to display the value. */
        this.displayUnit = this.props.displayUnit !== null && ('isSubscribable' in this.props.displayUnit)
            ? this.props.displayUnit
            : Subject.create(this.props.displayUnit);
    }
    /** @inheritdoc */
    onAfterRender() {
        this.valueSub = this.value.sub(this.onValueChanged.bind(this), true);
        this.displayUnitSub = this.displayUnit.sub(this.onDisplayUnitChanged.bind(this), true);
    }
    /** @inheritdoc */
    destroy() {
        var _a, _b;
        (_a = this.valueSub) === null || _a === void 0 ? void 0 : _a.destroy();
        (_b = this.displayUnitSub) === null || _b === void 0 ? void 0 : _b.destroy();
    }
}
