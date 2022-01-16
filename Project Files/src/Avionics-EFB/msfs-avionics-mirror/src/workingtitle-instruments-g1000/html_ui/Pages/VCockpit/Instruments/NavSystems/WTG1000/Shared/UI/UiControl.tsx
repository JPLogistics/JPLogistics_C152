import { DisplayComponent, FSComponent, VNode, ComponentProps, ComputedSubject, Subject } from 'msfssdk';
import { FmsHEvent } from './FmsHEvent';

/**
 * The properties for the UiControl component.
 */
export interface UiControlProps extends ComponentProps {
  onRegister?(ctrl: UiControl, unregister?: boolean): void;
  onUpperKnob?(sender: UiControl): void;
  onUpperKnobInc?(sender: UiControl): void;
  onUpperKnobDec?(sender: UiControl): void;
  onLowerKnob?(sender: UiControl): void;
  onLowerKnobInc?(sender: UiControl): void;
  onLowerKnobDec?(sender: UiControl): void;
  onEnter?(sender: UiControl): boolean;
  onClr?(sender: UiControl): boolean;
  onDirectTo?(sender: UiControl): boolean;
  onFocused?(sender: UiControl): void;
  onBlurred?(sender: UiControl): void;
  onActivated?(sender: UiControl): void;
  onDeactivated?(sender: UiControl): void;
  /** The CSS class string to be set on the control DOM element. */
  class?: string;
  /** Can control the visibility of this control. */
  isVisible?: Subject<boolean>;
}

/**
 * The UiControl component.
 */
export abstract class UiControl<T extends UiControlProps = UiControlProps> extends DisplayComponent<T> {
  public static readonly FOCUS_CLASS = 'highlight-select';
  public static readonly ACTIVE_CLASS = 'highlight-active';
  public static readonly HIDE_CLASS = 'hide-element';

  protected focusSubject = ComputedSubject.create(false, (v) => {
    return v ? UiControl.FOCUS_CLASS : '';
  });

  protected isEnabledSubject = Subject.create(true);
  protected isVisibleSubject = Subject.create(true);
  protected isActivated = false;
  protected registerSelf = true;
  protected containerRef = FSComponent.createRef<HTMLElement>();

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

  /** Method to focus this control */
  public focus(): void {
    this.focusSubject.set(true);
  }

  /** Method to unfocus this control */
  public blur(): void {
    this.focusSubject.set(false);
    this.isActivated = false;
  }

  /** Activates the control. Usually after being focused and some action happens. */
  public activate(): void {
    this.isActivated = true;
    this.onActivated();
    if (this.props.onActivated) {
      this.props.onActivated(this);
    }
  }

  /** Deactivate the control. */
  public deactivate(): void {
    this.isActivated = false;
    this.onDeactivated();
    if (this.props.onDeactivated) {
      this.props.onDeactivated(this);
    }
  }

  /** Method to check if this UiControl is in focus
   * @returns a boolean whether this is in focus
   */
  public getIsFocused(): boolean {
    return this.focusSubject.getRaw();
  }

  /**
   * Gets a boolean indicating if this control is enabled.
   * @returns A boolean.
   */
  public getIsEnabled(): boolean {
    return this.isEnabledSubject.get();
  }

  /**
   * Sets the enabled state of this control.
   * @param enable A {boolean} indicating if this control should be enabled.
   */
  public setIsEnabled(enable: boolean): void {
    if (!enable && this.getIsFocused()) {
      this.blur();
    }
    this.isEnabledSubject.set(enable);
  }

  /**
   * Sets the visibility of this control.
   * @param visible A {boolean} indicating if this control should be visible.
   */
  public setIsVisible(visible: boolean): void {
    this.isVisibleSubject.set(visible);
  }

  /**
   * Gets a boolean indicating if this control is visible.
   * @returns A boolean.
   */
  public getIsVisible(): boolean {
    return this.isVisibleSubject.get();
  }

  /**
   * Gets a boolean indicating if this control is able to be focused.
   * @returns A boolean.
   */
  public getIsFocusable(): boolean {
    return this.getIsEnabled() && this.getIsVisible();
  }

  /**
   * Gets a boolean indicating if this control is currently activated.
   * @returns A boolean.
   */
  public getIsActivated(): boolean {
    return this.isActivated;
  }

  /** @inheritdoc */
  public onBeforeRender(): void {
    this.onRegister();
  }

