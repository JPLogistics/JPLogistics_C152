import { FSComponent, Subject, Subscribable, VNode } from 'msfssdk';
import { FailedBox } from '../../../../Shared/UI/FailedBox';
import { UiControl } from '../../../../Shared/UI/UiControl';
import { FocusPosition, UiControl2, UiControl2Props } from '../../../../Shared/UI/UiControl2';

/** Props on the ConstraintSelector component. */
interface ConstraintSelectorProps extends UiControl2Props {

  /** The data for this component to display. */
  data: Subscribable<number>;

  /** Whether or not the constraint is invalid. */
  isInvalid: Subscribable<boolean>;

  /** Whether or not the constraint has been edited. */
  isEdited: Subscribable<boolean>;

  /** Whether or not the constraint should be hidden. */
  isHidden: Subscribable<boolean>;

  /** A callback called when a new value is selected on the control. */
  onSelected: (altitude: number) => void;

  /** A callback called when an altitude constraint in removed. */
  onRemoved: () => void;
}

/**
 * A component that allows one to select a constraint in the flight plan.
 */
export class ConstraintSelector extends UiControl2<ConstraintSelectorProps> {

  private readonly value = Subject.create<number>(0);
  private readonly isEdited = Subject.create<boolean>(false);
  private readonly el = FSComponent.createRef<HTMLDivElement>();
  private readonly failedBox = FSComponent.createRef<FailedBox>();

  private readonly digitValues = [
    this.value.map(v => this.extractDigit(v, 0)),
    this.value.map(v => this.extractDigit(v, 1)),
    this.value.map(v => this.extractDigit(v, 2)),
    this.value.map(v => this.extractDigit(v, 3)),
    this.value.map(v => this.extractDigit(v, 4))
  ];

  private readonly digitRefs = [
    FSComponent.createRef<HTMLSpanElement>(),
    FSComponent.createRef<HTMLSpanElement>(),
    FSComponent.createRef<HTMLSpanElement>(),
    FSComponent.createRef<HTMLSpanElement>(),
    FSComponent.createRef<HTMLSpanElement>()
  ];

  private isEditing = false;

  /** @inheritdoc */
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.setChildrenDisabled(true);

    this.props.data.sub(altitude => {
      if (!this.isEditing) {
        this.value.set(altitude);
      }
    });

    this.props.isEdited.sub(isEdited => {
      if (!this.isEditing) {
        this.isEdited.set(isEdited);
      }
    });

    this.props.isInvalid.sub(isInvalid => {
      if (!this.isEditing) {
        this.failedBox.instance.resetSize();
        this.failedBox.instance.setFailed(isInvalid);
      }
    }, true);

