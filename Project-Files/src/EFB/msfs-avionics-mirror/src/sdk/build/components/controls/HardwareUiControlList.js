import { ScrollUtils } from '../../graphics/layout/ScrollUtils';
import { FSComponent } from '../FSComponent';
import { SubscribableArrayEventType } from '../../sub/SubscribableArray';
import { HardwareUiControl, FocusPosition } from './HardwareUiControl';
/**
 * A component that displays a collection of UiControls in a list format.
 */
export class HardwareUiControlList extends HardwareUiControl {
    /**
     * Creates an instance of a ControlList.
     * @param props The props on the ControlList component.
     */
    constructor(props) {
        super(props);
        this.el = FSComponent.createRef();
        this.itemsContainer = FSComponent.createRef();
        /**
         * Sorts the registered controls by the provided ordering comparison function.
         * @param a The first control to compare.
         * @param b The second control to compare.
         * @returns Negative if the first control is less than, zero if equal, positive if greater than.
         */
        this.sortControls = (a, b) => {
            if (this.controlToDataMap !== undefined && this.props.orderBy !== undefined) {
                const aData = this.controlToDataMap.get(a);
                const bData = this.controlToDataMap.get(b);
                if (aData !== undefined && bData !== undefined) {
                    return this.props.orderBy(aData, bData);
                }
            }
            return 0;
        };
        if (props.orderBy !== undefined) {
            this.dataToControlMap = new Map();
            this.controlToElementMap = new Map();
            this.controlToDataMap = new Map();
            this.currentControlOrder = [];
        }
    }
    /** @inheritdoc */
    onAfterRender(node) {
        super.onAfterRender(node);
        if (this.props.itemSize !== undefined && this.props.numItems !== undefined) {
            const listSizePx = (this.props.itemSize * this.props.numItems).toFixed(4);
            this.el.instance.style.height = listSizePx;
            this.itemsContainer.instance.style.height = listSizePx;
        }
        this.renderList();
        this.props.data.sub(this.onDataChanged.bind(this));
    }
    /**
     * A callback fired when the array subject data changes.
     * @param index The index of the change.
     * @param type The type of change.
     * @param data The item that was changed.
     */
    onDataChanged(index, type, data) {
        switch (type) {
            case SubscribableArrayEventType.Added:
                this.onDataAdded(index, data);
                break;
            case SubscribableArrayEventType.Removed:
                this.onDataRemoved(index, data);
                break;
            case SubscribableArrayEventType.Cleared:
                this.onDataCleared();
                break;
        }
    }
    /**
     * An event called when data is added to the subscription.
     * @param index The index that the data was added at.
     * @param data The data that was added.
     */
    onDataAdded(index, data) {
        if (data !== undefined) {
            const currentItemElement = this.itemsContainer.instance.children.item(index);
            if (Array.isArray(data)) {
                for (let i = 0; i < data.length; i++) {
                    const dataItem = data[i];
                    const indexToAdd = index + i;
                    this.addDataItem(dataItem, indexToAdd, currentItemElement);
                }
            }
            else {
                this.addDataItem(data, index, currentItemElement);
            }
        }
        this.updateOrder();
    }
    /**
     * Adds a data item to the control list and performs the required rendering and
     * ordering operations.
     * @param dataItem The data item to add to the list.
     * @param indexToAdd The index to add the item at.
     * @param currentItemElement The current DOM element that resides at the location to add to.
     */
    addDataItem(dataItem, indexToAdd, currentItemElement) {
        const controlNode = this.props.renderItem(dataItem, indexToAdd);
        const control = controlNode.instance;
        //Nefariously monkey-patch the onFocused handler to get notified when the item is focused,
        //regardless of the underlying implementation or overrides
        const originalOnFocused = control.onFocused.bind(control);
        control.onFocused = (source) => {
            this.onItemFocused();
            originalOnFocused && originalOnFocused(source);
        };
        const element = this.renderToDom(controlNode, indexToAdd, currentItemElement);
        this.register(controlNode.instance, indexToAdd);
        if (element !== null && controlNode.instance !== null) {
            this.addToOrderTracking(controlNode.instance, dataItem, element);
        }
    }
    /**
     * An event called when data is removed from the subscription.
     * @param index The index that the data was removed at.
     * @param data The data that was removed;
     */
    onDataRemoved(index, data) {
        if (index >= 0 && index < this.length) {
            if (Array.isArray(data)) {
                for (let i = 0; i < data.length; i++) {
                    const dataItem = data[i];
                    this.removeDataItem(dataItem, index);
                }
            }
            else if (data !== undefined) {
                this.removeDataItem(data, index);
            }
            this.updateOrder();
        }
    }
    /**
     * Removes a data item from the control list.
     * @param data The data item to remove.
     * @param index The index of the data that was removed.
     */
    removeDataItem(data, index) {
        if (this.dataToControlMap !== undefined && this.registeredControls !== undefined) {
            const control = this.dataToControlMap.get(data);
            if (control !== undefined) {
                index = this.registeredControls.indexOf(control);
            }
        }
        let control;
        if (this.registeredControls !== undefined) {
            control = this.registeredControls[index];
        }
        this.unregister(index);
        this.removeDomNode(index);
        this.removeFromOrderTracking(data);
        control === null || control === void 0 ? void 0 : control.destroy();
    }
    /**
     * An event called when the data is cleared in the subscription.
     */
    onDataCleared() {
        let controls;
        if (this.registeredControls !== undefined) {
            controls = [...this.registeredControls];
        }
        this.clearRegistered();
        this.itemsContainer.instance.innerHTML = '';
        this.clearOrderTracking();
        if (controls !== undefined) {
            for (let i = 0; i < controls.length; i++) {
                controls[i].destroy();
            }
        }
        if (this.props.onItemSelected) {
            this.props.onItemSelected(null, null, -1);
        }
    }
    /**
     * Adds a data item to element order tracking information.
     * @param control The index to add the data item at.
     * @param data The data to add tracking information for.
     * @param element The DOM element to associate with this data item.
     */
    addToOrderTracking(control, data, element) {
        if (this.controlToElementMap !== undefined && this.dataToControlMap !== undefined && this.controlToDataMap !== undefined) {
            this.dataToControlMap.set(data, control);
            this.controlToElementMap.set(control, element);
            this.controlToDataMap.set(control, data);
        }
    }
    /**
     * Removes a data item from element order tracking information.
     * @param data The data item to remove order tracking information for.
     */
    removeFromOrderTracking(data) {
        if (this.controlToElementMap !== undefined && this.dataToControlMap !== undefined && this.controlToDataMap !== undefined) {
            const control = this.dataToControlMap.get(data);
            if (control !== undefined) {
                this.dataToControlMap.delete(data);
                this.controlToElementMap.delete(control);
                this.controlToDataMap.delete(control);
            }
        }
    }
    /**
     * Clears all data item element order tracking information.
     */
    clearOrderTracking() {
        if (this.controlToElementMap !== undefined && this.dataToControlMap !== undefined && this.controlToDataMap !== undefined) {
            this.dataToControlMap.clear();
            this.controlToElementMap.clear();
            this.controlToDataMap.clear();
        }
    }
    /**
     * Updates the order of data items in the list by the props supplied
     * comparison function, if one exists.
     */
    updateOrder() {
        if (this.controlToElementMap !== undefined && this.dataToControlMap !== undefined && this.controlToDataMap !== undefined) {
            const itemsContainer = this.itemsContainer.instance;
            if (this.registeredControls !== undefined) {
                const selectedControl = this.getChild(this.getFocusedIndex());
                this.registeredControls.sort(this.sortControls);
                if (!this.orderUnchanged()) {
                    for (let i = 0; i < this.registeredControls.length; i++) {
                        const element = this.controlToElementMap.get(this.registeredControls[i]);
                        if (element !== undefined) {
                            itemsContainer.appendChild(element);
                        }
                    }
                    this.currentControlOrder = [...this.registeredControls];
                    if (selectedControl !== undefined) {
                        this.focusedIndex = this.registeredControls.indexOf(selectedControl);
                        this.ensureIndexInView(this.focusedIndex);
                    }
                }
            }
        }
    }
    /**
     * Checks whether or not the control order is the same as it was previously.
     * @returns True if the order is the same, false otherwise.
     */
    orderUnchanged() {
        if (this.registeredControls !== undefined && this.currentControlOrder !== undefined) {
            if (this.registeredControls.length === this.currentControlOrder.length) {
                return this.registeredControls.every((control, i) => this.currentControlOrder && control === this.currentControlOrder[i]);
            }
            return false;
        }
        return true;
    }
    /**
     * Removes a dom node from the collection at the specified index.
     * @param index The index to remove.
     */
    removeDomNode(index) {
        const child = this.itemsContainer.instance.childNodes.item(index);
        this.itemsContainer.instance.removeChild(child);
    }
    /**
     * Adds a list rendered dom node to the collection.
     * @param node Item to render and add.
     * @param index The index to add at.
     * @param el The element to add to.
     * @returns The created DOM element.
     */
    renderToDom(node, index, el) {
        if (el !== null) {
            node && el && FSComponent.renderBefore(node, el);
            return el.previousElementSibling;
        }
        else {
            el = this.itemsContainer.instance;
            node && el && FSComponent.render(node, el);
            return this.itemsContainer.instance.lastElementChild;
        }
    }
    /**
     * Scrolls to an item.
     * @param index is the index of the list item to scroll to.
     * @param focusPosition The focus position to apply to children of the item being scrolled to.
     */
    scrollToIndex(index, focusPosition = FocusPosition.First) {
        const control = this.getChild(index);
        if (control !== undefined) {
            control.focus(focusPosition);
        }
    }
    /**
     * Ensures an indexed list item is in view.
     * @param index The index of the list item.
     */
    ensureIndexInView(index) {
        var _a, _b;
        const el = this.getElement(index);
        const container = (_b = (_a = this.props.scrollContainer) === null || _a === void 0 ? void 0 : _a.getOrDefault()) !== null && _b !== void 0 ? _b : this.itemsContainer.getOrDefault();
        if (el && container) {
            ScrollUtils.ensureInView(el, container);
        }
    }
    /**
     * Gets an element at the specified data/control index.
     * @param index The data/control index to get the element for.
     * @returns The request HTML element.
     */
    getElement(index) {
        var _a;
        return (_a = this.itemsContainer.instance.children[index]) !== null && _a !== void 0 ? _a : null;
    }
    /**
     * Gets the data object related to the selected DOM element.
     * @param index The index of the data to get.
     * @returns The selected item, if found.
     */
    getData(index) {
        var _a;
        const control = this.getChild(index);
        if (this.controlToDataMap !== undefined && control !== undefined) {
            return (_a = this.controlToDataMap.get(control)) !== null && _a !== void 0 ? _a : null;
        }
        if (index > -1) {
            return this.props.data.get(index);
        }
        return null;
    }
    /**
     * Get the selected HTMLElement.
     * @returns The selected element, if found.
     */
    getSelectedElement() {
        var _a;
        return (_a = this.itemsContainer.instance.children[this.getSelectedIndex()]) !== null && _a !== void 0 ? _a : null;
    }
    /**
     * Gets the index of the currently selected element.
     * @returns Selected element index. Returns -1 if nothing found.
     */
    getSelectedIndex() {
        if (this.length > 0) {
            return this.getFocusedIndex();
        }
        return -1;
    }
    /**
     * Gets the instance of the node at the specified index.
     * @param index The index to get the instance for.
     * @returns The node instance of specified type.
     */
    getChildInstance(index) {
        const child = this.getChild(index);
        if (child !== undefined) {
            return child;
        }
        return null;
    }
    /** @inheritdoc */
    onBlurred(source) {
        if (this.props.onItemSelected) {
            this.props.onItemSelected(null, null, -1);
        }
        super.onBlurred(source);
    }
    /**
     * Responds to when a list item is focused.
     */
    onItemFocused() {
        const index = this.getFocusedIndex();
        this.ensureIndexInView(index);
        if (this.props.onItemSelected) {
            const control = this.getChild(index);
            if (control !== undefined && control.isFocused) {
                let data = this.props.data.get(index);
                if (this.controlToDataMap !== undefined) {
                    data = this.controlToDataMap.get(control);
                }
                if (data !== undefined) {
                    this.props.onItemSelected(data, control, index);
                }
            }
        }
    }
    /**
     * Renders the complete list of data items as control components.
     */
    renderList() {
        this.itemsContainer.instance.textContent = '';
        this.onDataAdded(0, this.props.data.getArray());
    }
    /** @inheritdoc */
    render() {
        var _a;
        return (FSComponent.buildComponent("div", { class: `ui-control-list ${(_a = this.props.class) !== null && _a !== void 0 ? _a : ''}`, ref: this.el },
            FSComponent.buildComponent("div", { ref: this.itemsContainer, class: 'ui-control-list-content' }),
            !this.props.hideScrollbar && this.renderScrollbar()));
    }
}
