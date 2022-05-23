import { FSComponent, NumberUnitSubject, Subject, UnitFamily, UnitType, VNode } from 'msfssdk';
import { UiControlGroup, UiControlGroupProps } from '../UiControlGroup';
import { NumberInput } from './NumberInput';

import './TimeDistanceInput.css';

/** Props on the TimeDistanceInput component. */
interface TimeDistanceInputProps extends UiControlGroupProps {
  /** The time value to increment or decrement with each inner knob input. */
  timeSubject: NumberUnitSubject<UnitFamily.Duration>;

  /** The distance to increment or decrement with each inner knob input. */
  distanceSubject: NumberUnitSubject<UnitFamily.Distance>;

  /** The class to apply to the control. */
  class?: string;
}

/**
 * An input that can switch between time and distance.
 */
export class TimeDistanceInput extends UiControlGroup<TimeDistanceInputProps> {

  private readonly distanceSubject = Subject.create(0);
  private readonly minutesSubject = Subject.create(0);
  private readonly secondsTensSubject = Subject.create(0);
  private readonly secondsOnesSubject = Subject.create(0);

  private readonly distanceInput = FSComponent.createRef<NumberInput>();
  private readonly minutesInput = FSComponent.createRef<NumberInput>();
  private readonly tensInput = FSComponent.createRef<NumberInput>();
  private readonly onesInput = FSComponent.createRef<NumberInput>();

  private readonly minutesGroup = FSComponent.createRef<HTMLDivElement>();
  private readonly distanceGroup = FSComponent.createRef<HTMLDivElement>();

  private isTimeMode = true;
  private ignoreUpdate = false;

  /** @inheritdoc */
  public onAfterRender(): void {
    this.minutesSubject.sub(() => this.update());
    this.secondsTensSubject.sub(() => this.update());
    this.secondsOnesSubject.sub(() => this.update());
    this.distanceSubject.sub(() => this.update());

    this.props.distanceSubject.sub(v => {
      this.ignoreUpdate = true;
      this.distanceSubject.set(v.asUnit(UnitType.NMILE));
      this.ignoreUpdate = false;
    }, true);
    this.props.timeSubject.sub(v => {
      const minutes = Math.floor(v.asUnit(UnitType.MINUTE));
      const seconds = v.asUnit(UnitType.SECOND) % 60;

      this.ignoreUpdate = true;
      this.minutesSubject.set(minutes);
      this.secondsTensSubject.set(Math.floor(seconds / 10));
      this.secondsOnesSubject.set(seconds % 10);
      this.ignoreUpdate = false;
    }, true);

    this.setMode(true);
  }

  /**
   * Sets the input mode to time or distance.
   * @param isTime True if the input mode should be time, false otherwise.
   */
  public setMode(isTime: boolean): void {
    this.isTimeMode = isTime;
    this.minutesInput.instance.setIsEnabled(isTime);
    this.tensInput.instance.setIsEnabled(isTime);
    this.onesInput.instance.setIsEnabled(isTime);

    this.distanceInput.instance.setIsEnabled(!isTime);

    this.minutesGroup.instance.style.display = isTime ? '' : 'none';
    this.distanceGroup.instance.style.display = isTime ? 'none' : '';
  }

  /**
   * Updates the props subjects.
   */
  private update(): void {
    if (this.ignoreUpdate) {
      return;
    }

    if (this.isTimeMode) {
      const seconds = (this.minutesSubject.get() * 60)
        + (this.secondsTensSubject.get() * 10)
        + this.secondsOnesSubject.get();

      this.props.timeSubject.set(seconds, UnitType.SECOND);
    } else {
      this.props.distanceSubject.set(this.distanceSubject.get(), UnitType.NMILE);
    }
  }

  /**
   * Renders the control.
   * @returns The rendered VNode.
   */
  public render(): VNode {
    return (
      <div class={this.props.class}>
        <div ref={this.distanceGroup}>
          <NumberInput ref={this.distanceInput} class='time-distance-input-number' minValue={0} maxValue={40}
            increment={0.1} onRegister={this.register} wrap dataSubject={this.distanceSubject} formatter={(v): string => `${v.toFixed(1)}`} />
          <span class='time-distance-input-nm'>NM</span>
        </div>
        <div ref={this.minutesGroup}>
          <NumberInput class='time-distance-input-number' ref={this.minutesInput} minValue={0} maxValue={9} increment={1} onRegister={this.register} wrap dataSubject={this.minutesSubject} />
          <div class='time-distance-input-number'>:</div>
          <NumberInput class='time-distance-input-number' ref={this.tensInput} minValue={0} maxValue={5} increment={1} onRegister={this.register} wrap dataSubject={this.secondsTensSubject} />
          <NumberInput class='time-distance-input-number' ref={this.onesInput} minValue={0} maxValue={9} increment={1} onRegister={this.register} wrap dataSubject={this.secondsOnesSubject} />
        </div>
      </div>
    );
  }
}