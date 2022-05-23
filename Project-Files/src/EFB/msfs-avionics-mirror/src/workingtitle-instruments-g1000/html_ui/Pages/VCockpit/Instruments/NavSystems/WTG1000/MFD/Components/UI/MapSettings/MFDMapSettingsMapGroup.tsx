import { ArraySubject, FSComponent, NodeReference, NumberUnitInterface, Subscribable, UnitFamily, VNode } from 'msfssdk';
import { UserSettingManager } from 'msfssdk/settings';

import { MapOrientationSettingMode, MapTerrainSettingMode, MapUserSettingTypes } from '../../../../Shared/Map/MapUserSettings';
import { MapEnumSettingControl, MapRangeSettingControl } from '../../../../Shared/UI/MapSettings/MapSettingControls';
import { ScrollableControl } from '../../../../Shared/UI/UiView';
import { MFDMapSettingsGroup, MFDMapSettingsGroupProps } from './MFDMapSettingsGroup';
import {
  MFDMapSettingsRow, MFDMapSettingsRowProps, MFDMapSingleEnumSettingRow, MFDMapToggleEnumSettingsRow,
  MFDMapToggleRangeSettingsRow, MFDMapToggleSettingRow
} from './MFDMapSettingsRow';

/**
 * The 'Map' map settings group.
 */
export class MFDMapSettingsMapGroup extends MFDMapSettingsGroup<MFDMapSettingsGroupProps> {
  /** @inheritdoc */
  protected getSettingRows(containerRef: NodeReference<HTMLElement>): VNode[] {
    return [
      <MFDMapSingleEnumSettingRow
        viewService={this.props.viewService}
        title={'Orientation'}
        controlProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapOrientation',
          values: ArraySubject.create([MapOrientationSettingMode.NorthUp, MapOrientationSettingMode.TrackUp, MapOrientationSettingMode.HeadingUp]),
          valueText: ArraySubject.create(['North up', 'Track up', 'HDG up']),
          outerContainer: containerRef
        }}
      />,
      <MFDMapToggleRangeSettingsRow
        viewService={this.props.viewService}
        title={'North Up Above'}
        toggleProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAutoNorthUpActive',
        }}
        rangeProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAutoNorthUpRangeIndex',
          values: Array.from({ length: 7 }, (value, index) => index + 21),
          mapRanges: this.props.mapRanges,
          outerContainer: containerRef
        }}
      />,
      <MFDMapSettingsTerrainRow
        viewService={this.props.viewService}
        title={'Terrain Display'}
        registerFunc={this.register}
        settingManager={this.props.settingManager}
        mapRanges={this.props.mapRanges}
        outerContainer={containerRef}
      />,
      <MFDMapToggleSettingRow
        viewService={this.props.viewService}
        title={'Topo Scale'}
        toggleProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapTerrainScaleShow',
        }}
      />,
      <MFDMapToggleEnumSettingsRow
        viewService={this.props.viewService}
        title={'Track Vector'}
        toggleProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapTrackVectorShow',
        }}
        enumProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapTrackVectorLookahead',
          values: ArraySubject.create([30, 60, 120, 300, 600, 1200]),
          valueText: ArraySubject.create(['30 sec', '60 sec', '2 min', '5 min', '10 min', '20 min']),
          outerContainer: containerRef
        }}
      />,
      <MFDMapToggleSettingRow
        viewService={this.props.viewService}
        title={'Select ALT Arc'}
        toggleProps={{
          viewService: this.props.viewService,
          registerFunc: this.register,
          settingManager: this.props.settingManager,
          settingName: 'mapAltitudeArcShow',
        }}
      />,
    ];
  }
}

/**
 * Component props for MFDMapSettingsTerrainRow.
 */
interface MFDMapSettingsTerrainRowProps extends MFDMapSettingsRowProps {
  /** The function to use to register the row's setting controls. */
  registerFunc: (control: ScrollableControl) => void;

  /** A map settings manager. */
  settingManager: UserSettingManager<MapUserSettingTypes>;

  /** A subscribable array which provides the map range values. */
  mapRanges: Subscribable<readonly NumberUnitInterface<UnitFamily.Distance>[]>;

  /** The HTML container in which the row resides. */
  outerContainer: NodeReference<HTMLElement>;
}

/**
 * A map settings row which controls terrain settings.
 */
class MFDMapSettingsTerrainRow extends MFDMapSettingsRow<MFDMapSettingsTerrainRowProps> {
  /** @inheritdoc */
  protected renderLeftControl(): VNode | null {
    return (
      <MapEnumSettingControl
        viewService={this.props.viewService}
        registerFunc={this.props.registerFunc}
        settingManager={this.props.settingManager}
        settingName={'mapTerrainMode'}
        values={ArraySubject.create([MapTerrainSettingMode.None, MapTerrainSettingMode.Absolute, MapTerrainSettingMode.Relative])}
        valueText={ArraySubject.create(['Off', 'Topo', 'REL'])}
        outerContainer={this.props.outerContainer}
        class='mfd-mapsettings-row-leftcontrol'
      />
    );
  }

  /** @inheritdoc */
  protected renderRightControl(): VNode | null {
    return (
      <MapRangeSettingControl
        viewService={this.props.viewService}
        registerFunc={this.props.registerFunc}
        settingManager={this.props.settingManager}
        settingName={'mapTerrainRangeIndex'}
        values={Array.from({ length: 19 }, (value, index) => index + 9)}
        mapRanges={this.props.mapRanges}
        outerContainer={this.props.outerContainer}
        class='mfd-mapsettings-row-rightcontrol'
      />
    );
  }
}