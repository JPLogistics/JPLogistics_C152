import { ArraySubject, FSComponent, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';

import { MapUserSettings } from '../../../../Shared/Map/MapUserSettings';
import { ContextMenuDialog, ContextMenuItemDefinition } from '../../../../Shared/UI/Dialogs/ContextMenuDialog';
import { SelectControl } from '../../../../Shared/UI/UIControls/SelectControl';
import { UiView, UiViewProps } from '../../../../Shared/UI/UiView';
import { FmsHEvent } from '../../../../Shared/UI/FmsHEvent';
import { MenuSystem } from '../../../../Shared/UI/Menus/MenuSystem';
import { GroupBox } from '../GroupBox';
import { MFDMapSettingsGroup } from './MFDMapSettingsGroup';
import { MFDMapSettingsMapGroup } from './MFDMapSettingsMapGroup';
import { MFDMapSettingsWeatherGroup } from './MFDMapSettingsWeatherGroup';
import { MFDMapSettingsAviationGroup } from './MFDMapSettingsAviationGroup';
import { MFDMapSettingsAirspaceGroup } from './MFDMapSettingsAirspaceGroup';
import { MFDMapSettingsTrafficGroup } from './MFDMapSettingsTrafficGroup';
import { MapRangeSettings } from '../../../../Shared/Map/MapRangeSettings';

import './MFDMapSettings.css';

/**
 * Component props for MFDMapSettings.
 */
export interface MFDMapSettingsProps extends UiViewProps {
  /** The event bus. */
  bus: EventBus;

  /** The softkey menu system. */
  menuSystem: MenuSystem;
}

/** A name for a map settings group. */
type MFDMapSettingsGroupName = 'Map' | 'Weather' | 'Traffic' | 'Aviation' | 'Airspace' | 'Airways' | 'Land' | 'VSD';

/**
 * The MFD map settings menu.
 */
export class MFDMapSettings extends UiView<MFDMapSettingsProps> {
  private static readonly GROUP_ITEMS: MFDMapSettingsGroupName[] = ['Map', 'Weather', 'Traffic', 'Aviation', 'Airspace', 'Airways', 'Land', 'VSD'];

  private readonly groupRefs = {
    ['Map']: FSComponent.createRef<MFDMapSettingsMapGroup>(),
    ['Weather']: FSComponent.createRef<MFDMapSettingsWeatherGroup>(),
    ['Traffic']: FSComponent.createRef<MFDMapSettingsTrafficGroup>(),
    ['Aviation']: FSComponent.createRef<MFDMapSettingsAviationGroup>(),
    ['Airspace']: FSComponent.createRef<MFDMapSettingsAirspaceGroup>(),
    ['Airways']: FSComponent.createRef<MFDMapSettingsGroup<any>>(),
    ['Land']: FSComponent.createRef<MFDMapSettingsGroup<any>>(),
    ['VSD']: FSComponent.createRef<MFDMapSettingsGroup<any>>()
  };

  private readonly settingManager = MapUserSettings.getMfdManager(this.props.bus);
  private readonly mapRangesSub = MapRangeSettings.getRangeArraySubscribable(this.props.bus);

  private activeGroup: MFDMapSettingsGroup<any> | null = null;

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.UPPER_PUSH:
      case FmsHEvent.CLR:
        this.close();
        return true;
    }

    return false;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onViewOpened(): void {
    this.props.menuSystem.pushMenu('empty');
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onViewClosed(): void {
    this.props.menuSystem.back();
  }

  /**
   * Builds a menu item definition for a group item.
   * @param item A group item.
   * @returns a menu item definition for the group item.
   */
  private buildGroupMenuItem(item: MFDMapSettingsGroupName): ContextMenuItemDefinition {
    return {
      id: item,
      renderContent: (): VNode => <span>{item}</span>,
      estimatedWidth: item.length * ContextMenuDialog.CHAR_WIDTH,
      isEnabled: item === 'Map' || item === 'Weather' || item === 'Aviation' || item === 'Airspace' || item === 'Traffic'
    };
  }

  /**
   * A callback which is called when a group item is selected.
   * @param index The index of the selected item.
   * @param item The selected item.
   */
  private onGroupItemSelected(index: number, item: MFDMapSettingsGroupName | undefined): void {
    const selectedGroup = item === undefined ? null : this.groupRefs[item].instance;
    if (selectedGroup !== this.activeGroup) {
      if (this.activeGroup) {
        this.activeGroup.hide();
        this.scrollController.unregisterCtrl(this.activeGroup);
      }

      if (selectedGroup) {
        this.scrollController.registerCtrl(selectedGroup);
        selectedGroup.show();
      }

      this.activeGroup = selectedGroup;
    }
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public render(): VNode {
    return (
      <div ref={this.viewContainerRef} class='popout-dialog mfd-mapsettings'>
        <h1>{this.props.title}</h1>
        <GroupBox title={'Group'}>
          <SelectControl<MFDMapSettingsGroupName> viewService={this.props.viewService} onRegister={this.register} outerContainer={this.viewContainerRef}
            data={ArraySubject.create(MFDMapSettings.GROUP_ITEMS)}
            buildMenuItem={this.buildGroupMenuItem.bind(this)}
            onItemSelected={this.onGroupItemSelected.bind(this)} />
        </GroupBox>
        <div class='mfd-mapsettings-groupcontainer'>
          <MFDMapSettingsMapGroup viewService={this.props.viewService} ref={this.groupRefs['Map']} settingManager={this.settingManager} mapRanges={this.mapRangesSub} />
          <MFDMapSettingsWeatherGroup viewService={this.props.viewService} ref={this.groupRefs['Weather']} settingManager={this.settingManager} mapRanges={this.mapRangesSub} />
          <MFDMapSettingsAviationGroup viewService={this.props.viewService} ref={this.groupRefs['Aviation']} settingManager={this.settingManager} mapRanges={this.mapRangesSub} />
          <MFDMapSettingsAirspaceGroup viewService={this.props.viewService} ref={this.groupRefs['Airspace']} settingManager={this.settingManager} mapRanges={this.mapRangesSub} />
          <MFDMapSettingsTrafficGroup viewService={this.props.viewService} ref={this.groupRefs['Traffic']} settingManager={this.settingManager} mapRanges={this.mapRangesSub} />
        </div>
      </div>
    );
  }
}