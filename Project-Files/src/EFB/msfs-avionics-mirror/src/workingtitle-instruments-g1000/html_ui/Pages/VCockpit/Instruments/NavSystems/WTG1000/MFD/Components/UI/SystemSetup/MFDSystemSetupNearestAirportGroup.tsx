import { ArraySubject, ComponentProps, DisplayComponent, FSComponent, Subject, VNode } from 'msfssdk';
import { RunwaySurfaceCategory } from 'msfssdk/navigation';
import { UserSettingManager } from 'msfssdk/settings';
import { MFDSystemSetupGroupProps } from './MFDSystemSetupGroup';
import { MFDSystemSetupGenericRow, MFDSystemSetupSelectRow } from './MFDSystemSetupRow';
import { GroupBox } from '../GroupBox';
import { NearestAirportSearchSettings, NearestAirportSearchSettingTypes } from '../../../../Shared/NearestAirportSearchSettings';
import { ContextMenuItemDefinition } from '../../../../Shared/UI/Dialogs/ContextMenuDialog';
import { UiControl } from '../../../../Shared/UI/UiControl';
import { DigitInput } from '../../../../Shared/UI/UiControls2/DigitInput';
import { G1000UiControlWrapper } from '../../../../Shared/UI/UiControls2/G1000UiControlWrapper';
import { GenericNumberInput } from '../../../../Shared/UI/UiControls2/GenericNumberInput';


/** The MFD setup page section for nearest airport search parameters. */
export class MFDSystemSetupNearestAirportGroup extends DisplayComponent<MFDSystemSetupGroupProps> {
  private readonly settingManager = NearestAirportSearchSettings.getManager(this.props.bus);

  /** @inheritdoc */
  public render(): VNode {
    return (
      <GroupBox title='Nearest Airport' class='mfd-system-setup-group'>
        <MFDSystemSetupSelectRow<NearestAirportSearchSettingTypes, 'surfaceTypes'>
          title='Runway Surface'
          selectControlProps={{
            viewService: this.props.viewService,
            registerFunc: this.props.registerFunc,
            settingManager: this.settingManager,
            settingName: 'surfaceTypes',
            values: ArraySubject.create(
              [RunwaySurfaceCategory.Hard | RunwaySurfaceCategory.Soft | RunwaySurfaceCategory.Water,
              RunwaySurfaceCategory.Hard,
              RunwaySurfaceCategory.Hard | RunwaySurfaceCategory.Soft,
              RunwaySurfaceCategory.Water]
            ),
            buildMenuItem: (value: number): ContextMenuItemDefinition => {
              return {
                renderContent: (): VNode => {
                  let label = '_____';
                  switch (value) {
                    case RunwaySurfaceCategory.Hard | RunwaySurfaceCategory.Soft | RunwaySurfaceCategory.Water:
                      label = 'Any'; break;
                    case RunwaySurfaceCategory.Hard:
                      label = 'Hard Only'; break;
                    case RunwaySurfaceCategory.Hard | RunwaySurfaceCategory.Soft:
                      label = 'Hard/Soft'; break;
                    case RunwaySurfaceCategory.Water:
                      label = 'Water'; break;
                  }
                  return <div>{label}</div>;
                },
                estimatedWidth: 90
              };
            },
            outerContainer: this.props.pageContainerRef
          }}
        />
        <MFDSystemSetupGenericRow
          title='Minimum Length'
          right={<RunwayLengthInput settingManager={this.settingManager} registerFunc={this.props.registerFunc} />}
        />
      </GroupBox>
    );
  }
}

/** Component props for the runway length input. */
interface RunwayLengthInputProps extends ComponentProps {
  /** The function to use to register the group's controls. */
  registerFunc: (ctrl: UiControl, unregister?: boolean) => void;

  /** A user search setting manager. */
  settingManager: UserSettingManager<NearestAirportSearchSettingTypes>;
}

/** A component for inputting the minimum runway length. */
class RunwayLengthInput extends DisplayComponent<RunwayLengthInputProps> {
  private setting = this.props.settingManager.getSetting('runwayLength');
  private inputValue = Subject.create(0);

  /** @inheritdoc */
  public onAfterRender(): void {
    this.setting.pipe(this.inputValue);

    // Cap the input value to 25000.
    this.inputValue.sub(v => {
      if (v > 25000) {
        this.inputValue.set(25000);
      } else {
        this.setting.value = v;
      }
    });
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <G1000UiControlWrapper onRegister={this.props.registerFunc}>
        <GenericNumberInput value={this.inputValue}
          digitizer={(value, signValues, digitValues): void => {
            digitValues[0].set(Math.floor(value / 10000) * 10000);
            digitValues[1].set(Math.floor(value / 1000) % 10 * 1000);
            digitValues[2].set(Math.floor(value / 100) % 10 * 100);
            digitValues[3].set(Math.floor(value / 10) % 10 * 10);
            digitValues[4].set(value % 10);
          }}
          renderInactiveValue={(value: number): string => {
            return <div>{value.toFixed()}<span class='smallText'>FT</span></div>;
          }}
        >
          <DigitInput value={Subject.create(0)} minValue={0} maxValue={10} increment={1} wrap={true} scale={10000} />
          <DigitInput value={Subject.create(0)} minValue={0} maxValue={10} increment={1} wrap={true} scale={1000} />
          <DigitInput value={Subject.create(0)} minValue={0} maxValue={10} increment={1} wrap={true} scale={100} />
          <DigitInput value={Subject.create(0)} minValue={0} maxValue={10} increment={1} wrap={true} scale={10} />
          <DigitInput value={Subject.create(0)} minValue={0} maxValue={10} increment={1} wrap={true} scale={1} />
          <span class='smallText'>FT</span>
        </GenericNumberInput>
      </G1000UiControlWrapper >

    );
  }
}