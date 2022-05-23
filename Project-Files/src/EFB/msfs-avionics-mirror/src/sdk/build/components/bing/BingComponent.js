/// <reference types="msfstypes/JS/common" />
/// <reference types="msfstypes/JS/Types" />
/// <reference types="msfstypes/JS/NetBingMap" />
import { GameStateProvider } from '../../data/GameStateProvider';
import { Vec2Subject } from '../../math/VectorSubject';
import { ArraySubject } from '../../sub/ArraySubject';
import { Subject } from '../../sub/Subject';
import { SubscribableArrayEventType } from '../../sub/SubscribableArray';
import { DisplayComponent, FSComponent } from '../FSComponent';
/**
 * A FSComponent that displays the MSFS Bing Map, weather radar, and 3D terrain.
 */
export class BingComponent extends DisplayComponent {
    constructor() {
        super(...arguments);
        this.modeFlags = this.props.mode === EBingMode.HORIZON ? 4 : 0;
        this.isListenerRegistered = false;
        this.imgRef = FSComponent.createRef();
        this.uid = 0;
        this._isBound = false;
        this._isAwake = true;
        this.isDestroyed = false;
        this.pos = null;
        this.radius = 0;
        this.resolution = Vec2Subject.createFromVector(new Float64Array([BingComponent.DEFAULT_RESOLUTION, BingComponent.DEFAULT_RESOLUTION]));
        this.earthColors = ArraySubject.create(BingComponent.createEarthColorsArray('#000000', [{ elev: 0, color: '#000000' }, { elev: 60000, color: '#000000' }]));
        this.skyColor = Subject.create(BingComponent.hexaToRGBColor('#000000'));
        this.reference = Subject.create(EBingReference.SEA);
        this.wxrMode = Subject.create({ mode: EWeatherRadar.OFF, arcRadians: 0.5 }, (cur, prev) => cur.mode === prev.mode && cur.arcRadians === prev.arcRadians, (ref, val) => Object.assign(ref, val));
        this.resolutionPropHandler = (resolution) => {
            this.resolution.set(resolution);
        };
        this.earthColorsPropHandler = (index, type, item, array) => {
            if (array.length !== 61) {
                return;
            }
            this.earthColors.set(array);
        };
        this.skyColorPropHandler = (color) => {
            this.skyColor.set(color);
        };
        this.referencePropHandler = (reference) => {
            this.reference.set(reference);
        };
        this.wxrModePropHandler = (wxrMode) => {
            this.wxrMode.set(wxrMode);
        };
        this.resolutionHandler = (resolution) => {
            Coherent.call('SET_MAP_RESOLUTION', this.uid, resolution[0], resolution[1]);
        };
        this.earthColorsHandler = (index, type, item, array) => {
            if (type !== SubscribableArrayEventType.Cleared) {
                if (array.length !== 61) {
                    throw new Error(`Incorrect number of colors provided: was ${array.length} but should be 61`);
                }
                Coherent.call('SET_MAP_HEIGHT_COLORS', this.uid, array);
            }
        };
        this.skyColorHandler = (color) => {
            Coherent.call('SET_MAP_CLEAR_COLOR', this.uid, color);
        };
        this.referenceHandler = (reference) => {
            const flags = this.modeFlags | (reference === EBingReference.PLANE ? 1 : 0);
            this.mapListener.trigger('JS_BIND_BINGMAP', this.props.id, flags);
        };
        this.wxrModeHandler = (wxrMode) => {
            Coherent.call('SHOW_MAP_WEATHER', this.uid, wxrMode.mode, wxrMode.arcRadians);
        };
        /**
         * A callback called when the listener is fully bound.
         * @param binder The binder from the listener.
         * @param uid The unique ID of the bound map.
         */
        this.onListenerBound = (binder, uid) => {
            if (this.isDestroyed) {
                return;
            }
            if (binder.friendlyName === this.props.id) {
                // console.log('Bing map listener bound.');
                this.binder = binder;
                this.uid = uid;
                if (this._isBound) {
                    return;
                }
                this._isBound = true;
                Coherent.call('SHOW_MAP', uid, true);
                const pause = !this._isAwake;
                this.earthColorsSub = this.earthColors.sub(this.earthColorsHandler, true, pause);
                this.skyColorSub = this.skyColor.sub(this.skyColorHandler, true, pause);
                this.referenceSub = this.reference.sub(this.referenceHandler, true, pause);
                this.wxrModeSub = this.wxrMode.sub(this.wxrModeHandler, true, pause);
                this.resolutionSub = this.resolution.sub(this.resolutionHandler, true, pause);
                this.props.onBoundCallback(this);
            }
        };
        /**
         * A callback called when the map image is updated.
         * @param uid The unique ID of the bound map.
         * @param imgSrc The img tag src attribute to assign to the bing map image.
         */
        this.onMapUpdate = (uid, imgSrc) => {
            if (this.binder !== undefined && this.uid === uid && this.imgRef.instance !== null) {
                if (this.imgRef.instance.src !== imgSrc) {
                    this.imgRef.instance.src = imgSrc;
                }
            }
        };
    }
    /**
     * Checks whether this Bing component has been bound.
     * @returns whether this Bing component has been bound.
     */
    isBound() {
        return this._isBound;
    }
    /**
     * Checks whether this Bing component is awake.
     * @returns whether this Bing component is awake.
     */
    isAwake() {
        return this._isAwake;
    }
    /** @inheritdoc */
    onAfterRender() {
        var _a, _b, _c, _d, _e;
        if (window['IsDestroying']) {
            this.destroy();
            return;
        }
        this.resolutionPropSub = (_a = this.props.resolution) === null || _a === void 0 ? void 0 : _a.sub(this.resolutionPropHandler, true);
        this.earthColorsPropSub = (_b = this.props.earthColors) === null || _b === void 0 ? void 0 : _b.sub(this.earthColorsPropHandler, true);
        this.skyColorPropSub = (_c = this.props.skyColor) === null || _c === void 0 ? void 0 : _c.sub(this.skyColorPropHandler, true);
        this.referencePropSub = (_d = this.props.reference) === null || _d === void 0 ? void 0 : _d.sub(this.referencePropHandler, true);
        this.wxrModePropSub = (_e = this.props.wxrMode) === null || _e === void 0 ? void 0 : _e.sub(this.wxrModePropHandler, true);
        const gameStateSubscribable = GameStateProvider.get();
        const gameState = gameStateSubscribable.get();
        if (gameState === GameState.briefing || gameState === GameState.ingame) {
            this.registerListener();
        }
        else {
            this.gameStateSub = gameStateSubscribable.sub(state => {
                var _a;
                if (this.isDestroyed) {
                    return;
                }
                if (state === GameState.briefing || state === GameState.ingame) {
                    (_a = this.gameStateSub) === null || _a === void 0 ? void 0 : _a.destroy();
                    this.registerListener();
                }
            });
        }
        window.addEventListener('OnDestroy', this.destroy.bind(this));
    }
    /**
     * Registers this component's Bing map listener.
     */
    registerListener() {
        var _a;
        if (((_a = this.props.delay) !== null && _a !== void 0 ? _a : 0) > 0) {
            setTimeout(() => {
                if (this.isDestroyed) {
                    return;
                }
                this.mapListener = RegisterViewListener('JS_LISTENER_MAPS', this.onListenerRegistered.bind(this));
            }, this.props.delay);
        }
        else {
            this.mapListener = RegisterViewListener('JS_LISTENER_MAPS', this.onListenerRegistered.bind(this));
        }
    }
    /**
     * A callback called when this component's Bing map listener is registered.
     */
    onListenerRegistered() {
        if (this.isDestroyed || this.isListenerRegistered) {
            return;
        }
        this.mapListener.on('MapBinded', this.onListenerBound);
        this.mapListener.on('MapUpdated', this.onMapUpdate);
        this.isListenerRegistered = true;
        this.mapListener.trigger('JS_BIND_BINGMAP', this.props.id, this.modeFlags);
    }
    /**
     * Wakes this Bing component. Upon awakening, this component will synchronize its state from when it was put to sleep
     * to the Bing instance to which it is bound.
     */
    wake() {
        var _a, _b, _c, _d, _e;
        this._isAwake = true;
        if (!this._isBound) {
            return;
        }
        Coherent.call('SET_MAP_PARAMS', this.uid, this.pos, this.radius, 1);
        (_a = this.earthColorsSub) === null || _a === void 0 ? void 0 : _a.resume(true);
        (_b = this.skyColorSub) === null || _b === void 0 ? void 0 : _b.resume(true);
        (_c = this.referenceSub) === null || _c === void 0 ? void 0 : _c.resume(true);
        (_d = this.wxrModeSub) === null || _d === void 0 ? void 0 : _d.resume(true);
        (_e = this.resolutionSub) === null || _e === void 0 ? void 0 : _e.resume(true);
    }
    /**
     * Puts this Bing component to sleep. While asleep, this component cannot make changes to the Bing instance to which
     * it is bound.
     */
    sleep() {
        var _a, _b, _c, _d, _e;
        this._isAwake = false;
        if (!this._isBound) {
            return;
        }
        (_a = this.earthColorsSub) === null || _a === void 0 ? void 0 : _a.pause();
        (_b = this.skyColorSub) === null || _b === void 0 ? void 0 : _b.pause();
        (_c = this.referenceSub) === null || _c === void 0 ? void 0 : _c.pause();
        (_d = this.wxrModeSub) === null || _d === void 0 ? void 0 : _d.pause();
        (_e = this.resolutionSub) === null || _e === void 0 ? void 0 : _e.pause();
    }
    /**
     * Sets the center position and radius.
     * @param pos The center position.
     * @param radius The radius, in meters.
     */
    setPositionRadius(pos, radius) {
        this.pos = pos;
        this.radius = radius;
        if (this._isBound && this._isAwake) {
            Coherent.call('SET_MAP_PARAMS', this.uid, pos, radius, 1);
        }
    }
    /** @inheritdoc */
    render() {
        var _a;
        return (FSComponent.buildComponent("img", { ref: this.imgRef, src: '', style: 'position: absolute; left: 0; top: 0; width: 100%; height: 100%;', class: `${(_a = this.props.class) !== null && _a !== void 0 ? _a : ''}` }));
    }
    /** @inheritdoc */
    destroy() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        this.isDestroyed = true;
        this._isBound = false;
        (_a = this.gameStateSub) === null || _a === void 0 ? void 0 : _a.destroy();
        (_b = this.resolutionPropSub) === null || _b === void 0 ? void 0 : _b.destroy();
        (_c = this.earthColorsPropSub) === null || _c === void 0 ? void 0 : _c.destroy();
        (_d = this.skyColorPropSub) === null || _d === void 0 ? void 0 : _d.destroy();
        (_e = this.referencePropSub) === null || _e === void 0 ? void 0 : _e.destroy();
        (_f = this.wxrModePropSub) === null || _f === void 0 ? void 0 : _f.destroy();
        (_g = this.mapListener) === null || _g === void 0 ? void 0 : _g.off('MapBinded', this.onListenerBound);
        (_h = this.mapListener) === null || _h === void 0 ? void 0 : _h.off('MapUpdated', this.onMapUpdate);
        (_j = this.mapListener) === null || _j === void 0 ? void 0 : _j.trigger('JS_UNBIND_BINGMAP', this.props.id);
        this.isListenerRegistered = false;
        this.imgRef.instance.src = '';
        (_k = this.imgRef.instance.parentNode) === null || _k === void 0 ? void 0 : _k.removeChild(this.imgRef.instance);
    }
    /**
     * Converts an HTML hex color string to a numerical map RGB value.
     * @param hexColor The hex color string to convert.
     * @returns A numerical map RGB value.
     */
    static hexaToRGBColor(hexColor) {
        const hexStringColor = hexColor;
        let offset = 0;
        if (hexStringColor[0] === '#') {
            offset = 1;
        }
        const r = parseInt(hexStringColor.substr(0 + offset, 2), 16);
        const g = parseInt(hexStringColor.substr(2 + offset, 2), 16);
        const b = parseInt(hexStringColor.substr(4 + offset, 2), 16);
        const rgb = 256 * 256 * b + 256 * g + r;
        return rgb;
    }
    /**
     * Converts RGB color components to a numerical map RGB value.
     * @param r The red component, from 0 to 255.
     * @param g The green component, from 0 to 255.
     * @param b The blue component, from 0 to 255.
     * @returns A numerical map RGB value.
     */
    static rgbColor(r, g, b) {
        const rgb = 256 * 256 * b + 256 * g + r;
        return rgb;
    }
    /**
     * Creates a full Bing component earth colors array. The earth colors array will contain the specified water color
     * and terrain colors (including interpolated values between the explicitly defined ones, as necessary).
     * @param waterColor The desired water color, as a hex string with the format `#hhhhhh`.
     * @param terrainColors An array of desired terrain colors at specific elevations. Elevations should be specified in
     * feet and colors as hex strings with the format `#hhhhhh`.
     * @returns a full Bing component earth colors array.
     */
    // eslint-disable-next-line jsdoc/require-jsdoc
    static createEarthColorsArray(waterColor, terrainColors) {
        const earthColors = [BingComponent.hexaToRGBColor(waterColor)];
        const curve = new Avionics.Curve();
        curve.interpolationFunction = Avionics.CurveTool.StringColorRGBInterpolation;
        for (let i = 0; i < terrainColors.length; i++) {
            curve.add(terrainColors[i].elev, terrainColors[i].color);
        }
        for (let i = 0; i < 60; i++) {
            const color = curve.evaluate(i * 30000 / 60);
            earthColors[i + 1] = BingComponent.hexaToRGBColor(color);
        }
        return earthColors;
    }
}
BingComponent.DEFAULT_RESOLUTION = 1024;
