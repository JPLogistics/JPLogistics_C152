import { ComponentProps, DisplayComponent, FSComponent, Subject, VNode } from 'msfssdk';
import { ConsumerSubject, EventBus } from 'msfssdk/data';
import { ClockEvents } from 'msfssdk/instruments';
import { TimeDisplay, TimeDisplayFormat } from '../../../../Shared/UI/Common/TimeDisplay';
import { GroupBox } from '../GroupBox';
import { MFDSystemSetupGroupProps } from './MFDSystemSetupGroup';
import { MFDSystemSetupGenericRow } from './MFDSystemSetupRow';

/**
 * The MFD System Setup page Date/Time group.
 */
export class MFDSystemSetupDateTimeGroup extends DisplayComponent<MFDSystemSetupGroupProps> {
  /** @inheritdoc */
  public render(): VNode {
    return (
      <GroupBox title='Date / Time' class='mfd-system-setup-group'>
        <MFDSystemSetupGenericRow
          title='Date'
          right={<DateDisplay bus={this.props.bus} />}
        />
        <MFDSystemSetupGenericRow
          title='Time'
          right={
            <TimeDisplay
              time={ConsumerSubject.create(this.props.bus.getSubscriber<ClockEvents>().on('simTime'), 0)}
              format={Subject.create(TimeDisplayFormat.UTC)}
              localOffset={Subject.create(0)}
            />
          }
        />
        <MFDSystemSetupGenericRow
          title='Time Format'
          right={<div>UTC</div>}
        />
        <MFDSystemSetupGenericRow
          title='Time Offset'
          right={<div>––:––</div>}
        />
      </GroupBox>
    );
  }
}

/**
 * Component props for DateDisplay.
 */
interface DateDisplayProps extends ComponentProps {
  /** The event bus. */
  bus: EventBus;
}

/**
 * Displays the date in sim time in DD–MMM–YY format.
 */
class DateDisplay extends DisplayComponent<DateDisplayProps> {
  private static readonly MONTH_TEXT = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ];

  private readonly date = new Date();

  private readonly dateSub = Subject.create('__');
  private readonly monthSub = Subject.create('__');
  private readonly yearSub = Subject.create('__');

  /** @inheritdoc */
  public onAfterRender(): void {
    this.props.bus.getSubscriber<ClockEvents>().on('simTime').withPrecision(-3).handle(this.onTimeChanged.bind(this));
  }

  /**
   * Responds to changes in sim time.
   * @param time The current sim time, as a UNIX timestamp in milliseconds.
   */
  private onTimeChanged(time: number): void {
    this.date.setTime(time);

    this.dateSub.set(this.date.getUTCDate().toString());
    this.monthSub.set(DateDisplay.MONTH_TEXT[this.date.getUTCMonth()]);
    this.yearSub.set((this.date.getUTCFullYear() % 100).toString());
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div>{this.dateSub}–{this.monthSub}–{this.yearSub}</div>
    );
  }
}