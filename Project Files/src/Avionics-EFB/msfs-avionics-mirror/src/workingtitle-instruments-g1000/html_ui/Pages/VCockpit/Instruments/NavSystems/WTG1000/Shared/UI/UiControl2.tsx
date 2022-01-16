import { ComponentProps, DisplayComponent, FSComponent, VNode } from 'msfssdk';
import { FmsHEvent } from './FmsHEvent';

/** An event emitted by a UI control. */
export type UiControlEvent = (sender: UiControl2) => boolean;

/** A requested scroll direction. */
export type ScrollDirection = 'forward' | 'backward';

/**
 * Events that are emitted by the UI control system.
 */
export interface UiControlEvents {
  /** An event called when the FMS knob is pushed. */
  onFms?: UiControlEvent;

  /** An event called when the inner FMS knob is turned clockwise. */
  onUpperKnobInc?: UiControlEvent;

  /** An event called when the inner FMS knob is turned counterclockwise. */
  onUpperKnobDec?: UiControlEvent;

  /** An event called when the outer FMS knob is turned clockwise. */
  onLowerKnobInc?: UiControlEvent;

  /** An event called when the outer FMS knob is turned counterclockwise. */
  onLowerKnobDec?: UiControlEvent;

  /** An event called when the bezel ENT button is pushed. */
  onEnter?: UiControlEvent;

  /** An event called when the bezel CLR button is pushed. */
  onClr?: UiControlEvent;

  /** An event called when the bezel CLR button is held down. */
  onClrLong?: UiControlEvent;

  /** An event called when the bezel DIR button is pushed. */
  onDirectTo?: UiControlEvent;

  /** An event called when the bezel MENU button is pushed. */
  onMenu?: UiControlEvent;
}

/** Properties on the UiControl2 component. */
export interface UiControl2Props extends UiControlEvents, ComponentProps {

  /** Whether or not the inner FMS knob scrolls also by default. */
  innerKnobScroll?: boolean;

  /**
   * When enabled, scroll commands will not propagate from this control to its parent while
   * the control is focused.
   */
  isolateScroll?: boolean;

  /** An event called when the control is focused. */
  onFocused?: (source: UiControl2) => void;

  /** An event called when the control loses focus. */
  onBlurred?: (source: UiControl2) => void;

  /** An event called when the control is disabled. */
  onDisabled?: (source: UiControl2) => void;

  /** An event called when the control is enabled. */
  onEnabled?: (source: UiControl2) => void;

  /** An event called when the control is scrolled. */
  onScroll?: (direction: ScrollDirection) => boolean;

  /** An event called when the scroll operation has completed. */
  onAfterScroll?: (control: UiControl2, index: number) => void;

  /** An event called when a control is registered with this control. */
  onRegistered?: (source: UiControl2) => void;

  /** An event called when a control is unregistered with this control. */
  onUnregistered?: (source: UiControl2) => void;
}

/**
 * The item position to focus a component's children when performing a focus operation.
 */
export enum FocusPosition {
  /** The component's most recently focused descendants will be focused. */
  MostRecent = 'MostRecent',

  /** The components first child at each node in the descendant tree will be focused. */
  First = 'First',

  /** The component's last child at each node in the descendant tree will be focused. */
  Last = 'Last',

  /** No child components will be focused. */
  None = 'None'
}

/**
 * A component that forms the base of the G1000 UI control system.
 */
export class UiControl2<T extends UiControl2Props = UiControl2Props> extends DisplayComponent<T> {

  protected registeredControls: UiControl2[] | undefined;

  protected focusedIndex = -1;

  private parent: UiControl2 | undefined;

  private _isDisabled = false;

  private _isFocused = false;

  private _isIsolated = false;

  private readonly _UICONTROL_ = true;

  /**
   * Creates an instance of a UiControl2.
   * @param props The props for this component.
   */
  constructor(props: T) {
    super(props);

    this._isIsolated = this.props.isolateScroll !== undefined && this.props.isolateScroll;
  }

