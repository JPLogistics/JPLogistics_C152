import { MenuSystem } from '../MenuSystem';
import { SoftKeyMenu } from '../SoftKeyMenu';
import { ControlPublisher } from 'msfssdk/data';
import { MapTerrainSettingMode, MapUserSettings, MapUserSettingTypes } from '../../../Map/MapUserSettings';
import { UserSettingManager } from 'msfssdk/settings';

/** Map settings keys that are boolean only. */
type MapBooleanSettings = {
  [K in keyof MapUserSettingTypes]: MapUserSettingTypes[K] extends boolean ? K : never
}[keyof MapUserSettingTypes];

/**
 * The MFD Map options system  menu.
 */
export class MapOptMenu extends SoftKeyMenu {
  private publisher: ControlPublisher;
  private settings: UserSettingManager<MapUserSettingTypes>;

  /**
   * Creates an instance of the MFD map options menu.
   * @param menuSystem The map options menu system.
   * @param publisher A publisher to use for sending control events
   */
  constructor(menuSystem: MenuSystem, publisher: ControlPublisher) {
    super(menuSystem);
    this.publisher = publisher;

    this.addItem(0, 'Traffic', this.toggleBooleanSetting.bind(this, 'mapTrafficShow'), false, false);
    this.addItem(2, 'Inset', () => menuSystem.pushMenu('inset-menu'), undefined, true);
    this.addItem(3, 'TER', this.toggleTerrain.bind(this), 'Topo', false);
    this.addItem(4, 'AWY Off', () => { }, false, true);
    this.addItem(6, 'NEXRAD', this.toggleBooleanSetting.bind(this, 'mapNexradShow'), false, false);
    this.addItem(7, 'XM LTNG', () => { }, false, true);
    this.addItem(8, 'METAR', () => { }, false, true);
    this.addItem(9, 'Legend', this.toggleBooleanSetting.bind(this, 'mapTerrainScaleShow'), false, false);
    this.addItem(10, 'Back', () => menuSystem.back());

    this.settings = MapUserSettings.getMfdManager(this.menuSystem.bus);
    this.initSettings();
  }

  /**
   * Sets the map model to use for these options.
   */
  private initSettings(): void {
    this.settings.whenSettingChanged('mapTrafficShow').handle(v => this.getItem(0).value.set(v));
    this.settings.whenSettingChanged('mapTerrainMode').handle(v => this.getItem(3).value.set(this.getTerrainModeString(v)));
    this.settings.whenSettingChanged('mapTerrainScaleShow').handle(v => this.getItem(9).value.set(v));
    this.settings.whenSettingChanged('mapNexradShow').handle(v => this.getItem(6).value.set(v));
  }

  /**
   * Toggles terrain on and off.
   */
  private toggleTerrain(): void {
    const setting = this.settings.getSetting('mapTerrainMode');
    switch (setting.value) {
      case MapTerrainSettingMode.None:
        setting.value = MapTerrainSettingMode.Absolute;
        break;
      case MapTerrainSettingMode.Absolute:
        setting.value = MapTerrainSettingMode.Relative;
        break;
      default:
        setting.value = MapTerrainSettingMode.None;
        break;
    }
  }

  /**
   * Toggles a boolean map setting on or off.
   * @param setting The setting to toggle.
   */
  private toggleBooleanSetting<T extends MapBooleanSettings>(setting: T): void {
    const mapSetting = this.settings.getSetting(setting);
    mapSetting.value = !mapSetting.value;
  }

  /**
   * Gets a terrain mode value string from a mode enum.
   * @param mode The mode to get the string for.
   * @returns A terrain mode string.
   */
  private getTerrainModeString(mode: MapTerrainSettingMode): string {
    switch (mode) {
      case MapTerrainSettingMode.None:
        return 'Off';
      case MapTerrainSettingMode.Absolute:
        return 'Topo';
      case MapTerrainSettingMode.Relative:
        return 'Rel';
    }
  }
}