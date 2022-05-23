import { ComponentProps, DisplayComponent, FSComponent, VNode } from 'msfssdk';
import { UserSettingValueFilter } from 'msfssdk/settings';
import { MapUserSettingTypes } from '../../../../Shared/Map/MapUserSettings';
import { MapEnumSettingControl, MapEnumSettingControlProps, MapRangeSettingControl, MapRangeSettingControlProps, MapSettingControlProps, MapToggleSettingControl } from '../../../../Shared/UI/MapSettings/MapSettingControls';
import { ViewService } from '../../../../Shared/UI/ViewService';

import './MFDMapSettingsRow.css';

/**
 * Component props for MFDMapSettingsRow.
 */
export interface MFDMapSettingsRowProps extends ComponentProps {
  /** The view service. */
  viewService: ViewService;
  /** The title of this row. */
  title: string;
}

/**
 * A settings row for a MFDMapSettingsMapGroup. Each row has a title and up to two setting controls.
 */
export abstract class MFDMapSettingsRow<P extends MFDMapSettingsRowProps> extends DisplayComponent<P> {
  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class='mfd-mapsettings-row'>
        <div class='mfd-mapsettings-row-title'>{this.props.title}</div>
        {this.renderLeftControl()}
        {this.renderRightControl()}
      </div>
    );
  }

  /**
   * Renders this row's left setting control.
   */
  protected abstract renderLeftControl(): VNode | null;

  /**
   * Renders this row's right setting control.
   */
  protected abstract renderRightControl(): VNode | null;
}

/**
 * Component props for MFDMapSingleEnumSettingRow.
 */
export interface MFDMapSingleEnumSettingRowProps<K extends keyof MapUserSettingTypes> extends MFDMapSettingsRowProps {
  /** Component props for the enum setting control. */
  controlProps: MapEnumSettingControlProps<K>;
}

/**
 * A row which contains a single enum setting control.
 */
export class MFDMapSingleEnumSettingRow<K extends keyof MapUserSettingTypes> extends MFDMapSettingsRow<MFDMapSingleEnumSettingRowProps<K>> {
  /** @inheritdoc */
  protected renderLeftControl(): VNode | null {
    return (
      <MapEnumSettingControl<K>
        viewService={this.props.viewService}
        registerFunc={this.props.controlProps.registerFunc}
        settingManager={this.props.controlProps.settingManager}
        settingName={this.props.controlProps.settingName}
        values={this.props.controlProps.values} valueText={this.props.controlProps.valueText}
        outerContainer={this.props.controlProps.outerContainer}
        class='mfd-mapsettings-row-leftcontrol'
      />
    );
  }

  /** @inheritdoc */
  protected renderRightControl(): VNode | null {
    return null;
  }
}

/**
 * Component props for MFDMapToggleSettingRow.
 */
export interface MFDMapToggleSettingRowProps<K extends keyof UserSettingValueFilter<MapUserSettingTypes, boolean>> extends MFDMapSettingsRowProps {
  /** Component props for the toggle setting control. */
  toggleProps: MapSettingControlProps<K>;
}

/**
 * A map settings row which contains a toggle setting control.
 */
export class MFDMapToggleSettingRow
  <T extends keyof UserSettingValueFilter<MapUserSettingTypes, boolean>, P extends MFDMapToggleSettingRowProps<T> = MFDMapToggleSettingRowProps<T>>
  extends MFDMapSettingsRow<P> {

  /** @inheritdoc */
  protected renderLeftControl(): VNode | null {
    return (
      <MapToggleSettingControl<T>
        viewService={this.props.viewService}
        registerFunc={this.props.toggleProps.registerFunc}
        settingManager={this.props.toggleProps.settingManager}
        settingName={this.props.toggleProps.settingName}
        class='mfd-mapsettings-row-leftcontrol'
      />
    );
  }

  /** @inheritdoc */
  protected renderRightControl(): VNode | null {
    return null;
  }
}

/**
 * Component props for MFDMapToggleEnumSettingsRow.
 */
