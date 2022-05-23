import { NumberUnitSubject, Subject, UnitType } from '../../..';
import { AbstractMapModule } from './AbstractMapModule';
/**
 * A map data module that handles a horizontal sweeping weather radar display
 * parameters.
 */
export class MapWxrModule extends AbstractMapModule {
    constructor() {
        super(...arguments);
        /** Whether or not the weather radar is enable */
        this.enabled = Subject.create(false);
        /** The current map weather radar arc sweep angle in degrees. */
        this.weatherRadarArc = NumberUnitSubject.createFromNumberUnit(UnitType.DEGREE.createNumber(90));
        /** The current weather radar mode. */
        this.weatherRadarMode = Subject.create(EWeatherRadar.HORIZONTAL);
        this._wxrMode = Subject.create({
            mode: this.enabled.get() ? this.weatherRadarMode.get() : EWeatherRadar.OFF,
            arcRadians: this.weatherRadarArc.get().asUnit(UnitType.RADIAN),
        });
    }
    /**
     * A subscribable containing the combined WxrMode from the mode and arc subjects,
     * suitable for consumption in a MapBingLayer.
     * @returns The WxrMode subscribable.
     */
    get wxrMode() {
        return this._wxrMode;
    }
    /** @inheritdoc */
    onInstall() {
        this.enabled.sub(v => {
            this._wxrMode.get().mode = v ? this.weatherRadarMode.get() : EWeatherRadar.OFF;
            this._wxrMode.notify();
        });
        this.weatherRadarArc.sub(v => {
            this._wxrMode.get().arcRadians = v.asUnit(UnitType.RADIAN);
            this._wxrMode.notify();
        });
        this.weatherRadarMode.sub(v => {
            this._wxrMode.get().mode = this.enabled.get() ? v : EWeatherRadar.OFF;
            this._wxrMode.notify();
        });
    }
}
