import { ArraySubject, DisplayComponent, FSComponent, VNode } from 'msfssdk';
import { NavDataFieldType } from 'garminsdk/components/navdatafield';
import { NavDataBarSettingTypes } from 'garminsdk/settings/NavDataBarUserSettings';
import { GroupBox } from '../GroupBox';
import { MFDNavDataBarUserSettings } from '../NavDataBar/MFDNavDataBarUserSettings';
import { MFDSystemSetupGroupProps } from './MFDSystemSetupGroup';
import { MFDSystemSetupSelectRow } from './MFDSystemSetupRow';

/**
 * The MFD System Setup page MFD Data Bar Fields group.
 */
export class MFDSystemSetupDataBarGroup extends DisplayComponent<MFDSystemSetupGroupProps> {
  private readonly settingManager = MFDNavDataBarUserSettings.getManager(this.props.bus);

  /** @inheritdoc */
  public render(): VNode {
    const valueArray = ArraySubject.create(Object.values(NavDataFieldType).filter(type => type !== NavDataFieldType.TimeToDestination));
    return (
      <GroupBox title='MFD Data Bar Fields' class='mfd-system-setup-group'>
        <MFDSystemSetupSelectRow<NavDataBarSettingTypes, 'navDataBarField0'>
          title={'Field 1'}
          selectControlProps={{
            viewService: this.props.viewService,
            registerFunc: this.props.registerFunc,
            settingManager: this.settingManager,
            settingName: 'navDataBarField0',
            values: valueArray,
            outerContainer: this.props.pageContainerRef
          }}
        />
        <MFDSystemSetupSelectRow<NavDataBarSettingTypes, 'navDataBarField1'>
          title={'Field 2'}
          selectControlProps={{
            viewService: this.props.viewService,
            registerFunc: this.props.registerFunc,
            settingManager: this.settingManager,
            settingName: 'navDataBarField1',
            values: valueArray,
            outerContainer: this.props.pageContainerRef
          }}
        />
        <MFDSystemSetupSelectRow<NavDataBarSettingTypes, 'navDataBarField2'>
          title={'Field 3'}
          selectControlProps={{
            viewService: this.props.viewService,
            registerFunc: this.props.registerFunc,
            settingManager: this.settingManager,
            settingName: 'navDataBarField2',
            values: valueArray,
            outerContainer: this.props.pageContainerRef
          }}
        />
        <MFDSystemSetupSelectRow<NavDataBarSettingTypes, 'navDataBarField3'>
          title={'Field 4'}
          selectControlProps={{
            viewService: this.props.viewService,
            registerFunc: this.props.registerFunc,
            settingManager: this.settingManager,
            settingName: 'navDataBarField3',
            values: valueArray,
            outerContainer: this.props.pageContainerRef
          }}
        />
      </GroupBox>
    );
  }
}