  /**
   * Gets the current number of registered child controls.
   * @returns The current number of registered child controls.
   */
  public get length(): number {
    if (this.registeredControls !== undefined) {
      return this.registeredControls.length;
    }

    return 0;
  }

  /**
   * Gets whether or not the control is currently disabled.
   * @returns True if disabled, false otherwise.
   */
  public get isDisabled(): boolean {
    return this._isDisabled;
  }

  /**
   * Gets whether or not the control is currently focused.
   * @returns True if disabled, false otherwise.
   */
  public get isFocused(): boolean {
    return this._isFocused;
  }

  /**
   * Gets whether or not the control is currently in scroll isolation.
   * @returns True if currently in scroll isolation, false otherwise.
   */
  public get isIsolated(): boolean {
    return this._isIsolated;
  }

  /**
   * An event called when the FMS knob is pushed.
   * @param source The control that emitted this event.
   * @returns True if this control handled this event, false otherwise.
   */
  protected onFms(source: UiControl2): boolean {
    return this.props.onFms !== undefined && this.props.onFms(source);
  }

  /**
   * An event called when the inner FMS knob is turned clockwise.
   * @param source The control that emitted this event.
   * @returns True if this control handled this event, false otherwise.
   */
  protected onUpperKnobInc(source: UiControl2): boolean {
    return this.props.onUpperKnobInc !== undefined && this.props.onUpperKnobInc(source);
  }

  /**
   * An event called when the inner FMS knob is turned counterclockwise.
   * @param source The control that emitted this event.
   * @returns True if this control handled this event, false otherwise.
   */
  protected onUpperKnobDec(source: UiControl2): boolean {
    return this.props.onUpperKnobDec !== undefined && this.props.onUpperKnobDec(source);
  }

  /**
   * An event called when the outer FMS knob is turned clockwise.
   * @param source The control that emitted this event.
   * @returns True if this control handled this event, false otherwise.
   */
  protected onLowerKnobInc(source: UiControl2): boolean {
    return this.props.onLowerKnobInc !== undefined && this.props.onLowerKnobInc(source);
  }

  /**
   * An event called when the outer FMS knob is turned counterclockwise.
   * @param source The control that emitted this event.
   * @returns True if this control handled this event, false otherwise.
   */
  protected onLowerKnobDec(source: UiControl2): boolean {
    return this.props.onLowerKnobDec !== undefined && this.props.onLowerKnobDec(source);
  }

  /**
   * An event called when the ENT button is pushed.
   * @param source The control that emitted this event.
   * @returns True if this control handled this event, false otherwise.
   */
  protected onEnter(source: UiControl2): boolean {
    return this.props.onEnter !== undefined && this.props.onEnter(source);
  }

  /**
   * An event called when the CLR button is pushed.
   * @param source The control that emitted this event.
   * @returns True if this control handled this event, false otherwise.
   */
  protected onClr(source: UiControl2): boolean {
    return this.props.onClr !== undefined && this.props.onClr(source);
  }

  /**
   * An event called when the CLR button is held.
   * @param source The control that emitted this event.
   * @returns True if this control handled this event, false otherwise.
   */
  protected onClrLong(source: UiControl2): boolean {
    return this.props.onClrLong !== undefined && this.props.onClrLong(source);
  }

  /**
   * An event called when the MENU button is pushed.
   * @param source The control that emitted this event.
   * @returns True if this control handled this event, false otherwise.
   */
  protected onMenu(source: UiControl2): boolean {
    return this.props.onMenu !== undefined && this.props.onMenu(source);
  }

  /**
   * An event called when the control receives focus.
   * @param source The control that emitted this event.
   */
  protected onFocused(source: UiControl2): void {
    this.props.onFocused && this.props.onFocused(source);
  }

  /**
   * An event called when the control is blurred.
   * @param source The control that emitted this event.
   */
  protected onBlurred(source: UiControl2): void {
    this.props.onBlurred && this.props.onBlurred(source);
  }

