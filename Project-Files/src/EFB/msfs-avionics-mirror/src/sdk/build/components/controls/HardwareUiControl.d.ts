import { ComponentProps, DisplayComponent, VNode } from '../FSComponent';
/**
 * A handler for events emitted by UiControl2.
 * @template T The type of event sources.
 * @template Args A tuple type describing additional arguments for an event after the source control. Defaults to an
 * empty (zero-length) tuple.
 */
export declare type UiControlEventHandler<T extends HardwareUiControl<any, any>, Args extends any[] = []> = (source: T, ...args: Args) => boolean;
/** A requested scroll direction. */
export declare type ScrollDirection = 'forward' | 'backward';
/**
 * Maps an event definition type to an event handler interface. Each event in the definition type is mapped to a
 * handler with the name `on[Event]`.
 */
export declare type UiControlEventHandlers<Events> = {
    [Event in keyof Events as `on${Event & string}`]: Events[Event];
};
/**
 * Maps an event definition type to a prop event handler interface. Each event in the definition type is mapped to an
 * optional handler with the name `on[Event]`.
 */
export declare type UiControlPropEventHandlers<Events> = Partial<UiControlEventHandlers<Events>>;
/** Properties on the UiControl2 component. */
export interface HardwareUiControlProps extends ComponentProps {
    /** Whether or not the inner FMS knob scrolls also by default. */
    innerKnobScroll?: boolean;
    /**
     * When enabled, scroll commands will not propagate from this control to its parent while
     * the control is focused.
     */
    isolateScroll?: boolean;
    /** Whether the control requires one of its child controls to be focused for itself to be focused. */
    requireChildFocus?: boolean;
    /** An event called when the control is focused. */
    onFocused?: (source: HardwareUiControl) => void;
    /** An event called when the control loses focus. */
    onBlurred?: (source: HardwareUiControl) => void;
    /** An event called when the control is disabled. */
    onDisabled?: (source: HardwareUiControl) => void;
    /** An event called when the control is enabled. */
    onEnabled?: (source: HardwareUiControl) => void;
    /** A function which returns how the control should focus its children when it is focused from a scroll. */
    getFocusPositionOnScroll?: (direction: ScrollDirection) => FocusPosition;
    /** An event called when the control is scrolled. */
    onScroll?: (direction: ScrollDirection) => boolean;
    /** An event called when the scroll operation has completed. */
    onAfterScroll?: (control: HardwareUiControl, index: number) => void;
    /** An event called when a control is registered with this control. */
    onRegistered?: (source: HardwareUiControl) => void;
    /** An event called when a control is unregistered with this control. */
    onUnregistered?: (source: HardwareUiControl) => void;
    /** An event called when the control is destroyed. */
    onDestroyed?: (source: HardwareUiControl) => void;
    /**
     * A function which reconciles the focus state of the control's children when the control is focused with no focused
     * children after a child has been blurred.
     * @param index The index of the child control that was blurred.
     * @param child The child control that was blurred.
     * @returns The index of the child to focus, or a blur reconciliation strategy.
     */
    reconcileChildBlur?: (index: number, child: HardwareUiControl) => number | BlurReconciliation;
}
/**
 * The item position to focus a component's children when performing a focus operation.
 */
export declare enum FocusPosition {
    /** The component's most recently focused descendants will be focused. */
    MostRecent = "MostRecent",
    /** The first focus-able child at each node in the descendant tree will be focused. */
    First = "First",
    /** The last focus-able child at each node in the descendant tree will be focused. */
    Last = "Last",
    /** No child components will be focused. */
    None = "None"
}
/**
 * A strategy to focus a component's children as part of a blur reconciliation operation.
 */
export declare enum BlurReconciliation {
    /** The component's first focus-able child will be focused. */
    First = "First",
    /** The component's last focus-able child will be focused. */
    Last = "Last",
    /**
     * The component's next focus-able child after the child that was blurred will be focused. If no such child exists,
     * then the last focus-able child before the child that was blurred will be focused.
     */
    Next = "Next",
    /**
     * The component's last focus-able child before the child that was blurred will be focused. If no such child exists,
     * then the next focus-able child after the child that was blurred will be focused.
     */
    Prev = "Prev",
    /** No child components will be focused. */
    None = "None"
}
/**
 * An abstract implementation of a component that forms the base of a Garmin-like UI control system. Subclasses should
 * implement an appropriate event handler interface (using the utility type `UiControlEventHandlers<Events>`) and have
 * their props implement the corresponding prop event handler interface (using the utility type
 * `UiControlPropEventHandlers<Events>`).
 * @template E An event definition type for events supported by this control.
 * @template P The component prop type for this control.
 */