export interface MFDMapToggleEnumSettingsRowProps<T extends keyof UserSettingValueFilter<MapUserSettingTypes, boolean>, E extends keyof MapUserSettingTypes>
  extends MFDMapToggleSettingRowProps<T> {

  /** Component props for the enum setting control. */
  enumProps: MapEnumSettingControlProps<E>;
}

/**
 * A map settings row which controls track vector settings.
 */
export class MFDMapToggleEnumSettingsRow<T extends keyof UserSettingValueFilter<MapUserSettingTypes, boolean>, E extends keyof MapUserSettingTypes>
  extends MFDMapToggleSettingRow<T, MFDMapToggleEnumSettingsRowProps<T, E>> {

  /** @inheritdoc */
  protected renderRightControl(): VNode | null {
    return (
      <MapEnumSettingControl
        viewService={this.props.viewService}
        registerFunc={this.props.enumProps.registerFunc}
        settingManager={this.props.enumProps.settingManager}
        settingName={this.props.enumProps.settingName}
        values={this.props.enumProps.values}
        valueText={this.props.enumProps.valueText}
        outerContainer={this.props.enumProps.outerContainer}
        class='mfd-mapsettings-row-rightcontrol'
      />
    );
  }
}

/**
 * Component props for MFDMapRangeSettingRow.
 */
export interface MFDMapRangeSettingRowProps<R extends keyof UserSettingValueFilter<MapUserSettingTypes, number>> extends MFDMapSettingsRowProps {
  /** Component props for the range setting control. */
  rangeProps: MapRangeSettingControlProps<R>;
}

/**
 * A map settings row which contains a map range setting control.
 */
export class MFDMapRangeSettingRow<R extends keyof UserSettingValueFilter<MapUserSettingTypes, number>> extends MFDMapSettingsRow<MFDMapRangeSettingRowProps<R>> {
  /** @inheritdoc */
  protected renderLeftControl(): VNode | null {
    return <div style='visibility: hidden;' />;
  }

  /** @inheritdoc */
  protected renderRightControl(): VNode | null {
    return (
      <MapRangeSettingControl
        viewService={this.props.viewService}
        registerFunc={this.props.rangeProps.registerFunc}
        settingManager={this.props.rangeProps.settingManager}
        settingName={this.props.rangeProps.settingName}
        values={this.props.rangeProps.values}
        mapRanges={this.props.rangeProps.mapRanges}
        outerContainer={this.props.rangeProps.outerContainer}
        class='mfd-mapsettings-row-rightcontrol'
      />
    );
  }
}

/**
 * Component props for MFDMapToggleRangeSettingsRow.
 */
export interface MFDMapToggleRangeSettingsRowProps
  <T extends keyof UserSettingValueFilter<MapUserSettingTypes, boolean>, R extends keyof UserSettingValueFilter<MapUserSettingTypes, number>>
  extends MFDMapToggleSettingRowProps<T> {

  /** Component props for the range setting control. */
  rangeProps: MapRangeSettingControlProps<R>;
}

/**
 * A map settings row which contains a toggle setting control and a map range setting control.
 */
export class MFDMapToggleRangeSettingsRow
  <T extends keyof UserSettingValueFilter<MapUserSettingTypes, boolean>, R extends keyof UserSettingValueFilter<MapUserSettingTypes, number>>
  extends MFDMapToggleSettingRow<T, MFDMapToggleRangeSettingsRowProps<T, R>> {

  /** @inheritdoc */
  protected renderRightControl(): VNode | null {
    return (
      <MapRangeSettingControl
        viewService={this.props.viewService}
        registerFunc={this.props.rangeProps.registerFunc}
        settingManager={this.props.rangeProps.settingManager}
        settingName={this.props.rangeProps.settingName}
        values={this.props.rangeProps.values}
        mapRanges={this.props.rangeProps.mapRanges}
        outerContainer={this.props.rangeProps.outerContainer}
        class='mfd-mapsettings-row-rightcontrol'
      />
    );
  }
}