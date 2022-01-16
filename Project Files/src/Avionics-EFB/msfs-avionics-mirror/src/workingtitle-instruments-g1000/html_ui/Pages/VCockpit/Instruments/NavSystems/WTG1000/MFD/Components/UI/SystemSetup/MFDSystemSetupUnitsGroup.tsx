import { ArraySubject, DisplayComponent, FSComponent, SubscribableMapFunctions, VNode } from 'msfssdk';
import { ConsumerSubject } from 'msfssdk/data';
import { GNSSEvents } from 'msfssdk/instruments';
import { ContextMenuItemDefinition } from '../../../../Shared/UI/Dialogs/ContextMenuDialog';
import { UnitsAltitudeSettingMode, UnitsDistanceSettingMode, UnitsNavAngleSettingMode, UnitsTemperatureSettingMode, UnitsUserSettings, UnitsUserSettingTypes, UnitsWeightSettingMode } from '../../../../Shared/Units/UnitsUserSettings';
import { GroupBox } from '../GroupBox';
import { MFDSystemSetupGroupProps } from './MFDSystemSetupGroup';
import { MFDSystemSetupGenericRow, MFDSystemSetupSelectRow } from './MFDSystemSetupRow';
import { MagVarDisplay } from '../../../../Shared/UI/Common/MagVarDisplay';

/**
 * The MFD System Setup page Display Units group.
 */
export class MFDSystemSetupUnitsGroup extends DisplayComponent<MFDSystemSetupGroupProps> {
  private readonly settingManager = UnitsUserSettings.getManager(this.props.bus);

  /** @inheritdoc */
  public render(): VNode {
    return (
      <GroupBox title='Display Units' class='mfd-system-setup-group'>
        <MFDSystemSetupSelectRow<UnitsUserSettingTypes, 'unitsNavAngle'>
          title='NAV Angle'
          selectControlProps={{
            registerFunc: this.props.registerFunc,
            settingManager: this.settingManager,
            settingName: 'unitsNavAngle',
            values: ArraySubject.create([UnitsNavAngleSettingMode.Magnetic, UnitsNavAngleSettingMode.True]),
            buildMenuItem: (value: UnitsNavAngleSettingMode): ContextMenuItemDefinition => {
              return {
                id: value.toString(),
                renderContent: value === UnitsNavAngleSettingMode.Magnetic
                  ? (): VNode => <div>Magnetic(°)</div>
                  : (): VNode => <div>True(°<span class='mfd-system-setup-small-text'>T</span>)</div>,
                estimatedWidth: 11
              };
            },
            outerContainer: this.props.pageContainerRef
          }}
        />
        <MFDSystemSetupGenericRow
          title='MAG VAR'
          right={
            <MagVarDisplay magvar={ConsumerSubject.create(this.props.bus.getSubscriber<GNSSEvents>().on('magvar'), 0)
              .map(SubscribableMapFunctions.withPrecision(1))} />
          }
        />
        <MFDSystemSetupSelectRow<UnitsUserSettingTypes, 'unitsDistance'>
          title='DIS, SPD'
          selectControlProps={{
            registerFunc: this.props.registerFunc,
            settingManager: this.settingManager,
            settingName: 'unitsDistance',
            values: ArraySubject.create([UnitsDistanceSettingMode.Metric, UnitsDistanceSettingMode.Nautical]),
            buildMenuItem: (value: UnitsDistanceSettingMode): ContextMenuItemDefinition => {
              return {
                id: value.toString(),
                renderContent: value === UnitsDistanceSettingMode.Metric
                  ? (): VNode => <div>Metric(<span class='mfd-system-setup-small-text'>KM,KH</span>)</div>
                  : (): VNode => <div>Nautical(<span class='mfd-system-setup-small-text'>NM,KT</span>)</div>,
                estimatedWidth: 15
              };
            },
            outerContainer: this.props.pageContainerRef
          }}
        />
        <MFDSystemSetupSelectRow<UnitsUserSettingTypes, 'unitsAltitude'>
          title='ALT, VS'
          selectControlProps={{
            registerFunc: this.props.registerFunc,
            settingManager: this.settingManager,
            settingName: 'unitsAltitude',
            values: ArraySubject.create([UnitsAltitudeSettingMode.Feet, UnitsAltitudeSettingMode.Meters]),
            buildMenuItem: (value: UnitsAltitudeSettingMode): ContextMenuItemDefinition => {
              return {
                id: value.toString(),
                renderContent: value === UnitsAltitudeSettingMode.Feet
                  ? (): VNode => <div>Feet(<span class='mfd-system-setup-small-text'>FT,FPM</span>)</div>
                  : (): VNode => <div>Meters(<span class='mfd-system-setup-small-text'>MT,MPM</span>)</div>,
                estimatedWidth: 14
              };
            },
            outerContainer: this.props.pageContainerRef
          }}
        />
        <MFDSystemSetupSelectRow<UnitsUserSettingTypes, 'unitsTemperature'>
          title='Temperature'
          selectControlProps={{
            registerFunc: this.props.registerFunc,
            settingManager: this.settingManager,
            settingName: 'unitsTemperature',
            values: ArraySubject.create([UnitsTemperatureSettingMode.Celsius, UnitsTemperatureSettingMode.Fahrenheit]),
            buildMenuItem: (value: UnitsTemperatureSettingMode): ContextMenuItemDefinition => {
              return {
                id: value.toString(),
                renderContent: value === UnitsTemperatureSettingMode.Celsius
                  ? (): VNode => <div>Celsius(°<span class='mfd-system-setup-small-text'>C</span>)</div>
                  : (): VNode => <div>Fahrenheit(°<span class='mfd-system-setup-small-text'>F</span>)</div>,
                estimatedWidth: 14
              };
            },
            outerContainer: this.props.pageContainerRef
          }}
        />
        <MFDSystemSetupGenericRow
          title='Fuel'
          right={<div>Gallons(<span class='mfd-system-setup-small-text'>GAL,GAL/HR</span>)</div>}
        />
        <MFDSystemSetupSelectRow<UnitsUserSettingTypes, 'unitsWeight'>
          title='Weight'
          selectControlProps={{
            registerFunc: this.props.registerFunc,
            settingManager: this.settingManager,
            settingName: 'unitsWeight',
            values: ArraySubject.create([UnitsWeightSettingMode.Kilograms, UnitsWeightSettingMode.Pounds]),
            buildMenuItem: (value: UnitsWeightSettingMode): ContextMenuItemDefinition => {
              return {
                id: value.toString(),
                renderContent: value === UnitsWeightSettingMode.Kilograms
                  ? (): VNode => <div>Kilograms(<span class='mfd-system-setup-small-text'>KG</span>)</div>
                  : (): VNode => <div>Pounds(<span class='mfd-system-setup-small-text'>LB</span>)</div>,
                estimatedWidth: 13
              };
            },
            outerContainer: this.props.pageContainerRef
          }}
        />
        <MFDSystemSetupGenericRow
          title='Position'
          right={<div>HDDD°MM.MM'</div>}
        />
      </GroupBox>
    );
  }
}