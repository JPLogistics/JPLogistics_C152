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
        viewService={this.props.viewService}
        title={'Traffic'}
        toggleProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapTrafficShow',
        }}
      />,
      <MFDMapSingleEnumSettingRow
        viewService={this.props.viewService}
        title={'Traffic Mode'}
        controlProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapTrafficAlertLevelMode',
          values: ArraySubject.create([MapTrafficAlertLevelMode.All, MapTrafficAlertLevelMode.Advisories, MapTrafficAlertLevelMode.TA_RA]),
          valueText: ArraySubject.create(['All Traffic', 'TA/PA', 'TA Only']),
          outerContainer: containerRef
        }}
      />,
      <MFDMapRangeSettingRow
        viewService={this.props.viewService}
        title={'Traffic Symbols'}
        rangeProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapTrafficRangeIndex',
          values: Array.from({ length: 19 }, (value, index) => index + 9), // 1 nm to 1000 nm
          mapRanges: this.props.mapRanges,
          outerContainer: containerRef
        }}
      />,
      <MFDMapToggleRangeSettingsRow
        viewService={this.props.viewService}
        title={'Traffic Labels'}
        toggleProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapTrafficLabelShow',
        }}
        rangeProps={{
          viewService: this.props.viewService,
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