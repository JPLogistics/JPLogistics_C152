import { EventBus } from 'msfssdk/data';
import { UserSettingSaveManager } from 'msfssdk/settings';
import { MFDNavDataBarUserSettings } from '../../MFD/Components/UI/NavDataBar/MFDNavDataBarUserSettings';
import { PFDUserSettings } from '../../PFD/PFDUserSettings';
import { BacklightUserSettings } from '../Backlight/BacklightUserSettings';
import { MapUserSettings } from '../Map/MapUserSettings';
import { NavComUserSettings } from '../NavCom/NavComUserSettings';
import { TrafficUserSettings } from '../Traffic/TrafficUserSettings';
import { UnitsUserSettings } from '../Units/UnitsUserSettings';

/**
 * A manager for G1000 settings which are saved to pilot profiles.
 */
export class G1000SettingSaveManager extends UserSettingSaveManager {
  /**
   * Constructor.
   * @param bus The event bus.
   */
  constructor(bus: EventBus) {
    const backlightSettingManager = BacklightUserSettings.getManager(bus);
    const mapSettingManager = MapUserSettings.getManager(bus);
    const pfdSettingManager = PFDUserSettings.getManager(bus);
    const trafficSettingManager = TrafficUserSettings.getManager(bus);
    const mfdNavDataBarSettingManager = MFDNavDataBarUserSettings.getManager(bus);
    const unitsSettingManager = UnitsUserSettings.getManager(bus);
    const navComSettingManager = NavComUserSettings.getManager(bus);

    const settings = [
      ...backlightSettingManager.getAllSettings(),
      ...pfdSettingManager.getAllSettings(),
      ...mapSettingManager.getAllSettings(),
      ...trafficSettingManager.getAllSettings().filter(setting => setting.definition.name !== 'trafficOperatingMode'),
      ...mfdNavDataBarSettingManager.getAllSettings(),
      ...unitsSettingManager.getAllSettings(),
      ...navComSettingManager.getAllSettings()
    ];

    super(settings, bus);
  }
}