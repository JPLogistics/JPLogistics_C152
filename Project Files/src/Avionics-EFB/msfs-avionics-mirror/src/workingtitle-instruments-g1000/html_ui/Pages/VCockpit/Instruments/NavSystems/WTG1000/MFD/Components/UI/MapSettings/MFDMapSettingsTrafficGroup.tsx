import { ArraySubject, FSComponent, NodeReference, VNode } from 'msfssdk';
import { MapTrafficAlertLevelMode } from '../../../../Shared/Map/Modules/MapTrafficModule';
import { MFDMapSettingsGroup, MFDMapSettingsGroupProps } from './MFDMapSettingsGroup';
import { MFDMapRangeSettingRow, MFDMapSingleEnumSettingRow, MFDMapToggleRangeSettingsRow, MFDMapToggleSettingRow } from './MFDMapSettingsRow';

/**
 * The 'Aviation' map settings group.
 */
export class MFDMapSettingsTrafficGroup extends MFDMapSettingsGroup<MFDMapSettingsGroupProps> {
  // eslint-disable-next-line jsdoc/require-jsdoc
  protected getSettingRows(containerRef: NodeReference<HTMLElement>): VNode[] {
    return [
      <MFDMapToggleSettingRow
        title={'Traffic'}
        toggleProps={{
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapTrafficShow',
        }}
      />,
      <MFDMapSingleEnumSettingRow
        title={'Traffic Mode'}
        controlProps={{
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapTrafficAlertLevelMode',
          values: ArraySubject.create([MapTrafficAlertLevelMode.All, MapTrafficAlertLevelMode.Advisories, MapTrafficAlertLevelMode.TA_RA]),
          valueText: ArraySubject.create(['All Traffic', 'TA/PA', 'TA Only']),
          outerContainer: containerRef
        }}
      />,
      <MFDMapRangeSettingRow
        title={'Traffic Symbols'}
        rangeProps={{
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapTrafficRangeIndex',
          values: Array.from({ length: 19 }, (value, index) => index + 9), // 1 nm to 1000 nm
          mapRanges: this.props.mapRanges,
          outerContainer: containerRef
        }}
      />,
      <MFDMapToggleRangeSettingsRow
        title={'Traffic Labels'}
        toggleProps={{
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapTrafficLabelShow',
        }}
        rangeProps={{
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapTrafficLabelRangeIndex',
          values: Array.from({ length: 19 }, (value, index) => index + 9), // 1 nm to 1000 nm
          mapRanges: this.props.mapRanges,
          outerContainer: containerRef
        }}
      />
    ];
  }
}