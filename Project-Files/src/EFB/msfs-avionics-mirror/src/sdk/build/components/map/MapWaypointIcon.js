/**
 * A blank waypoint icon.
 */
export class MapBlankWaypointIcon {
    /**
     * Constructor.
     * @param waypoint The waypoint associated with this icon.
     * @param priority The render priority of this icon. Icons with higher priorities should be rendered above those
     * with lower priorities.
     */
    constructor(waypoint, priority) {
        this.waypoint = waypoint;
        this.priority = priority;
    }
    /**
     * Does nothing.
     */
    draw() {
        // noop
    }
}
/**
 * An abstract implementation of MapWaypointIcon which supports an arbitrary anchor point and offset.
 */
export class AbstractMapWaypointIcon {
    /**
     * Constructor.
     * @param waypoint The waypoint associated with this icon.
     * @param priority The render priority of this icon. Icons with higher priorities should be rendered above those
     * with lower priorities.
     * @param width The width at which this icon should be rendered, in pixels.
     * @param height The height at which this icon should be rendered, in pixels.
     * @param options Options with which to initialize this icon.
     */
    constructor(waypoint, priority, width, height, options) {
        this.waypoint = waypoint;
        this.priority = priority;
        this.width = width;
        this.height = height;
        /**
         * The anchor point of this icon, expressed relative to its width and height. [0, 0] is the top-left corner, and
         * [1, 1] is the bottom-right corner.
         */
        this.anchor = new Float64Array([0.5, 0.5]);
        /** The offset of this icon from the projected position of its associated waypoint, in pixels. */
        this.offset = new Float64Array(2);
        (options === null || options === void 0 ? void 0 : options.anchor) && this.anchor.set(options.anchor);
        (options === null || options === void 0 ? void 0 : options.offset) && this.offset.set(options.offset);
        this.totalOffsetX = this.offset[0] - this.anchor[0] * this.width;
        this.totalOffsetY = this.offset[1] - this.anchor[1] * this.height;
    }
    /** @inheritdoc */
    draw(context, mapProjection) {
        const projected = mapProjection.project(this.waypoint.location, MapWaypointImageIcon.tempVec2);
        const left = projected[0] + this.totalOffsetX;
        const top = projected[1] + this.totalOffsetY;
        this.drawIconAt(context, mapProjection, left, top);
    }
}
AbstractMapWaypointIcon.tempVec2 = new Float64Array(2);
/**
 * A waypoint icon with an image as the icon's graphic source.
 */
export class MapWaypointImageIcon extends AbstractMapWaypointIcon {
    /**
     * Constructor.
     * @param waypoint The waypoint associated with this icon.
     * @param priority The render priority of this icon. Icons with higher priorities should be rendered above those
     * with lower priorities.
     * @param img This icon's image.
     * @param width The width at which this icon should be rendered, in pixels.
     * @param height The height at which this icon should be rendered, in pixels.
     * @param options Options with which to initialize this icon.
     */
    constructor(waypoint, priority, img, width, height, options) {
        super(waypoint, priority, width, height, options);
        this.img = img;
    }
    /** @inheritdoc */
    drawIconAt(context, mapProjection, left, top) {
        context.drawImage(this.img, left, top, this.width, this.height);
    }
}
/**
 * A waypoint icon with a sprite as the icon's graphic source.
 */
export class MapWaypointSpriteIcon extends AbstractMapWaypointIcon {
    /**
     * Constructor.
     * @param waypoint The waypoint associated with this icon.
     * @param priority The render priority of this icon. Icons with higher priorities should be rendered above those
     * with lower priorities.
     * @param img This icon's sprite's image source.
     * @param frameWidth The frame width of the sprite, in pixels.
     * @param frameHeight The frame height of the sprite, in pixels.
     * @param width The width at which this icon should be rendered, in pixels.
     * @param height The height at which this icon should be rendered, in pixels.
     * @param options Options with which to initialize this icon.
     * @param spriteFrameHandler An optional handler to determine the sprite frame to draw.
     */
    constructor(waypoint, priority, img, frameWidth, frameHeight, width, height, options, spriteFrameHandler) {
        super(waypoint, priority, width, height, options);
        this.img = img;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.spriteFrameHandler = spriteFrameHandler;
    }
    /** @inheritdoc */
    drawIconAt(context, mapProjection, left, top) {
        const spriteIndex = this.getSpriteFrame(mapProjection);
        const rowCount = Math.floor(this.img.naturalHeight / this.frameHeight);
        const colCount = Math.floor(this.img.naturalWidth / this.frameWidth);
        const row = Math.min(rowCount - 1, Math.floor(spriteIndex / colCount));
        const col = Math.min(colCount - 1, spriteIndex % colCount);
        const spriteLeft = col * this.frameWidth;
        const spriteTop = row * this.frameHeight;
        context.drawImage(this.img, spriteLeft, spriteTop, this.frameWidth, this.frameHeight, left, top, this.width, this.height);
    }
    /**
     * Gets the sprite frame to render.
     * @param mapProjection The map projection to use.
     * @returns The sprite frame to render.
     */
    getSpriteFrame(mapProjection) {
        if (this.spriteFrameHandler !== undefined) {
            return this.spriteFrameHandler(mapProjection);
        }
        return 0;
    }
}
