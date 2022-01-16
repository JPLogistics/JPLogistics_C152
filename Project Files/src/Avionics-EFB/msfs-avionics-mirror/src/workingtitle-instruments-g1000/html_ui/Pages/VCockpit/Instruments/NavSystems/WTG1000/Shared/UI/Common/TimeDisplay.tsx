import { ComponentProps, DisplayComponent, FSComponent, Subject, Subscribable, SubscribableMapFunctions, VNode } from 'msfssdk';

import './TimeDisplay.css';

/**
 * Time display formats.
 */
export enum TimeDisplayFormat {
  /** UTC time. */
  UTC,
  /** Local time in 24-hour format. */
  Local24,
  /** Local time in 12-hour format. */
  Local12
}

/**
 * Component props for TimeDisplay.
 */
export interface TimeDisplayProps extends ComponentProps {
  /** A subscribable which provides the time to display, as a UNIX timestamp in milliseconds. */
  time: Subscribable<number>;

  /** A subscribable which provides the display format. */
  format: Subscribable<TimeDisplayFormat>;

  /** A subscribable which provides the local time offset, in milliseconds. */
  localOffset: Subscribable<number>;

  /** CSS class(es) to apply to the root of the component. */
  class?: string;
}

/**
 * Displays time in HH:MM:SS format.
 */
export class TimeDisplay extends DisplayComponent<TimeDisplayProps> {
  private readonly timeSecondsSub = this.props.time.map(SubscribableMapFunctions.withPrecision(1000));

  private readonly date = new Date();

  private readonly hourSub = Subject.create('');
  private readonly minSub = Subject.create('');
  private readonly secSub = Subject.create('');
  private readonly suffixSub = Subject.create('');

  private readonly updateHandler = this.updateDisplayedTime.bind(this);

  /** @inheritdoc */
  public onAfterRender(): void {
    this.timeSecondsSub.sub(this.updateHandler);
    this.props.format.sub(this.updateHandler);
    this.props.localOffset.sub(this.updateHandler, true);
  }

  /**
   * Updates the displayed time.
   */
  private updateDisplayedTime(): void {
    const utcTime = this.props.time.get();
    const format = this.props.format.get();

    let isAm = true;

    if (isNaN(utcTime)) {
      this.hourSub.set('––');
      this.minSub.set('––');
      this.secSub.set('––');
    } else {
      const offset = format === TimeDisplayFormat.UTC ? 0 : this.props.localOffset.get();

      const displayTime = utcTime + offset;
      this.date.setTime(displayTime);

      const hour = this.date.getUTCHours();
      isAm = hour < 12;

      const mod = format === TimeDisplayFormat.Local12 ? 12 : 24;
      const displayHour = mod - (mod - (hour % mod)) % mod;
      this.hourSub.set(displayHour.toString().padStart(2, '0'));

      this.minSub.set(this.date.getUTCMinutes().toString().padStart(2, '0'));

      this.secSub.set(this.date.getUTCSeconds().toString().padStart(2, '0'));
    }


    if (format === TimeDisplayFormat.UTC) {
      this.suffixSub.set('UTC');
    } else if (format === TimeDisplayFormat.Local24) {
      this.suffixSub.set('LCL');
    } else {
      this.suffixSub.set(isAm ? 'AM' : 'PM');
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class={this.props.class ?? ''} style='white-space: nowrap;'>
        <span class='time-time'>{this.hourSub}:{this.minSub}:{this.secSub}</span><span class='time-suffix'>{this.suffixSub}</span>
      </div>
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    this.timeSecondsSub.destroy();
    this.props.format.unsub(this.updateHandler);
    this.props.localOffset.unsub(this.updateHandler);
  }
}