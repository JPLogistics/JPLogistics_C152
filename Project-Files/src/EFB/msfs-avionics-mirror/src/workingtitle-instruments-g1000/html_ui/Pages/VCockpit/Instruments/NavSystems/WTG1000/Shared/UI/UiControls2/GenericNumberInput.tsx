import { DisplayComponent, FSComponent, Subject, VNode } from 'msfssdk';
import { DebounceTimer } from 'msfssdk/utils/time';
import { FocusPosition } from 'msfssdk/components/controls';
import { FmsHEvent } from '../FmsHEvent';
import { G1000UiControl, G1000UiControlProps } from '../../UI/G1000UiControl';
import { DigitInput } from './DigitInput';
import { SignInput } from './SignInput';

import './GenericNumberInput.css';

/**
 * Component props for GenericNumberInput.
 */
export interface GenericNumberInputProps extends G1000UiControlProps {
  /** A subject which is bound to the input value. */
  value: Subject<number>;

  /**
   * A function which assigns values to individual sign and digit inputs based on the bound value.
   * @param value The bound value.
   * @param signValues An array containing subjects which bind the values of the component's individual sign inputs.
   * The order of the subjects is the same as the order of the sign inputs in the component's control subtree.
   * @param digitValues An array containing subjects which bind the values of the component's individual digit inputs.
   * The order of the subjects is the same as the order of the digit inputs in the component's control subtree.
   */
  digitizer?: (value: number, signValues: readonly Subject<1 | -1>[], digitValues: readonly Subject<number>[]) => void;

  /**
   * A function which renders the input's value when editing is not active. If defined, the output of the function
   * replaces all rendered child components when editing is not active.
   */
  renderInactiveValue?: (value: number) => string | VNode;

  /**
   * The duration, in milliseconds, of the applied solid highlight when this input is focused or edited. Defaults to
   * 1000.
   */
  solidHighlightDuration?: number;

  /**
   * A function which responds to when an input value is accepted.
   * @param value The accepted value.
   */
  onInputAccepted?: (value: number) => void;

  /**
   * A function which responds to when an input value is rejected.
   * @param value The rejected value.
   */
  onInputRejected?: (value: number) => void;

  /** Whether the first event activating the input should also edit the value. */
  editOnActivate?: boolean;

  /** CSS class(es) to apply to the root of the component. */
  class?: string;
}

/**
 * An input which allows users to select a numeric value using a combination of one or more child SignInputs and
 * DigitInputs. The input value is derived from the sum of the values of all child DigitInputs, multiplied by the
 * product of the values of all SignInputs.
 */
export class GenericNumberInput extends G1000UiControl<GenericNumberInputProps> {
  private static readonly DEFAULT_SOLID_HIGHLIGHT_DURATION = 1000; // milliseconds

  private readonly rootRef = FSComponent.createRef<HTMLDivElement>();
  private readonly inputGroupRef = FSComponent.createRef<G1000UiControl>();
  private readonly activeRef = FSComponent.createRef<HTMLDivElement>();
  private readonly inactiveRef = FSComponent.createRef<HTMLDivElement>();

  private readonly signValues: Subject<1 | -1>[] = [];
  private readonly digitValues: Subject<number>[] = [];

  private isEditing = false;
  private inputValue = 0;
  private renderedInactiveValue: string | VNode | null = null;

  private readonly solidHighlightTimer = new DebounceTimer();

  private readonly valueChangedHandler = this.onValueChanged.bind(this);
  private readonly inputChangedHandler = this.onInputChanged.bind(this);

  /** @inheritdoc */
  public onAfterRender(thisNode: VNode): void {
    super.onAfterRender(thisNode);

    this.inputGroupRef.instance.setDisabled(true);

    FSComponent.visitNodes(thisNode, node => {
      if (node.instance instanceof SignInput) {
        this.signValues.push(node.instance.props.sign);
        return true;
      } else if (node.instance instanceof DigitInput) {
        this.digitValues.push(node.instance.props.value);
        return true;
      }

      return false;
    });

    this.inputValue = this.computeValueFromInputs();
    this.props.value.sub(this.valueChangedHandler, true);
    this.signValues.forEach(value => value.sub(this.inputChangedHandler));
    this.digitValues.forEach(value => value.sub(this.inputChangedHandler));
  }

