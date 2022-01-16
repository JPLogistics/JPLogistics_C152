import { ComponentProps, DisplayComponent, Subject } from 'msfssdk';
import { FmsHEvent } from './FmsHEvent';
import { ScrollController } from './ScrollController';
import { UiControl } from './UiControl';
import { ScrollableControl } from './UiView';

/** Ui control group props */
export interface UiControlGroupProps extends ComponentProps {
  onRegister?(ctrl: ScrollableControl, unregister?: boolean): void;
  /** If 'true' the list will also be scrollable using the upper knob */
  upperKnobCanScroll?: boolean;

  /**
   * A function to call when the control group is focused.
   * @param sender The control group.
   */
  onFocused?(sender: UiControlGroup): void;

  /**
   * A function to call when the control group is blurred.
   * @param sender The control group.
   */
  onBlurred?(sender: UiControlGroup): void;
}

/** The direction of entry to the control when focusing on the control group */
export type EntryDirection = 'top' | 'bottom';

/** Ui control group */
export abstract class UiControlGroup<T extends UiControlGroupProps = UiControlGroupProps> extends DisplayComponent<T> {
  protected scrollController: ScrollController = new ScrollController();
  protected focusSubject = Subject.create(false);

  /** @inheritdoc */
  constructor(props: T) {
    super(props);

    this.focusSubject.sub(isFocused => {
      if (isFocused) {
        this.onFocused();
        this.props.onFocused && this.props.onFocused(this);
      } else {
        this.onBlurred();
        this.props.onBlurred && this.props.onBlurred(this);
      }
    });
  }

  /** @inheritdoc */
  public onBeforeRender(): void {
    if (this.props.onRegister) {
      this.props.onRegister(this);
    }
  }

  /**
   * Method to focus this control group
   * @param dir The direction of entry.
   */
  public focus(dir: EntryDirection = 'top'): void {
    this.focusSubject.set(true);
    if (dir === 'top') {
      this.scrollController.gotoFirst();
    } else {
      this.scrollController.gotoLast();
    }
  }

  /** Method to unfocus this control group */
  public blur(): void {
    this.focusSubject.set(false);
    // TODO: maybe we need to bubble down the blur...
    this.scrollController.blur();
  }

  /** Method to check if this UiControlGroup is in focus
   * @returns true if the control group is in focus, false otherwise
   */
  public getIsFocused(): boolean {
    return this.focusSubject.get();
  }

  /**
   * Gets a boolean indicating if this control is able to be focused.
   * @returns true
   */
  public getIsFocusable(): boolean {
    return this.scrollController.getControlsCount() > 0;
  }

  /**
   * A method called when the control group scroll is toggled.
   * @param enabled if the scroll is enabled.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onScrollToggled(enabled: boolean): void {
    // noop, override it if needed
  }

  /**
   * Toggles the scroll highlighting
   */
  public toggleScroll(): void {
    this.scrollController.toggleScrollEnabled();
    this.onScrollToggled(this.scrollController.getIsScrollEnabled());
  }

  /**
   * Sets the scroll enabled state
   * @param enabled indicating if scrolling should be enabled
   */
  public setScrollEnabled(enabled: boolean): void {
    if (this.scrollController.getIsScrollEnabled() !== enabled) {
      this.toggleScroll();
    }
  }


  /**
   * This is just a dummy that exists here to be compatible
   * with the union type of ScrollableControl
   * @returns null
   */
  public getHighlightElement(): Element | null {
    return null;
  }

  /**
   * Handles HEvents and routes them to the subdialog when existant.
   * @param evt The received event.
   * @returns true if the event was handled in this control group, false otherwise.
   */
  public processHEvent(evt: FmsHEvent): boolean {
    const focusCtrl = this.scrollController.getFocusedUiControl();
    if (focusCtrl instanceof UiControlGroup && focusCtrl.processHEvent(evt)) {
      return true;
    }

    const activeCtrl = this.scrollController.getActivatedUiControl();
    if (activeCtrl instanceof UiControl && this.routeEventToControl(evt, activeCtrl)) {
      return true;
    }
    if (
      focusCtrl instanceof UiControl
      && evt !== FmsHEvent.LOWER_DEC
      && evt !== FmsHEvent.LOWER_INC
      && this.routeEventToControl(evt, focusCtrl)
    ) {
      return true;
    }

    switch (evt) {
      case FmsHEvent.UPPER_DEC:
      case FmsHEvent.UPPER_INC:
        if (!this.props.upperKnobCanScroll) {
          break;
        }
      // eslint-disable-next-line no-fallthrough
      case FmsHEvent.LOWER_DEC:
      case FmsHEvent.LOWER_INC:
        if (this.processScrollEvent(evt)) {
          return true;
        }
    }

    return this.onInteractionEvent(evt);
  }

  /**
   * Routes an interaction event to a UiControl.
   * @param evt An interaction event.
   * @param control The UiControl to which to route the event.
   * @returns Whether the event was handled by the UiControl.
   */
  protected routeEventToControl(evt: FmsHEvent, control: UiControl): boolean {
    switch (evt) {
      case FmsHEvent.UPPER_DEC:
      case FmsHEvent.UPPER_INC:
        if (this.props.upperKnobCanScroll) {
          break;
        }
      // eslint-disable-next-line no-fallthrough
      default:
        return control.onInteractionEvent(evt);
    }

    return false;
  }

  /**
   * Attempts to handle scroll events.
   * @param evt The received event.
   * @returns whether the event was handled.
   */
  protected processScrollEvent(evt: FmsHEvent): boolean {
    if (this.scrollController.getIsScrollEnabled()) {
      switch (evt) {
        case FmsHEvent.LOWER_DEC:
        case FmsHEvent.UPPER_DEC:
          return this.scrollController.gotoPrev();
        case FmsHEvent.LOWER_INC:
        case FmsHEvent.UPPER_INC:
          return this.scrollController.gotoNext();
      }
    }

    return false;
  }

  /**
   * Handler for interaction events to be handled by the view.
   * @param evt The HEvenet.
   * @returns true if the event was handled in this group
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onInteractionEvent(evt: FmsHEvent): boolean {
    // noop, override it if needed
    return false;
  }

  /** Register/Unregisters a UiControl with the scroll controller.
   * @param ctrl The UiControl to register.
   * @param unregister Indicates if the UiControl should be unregistered.
   */
  protected register = (ctrl: ScrollableControl, unregister = false): void => {
    if (unregister) {
      this.scrollController.unregisterCtrl(ctrl);
    } else {
      this.scrollController.registerCtrl(ctrl);
    }
  }

  /**
   * A callback which is called when this control group is focused.
   */
  protected onFocused(): void {
    // noop
  }

  /**
   * A callback which is called when this control group is blurred.
   */
  protected onBlurred(): void {
    // noop
  }
}