    this.props.isHidden.sub(isHidden => {
      this.setDisabled(isHidden);
      if (isHidden) {
        this.el.instance.classList.add(UiControl.HIDE_CLASS);
      } else {
        this.el.instance.classList.remove(UiControl.HIDE_CLASS);
      }
    });
  }

  /**
   * Extracts a specific digit from a number.
   * @param value The number to extract from.
   * @param digit The digit to extract, zero indexed.
   * @returns The extracted digit.
   */
  private extractDigit(value: number, digit: number): string {
    if ((value < 1 || isNaN(value)) && !this.isEditing) {
      return '_ ';
    }

    if (value < Math.pow(10, digit) && !this.isEditing) {
      return '';
    }

    return (Math.floor(this.value.get() / Math.pow(10, digit)) % 10).toFixed(0);
  }

  /** @inheritdoc */
  protected onUpperKnobInc(): boolean {
    this.setEditing(true);
    return true;
  }

  /** @inheritdoc */
  protected onUpperKnobDec(): boolean {
    this.setEditing(true);
    return true;
  }

  /**
   * Sets whether or not the control is presently in an edit state.
   * @param isEditing Whether or not the control is editing.
   */
  private setEditing(isEditing: boolean): void {
    if (this.isEditing !== isEditing) {
      if (isEditing) {
        this.setIsolated(true);
        this.setChildrenDisabled(false);
        this.failedBox.instance.setFailed(false);

        this.isEditing = isEditing;
      } else {
        this.setIsolated(false);
        this.setChildrenDisabled(true);

        this.isEditing = isEditing;
        this.isEdited.set(this.props.isEdited.get());

        this.failedBox.instance.resetSize();
        this.failedBox.instance.setFailed(this.props.isInvalid.get());
      }

      this.value.notify();
      this.focus(FocusPosition.First);
    }
  }

  /**
   * Sets all the individual digit controls disabled or enabled.
   * @param areDisabled Whether or not the controls are disabled.
   */
  private setChildrenDisabled(areDisabled: boolean): void {
    for (let i = 0; i < this.length; i++) {
      const control = this.getChild(i);
      control?.setDisabled(areDisabled);
    }
  }

  /** @inheritdoc */
  protected onClr(): boolean {
    if (this.isEditing) {
      this.setEditing(false);
      this.value.set(this.props.data.get());
    } else {
      this.props.onRemoved();
    }

    return true;
  }

  /** @inheritdoc */
  protected onEnter(): boolean {
    if (this.isEditing) {
      if (this.value.get() !== this.props.data.get()) {
        this.props.onSelected(this.value.get());
        this.isEdited.set(true);
      }

      this.setEditing(false);
    } else {
      this.scroll('forward');
    }

    return true;
  }

  /**
   * A callback called when a specific digit is focused.
   * @param digit The digit that was focused, zero indexed.
   */
  private onDigitFocused(digit: number): void {
    this.onBlurred();
    this.digitRefs[digit].instance.classList.add(UiControl.FOCUS_CLASS);
  }

  /**
   * A callback called when a specific digit is blurred.
   * @param digit The digit that was blurred, zero indexed.
   */
  private onDigitBlurred(digit: number): void {
    this.digitRefs[digit].instance.classList.remove(UiControl.FOCUS_CLASS);
  }

  /**
   * A callback called when a specific digit is increased.
   * @param digit The digit that was focused, zero indexed.
   * @returns True as the event is always handled.
   */
  private onDigitIncreased(digit: number): boolean {
    const currentValue = this.value.get();
    if (this.extractDigit(currentValue, digit) === '9') {
      this.value.set(currentValue - (9 * Math.pow(10, digit)));
    } else {
      this.value.set(currentValue + Math.pow(10, digit));
    }

    return true;
  }

  /**
   * A callback called when a specific digit is decreased.
   * @param digit The digit that was blurred, zero indexed.
   * @returns True as the event is always handled.
   */
  private onDigitDecreased(digit: number): boolean {
    const currentValue = this.value.get();
    if (this.extractDigit(currentValue, digit) === '0') {
      this.value.set(currentValue + (9 * Math.pow(10, digit)));
    } else {
      this.value.set(currentValue - Math.pow(10, digit));
    }

    return true;
  }

  /** @inheritdoc */
  protected onFocused(): void {
    for (let i = 0; i < this.length; i++) {
      this.onDigitBlurred(i);
    }

    this.el.instance.classList.add(UiControl.FOCUS_CLASS);
  }

  /** @inheritdoc */
  protected onBlurred(): void {
    this.el.instance.classList.remove(UiControl.FOCUS_CLASS);
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div style='position: relative; height: 18px'>
        <FailedBox color='blue' ref={this.failedBox} />
        <span ref={this.el}>
          <UiControl2 onFocused={(): void => this.onDigitFocused(4)} onBlurred={(): void => this.onDigitBlurred(4)}
            onUpperKnobInc={(): boolean => this.onDigitIncreased(4)} onUpperKnobDec={(): boolean => this.onDigitDecreased(4)}>
            <span ref={this.digitRefs[4]}>{this.digitValues[4]}</span>
          </UiControl2>
          <UiControl2 onFocused={(): void => this.onDigitFocused(3)} onBlurred={(): void => this.onDigitBlurred(3)}
            onUpperKnobInc={(): boolean => this.onDigitIncreased(3)} onUpperKnobDec={(): boolean => this.onDigitDecreased(3)}>
            <span ref={this.digitRefs[3]}>{this.digitValues[3]}</span>
          </UiControl2>
          <UiControl2 onFocused={(): void => this.onDigitFocused(2)} onBlurred={(): void => this.onDigitBlurred(2)}
            onUpperKnobInc={(): boolean => this.onDigitIncreased(2)} onUpperKnobDec={(): boolean => this.onDigitDecreased(2)}>
            <span ref={this.digitRefs[2]}>{this.digitValues[2]}</span>
          </UiControl2>
          <UiControl2 onFocused={(): void => this.onDigitFocused(1)} onBlurred={(): void => this.onDigitBlurred(1)}
            onUpperKnobInc={(): boolean => this.onDigitIncreased(1)} onUpperKnobDec={(): boolean => this.onDigitDecreased(1)}>
            <span ref={this.digitRefs[1]}>{this.digitValues[1]}</span>
          </UiControl2>
          <UiControl2 onFocused={(): void => this.onDigitFocused(0)} onBlurred={(): void => this.onDigitBlurred(0)}
            onUpperKnobInc={(): boolean => this.onDigitIncreased(0)} onUpperKnobDec={(): boolean => this.onDigitDecreased(0)}>
            <span ref={this.digitRefs[0]}>{this.digitValues[0]}</span>
          </UiControl2>
          <span class='smaller'>FT</span>
        </span>
        <svg viewBox='0 0 24 24' width='24' height='24' class={this.isEdited.map(x => x ? '' : UiControl.HIDE_CLASS)}>
          <path d='M 0 16 L 3 16 L 0 13 L 0 16 M 0 13 L 11 2 L 14 5 L 3 16 L 0 13 M 11 2 L 13 0 L 16 3 L 14 5 L 11 2' stroke='#333' stroke-width='1.2px' fill='cyan' />
        </svg>
      </div>
    );
  }
}