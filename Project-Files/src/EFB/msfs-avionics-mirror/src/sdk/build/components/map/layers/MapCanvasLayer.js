import { FSComponent } from '../../FSComponent';
import { MapLayer } from '../MapLayer';
/**
 * An implementation of MapCanvasLayerCanvasInstance.
 */
export class MapCanvasLayerCanvasInstanceClass {
    /**
     * Creates a new canvas instance.
     * @param canvas The canvas element.
     * @param context The canvas 2D rendering context.
     * @param isDisplayed Whether the canvas is displayed.
     */
    constructor(canvas, context, isDisplayed) {
        this.canvas = canvas;
        this.context = context;
        this.isDisplayed = isDisplayed;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    reset() {
        const width = this.canvas.width;
        this.canvas.width = 0;
        this.canvas.width = width;
    }
}
/**
 * A layer which uses a canvas to draw graphics.
 */
export class MapCanvasLayer extends MapLayer {
    constructor() {
        super(...arguments);
        this.displayCanvasRef = FSComponent.createRef();
        this.width = 0;
        this.height = 0;
        this.displayCanvasContext = null;
        this.isInit = false;
    }
    /**
     * Gets this layer's display canvas instance.
     * @returns This layer's display canvas instance.
     * @throws Error if this layer's display canvas instance has not been initialized.
     */
    get display() {
        if (!this._display) {
            throw new Error('MapCanvasLayer: attempted to access display before it was initialized');
        }
        return this._display;
    }
    /**
     * Gets this layer's buffer canvas instance.
     * @returns This layer's buffer canvas instance.
     * @throws Error if this layer's buffer canvas instance has not been initialized.
     */
    get buffer() {
        if (!this._buffer) {
            throw new Error('MapCanvasLayer: attempted to access buffer before it was initialized');
        }
        return this._buffer;
    }
    /**
     * Attempts to get this layer's display canvas instance.
     * @returns This layer's display canvas instance, or undefined if it has not been initialized.
     */
    tryGetDisplay() {
        return this._display;
    }
    /**
     * Attempts to get this layer's buffer canvas instance.
     * @returns This layer's buffer canvas instance, or undefined if it has not been initialized.
     */
    tryGetBuffer() {
        return this._buffer;
    }
    /**
     * Gets the width of the canvas element, in pixels.
     * @returns the width of the canvas element.
     */
    getWidth() {
        return this.width;
    }
    /**
     * Gets the height of the canvas element, in pixels.
     * @returns the height of the canvas element.
     */
    getHeight() {
        return this.height;
    }
    /**
     * Sets the width of the canvas element, in pixels.
     * @param width The new width.
     */
    setWidth(width) {
        if (width === this.width) {
            return;
        }
        this.width = width;
        if (this.isInit) {
            this.updateCanvasSize();
        }
    }
    /**
     * Sets the height of the canvas element, in pixels.
     * @param height The new height.
     */
    setHeight(height) {
        if (height === this.height) {
            return;
        }
        this.height = height;
        if (this.isInit) {
            this.updateCanvasSize();
        }
    }
    /**
     * Copies the contents of the buffer to the display. Has no effect if this layer does not have a buffer.
     */
    copyBufferToDisplay() {
        if (!this.isInit || !this.props.useBuffer) {
            return;
        }
        this.display.context.drawImage(this.buffer.canvas, 0, 0, this.width, this.height);
    }
    /**
     * A callback called after the component renders.
     */
    onAfterRender() {
        this.displayCanvasContext = this.displayCanvasRef.instance.getContext('2d');
    }
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/no-unused-vars
    onVisibilityChanged(isVisible) {
        if (this.isInit) {
            this.updateCanvasVisibility();
        }
    }
    /**
     * Updates this layer according to its current visibility.
     */
    updateFromVisibility() {
        this.display.canvas.style.display = this.isVisible() ? 'block' : 'none';
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    onAttached() {
        this.initCanvasInstances();
        this.isInit = true;
        this.updateCanvasVisibility();
        this.updateCanvasSize();
    }
    /**
     * Initializes this layer's canvas instances.
     */
    initCanvasInstances() {
        this._display = this.createCanvasInstance(this.displayCanvasRef.instance, this.displayCanvasContext, true);
        if (this.props.useBuffer) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            this._buffer = this.createCanvasInstance(canvas, context, false);
        }
    }
    /**
     * Creates a canvas instance.
     * @param canvas The canvas element.
     * @param context The canvas 2D rendering context.
     * @param isDisplayed Whether the canvas is displayed.
     * @returns a canvas instance.
     */
    createCanvasInstance(canvas, context, isDisplayed) {
        return new MapCanvasLayerCanvasInstanceClass(canvas, context, isDisplayed);
    }
    /**
     * Updates the canvas element's size.
     */
    updateCanvasSize() {
        const displayCanvas = this.display.canvas;
        displayCanvas.width = this.width;
        displayCanvas.height = this.height;
        displayCanvas.style.width = `${this.width}px`;
        displayCanvas.style.height = `${this.height}px`;
        if (this._buffer) {
            const bufferCanvas = this._buffer.canvas;
            bufferCanvas.width = this.width;
            bufferCanvas.height = this.height;
        }
    }
    /**
     * Updates the visibility of the display canvas.
     */
    updateCanvasVisibility() {
        this.display.canvas.style.display = this.isVisible() ? 'block' : 'none';
    }
    /** @inheritdoc */
    render() {
        var _a;
        return (FSComponent.buildComponent("canvas", { ref: this.displayCanvasRef, class: (_a = this.props.class) !== null && _a !== void 0 ? _a : '', width: '0', height: '0', style: 'position: absolute;' }));
    }
}