  /**
   * An event called when the DIR button is pushed.
   * @param source The control that emitted this event.
   * @returns True if this control handled this event, false otherwise.
   */
  protected onDirectTo(source: UiControl2): boolean {
    return this.props.onDirectTo !== undefined && this.props.onDirectTo(source);
  }

  /**
   * An event called when the control is enabled.
   * @param source The control that emitted this event.
   */
  protected onEnabled(source: UiControl2): void {
    this.props.onEnabled !== undefined && this.props.onEnabled(source);
  }

  /**
   * An event called when the control is disabled.
   * @param source The control that emitted this event.
   */
  protected onDisabled(source: UiControl2): void {
    this.props.onDisabled !== undefined && this.props.onDisabled(source);
  }

  /**
   * An event called when a control is registered with this control.
   * @param source The control that emitted this event.
   */
  protected onRegistered(source: UiControl2): void {
    this.props.onRegistered !== undefined && this.props.onRegistered(source);
  }

  /**
   * An event called when a control is unregistered from this control.
   * @param source The control that emitted this event.
   */
  protected onUnregistered(source: UiControl2): void {
    this.props.onUnregistered !== undefined && this.props.onUnregistered(source);
  }

  /**
   * An event called when the control is scrolled.
   * @param direction The direction that is being requested to scroll.
   * @returns True if this control handled this event, false otherwise.
   */
  protected onScroll(direction: ScrollDirection): boolean {
    if (this.registeredControls !== undefined && this.registeredControls.length > 0) {
      const indexToFocus = this.getNextFocusIndex(direction);

      if (indexToFocus !== undefined && indexToFocus < this.registeredControls.length && indexToFocus >= 0) {
        this.focusedIndex = indexToFocus;
        const controlToFocus = this.registeredControls[indexToFocus];

        controlToFocus.focus(FocusPosition.MostRecent);
        this.onAfterScroll(controlToFocus, indexToFocus);

        return true;
      }
    }

    return false;
  }

  /**
   * An event called when a scroll operation has completed.
   * @param control The control that was scrolled to.
   * @param index The index of the control in the collection of registered controls.
   */
  protected onAfterScroll(control: UiControl2, index: number): void {
    this.props.onAfterScroll && this.props.onAfterScroll(control, index);
  }

  /**
   * Scrolls the currently focused control in the supplied direction.
   * @param direction The direction that is being requested to scroll.
   * @returns True if propagation should be stopped, false otherwise.
   */
  public scroll(direction: ScrollDirection): boolean {
    if (!this.isFocused) {
      return false;
    }

    const controlToScroll = this.getFocusedComponentPath()[0];
    if (controlToScroll !== undefined) {
      return controlToScroll.tryPerformScroll(direction);
    } else {
      return this.tryPerformScroll(direction);
    }
  }

  /**
   * Attempts to perform a scroll operation on the control, propagating the operation
   * upward in the tree if the control does not handle the operation.
   * @param direction The direction that is being requested to scroll.
   * @returns True if propagation should be stopped, false otherwise.
   */
  private tryPerformScroll(direction: ScrollDirection): boolean {
    let handled = false;
    if (this.props.onScroll !== undefined) {
      handled = this.props.onScroll(direction);
    } else {
      handled = this.onScroll(direction);
    }

    if (!handled) {
      const currentlyIsolated = this.isFocused && this.isIsolated;
      if (this.parent !== undefined && !currentlyIsolated) {
        return this.parent.tryPerformScroll(direction);
      } else if (currentlyIsolated) {
        return true;
      }
    }

    return handled;
  }

  /**
   * Gets the next focus control index based on the provided scroll direction.
   * @param direction The direction that is being requested to scroll.
   * @returns The index of the next control that should be focused, or undefined if there is no control available
   * in the scroll direction
   */
  protected getNextFocusIndex(direction: ScrollDirection): number | undefined {
    if (this.registeredControls !== undefined && this.registeredControls.length > 0) {
      const indexToFocus = direction === 'forward' ? this.focusedIndex + 1 : this.focusedIndex - 1;
      let control: UiControl2 | undefined = undefined;

      for (let i = indexToFocus; i >= 0 && i < this.registeredControls.length; direction === 'forward' ? i++ : i--) {
        control = this.registeredControls[i];
        if (control !== undefined && !control.isDisabled) {
          return i;
        }
      }
    }

    return undefined;
  }

