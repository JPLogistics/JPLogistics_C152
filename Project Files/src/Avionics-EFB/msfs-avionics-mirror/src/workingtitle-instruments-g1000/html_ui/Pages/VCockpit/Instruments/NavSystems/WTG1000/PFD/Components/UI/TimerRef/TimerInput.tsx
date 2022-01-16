import { FSComponent, VNode, Subject, MathUtils } from 'msfssdk';
import { UiControlProps, UiControl } from '../../../../Shared/UI/UiControl';
import { NumberInput } from '../../../../Shared/UI/UIControls/NumberInput';
import { Timer, TimerMode } from './Timer';

import './TimerInput.css';

/**
 * The properties on the timer input component.
 */
interface TimerInputProps extends UiControlProps {
  /** An instance of the timer. */
  timer: Timer;
}

/**
 * The TimerInput Component.
 */
export class TimerInput extends UiControl<TimerInputProps> {
  private readonly inputCtrls: NumberInput[] = [];
  private activeInput: NumberInput | undefined = undefined;
  private highlightIndex = 0;

  private timerSubjects = [
    Subject.create(0),
    Subject.create(0),
    Subject.create(0),
    Subject.create(0),
    Subject.create(0),
  ]

  /**
   * A method called to get the current timer mode.
   * @returns the current TimerMode
   */
  public getTimerMode(): TimerMode {
    return this.props.timer.mode;
  }

  /**
   * A method called to get the current timer mode.
   * @returns the current TimerMode
   */
  public getTimerState(): boolean {
    return this.props.timer.timerRunning;
  }

  /**
   * A method called to get the current timer reset state.
   * @returns the current timer reset state
   */
  public getTimerResetState(): boolean {
    return this.props.timer.canReset;
  }

  /**
   * Sets this control's input value to a specific duration.
   * @param seconds The input to set in seconds.
   */
  public setInput(seconds: number): void {
    const timerValues = Timer.SecondsToHMMSS(seconds);
    this.timerSubjects[0].set(timerValues.hours);
    this.timerSubjects[1].set(timerValues.minutesTens);
    this.timerSubjects[2].set(timerValues.minutesOnes);
    this.timerSubjects[3].set(timerValues.secondsTens);
    this.timerSubjects[4].set(timerValues.secondsOnes);
  }

  /**
   * A method called to stop the timer.
   */
  public stopTimer(): void {
    this.props.timer.timerRunning = false;
    this.props.timer.canReset = true;
  }

  /**
   * A method called to start the timer.
   */
  public startTimer(): void {
    this.props.timer.timerRunning = true;
  }

  /**
   * A method called to reset the timer.
   */
  public resetTimer(): void {
    this.timerSubjects[0].set(0);
    this.timerSubjects[1].set(0);
    this.timerSubjects[2].set(0);
    this.timerSubjects[3].set(0);
    this.timerSubjects[4].set(0);
    this.props.timer.resetTimer();
  }

  /**
   * Sets the value of this control's timer to the current input value.
   */
  private setTimerFromInput(): void {
    const hours = this.timerSubjects[0].get();
    const minutes = 10 * this.timerSubjects[1].get() + this.timerSubjects[2].get();
    const seconds = 10 * this.timerSubjects[3].get() + this.timerSubjects[4].get();
    this.props.timer.setTimerValue(hours * 3600 + minutes * 60 + seconds);
  }

  /** @inheritdoc */
  public onUpperKnobInc(): void {
    if (!this.isActivated) {
      this.activate();
    } else {
      this.activeInput?.onUpperKnobInc();
    }
  }

  /** @inheritdoc */
  public onUpperKnobDec(): void {
    if (!this.isActivated) {
      this.activate();
    } else {
      this.activeInput?.onUpperKnobDec();
    }
  }

  /** @inheritdoc */
  public onLowerKnobInc(): void {
    this.highlightIndex++;
    this.highlightInput(this.highlightIndex);
  }

  /** @inheritdoc */
  public onLowerKnobDec(): void {
    this.highlightIndex--;
    this.highlightInput(this.highlightIndex);
  }

  /** @inheritdoc */
  public onEnter(): boolean {
    if (this.isActivated) {
      this.setTimerFromInput();
      this.deactivate();
      return true;
    } else {
      return false;
    }
  }

  /** @inheritdoc */
  public onClr(): boolean {
    if (this.isActivated) {
      this.deactivate();
      return true;
    } else {
      return false;
    }
  }

  /**
   * Highlights the specified input control.
   * @param index The index of the input to highlight.
   */
  private highlightInput(index: number): void {
    if (this.activeInput) {
      this.activeInput.blur();
    }
    this.highlightIndex = MathUtils.clamp(index, 0, this.inputCtrls.length - 1);
    this.activeInput = this.inputCtrls[this.highlightIndex];
    this.activeInput.focus();
  }

  /**
   * Registers the inputs with this control
   * @param ctrl The number input to register.
   */
  private register = (ctrl: NumberInput): void => {
    this.inputCtrls.push(ctrl);
  }

  /** @inheritdoc */
  public onActivated(): void {
    this.highlightIndex = 0;
    this.getHighlightElement()?.classList.remove(UiControl.FOCUS_CLASS);
    this.highlightInput(this.highlightIndex);
  }

  /** @inheritdoc */
  public onDeactivated(): void {
    this.activeInput?.blur();
    if (this.getIsFocused()) {
      this.getHighlightElement()?.classList.add(UiControl.FOCUS_CLASS);
    }

    this.setInput(this.props.timer.timerValue);
  }

  /** @inheritdoc */
  renderControl(): VNode {
    return (
      <div class="timerref-timer-container">
        <NumberInput onRegister={this.register} dataSubject={this.timerSubjects[0]} minValue={0} maxValue={99} increment={1} wrap={true} class='timerref-timer-number' />:
        <NumberInput onRegister={this.register} dataSubject={this.timerSubjects[1]} minValue={0} maxValue={5} increment={1} wrap={true} class='timerref-timer-number' />
        <NumberInput onRegister={this.register} dataSubject={this.timerSubjects[2]} minValue={0} maxValue={9} increment={1} wrap={true} class='timerref-timer-number' />:
        <NumberInput onRegister={this.register} dataSubject={this.timerSubjects[3]} minValue={0} maxValue={5} increment={1} wrap={true} class='timerref-timer-number' />
        <NumberInput onRegister={this.register} dataSubject={this.timerSubjects[4]} minValue={0} maxValue={9} increment={1} wrap={true} class='timerref-timer-number' />
      </div>
    );
  }
}
