import {
  ComponentProps, DisplayComponent, FSComponent, MappedSubject, MappedSubscribable,
  MutableSubscribable, SetSubject, Subscribable, SubscribableSet, Subscription, VNode
} from 'msfssdk';
import { ToggleStatusBar } from '../common/ToggleStatusBar';
import { TouchButton } from './TouchButton';

/**
 * Common component props for ToggleTouchButton.
 */
export interface ToggleTouchButtonPropsCommon extends ComponentProps {
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

  /** A callback function which will be called when the button is destroyed. */
  onDestroy?: () => void;

  /** CSS class(es) to apply to the button's root element. */
  class?: string | SubscribableSet<string>;
}

/**
 * Component props for a ToggleTouchButton which toggles a boolean state.
 */
export interface ToggleTouchButtonPropsBool extends ToggleTouchButtonPropsCommon {
  /** A mutable subscribable whose state will be bound to the button. */
  state: MutableSubscribable<boolean>;
}

/**
 * Component props for a ToggleTouchButton which sets the value of an arbitrarily typed state.
 */
export interface ToggleTouchButtonPropsAny<T> extends ToggleTouchButtonPropsCommon {
  /** A mutable subscribable whose state will be bound to the button. */
  state: MutableSubscribable<T>;

  /** A subscribable which provides the value which the button sets. */
  setValue: Subscribable<T>;
}

/**
 * A touchscreen button which either toggles a boolean state or sets the value of an arbitrarily typed state with each
 * press. The button also displays the value of its bound boolean state in the first case, or whether the value of its
 * bound state is equal to its set value in the second case.
 *
 * The root element of the button contains the `touch-button-toggle` CSS class by default, in addition to all
 * root-element classes used by {@link TouchButton}.
 *
 * The root element contains a child {@link ToggleStatusBar} component with the CSS class
 * `touch-button-toggle-status-bar` and an optional label element with the CSS class `touch-button-label`.
 */
export class ToggleTouchButton<T>
  extends DisplayComponent<T extends boolean ? ToggleTouchButtonPropsBool | ToggleTouchButtonPropsAny<T> : ToggleTouchButtonPropsAny<T>> {

  protected readonly buttonRef = FSComponent.createRef<TouchButton>();
  protected readonly statusBarRef = FSComponent.createRef<ToggleStatusBar>();

  protected readonly cssClassSet = SetSubject.create(['touch-button-toggle']);

  protected mappedToggleState?: MappedSubscribable<boolean>;
  protected cssClassSub?: Subscription;

  /** @inheritdoc */
  public render(): VNode {
    const props = this.props as ToggleTouchButtonPropsBool | ToggleTouchButtonPropsAny<T>;
    const useSetValue = 'setValue' in props;

    let onPressed: () => void;
    let toggleState: Subscribable<boolean>;

    if (useSetValue) {
      onPressed = (): void => { props.state.set(props.setValue.get()); };
      toggleState = this.mappedToggleState = MappedSubject.create(
        ([state, setValue]): boolean => state === setValue,
        props.state,
        props.setValue
      );
    } else {
      onPressed = (): void => { props.state.set(!props.state.get()); };
      toggleState = props.state;
    }

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
        onPressed={onPressed}
        class={this.cssClassSet}
      >
        <ToggleStatusBar ref={this.statusBarRef} state={toggleState} class='touch-button-toggle-status-bar'></ToggleStatusBar>
        {this.props.children}
      </TouchButton>
    );
  }

  /**
   * Gets the CSS classes that are reserved for this button's root element.
   * @returns The CSS classes that are reserved for this button's root element.
   */
  protected getReservedCssClasses(): Set<string> {
    return new Set(['touch-button-toggle']);
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();

    this.buttonRef.instance.destroy();
    this.statusBarRef.instance.destroy();
    this.mappedToggleState?.destroy();

    this.props.onDestroy && this.props.onDestroy();
  }
}