import { DmsFormatter } from '../../utils/DmsFormatter';
import { Subject } from '../../utils/Subject';
import { DisplayComponent, FSComponent } from '../FSComponent';
/**
 * A component which displays lat/lon coordinates.
 */
export class LatLonDisplay extends DisplayComponent {
    constructor() {
        super(...arguments);
        this.locationChangedHandler = this.onLocationChanged.bind(this);
        this.latPrefixSub = Subject.create('');
        this.latNumSub = Subject.create('');
        this.lonPrefixSub = Subject.create('');
        this.lonNumSub = Subject.create('');
        this.formatter = new DmsFormatter();
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    onAfterRender() {
        this.props.location.sub(this.locationChangedHandler, true);
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
        this.setCoordSub(this.latPrefixSub, this.latNumSub, this.formatter.parseLat(location.lat), 2);
        this.setCoordSub(this.lonPrefixSub, this.lonNumSub, this.formatter.parseLon(location.lon), 3);
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
        this.latPrefixSub.set('_');
        this.latNumSub.set('__°__.__\'');
        this.lonPrefixSub.set('_');
        this.lonNumSub.set('___°__.__\'');
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    render() {
        var _a;
        return (FSComponent.buildComponent("div", { class: (_a = this.props.class) !== null && _a !== void 0 ? _a : '' },
            FSComponent.buildComponent("div", { class: 'latlon-coord latlon-lat' },
                FSComponent.buildComponent("div", { class: 'latlon-prefix' }, this.latPrefixSub),
                FSComponent.buildComponent("div", { class: 'latlon-num', style: 'white-space: nowrap;' }, this.latNumSub)),
            FSComponent.buildComponent("div", { class: 'latlon-coord latlon-lon' },
                FSComponent.buildComponent("div", { class: 'latlon-prefix' }, this.lonPrefixSub),
                FSComponent.buildComponent("div", { class: 'latlon-num', style: 'white-space: nowrap;' }, this.lonNumSub))));
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    destroy() {
        this.props.location.unsub(this.locationChangedHandler);
    }
}
