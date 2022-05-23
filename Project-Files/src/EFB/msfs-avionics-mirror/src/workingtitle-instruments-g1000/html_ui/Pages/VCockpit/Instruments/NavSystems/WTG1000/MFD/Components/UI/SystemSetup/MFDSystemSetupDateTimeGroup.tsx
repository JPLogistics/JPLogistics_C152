import { ArraySubject, ComponentProps, DisplayComponent, FSComponent, MappedSubject, Subject, UnitType, VNode } from 'msfssdk';
import { ConsumerSubject, EventBus } from 'msfssdk/data';
import { ClockEvents } from 'msfssdk/instruments';
import { UserSettingManager } from 'msfssdk/settings';
import { DateTimeFormatSettingMode, DateTimeUserSettings, DateTimeUserSettingTypes } from '../../../../Shared/DateTime/DateTimeUserSettings';
import { TimeDisplay, TimeDisplayFormat } from '../../../../Shared/UI/Common/TimeDisplay';
import { UiControl } from '../../../../Shared/UI/UiControl';
import { DigitInput } from '../../../../Shared/UI/UiControls2/DigitInput';
import { GenericNumberInput } from '../../../../Shared/UI/UiControls2/GenericNumberInput';
import { SignInput } from '../../../../Shared/UI/UiControls2/SignInput';
import { G1000UiControlWrapper } from '../../../../Shared/UI/UiControls2/G1000UiControlWrapper';
import { UserSettingNumberController } from '../../../../Shared/UI/UserSettings/UserSettingNumberController';
import { GroupBox } from '../GroupBox';
import { MFDSystemSetupGroupProps } from './MFDSystemSetupGroup';
import { MFDSystemSetupGenericRow, MFDSystemSetupSelectRow } from './MFDSystemSetupRow';

import './MFDSystemSetupDateTimeGroup.css';

/**
 * The MFD System Setup page Date/Time group.
 */
export class MFDSystemSetupDateTimeGroup extends DisplayComponent<MFDSystemSetupGroupProps> {
  private static readonly FORMAT_SETTING_MAP = {
    [DateTimeFormatSettingMode.Local12]: TimeDisplayFormat.Local12,
    [DateTimeFormatSettingMode.Local24]: TimeDisplayFormat.Local24,
    [DateTimeFormatSettingMode.UTC]: TimeDisplayFormat.UTC
  };

