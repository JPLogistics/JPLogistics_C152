import { FSComponent, NodeReference, VNode } from 'msfssdk';
import { MFDMapSettingsGroup, MFDMapSettingsGroupProps } from './MFDMapSettingsGroup';
import { MFDMapToggleRangeSettingsRow } from './MFDMapSettingsRow';

/**
 * The 'Aviation' map settings group.
 */
export class MFDMapSettingsAirspaceGroup extends MFDMapSettingsGroup<MFDMapSettingsGroupProps> {
  // eslint-disable-next-line jsdoc/require-jsdoc
  protected getSettingRows(containerRef: NodeReference<HTMLElement>): VNode[] {
    return [
      <MFDMapToggleRangeSettingsRow
        viewService={this.props.viewService}
        title={'Class B/TMA'}
        toggleProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAirspaceClassBShow',
        }}
        rangeProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAirspaceClassBRangeIndex',
          values: Array.from({ length: 23 }, (value, index) => index), // 250 ft to 150 nm
          mapRanges: this.props.mapRanges,
          outerContainer: containerRef
        }}
      />,
      <MFDMapToggleRangeSettingsRow
        viewService={this.props.viewService}
        title={'Class C/TCA'}
        toggleProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAirspaceClassCShow',
        }}
        rangeProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAirspaceClassCRangeIndex',
          values: Array.from({ length: 22 }, (value, index) => index), // 250 ft to 100 nm
          mapRanges: this.props.mapRanges,
          outerContainer: containerRef
        }}
      />,
      <MFDMapToggleRangeSettingsRow
        viewService={this.props.viewService}
        title={'Class D'}
        toggleProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAirspaceClassDShow',
        }}
        rangeProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAirspaceClassDRangeIndex',
          values: Array.from({ length: 22 }, (value, index) => index), // 250 ft to 100 nm
          mapRanges: this.props.mapRanges,
          outerContainer: containerRef
        }}
      />,
      <MFDMapToggleRangeSettingsRow
        viewService={this.props.viewService}
        title={'Restricted'}
        toggleProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAirspaceRestrictedShow',
        }}
        rangeProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAirspaceRestrictedRangeIndex',
          values: Array.from({ length: 22 }, (value, index) => index), // 250 ft to 100 nm
          mapRanges: this.props.mapRanges,
          outerContainer: containerRef
        }}
      />,
      <MFDMapToggleRangeSettingsRow
        viewService={this.props.viewService}
        title={'MOA (Military)'}
        toggleProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAirspaceMoaShow',
        }}
        rangeProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAirspaceMoaRangeIndex',
          values: Array.from({ length: 24 }, (value, index) => index), // 250 ft to 250 nm
          mapRanges: this.props.mapRanges,
          outerContainer: containerRef
        }}
      />,
      <MFDMapToggleRangeSettingsRow
        viewService={this.props.viewService}
        title={'Other/ADIZ'}
        toggleProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAirspaceOtherShow',
        }}
        rangeProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAirspaceOtherRangeIndex',
          values: Array.from({ length: 24 }, (value, index) => index), // 250 ft to 250 nm
          mapRanges: this.props.mapRanges,
          outerContainer: containerRef
        }}
      />,
    ];
  }
}