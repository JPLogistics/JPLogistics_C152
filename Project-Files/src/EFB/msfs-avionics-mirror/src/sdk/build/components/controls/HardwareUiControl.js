import { DisplayComponent, FSComponent } from '../FSComponent';
/**
 * The item position to focus a component's children when performing a focus operation.
 */
export var FocusPosition;
(function (FocusPosition) {
    /** The component's most recently focused descendants will be focused. */
    FocusPosition["MostRecent"] = "MostRecent";
    /** The first focus-able child at each node in the descendant tree will be focused. */
    FocusPosition["First"] = "First";
    /** The last focus-able child at each node in the descendant tree will be focused. */
    FocusPosition["Last"] = "Last";
    /** No child components will be focused. */
    FocusPosition["None"] = "None";
})(FocusPosition || (FocusPosition = {}));
/**
 * A strategy to focus a component's children as part of a blur reconciliation operation.
 */
export var BlurReconciliation;
(function (BlurReconciliation) {
    /** The component's first focus-able child will be focused. */
    BlurReconciliation["First"] = "First";
    /** The component's last focus-able child will be focused. */
    BlurReconciliation["Last"] = "Last";
    /**
     * The component's next focus-able child after the child that was blurred will be focused. If no such child exists,
     * then the last focus-able child before the child that was blurred will be focused.
     */
    BlurReconciliation["Next"] = "Next";
    /**
     * The component's last focus-able child before the child that was blurred will be focused. If no such child exists,
     * then the next focus-able child after the child that was blurred will be focused.
     */
    BlurReconciliation["Prev"] = "Prev";
    /** No child components will be focused. */
    BlurReconciliation["None"] = "None";
})(BlurReconciliation || (BlurReconciliation = {}));
/**
 * An abstract implementation of a component that forms the base of a Garmin-like UI control system. Subclasses should
 * implement an appropriate event handler interface (using the utility type `UiControlEventHandlers<Events>`) and have
 * their props implement the corresponding prop event handler interface (using the utility type
 * `UiControlPropEventHandlers<Events>`).
 * @template E An event definition type for events supported by this control.
 * @template P The component prop type for this control.
 */
