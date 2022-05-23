import { Vec2Math } from '../../math/VecMath';
/**
 * An abstract implementation of a map text label.
 */
export class AbstractMapTextLabel {
    /**
     * Constructor.
     * @param text The text of this label.
     * @param priority The render priority of this label.
     * @param options Options with which to initialize this label.
     */
    constructor(text, priority, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        this.text = text;
        this.priority = priority;
        /**
         * The anchor point of this label, expressed relative to this label's width/height. [0, 0] is the top-left corner,
         * and [1, 1] is the bottom-right corner.
         */
        this.anchor = new Float64Array(2);
        /** The padding of this label's background, in pixels. Expressed as [top, right, bottom, left]. */
        this.bgPadding = new Float64Array(4);
        (options === null || options === void 0 ? void 0 : options.anchor) && this.anchor.set(options.anchor);
        this.font = (_a = options === null || options === void 0 ? void 0 : options.font) !== null && _a !== void 0 ? _a : 'Roboto';
        this.fontSize = (_b = options === null || options === void 0 ? void 0 : options.fontSize) !== null && _b !== void 0 ? _b : 10;
        this.fontColor = (_c = options === null || options === void 0 ? void 0 : options.fontColor) !== null && _c !== void 0 ? _c : 'white';
        this.fontOutlineWidth = (_d = options === null || options === void 0 ? void 0 : options.fontOutlineWidth) !== null && _d !== void 0 ? _d : 0;
        this.fontOutlineColor = (_e = options === null || options === void 0 ? void 0 : options.fontOutlineColor) !== null && _e !== void 0 ? _e : 'black';
        this.showBg = (_f = options === null || options === void 0 ? void 0 : options.showBg) !== null && _f !== void 0 ? _f : false;
        this.bgColor = (_g = options === null || options === void 0 ? void 0 : options.bgColor) !== null && _g !== void 0 ? _g : 'black';
        (options === null || options === void 0 ? void 0 : options.bgPadding) && this.bgPadding.set(options.bgPadding);
        this.bgBorderRadius = (_h = options === null || options === void 0 ? void 0 : options.bgBorderRadius) !== null && _h !== void 0 ? _h : 0;
        this.bgOutlineWidth = (_j = options === null || options === void 0 ? void 0 : options.bgOutlineWidth) !== null && _j !== void 0 ? _j : 0;
        this.bgOutlineColor = (_k = options === null || options === void 0 ? void 0 : options.bgOutlineColor) !== null && _k !== void 0 ? _k : 'white';
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    draw(context, mapProjection) {
        this.setTextStyle(context);
        const width = context.measureText(this.text).width;
        const height = this.fontSize;
        const bgExtraWidth = this.showBg ? this.bgPadding[1] + this.bgPadding[3] + this.bgOutlineWidth * 2 : 0;
        const bgExtraHeight = this.showBg ? this.bgPadding[0] + this.bgPadding[2] + this.bgOutlineWidth * 2 : 0;
        const pos = this.getPosition(mapProjection, AbstractMapTextLabel.tempVec2);
        const centerX = pos[0] - (this.anchor[0] - 0.5) * (width + bgExtraWidth);
        const centerY = pos[1] - (this.anchor[1] - 0.5) * (height + bgExtraHeight);
        if (this.showBg) {
            this.drawBackground(context, centerX, centerY, width, height);
        }
        this.drawText(context, centerX, centerY);
    }
    /**
     * Loads this label's text style to a canvas rendering context.
     * @param context The canvas rendering context to use.
     */
    setTextStyle(context) {
        context.font = `${this.fontSize}px ${this.font}`;
        context.textBaseline = 'middle';
        context.textAlign = 'center';
    }
    /**
     * Draws this label's text to a canvas.
     * @param context The canvas rendering context.
     * @param centerX The x-coordinate of the center of the label, in pixels.
     * @param centerY the y-coordinate of the center of the label, in pixels.
     */
    drawText(context, centerX, centerY) {
        if (this.fontOutlineWidth > 0) {
            context.lineWidth = this.fontOutlineWidth * 2;
            context.strokeStyle = this.fontOutlineColor;
            context.strokeText(this.text, centerX, centerY);
        }
        context.fillStyle = this.fontColor;
        context.fillText(this.text, centerX, centerY);
    }
    /**
     * Draws this label's background to a canvas.
     * @param context The canvas rendering context.
     * @param centerX The x-coordinate of the center of the label, in pixels.
     * @param centerY the y-coordinate of the center of the label, in pixels.
     * @param width The width of the background, in pixels.
     * @param height The height of the background, in pixels.
     */
    drawBackground(context, centerX, centerY, width, height) {
        const backgroundLeft = centerX - width / 2 - (this.bgPadding[3] + this.bgOutlineWidth);
        const backgroundTop = centerY - height / 2 - (this.bgPadding[0] + this.bgOutlineWidth);
        const backgroundWidth = width + (this.bgPadding[1] + this.bgPadding[3] + 2 * this.bgOutlineWidth);
        const backgroundHeight = height + (this.bgPadding[0] + this.bgPadding[2] + 2 * this.bgOutlineWidth);
        let isRounded = false;
        if (this.bgBorderRadius > 0) {
            isRounded = true;
            this.loadBackgroundPath(context, backgroundLeft, backgroundTop, backgroundWidth, backgroundHeight, this.bgBorderRadius);
        }
        if (this.bgOutlineWidth > 0) {
            context.lineWidth = this.bgOutlineWidth * 2;
            context.strokeStyle = this.bgOutlineColor;
            if (isRounded) {
                context.stroke();
            }
            else {
                context.strokeRect(backgroundLeft, backgroundTop, backgroundWidth, backgroundHeight);
            }
        }
        context.fillStyle = this.bgColor;
        if (isRounded) {
            context.fill();
        }
        else {
            context.fillRect(backgroundLeft, backgroundTop, backgroundWidth, backgroundHeight);
        }
    }
    /**
     * Loads the path of this label's background to a canvas rendering context.
     * @param context The canvas rendering context to use.
     * @param left The x-coordinate of the left edge of the background, in pixels.
     * @param top The y-coordinate of the top edge of the background, in pixels.
     * @param width The width of the background, in pixels.
     * @param height The height of the background, in pixels.
     * @param radius The border radius of the background, in pixels.
     */
    loadBackgroundPath(context, left, top, width, height, radius) {
        const right = left + width;
        const bottom = top + height;
        context.beginPath();
        context.moveTo(left + radius, top);
        context.lineTo(right - radius, top);
        context.arcTo(right, top, right, top + radius, radius);
        context.lineTo(right, bottom - radius);
        context.arcTo(right, bottom, right - radius, bottom, radius);
        context.lineTo(left + radius, bottom);
        context.arcTo(left, bottom, left, bottom - radius, radius);
        context.lineTo(left, top + radius);
        context.arcTo(left, top, left + radius, top, radius);
    }
}
AbstractMapTextLabel.tempVec2 = new Float64Array(2);
/**
 * A text label associated with a specific geographic location.
 */
export class MapLocationTextLabel extends AbstractMapTextLabel {
    /**
     * Constructor.
     * @param text The text of this label.
     * @param priority The render priority of this label.
     * @param location The geographic location of this label.
     * @param options Options with which to initialize this label.
     */
    constructor(text, priority, location, options) {
        super(text, priority, options);
        this.offset = new Float64Array(2);
        this._location = location.copy();
        this.location = this._location.readonly;
        (options === null || options === void 0 ? void 0 : options.offset) && this.offset.set(options.offset);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    getPosition(mapProjection, out) {
        mapProjection.project(this._location, out);
        Vec2Math.add(out, this.offset, out);
        return out;
    }
}
