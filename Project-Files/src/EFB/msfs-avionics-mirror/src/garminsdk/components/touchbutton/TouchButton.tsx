import { ComponentProps, DisplayComponent, FSComponent, SetSubject, Subject, Subscribable, SubscribableSet, Subscription, VNode } from 'msfssdk';

/**
 * Component props for TouchButton.
 */
export interface TouchButtonProps extends ComponentProps {
  /**
   * Whether the button is enabled, or a subscribable which provides it. Disabled buttons cannot be pressed. Defaults
   * to `true`.
   */
  isEnabled?: boolean | Subscribable<boolean>;

  /** Whether the button is highlighted, or a subscribable which provides it. Defaults to `false`. */
  isHighlighted?: boolean | Subscribable<boolean>;

  /**
   * The label for the button. Can be defined as either a static `string`, a subscribable which provides the label
   * `string`, or a VNode. If not defined, the button will not have a label.
   */
  label?: string | Subscribable<string> | VNode;

  /**
   * A callback function which will be called every time the button is pressed.
   * @param button The button that was pressed.
   */
  onPressed?: <B extends TouchButton = TouchButton>(button: B) => void;

  /** A callback function which will be called when the button is destroyed. */
  onDestroy?: () => void;

  /** CSS class(es) to apply to the button's root element. */
  class?: string | SubscribableSet<string>;
}

/**
 * A touchscreen button.
 *
 * The root element of the button contains the `touch-button` CSS class by default. The root element also
 * conditionally contains the `touch-button-disabled` and `touch-button-primed` classes when the button is disabled
 * and primed, respectively.
 *
 * The root element optionally contains a child label element with the CSS class `touch-button-label`.
 */
export class TouchButton<P extends TouchButtonProps = TouchButtonProps> extends DisplayComponent<P> {
  protected readonly rootRef = FSComponent.createRef<HTMLDivElement>();

  protected readonly mouseDownListener = this.onMouseDown.bind(this);
  protected readonly mouseUpListener = this.onMouseUp.bind(this);
  protected readonly mouseLeaveListener = this.onMouseLeave.bind(this);

  protected readonly isEnabled = Subject.create(true);
  protected readonly isHighlighted = Subject.create(false);
  protected isPrimed = false;

  protected readonly cssClassSet = SetSubject.create(['touch-button']);

  protected isEnabledPipe?: Subscription;
  protected isHighlightedPipe?: Subscription;
  protected cssClassSub?: Subscription;

  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onAfterRender(node: VNode): void {
    if (typeof this.props.isEnabled === 'object') {
      this.isEnabledPipe = this.props.isEnabled.pipe(this.isEnabled);
    } else {
      this.isEnabled.set(this.props.isEnabled ?? true);
    }

    if (typeof this.props.isHighlighted === 'object') {
      this.isHighlightedPipe = this.props.isHighlighted.pipe(this.isHighlighted);
    } else {
      this.isHighlighted.set(this.props.isHighlighted ?? false);
    }

    this.isEnabled.sub(isEnabled => {
      if (isEnabled) {
        this.cssClassSet.delete('touch-button-disabled');
      } else {
        this.cssClassSet.add('touch-button-disabled');
      }

      if (!isEnabled) {
        this.setPrimed(false);
      }
    }, true);

    this.isHighlighted.sub(isHighlighted => {
      if (isHighlighted) {
        this.cssClassSet.add('touch-button-highlight');
      } else {
        this.cssClassSet.delete('touch-button-highlight');
      }
    }, true);

    this.rootRef.instance.addEventListener('mousedown', this.mouseDownListener);
    this.rootRef.instance.addEventListener('mouseup', this.mouseUpListener);
    this.rootRef.instance.addEventListener('mouseleave', this.mouseLeaveListener);
  }

  /**
   * Sets the primed state of this button.
   * @param isPrimed The new primed state.
   */
  protected setPrimed(isPrimed: boolean): void {
    if (this.isPrimed === isPrimed) {
      return;
    }

    this.isPrimed = isPrimed;
    if (isPrimed) {
      this.cssClassSet.add('touch-button-primed');
    } else {
      this.cssClassSet.delete('touch-button-primed');
    }

  }

  /**
   * Responds to mouse down events on this button's root element.
   */
  protected onMouseDown(): void {
    if (this.isEnabled.get()) {
      this.setPrimed(true);
    }
  }

  /**
   * Responds to mouse up events on this button's root element.
   */
  protected onMouseUp(): void {
    const wasPrimed = this.isPrimed;
    this.setPrimed(false);
    if (wasPrimed && this.isEnabled.get()) {
      this.onPressed();
    }
  }

  /**
   * Responds to mouse leave events on this button's root element.
   */
  protected onMouseLeave(): void {
    this.setPrimed(false);
  }

  /**
   * Responds to when this button is pressed.
   */
  protected onPressed(): void {
    this.props.onPressed && this.props.onPressed(this);
  }

  /** @inheritdoc */
  public render(): VNode {
    const reservedClasses = this.getReservedCssClasses();

    if (typeof this.props.class === 'object') {
      this.cssClassSub = FSComponent.bindCssClassSet(this.cssClassSet, this.props.class, reservedClasses);
    } else {
      for (const cssClassToAdd of FSComponent.parseCssClassesFromString(this.props.class ?? '').filter(cssClass => !reservedClasses.has(cssClass))) {
        this.cssClassSet.add(cssClassToAdd);
      }
    }

    return (
      <div ref={this.rootRef} class={this.cssClassSet}>
        {this.renderLabel()}
        {this.props.children}
      </div>
    );
  }

  /**
   * Renders this button's label.
   * @returns This button's rendered label, or `null` if this button does not have a label.
   */
  protected renderLabel(): VNode | null {
    if (this.props.label === undefined) {
      return null;
    }

    return (
      <div class='touch-button-label'>{this.props.label}</div>
    );
  }

  /**
   * Gets the CSS classes that are reserved for this button's root element.
   * @returns The CSS classes that are reserved for this button's root element.
   */
  protected getReservedCssClasses(): Set<string> {
    return new Set(['touch-button', 'touch-button-disabled', 'touch-button-primed', 'touch-button-highlight']);
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();

    this.isEnabledPipe?.destroy();
    this.isHighlightedPipe?.destroy();
    this.cssClassSub?.destroy();

    this.rootRef.instance.removeEventListener('mousedown', this.mouseDownListener);
    this.rootRef.instance.removeEventListener('mouseup', this.mouseUpListener);
    this.rootRef.instance.removeEventListener('mouseleave', this.mouseLeaveListener);

    this.props.onDestroy && this.props.onDestroy();
  }
}