export class HardwareUiControl extends DisplayComponent {
    /**
     * Creates an instance of a HardwareUiControl.
     * @param props The props for this component.
     */
    constructor(props) {
        super(props);
        this.focusedIndex = -1;
        this._isDisabled = false;
        this._isFocused = false;
        this._isIsolated = false;
        this._UICONTROL_ = true;
        this._isIsolated = this.props.isolateScroll !== undefined && this.props.isolateScroll;
    }
    /**
     * Gets the current number of registered child controls.
     * @returns The current number of registered child controls.
     */
    get length() {
        if (this.registeredControls !== undefined) {
            return this.registeredControls.length;
        }
        return 0;
    }
    /**
     * Gets whether or not the control is currently disabled.
     * @returns True if disabled, false otherwise.
     */
    get isDisabled() {
        return this._isDisabled;
    }
    /**
     * Gets whether or not the control is currently focused.
     * @returns True if disabled, false otherwise.
     */
    get isFocused() {
        return this._isFocused;
    }
    /**
     * Gets whether or not the control is currently in scroll isolation.
     * @returns True if currently in scroll isolation, false otherwise.
     */
    get isIsolated() {
        return this._isIsolated;
    }
    /**
     * An event called when the control receives focus.
     * @param source The control that emitted this event.
     */
    onFocused(source) {
        this.props.onFocused && this.props.onFocused(source);
    }
    /**
     * An event called when the control is blurred.
     * @param source The control that emitted this event.
     */
    onBlurred(source) {
        this.props.onBlurred && this.props.onBlurred(source);
    }
    /**
     * An event called when the control is enabled.
     * @param source The control that emitted this event.
     */
    onEnabled(source) {
        this.props.onEnabled && this.props.onEnabled(source);
    }
    /**
     * An event called when the control is disabled.
     * @param source The control that emitted this event.
     */
    onDisabled(source) {
        this.props.onDisabled && this.props.onDisabled(source);
    }
    /**
     * An event called when a control is registered with this control.
     * @param source The control that emitted this event.
     */
    onRegistered(source) {
        this.props.onRegistered && this.props.onRegistered(source);
    }
    /**
     * An event called when a control is unregistered from this control.
     * @param source The control that emitted this event.
     */
    onUnregistered(source) {
        this.props.onUnregistered && this.props.onUnregistered(source);
    }
    /**
     * Gets the focus position to apply when this control is focused from a scroll.
     * @param direction The direction of the scroll.
     * @returns The focus position to apply when this control is focused from a scroll.
     */
    getFocusPositionOnScroll(direction) {
        if (this.props.getFocusPositionOnScroll) {
            return this.props.getFocusPositionOnScroll(direction);
        }
        return direction === 'forward' ? FocusPosition.First : FocusPosition.Last;
    }
    /**
     * An event called when the control is scrolled.
     * @param direction The direction that is being requested to scroll.
     * @returns True if this control handled this event, false otherwise.
     */
    onScroll(direction) {
        if (this.registeredControls !== undefined && this.registeredControls.length > 0) {
            const delta = direction === 'forward' ? 1 : -1;
            for (let i = this.focusedIndex + delta; direction === 'forward' ? i < this.registeredControls.length : i >= 0; i += delta) {
                const controlToFocus = this.registeredControls[i];
                if (controlToFocus.focus(controlToFocus.getFocusPositionOnScroll(direction))) {
                    this.onAfterScroll(controlToFocus, i);
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * An event called when a scroll operation has completed.
     * @param control The control that was scrolled to.
     * @param index The index of the control in the collection of registered controls.
     */
    onAfterScroll(control, index) {
        this.props.onAfterScroll && this.props.onAfterScroll(control, index);
    }
    /**
     * Scrolls the currently focused control in the supplied direction.
     * @param direction The direction that is being requested to scroll.
     * @returns True if propagation should be stopped, false otherwise.
     */
    scroll(direction) {
        if (!this.isFocused) {
            return false;
        }
        const controlToScroll = this.getFocusedComponentPath()[0];
        if (controlToScroll !== undefined) {
            return controlToScroll.tryPerformScroll(direction);
        }
        else {
            return this.tryPerformScroll(direction);
        }
    }
    /**
     * Attempts to perform a scroll operation on the control, propagating the operation
     * upward in the tree if the control does not handle the operation.
     * @param direction The direction that is being requested to scroll.
     * @returns True if propagation should be stopped, false otherwise.
     */
    tryPerformScroll(direction) {
        let handled = false;
        if (this.props.onScroll !== undefined) {
            handled = this.props.onScroll(direction);
        }
        else {
            handled = this.onScroll(direction);
        }
        if (!handled) {
            const currentlyIsolated = this.isFocused && this.isIsolated;
            if (this.parent !== undefined && !currentlyIsolated) {
                return this.parent.tryPerformScroll(direction);
            }
            else if (currentlyIsolated) {
                return true;
            }
        }
        return handled;
    }
    /**
     * Triggers an event on this control. The event will first be routed to the deepest focused descendent of this
     * control and will propagate up the control tree until it is handled or there are no more controls to which to
     * propagate.
     * @param event The event to trigger.
     * @param source The source of the event. Defaults to this if not supplied.
     * @param args Additional arguments to pass to the event handler.
     * @returns True if the event was handled, false otherwise.
     */
    triggerEvent(event, source, ...args) {
        const canListen = this.isFocused || this.parent === undefined;
        if (!canListen) {
            return false;
        }
        const focusedControl = this.getFocusedComponentPath()[0];
        if (focusedControl !== undefined) {
            return focusedControl.propagateEvent(event, focusedControl, args);
        }
        return false;
    }
    /**
     * Propagates an event up the control tree.
     * @param event The event to propagate.
     * @param source The source of the event.
     * @param args Additional arguments to pass to the event handler.
     * @returns True if the event was handled, false otherwise.
     */
    propagateEvent(event, source, args) {
        const handler = this[`on${event}`];
        const propHandler = this.props[`on${event}`];
        // Class-defined handlers get priority over prop-defined handlers
        // Prop-defined handlers are not called if a class-defined handler exists -> this is to allow subclasses to
        // restrict which events get sent to prop-defined handlers if they choose.
        const stopPropagation = (!!handler && handler.call(this, source, ...args)) || (!!propHandler && propHandler(source, ...args));
        if (!stopPropagation && this.parent !== undefined) {
            return this.parent.propagateEvent(event, this.parent, args);
        }
        return stopPropagation;
    }
    /**
     * Validates that the control can be focused by checking if any ancestors in the
     * control tree are disabled.
     * @returns True if there are no disabled ancestors, false otherwise.
     */
    canBeFocused() {
        let canFocus = true;
        if (!this._isDisabled) {
            if (this.parent !== undefined) {
                canFocus = this.parent.canBeFocused();
            }
        }
        else {
            canFocus = false;
        }
        return canFocus;
    }
    /**
     * Brings focus to the control. Focusing the control will also blur the currently
     * focused control, if any.
     * @param focusPosition The focus position to activate for descendents of this control.
     * @returns Whether this control was successfully focused.
     */
    focus(focusPosition) {
        if (!this.canBeFocused()) {
            return false;
        }
        const focusStack = this.buildFocusPath(focusPosition);
        if (focusStack.length === 0) {
            return false;
        }
        // Top of the stack is always 'this', and will be repeated by getFocusRootPath() if we don't remove it
        focusStack.pop();
        this.getDeepestFocusedAncestorPath(focusStack);
        const focusRoot = focusStack[focusStack.length - 1];
        const blurStack = focusRoot.getFocusedComponentPath();
        if (blurStack.length > 0) {
            // Top of the blur stack is the deepest common ancestor of the old focused leaf and this control.
            // This ancestor will be focused after this operation, so we need to remove it from the blur stack.
            blurStack.pop();
            for (let i = 0; i < blurStack.length; i++) {
                blurStack[i]._isFocused = false;
            }
        }
        // Top of the focus stack is the deepest common ancestor of the old focused leaf and this control, OR the root of
        // the control tree if nothing in the tree is focused -> either way, the control will be focused after this
        // operation, so if the control is already focused, we need to remove it from the focus stack.
        if (focusRoot.isFocused) {
            focusStack.pop();
        }
        for (let i = 0; i < focusStack.length; i++) {
            const control = focusStack[i];
            const parent = control.parent;
            control._isFocused = true;
            if (parent !== undefined && parent.registeredControls !== undefined) {
                parent.focusedIndex = parent.registeredControls.indexOf(control);
            }
        }
        while (blurStack.length > 0) {
            const control = blurStack.pop();
            if (control !== undefined) {
                control.onBlurred(control);
            }
        }
        while (focusStack.length > 0) {
            const control = focusStack.pop();
            if (control !== undefined) {
                control.onFocused(control);
            }
        }
        return true;
    }
    /**
     * Gets the path from this control to the deepest descendent control that is focused. If this control is not focused,
     * then the path is empty.
     * @param path The stack of control nodes defining the path to the currently
     * focused descendent control.
     * @returns A stack of nodes that defines the path to the deepest focused descendent
     * node, in order of deepest descendent first.
     */
    getFocusedComponentPath(path) {
        if (path === undefined) {
            path = [];
        }
        if (!this._isFocused) {
            return path;
        }
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let currentControl = this;
        while (currentControl !== undefined) {
            path.splice(0, 0, currentControl);
            if (currentControl.registeredControls !== undefined) {
                currentControl = currentControl.registeredControls.find(c => c.isFocused);
            }
            else {
                currentControl = undefined;
            }
        }
        return path;
    }
    /**
     * Gets the path from this control to its deepest ancestor that is focused (including itself). If none of this
     * control's ancestors are focused, the path will contain this control and all of its ancestors up to and including
     * the root of its control tree.
     * @param path An array in which to store the path.
     * @returns A stack of controls that defines the path from this control to its deepest focused ancestor, ordered
     * from descendents to ancestors (the control at the shallowest tree depth is located at the top of the stack).
     */
    getDeepestFocusedAncestorPath(path) {
        if (path === undefined) {
            path = [];
        }
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let currentControl = this;
        while (currentControl !== undefined) {
            path.push(currentControl);
            if (currentControl !== this && currentControl.isFocused) {
                break;
            }
            currentControl = currentControl.parent;
        }
        return path;
    }
    /**
     * Builds the path of controls to focus from this control downward in children based on the provided default focus
     * position. If this control cannot be focused, the path will be empty.
     * @param focusPosition The focus position to use to build the path.
     * @param focusStack The stack in which to store the path.
     * @returns A stack of components that defines the path from the deepest descendent to focus to this control if this
     * control were to be focused with the specified focus position, ordered from descendents to ancestors (the control
     * at the shallowest tree depth is located at the top of the stack).
     */
    buildFocusPath(focusPosition, focusStack) {
        var _a;
        if (focusStack === undefined) {
            focusStack = [];
        }
        if (this._isDisabled) {
            return focusStack;
        }
        //focusStack.splice(0, 0, currentControl);
        const originalStackDepth = focusStack.length;
        const childControls = this.registeredControls;
        if (childControls !== undefined) {
            switch (focusPosition) {
                case FocusPosition.MostRecent:
                    // Attempt to focus the most recent focused child. If this fails, fall back to FocusPosition.First.
                    (_a = childControls[this.focusedIndex]) === null || _a === void 0 ? void 0 : _a.buildFocusPath(FocusPosition.MostRecent, focusStack);
                    if (focusStack.length > originalStackDepth) {
                        break;
                    }
                // eslint-disable-next-line no-fallthrough
                case FocusPosition.First:
                    for (let i = 0; i < childControls.length; i++) {
                        childControls[i].buildFocusPath(FocusPosition.First, focusStack);
                        if (focusStack.length > originalStackDepth) {
                            break;
                        }
                    }
                    break;
                case FocusPosition.Last:
                    for (let i = childControls.length - 1; i >= 0; i--) {
                        childControls[i].buildFocusPath(FocusPosition.Last, focusStack);
                        if (focusStack.length > originalStackDepth) {
                            break;
                        }
                    }
                    break;
            }
        }
        // If this control requires child focus, make sure a child was able to be focused before adding this control to the stack.
        if (!this.props.requireChildFocus || focusStack.length > originalStackDepth) {
            focusStack.push(this);
        }
        return focusStack;
    }
    /**
     * Blurs, or removes focus, from the component.
     */
    blur() {
        var _a, _b;
        if (!this._isFocused) {
            return;
        }
        let indexInParent = -1;
        if (this.parent) {
            indexInParent = (_b = (_a = this.parent.registeredControls) === null || _a === void 0 ? void 0 : _a.indexOf(this)) !== null && _b !== void 0 ? _b : -1;
        }
        const blurStack = this.getFocusedComponentPath();
        for (let i = 0; i < blurStack.length; i++) {
            blurStack[i]._isFocused = false;
        }
        while (blurStack.length > 0) {
            const control = blurStack.pop();
            if (control !== undefined) {
                control.onBlurred(control);
            }
        }
        if (this.parent && indexInParent >= 0) {
            this.parent.handleNoFocusedChild(indexInParent, this);
        }
    }
    /**
     * Handles the case where this control is left focused with no focused child control after a child control is
     * blurred.
     * @param indexBlurred The index of the child control that was blurred. If the child is no longer registered, then
     * this is the index of the child prior to being unregistered.
     * @param childBlurred The child control that was blurred.
     */
    handleNoFocusedChild(indexBlurred, childBlurred) {
        var _a;
        if (!this._isFocused || this.getFocusedIndex() >= 0) {
            return;
        }
        const reconciliation = this.reconcileChildBlur(indexBlurred, childBlurred);
        if (this.registeredControls) {
            if (typeof reconciliation === 'number') {
                const controlToFocus = (_a = this.registeredControls) === null || _a === void 0 ? void 0 : _a[reconciliation];
                controlToFocus === null || controlToFocus === void 0 ? void 0 : controlToFocus.focus(FocusPosition.First);
            }
            else {
                switch (reconciliation) {
                    case BlurReconciliation.First:
                        this.focus(FocusPosition.First);
                        break;
                    case BlurReconciliation.Last:
                        this.focus(FocusPosition.Last);
                        break;
                    case BlurReconciliation.Next:
                        for (let i = Math.max(indexBlurred + (this.registeredControls[indexBlurred] === childBlurred ? 1 : 0), 0); i < this.registeredControls.length; i++) {
                            if (this.registeredControls[i].focus(FocusPosition.First)) {
                                break;
                            }
                        }
                        for (let i = Math.min(indexBlurred - 1, this.registeredControls.length - 1); i >= 0; i--) {
                            if (this.registeredControls[i].focus(FocusPosition.First)) {
                                break;
                            }
                        }
                        break;
                    case BlurReconciliation.Prev:
                        for (let i = Math.min(indexBlurred - 1, this.registeredControls.length - 1); i >= 0; i--) {
                            if (this.registeredControls[i].focus(FocusPosition.Last)) {
                                break;
                            }
                        }
                        for (let i = Math.max(indexBlurred + (this.registeredControls[indexBlurred] === childBlurred ? 1 : 0), 0); i < this.registeredControls.length; i++) {
                            if (this.registeredControls[i].focus(FocusPosition.Last)) {
                                break;
                            }
                        }
                        break;
                }
            }
        }
        if (this.props.requireChildFocus && this.getFocusedIndex() < 0) {
            this.blur();
        }
    }
    /**
     * Reconciles the focus state of this control's children when this control is focused with no focused children after
     * a child has been blurred.
     * @param index The index of the child control that was blurred. If the child is no longer registered, then this is
     * the index of the child prior to being unregistered.
     * @param child The child control that was blurred.
     * @returns The index of the child control to focus.
     */
    reconcileChildBlur(index, child) {
        var _a;
        if (this.props.reconcileChildBlur) {
            return this.props.reconcileChildBlur(index, child);
        }
        if (((_a = this.registeredControls) === null || _a === void 0 ? void 0 : _a[index]) !== child) {
            return BlurReconciliation.Next;
        }
        else {
            return -1;
        }
    }
    /**
     * Sets the component to be disabled, removing the ability for the component to scroll. Setting
     * a component to disabled will also blur the component and its children, if necessary.
     * @param isDisabled Whether or not the component is disabled.
     */
    setDisabled(isDisabled) {
        this._isDisabled = isDisabled;
        if (isDisabled) {
            this.blur();
            this.onDisabled(this);
        }
        else {
            this.onEnabled(this);
        }
    }
    /**
     * Registers a child control with this control.
     * @param control The control to register.
     * @param index The index at which to register the control. If none is provided,
     * the control will be registered at the end of the collection of child controls.
     */
    register(control, index) {
        if (this.registeredControls === undefined) {
            this.registeredControls = [];
        }
        if (index !== undefined) {
            this.registeredControls.splice(index, 0, control);
            if (this.focusedIndex >= index) {
                this.focusedIndex++;
            }
        }
        else {
            this.registeredControls.push(control);
        }
        control.setParent(this);
        control.onRegistered(control);
    }
    /**
     * Unregisters a child control with this control.
     * @param item The child control or index of a child control to unregister. If a
     * child control is provided, it will attempt to be located in the control's
     * child registry and then removed. If an index is provided, the child control
     * at that registered index will be removed.
     */
    unregister(item) {
        if (this.registeredControls !== undefined) {
            let index = -1;
            if (typeof item === 'number') {
                index = item;
            }
            else {
                index = this.registeredControls.indexOf(item);
            }
            if (index >= 0 && index < this.length) {
                const controlToRemove = this.registeredControls[index];
                const isRemovedControlFocused = controlToRemove._isFocused;
                this.registeredControls.splice(index, 1);
                controlToRemove.parent = undefined;
                if (isRemovedControlFocused) {
                    controlToRemove.blur();
                    this.handleNoFocusedChild(index, controlToRemove);
                }
                else {
                    if (this.focusedIndex === index) {
                        this.focusedIndex = -1;
                    }
                    else if (this.focusedIndex > index) {
                        this.focusedIndex--;
                    }
                }
                this.focusedIndex = Math.min(this.focusedIndex, this.registeredControls.length - 1);
                if (controlToRemove.length > 0) {
                    controlToRemove.clearRegistered();
                }
                controlToRemove.onUnregistered(controlToRemove);
                if (this.length === 0) {
                    this.registeredControls = undefined;
                }
            }
        }
    }
    /**
     * Clears the list of registered components.
     */
    clearRegistered() {
        if (this.registeredControls !== undefined) {
            const registeredControls = this.registeredControls;
            this.registeredControls = undefined;
            this.focusedIndex = -1;
            for (let i = 0; i < registeredControls.length; i++) {
                const controlToRemove = registeredControls[i];
                controlToRemove.parent = undefined;
                if (controlToRemove._isFocused) {
                    controlToRemove.blur();
                }
                if (controlToRemove.length > 0) {
                    controlToRemove.clearRegistered();
                }
                registeredControls[i].onUnregistered(registeredControls[i]);
            }
            // Only call this once for the last child removed to prevent multiple sequential, redundant reconciliations.
            this.handleNoFocusedChild(0, registeredControls[registeredControls.length - 1]);
        }
    }
    /**
     * Gets the current focused index in the registered controls collection.
     * @returns The index of the focused control in the collection of registered controls.
     */
    getFocusedIndex() {
        var _a, _b;
        return ((_b = (_a = this.registeredControls) === null || _a === void 0 ? void 0 : _a[this.focusedIndex]) === null || _b === void 0 ? void 0 : _b._isFocused) ? this.focusedIndex : -1;
    }
    /**
     * Gets the most recent focused index (including the current focused index, if one exists) in the registered controls
     * collection.
     * @returns The index of the most recently focused control in the collection of registered controls.
     */
    getMostRecentFocusedIndex() {
        return this.focusedIndex;
    }
    /**
     * Sets the current most recently focused child control index. If this control is focused and has children
     * that have focus, this will also switch child focus to the new index.
     * @param index The index of the child control to set most recent focus for.
     * @param focusPosition The focus position to focus the child for, if required.
     */
    setFocusedIndex(index, focusPosition = FocusPosition.MostRecent) {
        var _a;
        if (this.isFocused && this.length > 0 && ((_a = this.registeredControls) === null || _a === void 0 ? void 0 : _a.findIndex(c => c.isFocused)) !== -1) {
            const child = this.getChild(index);
            if (child !== undefined) {
                child.focus(focusPosition);
            }
        }
        else if (this.length > 0 && index >= 0 && index < this.length) {
            this.focusedIndex = index;
        }
    }
    /**
     * Gets a child control at the specified index.
     * @param index The index of the child control to get.
     * @returns The specified child control.
     */
    getChild(index) {
        if (this.registeredControls !== undefined) {
            return this.registeredControls[index];
        }
        return undefined;
    }
    /**
     * Gets the index of a specified child control within the registered
     * child controls collection.
     * @param child The child to get the index of.
     * @returns The index of the child, or -1 if not found.
     */
    indexOf(child) {
        if (this.registeredControls !== undefined) {
            return this.registeredControls.indexOf(child);
        }
        return -1;
    }
    /**
     * Sets the parent of this control.
     * @param parent The parent to set.
     */
    setParent(parent) {
        this.parent = parent;
    }
    /**
     * Sets whether or not this control is in scroll isolation. While scroll isolation
     * is enabled, scroll events will not propagate to the control's parent when the
     * control has focus.
     * @param isolated Whether or not the control is isolated.
     */
    setIsolated(isolated) {
        this._isIsolated = isolated;
    }
    /** @inheritdoc */
    onAfterRender(thisNode) {
        FSComponent.visitNodes(thisNode, (node) => {
            const instance = node.instance;
            if (instance !== this && (instance === null || instance === void 0 ? void 0 : instance._UICONTROL_)) {
                this.register(node.instance);
                return true;
            }
            return false;
        });
    }
    /**
     * Renders the control.
     * @returns The component VNode.
     */
    render() {
        return (FSComponent.buildComponent(FSComponent.Fragment, null, this.props.children));
    }
    /** @inheritdoc */
    destroy() {
        super.destroy();
        this.props.onDestroyed && this.props.onDestroyed(this);
    }
}
