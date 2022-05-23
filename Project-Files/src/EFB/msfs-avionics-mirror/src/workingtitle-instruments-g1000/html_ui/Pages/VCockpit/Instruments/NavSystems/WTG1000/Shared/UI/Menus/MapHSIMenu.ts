import { UserSettingManager } from 'msfssdk/settings';
import { PfdMapLayoutSettingMode, PFDUserSettings, PFDUserSettingTypes } from '../../../PFD/PFDUserSettings';
import { MapDeclutterSettingMode, MapTerrainSettingMode, MapUserSettings, MapUserSettingTypes } from '../../Map/MapUserSettings';
import { MenuSystem } from './MenuSystem';
import { SoftKeyMenu } from './SoftKeyMenu';

/** Map settings keys that are boolean only. */
type MapBooleanSettings = {
  [K in keyof MapUserSettingTypes]: MapUserSettingTypes[K] extends boolean ? K : never
}[keyof MapUserSettingTypes];

/**
 * The Map/HSI softkey menu.
 */
export class MapHSIMenu extends SoftKeyMenu {
  private static readonly DECLUTTER_TEXT = {
    [MapDeclutterSettingMode.All]: 'All',
    [MapDeclutterSettingMode.Level3]: '3',
    [MapDeclutterSettingMode.Level2]: '2',
    [MapDeclutterSettingMode.Level1]: '1',
  };

  private readonly settings: UserSettingManager<MapUserSettingTypes>;
  private readonly userSettings: UserSettingManager<PFDUserSettingTypes>;

  /**
   * Creates an instance of the Map/HSI softkey menu.
   * @param menuSystem The menu system.
   */
  constructor(menuSystem: MenuSystem) {
    super(menuSystem);

    this.settings = MapUserSettings.getPfdManager(this.menuSystem.bus);
    this.userSettings = PFDUserSettings.getManager(this.menuSystem.bus);

    this.addItem(0, 'Layout', () => menuSystem.pushMenu('map-hsi-layout'));
    this.addItem(1, 'Detail', this.cycleDeclutterSetting.bind(this), '', false);
    this.addItem(2, 'Traffic', this.toggleBooleanSetting.bind(this, 'mapTrafficShow'), false, false);
    this.addItem(3, 'Topo', this.toggleTerrainMode.bind(this, MapTerrainSettingMode.Absolute), false, false);
    this.addItem(4, 'Rel Ter', this.toggleTerrainMode.bind(this, MapTerrainSettingMode.Relative), false, false);
    this.addItem(5, 'NEXRAD', this.toggleBooleanSetting.bind(this, 'mapNexradShow'), false, false);
    this.addItem(6, 'METAR');
    this.addItem(7, 'Lightning');
    this.addItem(10, 'Back', () => menuSystem.back());
    this.addItem(11, 'Alerts');

    this.initSettings();
  }

  /**
   * Sets the map model to use for these options.
   */
  private initSettings(): void {
    this.settings.whenSettingChanged('mapDeclutter').handle(v => this.getItem(1).value.set(MapHSIMenu.DECLUTTER_TEXT[v]));
    this.settings.whenSettingChanged('mapTrafficShow').handle(v => this.getItem(2).value.set(v));
    this.settings.whenSettingChanged('mapTerrainMode').handle(this.onTerrainModeChanged.bind(this));
    this.settings.whenSettingChanged('mapNexradShow').handle(v => this.getItem(5).value.set(v));
    this.userSettings.whenSettingChanged('mapLayout').handle(v => this.setMapMenuItemsDisabled(v === PfdMapLayoutSettingMode.Off));
  }

  /**
   * Helps disable the menu items if the map is in a certain setting (On/off, Insert, HSI).
   * @param disable if the items should be disabled
   */
  private setMapMenuItemsDisabled(disable: boolean): void {
    this.getItem(1).disabled.set(disable);
    this.getItem(2).disabled.set(disable);
    this.getItem(3).disabled.set(disable);
    this.getItem(4).disabled.set(disable);
    this.getItem(5).disabled.set(disable);
  }

  /**
   * Handles menu changes when the terrain mode changes.
   * @param v The new terrain mode.
   */
  private onTerrainModeChanged(v: MapTerrainSettingMode): void {
    switch (v) {
      case MapTerrainSettingMode.Absolute:
        this.getItem(3).value.set(true);
        this.getItem(4).value.set(false);
        break;
      case MapTerrainSettingMode.Relative:
        this.getItem(3).value.set(false);
        this.getItem(4).value.set(true);
        break;
      default:
        this.getItem(3).value.set(false);
        this.getItem(4).value.set(false);
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
   * Cycles the declutter setting.
   */
  private cycleDeclutterSetting(): void {
    const setting = this.settings.getSetting('mapDeclutter');
    switch (setting.value) {
      case MapDeclutterSettingMode.All:
        setting.value = MapDeclutterSettingMode.Level3;
        break;
      case MapDeclutterSettingMode.Level3:
        setting.value = MapDeclutterSettingMode.Level2;
        break;
      case MapDeclutterSettingMode.Level2:
        setting.value = MapDeclutterSettingMode.Level1;
        break;
      case MapDeclutterSettingMode.Level1:
        setting.value = MapDeclutterSettingMode.All;
        break;
    }
  }

  /**
   * Toggles a specified terrain mode.
   * @param mode The mode to toggle.
   */
  private toggleTerrainMode(mode: MapTerrainSettingMode): void {
    const setting = this.settings.getSetting('mapTerrainMode');
    const currentMode = setting.value;
    if (mode === currentMode) {
      setting.value = MapTerrainSettingMode.None;
    } else {
      setting.value = mode;
    }
  }
}