/** Scroll utils */
export declare class ScrollUtils {
    /**
     * Scrolls the container to make sure an element is in view.
     * @param el The element to scroll into view in the container.
     * @param container The container to scroll.
     */
    static ensureInView(el: HTMLElement, container: HTMLElement): void;
    /**
     * Finds the offsetTop of an element relative to one of its ancestors.
     * @param element An element.
     * @param ancestor An ancestor of `element`.
     * @returns the offsetTop of the element relative to the ancestor.
     * @throws Error if the offsetTop could not be calculated.
     */
    private static findOffsetTopRelativeToAncestor;
    /**
     * Checks if an element is visible.
     * @param cTop The top coordinate of the scroll container.
     * @param cBottom The bottom coordinate of the scroll container.
     * @param eTop The top coordinate of the element.
     * @param eBottom The bottom coordinate of the element.
     * @returns A boolean.
     */
    private static isElementInViewport;
}
//# sourceMappingURL=ScrollUtils.d.ts.map