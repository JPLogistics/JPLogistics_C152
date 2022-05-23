import { AbstractSubscribableArray } from '../../sub/AbstractSubscribableArray';
import { SubscribableArrayEventType } from '../../sub/SubscribableArray';
/**
 * A subscribable which provides a filtered version of a source SubscribableArray.
 */
export class FilteredMappedSubscribableArray extends AbstractSubscribableArray {
    /**
     * Private constructor for a FilteredMappedSubscribableArray.
     * @param source The source array subject for this subscribable.
     * @param filterFunc The filter function to use to prune members.  Should return false for filtered-out elements.
     */
    constructor(source, filterFunc) {
        super();
        this.source = source;
        this.filterFunc = filterFunc;
        this.filtered = new Array();
        this.sourceSub = source.sub(this.onSourceChanged.bind(this), true);
    }
    /** @inheritdoc */
    get length() {
        return this.filtered.length;
    }
    /**
     * Public creation method for a new FilteredMappedSubscribableArray.
     * @param source The source array subject for the new mapped array.
     * @param filterFunc The filter function to use to prune members.  Should return false for filtered-out elements.
     * @returns A new SortedMappedSubscribableArray.
     */
    static create(source, filterFunc) {
        return new FilteredMappedSubscribableArray(source, filterFunc);
    }
    /**
     * Responds to changes in this subscribable's source array.
     * @param index The index of the change.
     * @param type The type of change.
     * @param item The item(s) involved in the change, if any.
     */
    onSourceChanged(index, type, item) {
        switch (type) {
            case SubscribableArrayEventType.Cleared:
                if (this.filtered.length !== 0) {
                    this.filtered = [];
                    this.notify(0, SubscribableArrayEventType.Cleared);
                }
                break;
            case SubscribableArrayEventType.Added:
                if (item) {
                    this.insert(item);
                }
                break;
            case SubscribableArrayEventType.Removed:
                if (item) {
                    this.remove(item);
                }
                break;
        }
    }
    /**
     * Set a new filter for this array.
     * @param filterFunc The new filter function.
     */
    setFilter(filterFunc) {
        this.filterFunc = filterFunc;
        this.filtered = [];
        this.notify(0, SubscribableArrayEventType.Cleared);
        this.insert(this.source.getArray());
    }
    /**
     * Takes an element or array of elements and returns an array of only those passing the filter.
     * @param elements An element or array of elements to run through the filter.
     * @returns A new list composed of only those elements which pass the filter.
     */
    filter(elements) {
        if (elements instanceof Array) {
            return elements.filter(this.filterFunc);
        }
        else {
            return this.filterFunc(elements) ? [elements] : [];
        }
    }
    /**
     * Inserts elements into this array.
     * @param elements An element or array of elements to insert.
     */
    insert(elements) {
        const filtered = this.filter(elements);
        if (filtered.length > 0) {
            this.filtered.push(...filtered);
            this.notify(0, SubscribableArrayEventType.Added, filtered);
        }
    }
    /**
     * Finds the index of the first element in this array which equals a query element.
     * @param element The query element.
     * @returns The index of the first matching element, or -1 if no such element.
     */
    searchEquals(element) {
        for (let i = 0; i < this.filtered.length; i++) {
            if (this.filtered[i] === element) {
                return i;
            }
        }
        return -1;
    }
    /**
     * Removes elements from this array.
     * @param elements An element or array of elements to remove.
     */
    remove(elements) {
        if (elements instanceof Array) {
            for (let i = 0; i < elements.length; i++) {
                this.removeElement(elements[i]);
            }
        }
        else {
            this.removeElement(elements);
        }
    }
    /**
     * Removes a single element from the array.
     * @param element The element to remove.
     */
    removeElement(element) {
        const removedIndex = this.searchEquals(element);
        if (removedIndex >= 0) {
            this.filtered.splice(removedIndex, 1);
            this.notify(removedIndex, SubscribableArrayEventType.Removed, element);
        }
    }
    /** @inheritdoc */
    getArray() {
        return this.filtered;
    }
    /**
     * Destroys this subscribable. After destruction, this subscribable will no longer update in response to changes
     * made to its source.
     */
    destroy() {
        this.sourceSub.destroy();
    }
}
