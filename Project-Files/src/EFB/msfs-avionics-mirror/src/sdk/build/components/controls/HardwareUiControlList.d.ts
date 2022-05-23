import { NodeReference, VNode } from '../FSComponent';
import { SubscribableArray } from '../../sub/SubscribableArray';
import { HardwareUiControl, HardwareUiControlProps, FocusPosition } from './HardwareUiControl';
/**
 * Properties on the ControlList component.
 */
export interface HardwareControlListProps<T> extends HardwareUiControlProps {
    /** The data associated with this list component. */
    data: SubscribableArray<T>;
    /** A function that renders a single data item into the list. */
    renderItem: (data: T, index: number) => VNode;
    /** A callback called when an item in the list is selected. */
    onItemSelected?: (data: T | null, node: HardwareUiControl | null, index: number) => void;
    /** Indicates that the list should be ordered by a specified function. */
    orderBy?: (a: T, b: T) => number;
    /** The size, in pixels, of each item in the list. */
    itemSize?: number;
    /** The max number of items to display in the list. */
    numItems?: number;
    /** Whether or not to hide the list scrollbar. */
    hideScrollbar?: boolean;
    /** The CSS class to apply to this list container. */
    class?: string;
    /** An alternate HTML element to scroll to ensure the selected element is in view. */
    scrollContainer?: NodeReference<HTMLElement>;
}
/**
 * A component that displays a collection of UiControls in a list format.
 */
export declare abstract class HardwareUiControlList<T, E extends Record<string, any> = Record<string, never>, P extends HardwareControlListProps<T> = HardwareControlListProps<T>> extends HardwareUiControl<E, P> {
    private readonly el;
    private readonly itemsContainer;
    private dataToControlMap;
    private controlToElementMap;
    private controlToDataMap;
    private currentControlOrder;
    /**
     * Creates an instance of a ControlList.
     * @param props The props on the ControlList component.
     */
    constructor(props: P);
    /** @inheritdoc */
    onAfterRender(node: VNode): void;
    /**
     * A callback fired when the array subject data changes.
     * @param index The index of the change.
     * @param type The type of change.
     * @param data The item that was changed.
     */
    private onDataChanged;
    /**
     * An event called when data is added to the subscription.
     * @param index The index that the data was added at.
     * @param data The data that was added.
     */
    private onDataAdded;
    /**
     * Adds a data item to the control list and performs the required rendering and
     * ordering operations.
     * @param dataItem The data item to add to the list.
     * @param indexToAdd The index to add the item at.
     * @param currentItemElement The current DOM element that resides at the location to add to.
     */
    private addDataItem;
    /**
     * An event called when data is removed from the subscription.
     * @param index The index that the data was removed at.
     * @param data The data that was removed;
     */
    private onDataRemoved;
    /**
     * Removes a data item from the control list.
     * @param data The data item to remove.
     * @param index The index of the data that was removed.
     */
    private removeDataItem;
    /**
     * An event called when the data is cleared in the subscription.
     */
    private onDataCleared;
    /**
     * Adds a data item to element order tracking information.
     * @param control The index to add the data item at.
     * @param data The data to add tracking information for.
     * @param element The DOM element to associate with this data item.
     */
    private addToOrderTracking;
    /**
     * Removes a data item from element order tracking information.
     * @param data The data item to remove order tracking information for.
     */
    private removeFromOrderTracking;
    /**
     * Clears all data item element order tracking information.
     */
    private clearOrderTracking;
    /**
     * Updates the order of data items in the list by the props supplied
     * comparison function, if one exists.
     */
    updateOrder(): void;
    /**
     * Checks whether or not the control order is the same as it was previously.
     * @returns True if the order is the same, false otherwise.
     */
    private orderUnchanged;
    /**
     * Sorts the registered controls by the provided ordering comparison function.
     * @param a The first control to compare.
     * @param b The second control to compare.
     * @returns Negative if the first control is less than, zero if equal, positive if greater than.
     */
    private sortControls;
    /**
     * Removes a dom node from the collection at the specified index.
     * @param index The index to remove.
     */
    private removeDomNode;
    /**
     * Adds a list rendered dom node to the collection.
     * @param node Item to render and add.
     * @param index The index to add at.
     * @param el The element to add to.
     * @returns The created DOM element.
     */
    private renderToDom;
    /**
     * Scrolls to an item.
     * @param index is the index of the list item to scroll to.
     * @param focusPosition The focus position to apply to children of the item being scrolled to.
     */
    scrollToIndex(index: number, focusPosition?: FocusPosition): void;
    /**
     * Ensures an indexed list item is in view.
     * @param index The index of the list item.
     */
    ensureIndexInView(index: number): void;
    /**
     * Gets an element at the specified data/control index.
     * @param index The data/control index to get the element for.
     * @returns The request HTML element.
     */
    private getElement;
    /**
     * Gets the data object related to the selected DOM element.
     * @param index The index of the data to get.
     * @returns The selected item, if found.
     */
    getData(index: number): T | null;
    /**
     * Get the selected HTMLElement.
     * @returns The selected element, if found.
     */
    getSelectedElement(): HTMLElement | null;
    /**
     * Gets the index of the currently selected element.
     * @returns Selected element index. Returns -1 if nothing found.
     */
    getSelectedIndex(): number;
    /**
     * Gets the instance of the node at the specified index.
     * @param index The index to get the instance for.
     * @returns The node instance of specified type.
     */
    getChildInstance<TControl extends HardwareUiControl<E>>(index: number): TControl | null;
    /** @inheritdoc */
    protected onBlurred(source: HardwareUiControl<E, P>): void;
    /**
     * Responds to when a list item is focused.
     */
    private onItemFocused;
    /**
     * Renders the complete list of data items as control components.
     */
    private renderList;
    /**
     * Renders the control list scroll bar.
     */
    protected abstract renderScrollbar(): VNode;
    /** @inheritdoc */
    render(): VNode;
}
//# sourceMappingURL=HardwareUiControlList.d.ts.map