  /**
   * Responds to changes in the input value.
   */
  private onValueChanged(): void {
    this.reconcileValueWithInputs();
    this.updateInactiveDisplay();
  }

  /**
   * Reconciles this component's bound value with the input value derived from this component's individual digit and
   * sign inputs. If the two do not match, a digitizer, if available, is used to change the digit and sign inputs'
   * values such that the input value matches the bound value. If a digitizer is not available or is unable to
   * reconcile the two values, the bound value will be changed to match the input value.
   */
  private reconcileValueWithInputs(): void {
    const value = this.props.value.get();

    // 0 === -0 is true, so we need to differentiate between the two.
    if (value === 0 ? 1 / value === 1 / this.inputValue : value === this.inputValue) {
      return;
    }

    this.props.digitizer && this.props.digitizer(value, this.signValues, this.digitValues);

    this.inputValue = this.computeValueFromInputs();

    if (this.inputValue !== value) {
      this.props.value.set(this.inputValue);
    }
  }

  /**
   * Updates this input's rendered editing-inactive value. If editing is currently active, the rendered editing-
   * inactive value will be hidden. If editing is not active, it will be displayed and updated to reflect this input's
   * current value.
   */
  private updateInactiveDisplay(): void {
    if (!this.isEditing && this.props.renderInactiveValue) {
      const renderedValue = this.props.renderInactiveValue(this.props.value.get());

      if (renderedValue !== this.renderedInactiveValue) {
        this.cleanUpRenderedInactiveValue();

        if (typeof renderedValue === 'string') {
          this.inactiveRef.instance.textContent = renderedValue;
        } else {
          this.inactiveRef.instance.innerHTML = '';
          FSComponent.render(renderedValue, this.inactiveRef.instance);
        }

        this.renderedInactiveValue = renderedValue;
      }

      this.inactiveRef.instance.style.display = '';
      this.activeRef.instance.style.display = 'none';
    } else {
      this.inactiveRef.instance.style.display = 'none';
      this.activeRef.instance.style.display = '';
    }
  }

  /**
   * Cleans up this input's rendered editing-inactive value, destroying any top-level DisplayComponents that are part
   * of the rendered value's VNode tree.
   */
  private cleanUpRenderedInactiveValue(): void {
    if (this.renderedInactiveValue !== null && typeof this.renderedInactiveValue !== 'string') {
      FSComponent.visitNodes(this.renderedInactiveValue, node => {
        if (node.instance instanceof DisplayComponent) {
          node.instance.destroy();
          return true;
        }

        return false;
      });
    }

    this.renderedInactiveValue = null;
  }

  /**
   * Responds to changes in the input value.
   */
  private onInputChanged(): void {
    this.inputValue = this.computeValueFromInputs();
  }

  /**
   * Computes a value from this component's individual digit and sign inputs.
   * @returns The value represented by this component's individual digit and sign inputs.
   */
  private computeValueFromInputs(): number {
    const sign = this.signValues.reduce((prev, curr) => prev * curr.get(), 1);
    const abs = this.digitValues.reduce((prev, curr) => prev + curr.get(), 0);

    return sign * abs;
  }

  /** @inheritdoc */
  protected onFocused(source: G1000UiControl): void {
    super.onFocused(source);

    this.applySolidHighlight(this.props.solidHighlightDuration ?? GenericNumberInput.DEFAULT_SOLID_HIGHLIGHT_DURATION);
  }

  /** @inheritdoc */
  protected onBlurred(source: G1000UiControl): void {
    super.onBlurred(source);

    this.rootRef.instance.classList.remove('highlight-active');
    this.rootRef.instance.classList.remove('highlight-select');
    this.deactivateEditing(false);
  }

  /** @inheritdoc */
  protected onEnabled(source: G1000UiControl): void {
    super.onEnabled(source);

    this.rootRef.instance.classList.remove('input-disabled');
  }