  /**
   * A method which is called when this control receives an interaction event.
   * @param evt The event.
   * @returns True if the event was handled, false otherwise.
   */
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.UPPER_INC:
        if (this.props.innerKnobScroll) {
          return this.scroll('forward');
        } else {
          return this.triggerControl('onUpperKnobInc');
        }
      case FmsHEvent.UPPER_DEC:
        if (this.props.innerKnobScroll) {
          return this.scroll('backward');
        } else {
          return this.triggerControl('onUpperKnobDec');
        }
      case FmsHEvent.LOWER_INC:
        return this.scroll('forward');
      case FmsHEvent.LOWER_DEC:
        return this.scroll('backward');
      case FmsHEvent.ENT:
        return this.triggerControl('onEnter');
      case FmsHEvent.CLR:
        return this.triggerControl('onClr');
      case FmsHEvent.DIRECTTO:
        return this.triggerControl('onDirectTo');
      case FmsHEvent.MENU:
        return this.triggerControl('onMenu');
      case FmsHEvent.PUSH:
        return this.triggerControl('onFms');
      case FmsHEvent.CLR_LONG:
        return this.triggerControl('onClrLong');
    }

    return false;
  }

  /**
   * Triggers a control event within the control.
   * @param event The event to trigger.
   * @param source The source of the event. Defaults to this if not supplied.
   * @returns True if the event was handled, false otherwise.
   */
  public triggerControl(event: keyof UiControlEvents, source?: UiControl2): boolean {
    if (source === undefined) {
      source = this;
    }

    const canListen = this.isFocused || this.parent === undefined;
    if (!canListen) {
      return false;
    }

    const focusedControl = this.getFocusedComponentPath()[0];
    if (focusedControl !== undefined) {
      return focusedControl.propagateEvent(event, focusedControl);
    }

    return false;
  }

  /**
   * Propagates a control event upward in the control tree.
   * @param event The event to propagate.
   * @param source The source of the event.
   * @returns True if the event was handled, false otherwise.
   */
  private propagateEvent(event: keyof UiControlEvents, source: UiControl2): boolean {
    const stopPropagation = this[event](source);

    if (!stopPropagation && this.parent !== undefined) {
      return this.parent.propagateEvent(event, this.parent);
    }

    return stopPropagation;
  }

  /**
   * Validates that the control can be focused by checking if any ancestors in the
   * control tree are disabled.
   * @returns True if there are no disabled ancestors, false otherwise.
   */
  private canBeFocused(): boolean {
    let canFocus = true;

    if (!this._isDisabled) {
      if (this.parent !== undefined) {
        canFocus = this.parent.canBeFocused();
      }
    } else {
      canFocus = false;
    }

    return canFocus;
  }

  /**
   * Brings focus to the control. Focusing the control will also blur the currently
   * focused control, if any.
   * @param focusPosition The focus position to activate for descendents of this control.
   */
  public focus(focusPosition: FocusPosition): void {
    if (!this.canBeFocused()) {
      return;
    }

    const focusStack = this.getFocusRootPath();
    const focusRoot = focusStack[focusStack.length - 1];

    const blurStack = focusRoot.getFocusedComponentPath();
    for (let i = 0; i < blurStack.length; i++) {
      blurStack[i]._isFocused = false;
    }

    for (let i = 0; i < focusStack.length; i++) {
      const parent = focusStack[i + 1];
      if (parent !== undefined && parent.registeredControls !== undefined) {
        const control = focusStack[i];
        parent.focusedIndex = parent.registeredControls.indexOf(control);
      }
    }

    if (focusPosition !== FocusPosition.None) {
      //Top node is always us, and will be repeated by the next method if we don't remove ourselves
      focusStack.splice(0, 1);

      this.buildFocusPath(focusPosition, focusStack);
    }

    for (let i = 0; i < focusStack.length; i++) {
      focusStack[i]._isFocused = true;
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
  }

  /**
   * Gets the path from this control to the child control that should be blurred.
   * @param path The stack of control nodes defining the path to the currently
   * focused child control.
   * @returns A stack of nodes that defines the path to the currently focused child
   * node, in order of furthest child up to this component.
   */
  private getFocusedComponentPath(path?: UiControl2[]): UiControl2[] {
    if (path === undefined) {
      path = [];
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let currentControl: UiControl2 | undefined = this;
    while (currentControl !== undefined) {
      path.splice(0, 0, currentControl);

      if (currentControl.registeredControls !== undefined) {
        currentControl = currentControl.registeredControls.find(c => c.isFocused);
      } else {
        currentControl = undefined;
      }
    }

    return path;
  }

  /**
   * Gets the path from this component to the root of current focus.
   * @param path A stack of components that defines the path to the focus root.
   * @returns A stack of components that defines the path to the focus root, in order from
   * this component to the root.
   */
  private getFocusRootPath(path?: UiControl2[]): UiControl2[] {
    if (path === undefined) {
      path = [];
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let currentControl: UiControl2 | undefined = this;
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
   * Builds the path of nodes to focus from this control node downward in children
   * based on the provided default focus position, if any.
   * @param focusPosition The focus position to use to build the path.
   * @param focusStack A stack of components that defines the path from the furthest child
   * to the focus root.
   * @returns A stack of components that defines the path from the furthest child
   * to the focus root.
   */
  private buildFocusPath(focusPosition: FocusPosition, focusStack?: UiControl2[]): UiControl2[] {
    if (focusStack === undefined) {
      focusStack = [];
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let currentControl: UiControl2 | undefined = this;
    while (currentControl !== undefined) {
      focusStack.splice(0, 0, currentControl);

      if (currentControl.registeredControls !== undefined) {
        let controlIndex = 0;
        switch (focusPosition) {
          case FocusPosition.First:
            controlIndex = 0;
            break;
          case FocusPosition.Last:
            controlIndex = currentControl.registeredControls.length - 1;
            break;
          case FocusPosition.MostRecent:
            if (currentControl.focusedIndex === -1) {
              controlIndex = 0;
            } else {
              controlIndex = currentControl.focusedIndex;
            }
            break;
        }

        const controlToAdd = currentControl.registeredControls[controlIndex];
        if (!controlToAdd.isDisabled) {
          currentControl.focusedIndex = controlIndex;
          currentControl = currentControl.registeredControls[controlIndex];
        } else {
          currentControl = undefined;
        }
      } else {
        currentControl = undefined;
      }
    }

    return focusStack;
  }

  /**
   * Blurs, or removes focus, from the component.
   */
  public blur(): void {
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
  }

  /**
   * Sets the component to be disabled, removing the ability for the component to scroll. Setting
   * a component to disabled will also blur the component and its children, if necessary.
   * @param isDisabled Whether or not the component is disabled.
   */
  public setDisabled(isDisabled: boolean): void {
    if (isDisabled) {
      this._isDisabled = true;
      const blurStack = this.getFocusedComponentPath();

      while (blurStack.length > 0) {
        const control = blurStack.pop();
        if (control !== undefined) {
          control.onBlurred(control);
        }
      }
    }

    this._isDisabled = isDisabled;

    if (isDisabled) {
      this.onDisabled(this);
    } else {
      this.onEnabled(this);
    }
  }

  /**
   * Registers a child control with this control.
   * @param control The control to register.
   * @param index The index at which to register the control. If none is provided,
   * the control will be registered at the end of the collection of child controls.
   */
  public register(control: UiControl2, index?: number): void {
    if (this.registeredControls === undefined) {
      this.registeredControls = [];
    }

    if (index !== undefined) {
      this.registeredControls.splice(index, 0, control);

      if (this.focusedIndex >= index) {
        this.focusedIndex++;
      }
    } else {
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
  public unregister(item: UiControl2 | number): void {
    if (this.registeredControls !== undefined) {
      let index = -1;
      if (typeof item === 'number') {
        index = item;
      } else {
        index = this.registeredControls.indexOf(item);
      }

      if (index >= 0 && index < this.length) {
        const controlToRemove = this.registeredControls[index];
        this.registeredControls.splice(index, 1);

        if (this.length === 0 && controlToRemove._isFocused) {
          controlToRemove.blur();
        } else if (this.focusedIndex > this.registeredControls.length - 1) {
          this.focusedIndex = this.length === 0 ? -1 : Math.max(this.registeredControls.length - 1, 0);
          const newFocusedControl = this.registeredControls[this.focusedIndex];

          if (newFocusedControl !== undefined && controlToRemove._isFocused) {
            newFocusedControl.focus(FocusPosition.First);
          }
        }

        if (controlToRemove.length > 0) {
          controlToRemove.clearRegistered();
        }

        controlToRemove.parent = undefined;
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
  public clearRegistered(): void {
    if (this.registeredControls !== undefined) {
      const registeredControls = this.registeredControls;
      this.registeredControls = [];
      this.focusedIndex = -1;

      for (let i = 0; i < registeredControls.length; i++) {
        const controlToRemove = registeredControls[i];
        if (controlToRemove._isFocused) {
          controlToRemove.blur();
        }

        if (controlToRemove.length > 0) {
          controlToRemove.clearRegistered();
        }

        registeredControls[i].onUnregistered(registeredControls[i]);
      }

      this.registeredControls = undefined;
    }
  }

  /**
   * Gets the currently focused index in the registered controls collection.
   * @returns The index of the focused control in the collection of registered controls.
   */
  public getFocusedIndex(): number {
    return this.focusedIndex;
  }

  /**
   * Sets the current most recently focused child control index. If this control is focused and has children
   * that have focus, this will also switch child focus to the new index.
   * @param index The index of the child control to set most recent focus for.
   * @param focusPosition The focus position to focus the child for, if required.
   */
  public setFocusedIndex(index: number, focusPosition: FocusPosition = FocusPosition.MostRecent): void {
    if (this.isFocused && this.length > 0 && this.registeredControls?.findIndex(c => c.isFocused) !== -1) {
      const child = this.getChild(index);
      if (child !== undefined) {
        child.focus(focusPosition);
      }
    } else if (this.length > 0 && index >= 0 && index < this.length) {
      this.focusedIndex = index;
    }
  }

  /**
   * Gets a child control at the specified index.
   * @param index The index of the child control to get.
   * @returns The specified child control.
   */
  public getChild(index: number): UiControl2 | undefined {
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
  public indexOf(child: UiControl2): number {
    if (this.registeredControls !== undefined) {
      return this.registeredControls.indexOf(child);
    }

    return -1;
  }

  /**
   * Sets the parent of this control.
   * @param parent The parent to set.
   */
  public setParent(parent: UiControl2): void {
    this.parent = parent;
  }

  /**
   * Sets whether or not this control is in scroll isolation. While scroll isolation
   * is enabled, scroll events will not propagate to the control's parent when the
   * control has focus.
   * @param isolated Whether or not the control is isolated.
   */
  public setIsolated(isolated: boolean): void {
    this._isIsolated = isolated;
  }

  /** @inheritdoc */
  public onAfterRender(thisNode: VNode): void {
    FSComponent.visitNodes(thisNode, (node: VNode) => {
      const instance = node.instance as any;
      if (instance !== this && instance?._UICONTROL_) {
        this.register(node.instance as unknown as UiControl2);
        return true;
      }

      return false;
    });
  }

  /**
   * Renders the control.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <>{this.props.children}</>
    );
  }
}