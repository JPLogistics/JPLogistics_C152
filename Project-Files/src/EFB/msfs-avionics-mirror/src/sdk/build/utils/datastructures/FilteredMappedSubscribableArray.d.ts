import { AbstractSubscribableArray } from '../../sub/AbstractSubscribableArray';
import { SubscribableArray } from '../../sub/SubscribableArray';
/**
 * A subscribable which provides a filtered version of a source SubscribableArray.
 */
export declare class FilteredMappedSubscribableArray<T> extends AbstractSubscribableArray<T> {
    private readonly source;
    private filterFunc;
    private filtered;
    private readonly sourceSub;
    /** @inheritdoc */
    get length(): number;
    /**
     * Private constructor for a FilteredMappedSubscribableArray.
     * @param source The source array subject for this subscribable.
     * @param filterFunc The filter function to use to prune members.  Should return false for filtered-out elements.
     */
    private constructor();
    /**
     * Public creation method for a new FilteredMappedSubscribableArray.
     * @param source The source array subject for the new mapped array.
     * @param filterFunc The filter function to use to prune members.  Should return false for filtered-out elements.
     * @returns A new SortedMappedSubscribableArray.
     */
    static create<CT>(source: SubscribableArray<CT>, filterFunc: (a: CT) => boolean): FilteredMappedSubscribableArray<CT>;
    /**
     * Responds to changes in this subscribable's source array.
     * @param index The index of the change.
     * @param type The type of change.
     * @param item The item(s) involved in the change, if any.
     */
    private onSourceChanged;
    /**
     * Set a new filter for this array.
     * @param filterFunc The new filter function.
     */
    setFilter(filterFunc: (a: T) => boolean): void;
    /**
     * Takes an element or array of elements and returns an array of only those passing the filter.
     * @param elements An element or array of elements to run through the filter.
     * @returns A new list composed of only those elements which pass the filter.
     */
    private filter;
    /**
     * Inserts elements into this array.
     * @param elements An element or array of elements to insert.
     */
    private insert;
    /**
     * Finds the index of the first element in this array which equals a query element.
     * @param element The query element.
     * @returns The index of the first matching element, or -1 if no such element.
     */
    private searchEquals;
    /**
     * Removes elements from this array.
     * @param elements An element or array of elements to remove.
     */
    private remove;
    /**
     * Removes a single element from the array.
     * @param element The element to remove.
     */
    private removeElement;
    /** @inheritdoc */
    getArray(): readonly T[];
    /**
     * Destroys this subscribable. After destruction, this subscribable will no longer update in response to changes
     * made to its source.
     */
    destroy(): void;
}
//# sourceMappingURL=FilteredMappedSubscribableArray.d.ts.map