  /** @inheritdoc */
  protected onDisabled(source: G1000UiControl): void {
    super.onDisabled(source);

    this.rootRef.instance.classList.add('input-disabled');
  }

  /** @inheritdoc */
  public onUpperKnobInc(): boolean {
    this.activateEditing(FmsHEvent.UPPER_INC);
    return true;
  }

  /** @inheritdoc */
  public onUpperKnobDec(): boolean {
    this.activateEditing(FmsHEvent.UPPER_DEC);
    return true;
  }

  /** @inheritdoc */
  public onEnter(source: G1000UiControl): boolean {
    let handled = false;

    if (this.isEditing) {
      this.deactivateEditing(true);
      handled = true;
    }

    return handled || !!(this.props.onEnter && this.props.onEnter(source));
  }

  /** @inheritdoc */
  public onClr(source: G1000UiControl): boolean {
    let handled = false;

    if (this.isEditing) {
      this.deactivateEditing(false);
      handled = true;
    }

    return handled || !!(this.props.onClr && this.props.onClr(source));
  }

  /**
   * Activates editing for this component.
   * @param activatingEvent The event that triggered activation of editing, if any.
   */
  private activateEditing(activatingEvent?: FmsHEvent.UPPER_INC | FmsHEvent.UPPER_DEC): void {
    if (this.isEditing) {
      return;
    }

    this.solidHighlightTimer.clear();
    this.rootRef.instance.classList.remove('highlight-active');
    this.rootRef.instance.classList.remove('highlight-select');

    this.inactiveRef.instance.style.display = 'none';
    this.activeRef.instance.style.display = '';

    this.inputGroupRef.instance.setDisabled(false);
    this.inputGroupRef.instance.focus(FocusPosition.First);

    if (activatingEvent !== undefined && this.props.editOnActivate) {
      this.inputGroupRef.instance.onInteractionEvent(activatingEvent);
    }

    this.isEditing = true;
  }

  /**
   * Deactivates editing for this component.
   * @param saveValue Whether to save the current edited input value to this component's bound value.
   */
  private deactivateEditing(saveValue: boolean): void {
    if (!this.isEditing) {
      return;
    }

    this.inputGroupRef.instance.blur();
    this.inputGroupRef.instance.setDisabled(true);

    if (this.isFocused) {
      this.applySolidHighlight(this.props.solidHighlightDuration ?? GenericNumberInput.DEFAULT_SOLID_HIGHLIGHT_DURATION);
    } else {
      this.solidHighlightTimer.clear();
    }

    if (saveValue) {
      const acceptedValue = this.inputValue;
      this.props.value.set(acceptedValue);
      this.props.onInputAccepted && this.props.onInputAccepted(acceptedValue);
    } else {
      const rejectedValue = this.inputValue;
      this.reconcileValueWithInputs();
      this.props.onInputRejected && this.props.onInputRejected(rejectedValue);
    }

    this.isEditing = false;

    this.updateInactiveDisplay();
  }

  /**
   * Applies a solid highlight to this input.
   * @param duration The duration, in milliseconds, of the highlight.
   */
  private applySolidHighlight(duration: number): void {
    this.rootRef.instance.classList.remove('highlight-select');
    this.rootRef.instance.classList.add('highlight-active');

    this.solidHighlightTimer.schedule(() => {
      this.rootRef.instance.classList.remove('highlight-active');
      if (this.isFocused) {
        this.rootRef.instance.classList.add('highlight-select');
      }
    }, duration);
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div ref={this.rootRef} class={`number-input ${this.props.class ?? ''}`}>
        <div ref={this.activeRef} class='number-input-active'>
          <G1000UiControl ref={this.inputGroupRef} isolateScroll>{this.props.children}</G1000UiControl>
        </div>
        <div ref={this.inactiveRef} class='number-input-inactive' />
      </div>
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    this.solidHighlightTimer.clear();
    this.props.value.unsub(this.valueChangedHandler);
    this.signValues.forEach(value => value.unsub(this.inputChangedHandler));
    this.digitValues.forEach(value => value.unsub(this.inputChangedHandler));
    this.cleanUpRenderedInactiveValue();
  }
}