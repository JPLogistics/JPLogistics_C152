import { DmsFormatter } from '../../graphics/text/DmsFormatter';
import { Subject } from '../../sub/Subject';
import { DisplayComponent, FSComponent } from '../FSComponent';
/**
 * A component which displays lat/lon coordinates.
 */
export class LatLonDisplay extends DisplayComponent {
    constructor() {
        super(...arguments);
        this.latPrefix = Subject.create('');
        this.latNum = Subject.create('');
        this.lonPrefix = Subject.create('');
        this.lonNum = Subject.create('');
        this.formatter = new DmsFormatter();
    }
    /** @inheritdoc */
    onAfterRender() {
        this.locationSub = this.props.location.sub(this.onLocationChanged.bind(this), true);
    }
    /**
     * A callback which is called when this component's bound location changes.
     * @param location The new location.
     */
    onLocationChanged(location) {
        if (isNaN(location.lat) || isNaN(location.lon)) {
            this.clearDisplay();
        }
        else {
            this.setDisplay(location);
        }
    }
    /**
     * Displays the formatted lat/lon coordinates of a location.
     * @param location A location.
     */
    setDisplay(location) {
        this.setCoordSub(this.latPrefix, this.latNum, this.formatter.parseLat(location.lat), 2);
        this.setCoordSub(this.lonPrefix, this.lonNum, this.formatter.parseLon(location.lon), 3);
    }
    /**
     * Sets coordinate subjects for a given set of coordinate values.
     * @param prefixSub The coordinate prefix subject.
     * @param numSub The coordinate number subject.
     * @param coordValues The DMS values of the coordinate.
     * @param padDeg The number of digits to which to pad the degrees value.
     */
    setCoordSub(prefixSub, numSub, coordValues, padDeg) {
        const prefix = coordValues.direction;
        let deg = coordValues.degrees;
        let minutes = Math.round((coordValues.minutes + coordValues.seconds / 60) * 100) / 100;
        if (minutes === 60) {
            // need to increment up degrees if minutes was rounded up to 60 from 59.xx.
            deg++;
            minutes = 0;
        }
        prefixSub.set(prefix);
        numSub.set(`${deg.toString().padStart(padDeg, '0')}°${minutes.toFixed(2)}'`);
    }
    /**
     * Displays the blank default value.
     */
    clearDisplay() {
        this.latPrefix.set('_');
        this.latNum.set('__°__.__\'');
        this.lonPrefix.set('_');
        this.lonNum.set('___°__.__\'');
    }
    /** @inheritdoc */
    render() {
        var _a;
        return (FSComponent.buildComponent("div", { class: (_a = this.props.class) !== null && _a !== void 0 ? _a : '' },
            FSComponent.buildComponent("div", { class: 'latlon-coord latlon-lat' },
                FSComponent.buildComponent("div", { class: 'latlon-prefix' }, this.latPrefix),
                FSComponent.buildComponent("div", { class: 'latlon-num', style: 'white-space: nowrap;' }, this.latNum)),
            FSComponent.buildComponent("div", { class: 'latlon-coord latlon-lon' },
                FSComponent.buildComponent("div", { class: 'latlon-prefix' }, this.lonPrefix),
                FSComponent.buildComponent("div", { class: 'latlon-num', style: 'white-space: nowrap;' }, this.lonNum))));
    }
    /** @inheritdoc */
    destroy() {
        var _a;
        (_a = this.locationSub) === null || _a === void 0 ? void 0 : _a.destroy();
    }
}
