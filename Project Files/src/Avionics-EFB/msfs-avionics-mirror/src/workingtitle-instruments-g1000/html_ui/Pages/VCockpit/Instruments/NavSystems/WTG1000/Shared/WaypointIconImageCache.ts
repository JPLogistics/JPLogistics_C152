import { ImageCache } from 'msfssdk';
import { AirportFacility, AirportPrivateType, VorType } from 'msfssdk/navigation';

/**
 * The image cache specific to this instrument.
 * @class GImageCache
 * @augments {ImageCache}
 */
export class WaypointIconImageCache extends ImageCache {
  /**
   * Initializes the icons used in this instrument.
   * @static
   */
  public static init(): void {
    WaypointIconImageCache.addToCache('AIRPORT_PRIVATE', 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/icons-map/airport_r.png');
    WaypointIconImageCache.addToCache('AIRPORT_UNKNOWN', 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/icons-map/airport_q.png');
    WaypointIconImageCache.addToCache('AIRPORT_NONTOWERED_SERVICED', 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/icons-map/airport_large_magenta.png');
    WaypointIconImageCache.addToCache('AIRPORT_TOWERED_NONSERVICED', 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/icons-map/airport_med_blue.png');
    WaypointIconImageCache.addToCache('AIRPORT_TOWERED_SERVICED', 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/icons-map/airport_large_blue.png');
    WaypointIconImageCache.addToCache('AIRPORT_NONTOWERED_NON_SERVICED', 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/icons-map/airport_med_magenta.png');
    WaypointIconImageCache.addToCache('AIRPORT_SMALL_NONSERVICED', 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/icons-map/airport_small_a.png');
    WaypointIconImageCache.addToCache('AIRPORT_SMALL_SERVICED', 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/icons-map/airport_small_b.png');
    WaypointIconImageCache.addToCache('INTERSECTION_CYAN', 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/icons-map/intersection_cyan.png');
    WaypointIconImageCache.addToCache('VOR', 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/icons-map/vor.png');
    WaypointIconImageCache.addToCache('VORDME', 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/icons-map/vor_dme.png');
    WaypointIconImageCache.addToCache('DME', 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/icons-map/dme.png');
    WaypointIconImageCache.addToCache('VORVORTAC', 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/icons-map/vor_vortac.png');
    // TODO TACAN icon
    WaypointIconImageCache.addToCache('NDB', 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/icons-map/ndb.png');
    WaypointIconImageCache.addToCache('USER', 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/icons-map/user.png');
    WaypointIconImageCache.addToCache('FPLN_WAYPOINT', 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/icons-map/map_icon_flight_path_waypoint.png');
    WaypointIconImageCache.addToCache('VNAV', 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/icons-map/vnav.png');
  }

  /**
   * Maps the airport type to the right icon.
   * @param fac The airport facility to get the icon for.
   * @returns The image element used for this type of airport.
   */
  public static getAirportIcon(fac: AirportFacility): HTMLImageElement {
    // HINT class 1 airports are always assumed serviced
    const serviced = (fac.fuel1 !== '' || fac.fuel2 !== '') || fac.airportClass === 1;

    if (fac.airportPrivateType !== AirportPrivateType.Public) {
      return WaypointIconImageCache.get('AIRPORT_PRIVATE');
    } else if (serviced && fac.towered) {
      return WaypointIconImageCache.get('AIRPORT_TOWERED_SERVICED');
    } else if (serviced && !fac.towered) {
      if (fac.airportClass === 1) {
        return WaypointIconImageCache.get('AIRPORT_NONTOWERED_SERVICED');
      } else {
        return WaypointIconImageCache.get('AIRPORT_SMALL_SERVICED');
      }
    } else if (!serviced && fac.towered) {
      return WaypointIconImageCache.get('AIRPORT_TOWERED_NONSERVICED');
    } else if (!serviced && !fac.towered) {
      if (fac.airportClass === 1) {
        return WaypointIconImageCache.get('AIRPORT_NONTOWERED_NONSERVICED');
      } else {
        return WaypointIconImageCache.get('AIRPORT_SMALL_NONSERVICED');
      }
    } else {
      return WaypointIconImageCache.get('AIRPORT_UNKNOWN');
    }
  }

  /**
   * Maps the vor type to the right icon.
   * @param type The vor type enum to get the icon for.
   * @returns The image elements used for this  type of vor.
   */
  public static getVorIcon(type: VorType): HTMLImageElement {
    switch (type) {
      case VorType.DME:
        return WaypointIconImageCache.get('DME');
      case VorType.ILS:
      case VorType.VORDME:
        return WaypointIconImageCache.get('VORDME');
      case VorType.VORTAC:
      case VorType.TACAN:
        return WaypointIconImageCache.get('VORVORTAC');
      default:
        return WaypointIconImageCache.get('VOR');
    }
  }
}