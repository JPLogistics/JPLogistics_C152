/// <reference types="msfstypes/js/netbingmap" />
import { NumberUnitSubject, Subject, Subscribable } from '../../..';
import { WxrMode } from '../../bing';
import { AbstractMapModule } from './AbstractMapModule';
/**
 * A map data module that handles a horizontal sweeping weather radar display
 * parameters.
 */
export declare class MapWxrModule extends AbstractMapModule {
    /** Whether or not the weather radar is enable */
    enabled: Subject<boolean>;
    /** The current map weather radar arc sweep angle in degrees. */
    weatherRadarArc: NumberUnitSubject<import("../../..").UnitFamily.Angle, import("../../..").SimpleUnit<import("../../..").UnitFamily.Angle>>;
    /** The current weather radar mode. */
    weatherRadarMode: Subject<EWeatherRadar.TOPVIEW | EWeatherRadar.HORIZONTAL | EWeatherRadar.VERTICAL>;
    private _wxrMode;
    /**
     * A subscribable containing the combined WxrMode from the mode and arc subjects,
     * suitable for consumption in a MapBingLayer.
     * @returns The WxrMode subscribable.
     */
    get wxrMode(): Subscribable<WxrMode>;
    /** @inheritdoc */
    onInstall(): void;
}
//# sourceMappingURL=MapWxrModule.d.ts.map