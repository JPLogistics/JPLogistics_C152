import { ComponentProps, DisplayComponent, FSComponent, MappedSubscribable, SetSubject, Subscribable, Subscription, VNode } from 'msfssdk';
import { TouchButton } from './TouchButton';

/**
 * Component props for ValueTouchButton.
 */
export interface ValueTouchButtonProps<T> extends ComponentProps {
  /** A subscribable whose state will be bound to the button. */
  state: Subscribable<T>;

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
   * A function which renders the value of the button's bound state, or a {@link VNode} which renders the value. If not
   * defined, values are rendered into strings via default `toString()` behavior.
   */
  renderValue?: ((state: T) => string) | VNode;

  /**
   * A callback function which will be called every time the button is pressed.
   * @param button The button that was pressed.
   */
  onPressed?: <B extends ValueTouchButton<T> = ValueTouchButton<T>>(button: B) => void;

  /** A callback function which will be called when the button is destroyed. */
  onDestroy?: () => void;

  /** CSS class(es) to apply to the button's root element. */
  class?: string;
}

/**
 * A touchscreen button which displays the value of a bound state.
 *
 * The root element of the button contains the `touch-button-value` CSS class by default, in addition to all
 * root-element classes used by {@link TouchButton}.
 *
 * The value of the button's bound state is rendered into a child `div` element containing the CSS class
 * `touch-button-value-value`.
 */
export class ValueTouchButton<T> extends DisplayComponent<ValueTouchButtonProps<T>> {
  protected readonly buttonRef = FSComponent.createRef<TouchButton>();
  protected readonly valueRef = FSComponent.createRef<HTMLDivElement>();

  protected readonly cssClassSet = SetSubject.create(['touch-button-value']);

  protected renderedValue?: MappedSubscribable<string>;
  private cssClassSub?: Subscription;

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
      <TouchButton
        ref={this.buttonRef}
        isEnabled={this.props.isEnabled}
        isHighlighted={this.props.isHighlighted}
        label={this.props.label}
        onPressed={this.onPressed.bind(this)}
        class={this.cssClassSet}
      >
        {this.renderValue()}
        {this.props.children}
      </TouchButton>
    );
  }

  /**
   * Renders this button's value display.
   * @returns This button's rendered value display.
   */
  protected renderValue(): VNode {
    let content: VNode | Subscribable<string>;

    if (this.props.renderValue === undefined) {
      content = this.renderedValue = this.props.state.map(state => `${state}`);
    } else if (typeof this.props.renderValue === 'function') {
      content = this.renderedValue = this.props.state.map(this.props.renderValue);
    } else {
      content = this.props.renderValue;
    }

    return (
      <div ref={this.valueRef} class='touch-button-value-value'>{content}</div>
    );
  }

  /**
   * Gets the CSS classes that are reserved for this button's root element.
   * @returns The CSS classes that are reserved for this button's root element.
   */
  protected getReservedCssClasses(): Set<string> {
    return new Set(['touch-button-value']);
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();

    this.buttonRef.instance.destroy();
    this.renderedValue?.destroy();
    this.cssClassSub?.destroy();

    this.props.onDestroy && this.props.onDestroy();
  }
}