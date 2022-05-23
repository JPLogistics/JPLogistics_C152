import { FSComponent, NodeReference, VNode } from 'msfssdk';
import { MFDMapSettingsGroup, MFDMapSettingsGroupProps } from './MFDMapSettingsGroup';
import { MFDMapToggleRangeSettingsRow } from './MFDMapSettingsRow';

/**
 * The 'Weather' map settings group.
 */
export class MFDMapSettingsWeatherGroup extends MFDMapSettingsGroup<MFDMapSettingsGroupProps> {
  // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/no-unused-vars
  protected getSettingRows(containerRef: NodeReference<HTMLElement>): VNode[] {
    return [
      <MFDMapToggleRangeSettingsRow
        viewService={this.props.viewService}
        title={'NEXRAD Data'}
        toggleProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapNexradShow',
        }}
        rangeProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapNexradRangeIndex',
          values: Array.from({ length: 19 }, (value, index) => index + 9), // 1 nm to 1000 nm
          mapRanges: this.props.mapRanges,
          outerContainer: containerRef
        }}
      />
    ];
  }
}