import { FSComponent, Subject, VNode } from 'msfssdk';
import { UiControl, UiControlProps } from '../UiControl';

import './NumberInput.css';

/**
 * The properties for the NumberInput component.
 */
interface NumberInputProps extends UiControlProps {
  /** The minimum value allowed. */
  minValue: number;
  /** The maximum value allowed. */
  maxValue: number;
  /** The value by which to increment or decrement with each inner knob input. */
  increment: number;
  /** Whether to wrap values from maxValue to minValue and vice versa. */
  wrap: boolean;
  /** The value to increment or decrement with each inner knob input. */
  dataSubject: Subject<number>;
  /** The optional default text value for when the dataSubject = 0. */
  defaultDisplayValue?: string;
  /** An optional formatter for the display value */
  formatter?: (value: number) => string;
  /** Callback method to send the new value back to the parent component. */
  onValueChanged?(value: number): void;
  /** Whether to quantize input to the nearest increment multiple when changed. */
  quantize?: boolean;
}

/**
 * The NumberInput component.
 */
export class NumberInput extends UiControl<NumberInputProps> {
  private displaySubject = Subject.create('');

  // If increment doesn't divide evenly into range, this will have unexpected behavior!
  private readonly range = this.props.maxValue - this.props.minValue + this.props.increment;

  /** @inheritdoc */
  public onAfterRender(): void {
    super.onAfterRender();

    this.displaySubject.set(this.getDisplaySubject());
    this.props.dataSubject.sub(() => {
      this.displaySubject.set(this.getDisplaySubject());
    });
  }

  /**
   * Method to get the display subject
   * @returns a string to set the display subject
   */
  private getDisplaySubject(): string {
    if (this.props.defaultDisplayValue !== undefined && this.props.dataSubject.get() == 0) {
      return this.props.defaultDisplayValue;
    } else {
      if (this.props.formatter) {
        return this.props.formatter(this.props.dataSubject.get());
      } else {
        return `${this.props.dataSubject.get()}`;
      }
    }
  }

  /** @inheritdoc */
  public onUpperKnobInc(): void {
    let newValue = this.props.wrap
      ? ((this.props.dataSubject.get() + this.props.increment) - this.props.minValue) % this.range + this.props.minValue
      : Math.min(this.props.dataSubject.get() + this.props.increment, this.props.maxValue);
    if (this.props.quantize && newValue % this.props.increment !== 0) {
      newValue = Math.floor(newValue / this.props.increment) * this.props.increment;
    }
    this.props.dataSubject.set(newValue);
    if (this.props.onValueChanged !== undefined) {
      this.props.onValueChanged(this.props.dataSubject.get());
      this.displaySubject.set(this.getDisplaySubject());
    }
  }

  /** @inheritdoc */
  public onUpperKnobDec(): void {
    let newValue = this.props.wrap
      ? this.props.maxValue - (this.props.maxValue - (this.props.dataSubject.get() - this.props.increment)) % this.range
      : Math.max(this.props.dataSubject.get() - this.props.increment, this.props.minValue);
    if (this.props.quantize && newValue % this.props.increment !== 0) {
      newValue = Math.ceil(newValue / this.props.increment) * this.props.increment;
    }
    this.props.dataSubject.set(newValue);
    if (this.props.onValueChanged !== undefined) {
      this.props.onValueChanged(this.props.dataSubject.get());
      this.displaySubject.set(this.getDisplaySubject());
    }
  }

  /** @inheritdoc */
  renderControl(): VNode {
    return (
      <div>{this.displaySubject}</div>
    );
  }

}