  /** @inheritdoc */
  public onAfterRender(): void {
    this.focusSubject.sub((v, rv) => {
      if (rv) {
        this.getHighlightElement()?.classList.add(UiControl.FOCUS_CLASS);
      } else {
        this.getHighlightElement()?.classList.remove(UiControl.FOCUS_CLASS);
      }
    }, true);

    this.isVisibleSubject.sub((v) => {
      if (v) {
        this.containerRef.instance.classList.remove(UiControl.HIDE_CLASS);
      } else {
        this.containerRef.instance.classList.add(UiControl.HIDE_CLASS);
      }
    }, true);

    this.props.isVisible?.sub((v) => {
      this.setIsVisible(v);
    }, true);
  }

  /**
   * Gets the element to highlight on focus.
   * Should be overriden by inheriting controls when the highlight is not the topmost container.
   * @protected
   * @returns The {Element} to highlight.
   */
  public getHighlightElement(): Element | null {
    return this.containerRef.instance.firstElementChild;
  }

  /** Method to register this Ui Control */
  public onRegister(): void {
    if (this.props.onRegister) {
      if (this.registerSelf) {
        this.props.onRegister(this);
      }
    } else {
      console.warn('No register method found for UiControl');
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

  /** Method to override what to do when control is activated */
  public onActivated(): void {
    this.getHighlightElement()?.classList.remove(UiControl.FOCUS_CLASS);
    this.getHighlightElement()?.classList.add(UiControl.ACTIVE_CLASS);
  }

  /** Method to override what to do when control is deactivated */
  public onDeactivated(): void {
    this.getHighlightElement()?.classList.remove(UiControl.ACTIVE_CLASS);
    if (this.getIsFocused()) {
      this.getHighlightElement()?.classList.add(UiControl.FOCUS_CLASS);
    }
  }

  /**
   * A method which is called when this control receives an interaction event.
   * @param evt The event.
   * @returns Whether the event was handled.
   */
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.UPPER_INC:
        this.onUpperKnobInc();
        return true;
      case FmsHEvent.UPPER_DEC:
        this.onUpperKnobDec();
        return true;
      case FmsHEvent.LOWER_DEC:
        this.onLowerKnobDec();
        return true;
      case FmsHEvent.LOWER_INC:
        this.onLowerKnobInc();
        return true;
      case FmsHEvent.ENT:
        return this.onEnter();
      case FmsHEvent.CLR:
        return this.onClr();
      case FmsHEvent.DIRECTTO:
        return this.onDirectTo();
    }

    return false;
  }

  /** Method to override that specifies what to do on Enter
   * @returns A boolean indicating if the control handled the event.
   */
  public onEnter(): boolean {
    if (this.props.onEnter) {
      return this.props.onEnter(this);
    }
    return false;
  }

  /** Method to override that specifies what to do on Clr
   * @returns A boolean indicating if the control handled the event.
   */
  public onClr(): boolean {
    if (this.props.onClr) {
      return this.props.onClr(this);
    }
    return false;
  }

  /**
   * Method to overwirte that specifies what to do on a direct to.
   * @returns A boolean indicating if the control handleded the event.
   */
  public onDirectTo(): boolean {
    if (this.props.onDirectTo) {
      return this.props.onDirectTo(this);
    }
    return false;
  }

  /** Method to override that specifies what to do on upper knob */
  public onUpperKnob(): void {
    if (this.props.onUpperKnob) {
      this.props.onUpperKnob(this);
    }
  }

  /** Method to override that specifies what to do on upper knob inc */
  public onUpperKnobInc(): void {
    if (this.props.onUpperKnobInc) {
      this.props.onUpperKnobInc(this);
    } else {
      this.onUpperKnob();
    }
  }

  /** Method to override that specifies what to do on upper knob dec */
  public onUpperKnobDec(): void {
    if (this.props.onUpperKnobDec) {
      this.props.onUpperKnobDec(this);
    } else {
      this.onUpperKnob();
    }
  }

  /** Method to override that specifies what to do on lower knob */
  public onLowerKnob(): void {
    if (this.props.onLowerKnob) {
      this.props.onLowerKnob(this);
    }
  }

  /** Method to override that specifies what to do on lower knob inc */
  public onLowerKnobInc(): void {
    if (this.props.onLowerKnobInc) {
      this.props.onLowerKnobInc(this);
    } else {
      this.onLowerKnob();
    }
  }

  /** Method to override that specifies what to do on lower knob dec */
  public onLowerKnobDec(): void {
    if (this.props.onLowerKnobDec) {
      this.props.onLowerKnobDec(this);
    } else {
      this.onLowerKnob();
    }
  }

  protected abstract renderControl(): VNode;

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    const content = (this.props.children && this.props.children.length > 0) ? this.props.children : this.renderControl();
    const hideClass = this.getIsVisible() ? '' : UiControl.HIDE_CLASS;
    return (
      // TODO: would like to have this more layout neutral
      <div ref={this.containerRef} class={`${this.props.class ?? ''} ${hideClass}`}>
        {content}
      </div>
    );
  }
}
