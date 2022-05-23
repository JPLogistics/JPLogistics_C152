import { EventBus, Publisher } from 'msfssdk/data';
import { GNSSEvents } from 'msfssdk/instruments';
import { G1000ControlEvents } from '../../../../Shared/G1000Events';

/**
 * Timer modes enum.
 */
export enum TimerMode {
  UP,
  DOWN
}

/**
 * This is a timer that can count up or down based on the mode.
 */
export class Timer {
  private _mode = TimerMode.UP;

  private _timerRunning = false;

  private _worldTime = 0;

  private _timerValue = 0;

  private _startTime = 0;

  private _canReset = false;

  private g1000Publisher: Publisher<G1000ControlEvents>;

  /**
   * Get method for timer mode.
   * @returns this._mode value
   */
  public get mode(): TimerMode {
    return this._mode;
  }

  /**
   * Get method for timer mode.
   * @param mode new mode value
   */
  public set mode(mode: TimerMode) {
    this._mode = mode;
  }

  /**
   * Get method for timer state (running or not true/false).
   * @returns this._timerValue value
   */
  public get timerRunning(): boolean {
    return this._timerRunning;
  }

  /**
   * Set method for timer state (running or not true/false).
   * @param state the state to set the timer (true = running, false = stopped).
   */
  public set timerRunning(state: boolean) {
    this._timerRunning = state;
  }

  /**
   * Get the timer value in seconds.
   * @returns this._timerValue value
   */
  public get timerValue(): number {
    return this._timerValue;
  }

  /**
   * Set method for setting whether the timer can be reset.
   * @param state (true = stopped, can be reset, false = has been reset).
   */
  public set canReset(state: boolean) {
    this._canReset = state;
  }

  /**
   * Set method for setting whether the timer can be reset.
   * @returns this._canReset value
   */
  public get canReset(): boolean {
    return this._canReset;
  }


  /**
   * Builds an instance of a Timer
   * @param bus is the EventBus
   * @param onModeChanged is the onModeChanged callback when the timer mode changes
   * @param onValueChanged is the onValuaChanged callback when the timer value changes
   */
  constructor(bus: EventBus, private onModeChanged: (newMode: TimerMode) => void, private onValueChanged: (time: number) => void) {
    this.g1000Publisher = bus.getPublisher<G1000ControlEvents>();

    const gnss = bus.getSubscriber<GNSSEvents>();
    gnss.on('zulu_time')
      .withPrecision(0)
      .whenChangedBy(1)
      .handle((time) => {
        this._worldTime = time;
        if (this._timerRunning) {
          this.updateTimer();
        }
      });
  }

  /**
   * Method to update the timer based on mode and current utc time.
   */
  private updateTimer(): void {
    switch (this._mode) {
      case TimerMode.UP:
        this._timerValue++;
        break;
      case TimerMode.DOWN:
        this._timerValue--;
        if (this._timerValue <= 0) {
          this.mode = TimerMode.UP;
          this.onModeChanged(this.mode);
        }
        break;
    }
    this.onValueChanged(this._timerValue);
    this.g1000Publisher.pub('timer_value', this._timerValue, false, false);
  }

  /**
   * Method to set timer value
   * @param time is the time to set the timer in seconds
   */
  public setTimerValue(time: number): void {
    this._timerValue = time;
  }

  /**
   * Method to reset all timer values
   */
  public resetTimer(): void {
    this._timerValue = 0;
    this.canReset = false;
    this.g1000Publisher.pub('timer_value', 0, false, false);
  }

  /**
   * Utility method to get H:M:S values from seconds.
   * @param totalSeconds is the value in seconds 
   * @returns an object of hours minutes and seconds as numbers
   */
  public static SecondsToHMMSS(totalSeconds: number): any {
    const time = {
      hours: Math.floor(totalSeconds / 3600),
      minutesTens: 0,
      minutesOnes: 0,
      secondsTens: 0,
      secondsOnes: 0
    };
    time.minutesTens = Math.floor((totalSeconds - (time.hours * 3600)) / 600);
    time.minutesOnes = Math.floor((totalSeconds - (time.hours * 3600)) / 60) % 10;
    time.secondsTens = Math.floor((totalSeconds - (time.hours * 3600) - (time.minutesTens * 600) - (time.minutesOnes * 60)) / 10);
    time.secondsOnes = Math.floor((totalSeconds - (time.hours * 3600) - (time.minutesTens * 600) - (time.minutesOnes * 60)) % 10);
    return time;
  }
}