  private readonly settingManager = DateTimeUserSettings.getManager(this.props.bus);

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
              format={
                ConsumerSubject.create(this.settingManager.whenSettingChanged('dateTimeFormat'), this.settingManager.getSetting('dateTimeFormat').value).map(setting => {
                  return MFDSystemSetupDateTimeGroup.FORMAT_SETTING_MAP[setting];
                })
              }
              localOffset={ConsumerSubject.create(this.settingManager.whenSettingChanged('dateTimeLocalOffset'), this.settingManager.getSetting('dateTimeLocalOffset').value)}
            />
          }
        />
        <MFDSystemSetupSelectRow<DateTimeUserSettingTypes, 'dateTimeFormat'>
          title={'Time Format'}
          selectControlProps={{
            registerFunc: this.props.registerFunc,
            settingManager: this.settingManager,
            settingName: 'dateTimeFormat',
            values: ArraySubject.create([DateTimeFormatSettingMode.Local12, DateTimeFormatSettingMode.Local24, DateTimeFormatSettingMode.UTC]),
            valueText: ArraySubject.create(['Local 12hr', 'Local 24hr', 'UTC']),
            outerContainer: this.props.pageContainerRef,
            viewService: this.props.viewService
          }}
        />
        <MFDSystemSetupGenericRow
          title='Time Offset'
          right={
            <LocalOffsetInput
              registerFunc={this.props.registerFunc}
              settingManager={this.settingManager}
            />
          }
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

  private readonly dateTimeSettingManager = DateTimeUserSettings.getManager(this.props.bus);

  private readonly simTime = ConsumerSubject.create(this.props.bus.getSubscriber<ClockEvents>().on('simTime').withPrecision(-3), 0);
  private readonly offset = MappedSubject.create(
    ([format, localOffset]): number => {
      if (format === DateTimeFormatSettingMode.UTC) {
        return 0;
      } else {
        return localOffset;
      }
    },
    ConsumerSubject.create(this.dateTimeSettingManager.whenSettingChanged('dateTimeFormat'), this.dateTimeSettingManager.getSetting('dateTimeFormat').value),
    ConsumerSubject.create(this.dateTimeSettingManager.whenSettingChanged('dateTimeLocalOffset'), 0)
  );

  private readonly date = new Date();

  private readonly dateSub = Subject.create('__');
  private readonly monthSub = Subject.create('__');
  private readonly yearSub = Subject.create('__');

  /** @inheritdoc */
  public onAfterRender(): void {
    this.simTime.sub(this.onTimeChanged.bind(this));
    this.offset.sub(this.onTimeChanged.bind(this));
  }

  /**
   * Responds to changes in sim time.
   */
  private onTimeChanged(): void {
    this.date.setTime(this.simTime.get() + this.offset.get());

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

/**
 * Component props for LocalOffsetInput.
 */
interface LocalOffsetInputProps extends ComponentProps {
  /** The function to use to register the group's controls. */
  registerFunc: (ctrl: UiControl, unregister?: boolean) => void;

  /** A date/time user setting manager. */
  settingManager: UserSettingManager<DateTimeUserSettingTypes>;
}

/**
 * A component which allows the user to input the date/time local offset setting value.
 */
class LocalOffsetInput extends DisplayComponent<LocalOffsetInputProps> {
  private static readonly HR_TO_MS = UnitType.HOUR.convertTo(1, UnitType.MILLISECOND);
  private static readonly MIN_TO_MS = UnitType.MINUTE.convertTo(1, UnitType.MILLISECOND);

  private readonly rootRef = FSComponent.createRef<HTMLDivElement>();
  private readonly inputRef = FSComponent.createRef<GenericNumberInput>();

  private readonly controller = new UserSettingNumberController<DateTimeUserSettingTypes, 'dateTimeLocalOffset'>(
    this.props.settingManager,
    'dateTimeLocalOffset'
  );

  /** @inheritdoc */
  public onAfterRender(thisNode: VNode): void {
    super.onAfterRender(thisNode);

    this.controller.init();

    this.props.settingManager.whenSettingChanged('dateTimeFormat').handle(this.onFormatChanged.bind(this));
  }

  /**
   * Responds to when the date/time format setting changes.
   * @param format The date/time format setting value.
   */
  private onFormatChanged(format: DateTimeFormatSettingMode): void {
    if (format === DateTimeFormatSettingMode.UTC) {
      this.rootRef.instance.classList.add('local-offset-input-utc');
      this.inputRef.instance.setDisabled(true);
    } else {
      this.inputRef.instance.setDisabled(false);
      this.rootRef.instance.classList.remove('local-offset-input-utc');
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div ref={this.rootRef}>
        <G1000UiControlWrapper onRegister={this.props.registerFunc}>
          <GenericNumberInput
            ref={this.inputRef}
            value={this.controller.dataSub}
            digitizer={(value, signValues, digitValues): void => {
              signValues[0].set(value < 0 ? -1 : 1);

              const abs = Math.abs(value);

              const hrs = Math.min(23, Math.trunc(abs / LocalOffsetInput.HR_TO_MS));
              const min = value - hrs * LocalOffsetInput.HR_TO_MS;
              const minTens = Math.min(5, Math.trunc(min / LocalOffsetInput.MIN_TO_MS));

              digitValues[0].set(hrs * LocalOffsetInput.HR_TO_MS);
              digitValues[1].set(minTens * 10 * LocalOffsetInput.MIN_TO_MS);
              digitValues[2].set(Math.min(9, min - minTens) * LocalOffsetInput.MIN_TO_MS);
            }}
            editOnActivate={true}
            class='local-offset-input-input'
          >
            <SignInput sign={Subject.create<1 | -1>(1)} />
            <DigitInput
              value={Subject.create(0)} minValue={0} maxValue={24} increment={1} scale={LocalOffsetInput.HR_TO_MS} wrap={true}
              formatter={(value): string => value.toString().padStart(2, '0')}
            />
            <span>:</span>
            <DigitInput value={Subject.create(0)} minValue={0} maxValue={6} increment={1} scale={10 * LocalOffsetInput.MIN_TO_MS} wrap={true} />
            <DigitInput value={Subject.create(0)} minValue={0} maxValue={10} increment={1} scale={1 * LocalOffsetInput.MIN_TO_MS} wrap={true} />
          </GenericNumberInput>
        </G1000UiControlWrapper>
        <div class='local-offset-input-disabled'>––:––</div>
      </div>
    );
  }
}