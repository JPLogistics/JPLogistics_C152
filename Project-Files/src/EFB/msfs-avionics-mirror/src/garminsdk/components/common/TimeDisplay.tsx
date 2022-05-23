import { ComponentProps, DisplayComponent, FSComponent, MappedSubscribable, Subject, Subscribable, SubscribableMapFunctions, SubscribableSet, Subscription, VNode } from 'msfssdk';

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
  /** The time to display, as a UNIX timestamp in milliseconds, or a subscribable which provides it. */
  time: number | Subscribable<number>;

  /** The display format, or a subscribable which provides it. */
  format: TimeDisplayFormat | Subscribable<TimeDisplayFormat>;

  /** The local time offset, in milliseconds, or a subscribable which provides it. */
  localOffset: number | Subscribable<number>;

  /** CSS class(es) to apply to the root of the component. */
  class?: string | SubscribableSet<string>;
}

/**
 * Displays time in HH:MM:SS format.
 */
export class TimeDisplay extends DisplayComponent<TimeDisplayProps> {
  private static readonly SECOND_PRECISION_MAP = SubscribableMapFunctions.withPrecision(1000);

  private readonly timeSeconds = typeof this.props.time === 'object'
    ? (this.timeSub = this.props.time.map(TimeDisplay.SECOND_PRECISION_MAP))
    : Subject.create(TimeDisplay.SECOND_PRECISION_MAP(this.props.time));

  private readonly format = typeof this.props.format === 'object'
    ? this.props.format
    : Subject.create(this.props.format);

  private readonly localOffset = typeof this.props.localOffset === 'object'
    ? this.props.localOffset
    : Subject.create(this.props.localOffset);

  private readonly date = new Date();

  private readonly hourText = Subject.create('');
  private readonly minText = Subject.create('');
  private readonly secText = Subject.create('');
  private readonly suffixText = Subject.create('');

  private readonly updateHandler = this.updateDisplayedTime.bind(this);

  private timeSub?: MappedSubscribable<number>;
  private formatSub?: Subscription;
  private localOffsetSub?: Subscription;

  /** @inheritdoc */
  public onAfterRender(): void {
    this.formatSub = this.format.sub(this.updateHandler);
    this.localOffsetSub = this.localOffset.sub(this.updateHandler);
    this.timeSeconds.sub(this.updateHandler, true);
  }

  /**
   * Updates the displayed time.
   */
  private updateDisplayedTime(): void {
    const utcTime = this.timeSeconds.get();
    const format = this.format.get();

    let isAm = true;

    if (isNaN(utcTime)) {
      this.hourText.set('__');
      this.minText.set('__');
      this.secText.set('__');
    } else {
      const offset = format === TimeDisplayFormat.UTC ? 0 : this.localOffset.get();

      const displayTime = utcTime + offset;
      this.date.setTime(displayTime);

      const hour = this.date.getUTCHours();
      isAm = hour < 12;

      const mod = format === TimeDisplayFormat.Local12 ? 12 : 24;
      const displayHour = mod - (mod - (hour % mod)) % mod;
      this.hourText.set(displayHour.toString().padStart(2, '0'));

      this.minText.set(this.date.getUTCMinutes().toString().padStart(2, '0'));

      this.secText.set(this.date.getUTCSeconds().toString().padStart(2, '0'));
    }


    if (format === TimeDisplayFormat.UTC) {
      this.suffixText.set('UTC');
    } else if (format === TimeDisplayFormat.Local24) {
      this.suffixText.set('LCL');
    } else {
      this.suffixText.set(isAm ? 'AM' : 'PM');
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class={this.props.class ?? ''} style='white-space: nowrap;'>
        <span class='time-hour'>{this.hourText}</span>
        <span class='time-min'>:{this.minText}</span>
        <span class='time-sec'>:{this.secText}</span>
        <span class='time-suffix'>{this.suffixText}</span>
      </div>
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    this.timeSub?.destroy();
    this.formatSub?.destroy();
    this.localOffsetSub?.destroy();
  }
}