export declare abstract class HardwareUiControl<E extends Record<string, any> = Record<string, any>, P extends HardwareUiControlProps = HardwareUiControlProps> extends DisplayComponent<P> {
    protected registeredControls: HardwareUiControl<E>[] | undefined;
    protected focusedIndex: number;
    private parent;
    private _isDisabled;
    private _isFocused;
    private _isIsolated;
    private readonly _UICONTROL_;
    /**
     * Creates an instance of a HardwareUiControl.
     * @param props The props for this component.
     */
    constructor(props: P);
    /**
     * Gets the current number of registered child controls.
     * @returns The current number of registered child controls.
     */
    get length(): number;
    /**
     * Gets whether or not the control is currently disabled.
     * @returns True if disabled, false otherwise.
     */
    get isDisabled(): boolean;
    /**
     * Gets whether or not the control is currently focused.
     * @returns True if disabled, false otherwise.
     */
    get isFocused(): boolean;
    /**
     * Gets whether or not the control is currently in scroll isolation.
     * @returns True if currently in scroll isolation, false otherwise.
     */
    get isIsolated(): boolean;
    /**
     * An event called when the control receives focus.
     * @param source The control that emitted this event.
     */
    protected onFocused(source: HardwareUiControl<E>): void;
    /**
     * An event called when the control is blurred.
     * @param source The control that emitted this event.
     */
    protected onBlurred(source: HardwareUiControl<E>): void;
    /**
     * An event called when the control is enabled.
     * @param source The control that emitted this event.
     */
    protected onEnabled(source: HardwareUiControl<E>): void;
    /**
     * An event called when the control is disabled.
     * @param source The control that emitted this event.
     */
    protected onDisabled(source: HardwareUiControl<E>): void;
    /**
     * An event called when a control is registered with this control.
     * @param source The control that emitted this event.
     */
    protected onRegistered(source: HardwareUiControl<E>): void;
    /**
     * An event called when a control is unregistered from this control.
     * @param source The control that emitted this event.
     */
    protected onUnregistered(source: HardwareUiControl<E>): void;
    /**
     * Gets the focus position to apply when this control is focused from a scroll.
     * @param direction The direction of the scroll.
     * @returns The focus position to apply when this control is focused from a scroll.
     */
    protected getFocusPositionOnScroll(direction: ScrollDirection): FocusPosition;
    /**
     * An event called when the control is scrolled.
     * @param direction The direction that is being requested to scroll.
     * @returns True if this control handled this event, false otherwise.
     */
    protected onScroll(direction: ScrollDirection): boolean;
    /**
     * An event called when a scroll operation has completed.
     * @param control The control that was scrolled to.
     * @param index The index of the control in the collection of registered controls.
     */
    protected onAfterScroll(control: HardwareUiControl<E>, index: number): void;
    /**
     * Scrolls the currently focused control in the supplied direction.
     * @param direction The direction that is being requested to scroll.
     * @returns True if propagation should be stopped, false otherwise.
     */
    scroll(direction: ScrollDirection): boolean;
    /**
     * Attempts to perform a scroll operation on the control, propagating the operation
     * upward in the tree if the control does not handle the operation.
     * @param direction The direction that is being requested to scroll.
     * @returns True if propagation should be stopped, false otherwise.
     */
    private tryPerformScroll;
    /**
     * A method which is called when this control receives an interaction event.
     * @param event The event.
     * @returns True if the event was handled, false otherwise.
     */
    abstract onInteractionEvent(event: keyof E): boolean;
    /**
     * Triggers an event on this control. The event will first be routed to the deepest focused descendent of this
     * control and will propagate up the control tree until it is handled or there are no more controls to which to
     * propagate.
     * @param event The event to trigger.
     * @param source The source of the event. Defaults to this if not supplied.
     * @param args Additional arguments to pass to the event handler.
     * @returns True if the event was handled, false otherwise.
     */
    triggerEvent(event: keyof E, source: HardwareUiControl, ...args: any[]): boolean;
    /**
     * Propagates an event up the control tree.
     * @param event The event to propagate.
     * @param source The source of the event.
     * @param args Additional arguments to pass to the event handler.
     * @returns True if the event was handled, false otherwise.
     */
    private propagateEvent;
    /**
     * Validates that the control can be focused by checking if any ancestors in the
     * control tree are disabled.
     * @returns True if there are no disabled ancestors, false otherwise.
     */
    private canBeFocused;
    /**
     * Brings focus to the control. Focusing the control will also blur the currently
     * focused control, if any.
     * @param focusPosition The focus position to activate for descendents of this control.
     * @returns Whether this control was successfully focused.
     */
    focus(focusPosition: FocusPosition): boolean;
    /**
     * Gets the path from this control to the deepest descendent control that is focused. If this control is not focused,
     * then the path is empty.
     * @param path The stack of control nodes defining the path to the currently
     * focused descendent control.
     * @returns A stack of nodes that defines the path to the deepest focused descendent
     * node, in order of deepest descendent first.
     */
    private getFocusedComponentPath;
    /**
     * Gets the path from this control to its deepest ancestor that is focused (including itself). If none of this
     * control's ancestors are focused, the path will contain this control and all of its ancestors up to and including
     * the root of its control tree.
     * @param path An array in which to store the path.
     * @returns A stack of controls that defines the path from this control to its deepest focused ancestor, ordered
     * from descendents to ancestors (the control at the shallowest tree depth is located at the top of the stack).
     */
    private getDeepestFocusedAncestorPath;
    /**
     * Builds the path of controls to focus from this control downward in children based on the provided default focus
     * position. If this control cannot be focused, the path will be empty.
     * @param focusPosition The focus position to use to build the path.
     * @param focusStack The stack in which to store the path.
     * @returns A stack of components that defines the path from the deepest descendent to focus to this control if this
     * control were to be focused with the specified focus position, ordered from descendents to ancestors (the control
     * at the shallowest tree depth is located at the top of the stack).
     */
    private buildFocusPath;
    /**
     * Blurs, or removes focus, from the component.
     */
    blur(): void;
    /**
     * Handles the case where this control is left focused with no focused child control after a child control is
     * blurred.
     * @param indexBlurred The index of the child control that was blurred. If the child is no longer registered, then
     * this is the index of the child prior to being unregistered.
     * @param childBlurred The child control that was blurred.
     */
    private handleNoFocusedChild;
    /**
     * Reconciles the focus state of this control's children when this control is focused with no focused children after
     * a child has been blurred.
     * @param index The index of the child control that was blurred. If the child is no longer registered, then this is
     * the index of the child prior to being unregistered.
     * @param child The child control that was blurred.
     * @returns The index of the child control to focus.
     */
    protected reconcileChildBlur(index: number, child: HardwareUiControl<E>): number | BlurReconciliation;
    /**
     * Sets the component to be disabled, removing the ability for the component to scroll. Setting
     * a component to disabled will also blur the component and its children, if necessary.
     * @param isDisabled Whether or not the component is disabled.
     */
    setDisabled(isDisabled: boolean): void;
    /**
     * Registers a child control with this control.
     * @param control The control to register.
     * @param index The index at which to register the control. If none is provided,
     * the control will be registered at the end of the collection of child controls.
     */
    register(control: HardwareUiControl<E>, index?: number): void;
    /**
     * Unregisters a child control with this control.
     * @param item The child control or index of a child control to unregister. If a
     * child control is provided, it will attempt to be located in the control's
     * child registry and then removed. If an index is provided, the child control
     * at that registered index will be removed.
     */
    unregister(item: HardwareUiControl<E> | number): void;
    /**
     * Clears the list of registered components.
     */
    clearRegistered(): void;
    /**
     * Gets the current focused index in the registered controls collection.
     * @returns The index of the focused control in the collection of registered controls.
     */
    getFocusedIndex(): number;
    /**
     * Gets the most recent focused index (including the current focused index, if one exists) in the registered controls
     * collection.
     * @returns The index of the most recently focused control in the collection of registered controls.
     */
    getMostRecentFocusedIndex(): number;
    /**
     * Sets the current most recently focused child control index. If this control is focused and has children
     * that have focus, this will also switch child focus to the new index.
     * @param index The index of the child control to set most recent focus for.
     * @param focusPosition The focus position to focus the child for, if required.
     */
    setFocusedIndex(index: number, focusPosition?: FocusPosition): void;
    /**
     * Gets a child control at the specified index.
     * @param index The index of the child control to get.
     * @returns The specified child control.
     */
    getChild(index: number): HardwareUiControl<E> | undefined;
    /**
     * Gets the index of a specified child control within the registered
     * child controls collection.
     * @param child The child to get the index of.
     * @returns The index of the child, or -1 if not found.
     */
    indexOf(child: HardwareUiControl<E>): number;
    /**
     * Sets the parent of this control.
     * @param parent The parent to set.
     */
    setParent(parent: HardwareUiControl<E>): void;
    /**
     * Sets whether or not this control is in scroll isolation. While scroll isolation
     * is enabled, scroll events will not propagate to the control's parent when the
     * control has focus.
     * @param isolated Whether or not the control is isolated.
     */
    setIsolated(isolated: boolean): void;
    /** @inheritdoc */
    onAfterRender(thisNode: VNode): void;
    /**
     * Renders the control.
     * @returns The component VNode.
     */
    render(): VNode;
    /** @inheritdoc */
    destroy(): void;
}
//# sourceMappingURL=HardwareUiControl.d.ts.map