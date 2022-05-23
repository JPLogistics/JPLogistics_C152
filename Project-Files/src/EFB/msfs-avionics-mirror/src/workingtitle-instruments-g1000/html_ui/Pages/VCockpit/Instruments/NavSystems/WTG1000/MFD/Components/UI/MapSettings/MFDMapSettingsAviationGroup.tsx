import { FSComponent, NodeReference, VNode } from 'msfssdk';
import { MFDMapSettingsGroup, MFDMapSettingsGroupProps } from './MFDMapSettingsGroup';
import { MFDMapToggleRangeSettingsRow } from './MFDMapSettingsRow';

/**
 * The 'Aviation' map settings group.
 */
export class MFDMapSettingsAviationGroup extends MFDMapSettingsGroup<MFDMapSettingsGroupProps> {
  // eslint-disable-next-line jsdoc/require-jsdoc
  protected getSettingRows(containerRef: NodeReference<HTMLElement>): VNode[] {
    return [
      <MFDMapToggleRangeSettingsRow
        viewService={this.props.viewService}
        title={'Large Airport'}
        toggleProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAirportLargeShow',
        }}
        rangeProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAirportLargeRangeIndex',
          values: Array.from({ length: 28 }, (value, index) => index), // All ranges
          mapRanges: this.props.mapRanges,
          outerContainer: containerRef
        }}
      />,
      <MFDMapToggleRangeSettingsRow
        viewService={this.props.viewService}
        title={'Medium Airport'}
        toggleProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAirportMediumShow',
        }}
        rangeProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAirportMediumRangeIndex',
          values: Array.from({ length: 25 }, (value, index) => index), // 250 ft to 400 nm
          mapRanges: this.props.mapRanges,
          outerContainer: containerRef
        }}
      />,
      <MFDMapToggleRangeSettingsRow
        viewService={this.props.viewService}
        title={'Small Airport'}
        toggleProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAirportSmallShow',
        }}
        rangeProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAirportSmallRangeIndex',
          values: Array.from({ length: 23 }, (value, index) => index), // 250 ft to 150 nm
          mapRanges: this.props.mapRanges,
          outerContainer: containerRef
        }}
      />,
      <MFDMapToggleRangeSettingsRow
        viewService={this.props.viewService}
        title={'INT'}
        toggleProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapIntersectionShow',
        }}
        rangeProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapIntersectionRangeIndex',
          values: Array.from({ length: 10 }, (value, index) => index + 9), // 1 nm to 40 nm
          mapRanges: this.props.mapRanges,
          outerContainer: containerRef
        }}
      />,
      <MFDMapToggleRangeSettingsRow
        viewService={this.props.viewService}
        title={'NDB'}
        toggleProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapNdbShow',
        }}
        rangeProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapNdbRangeIndex',
          values: Array.from({ length: 11 }, (value, index) => index + 9), // 1 nm to 50 nm
          mapRanges: this.props.mapRanges,
          outerContainer: containerRef
        }}
      />,
      <MFDMapToggleRangeSettingsRow
        viewService={this.props.viewService}
        title={'VOR'}
        toggleProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapVorShow',
        }}
        rangeProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapVorRangeIndex',
          values: Array.from({ length: 15 }, (value, index) => index + 9), // 1 nm to 250 nm
          mapRanges: this.props.mapRanges,
          outerContainer: containerRef
        }}
      />
    ];
  }
}