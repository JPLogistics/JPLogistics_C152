import { ComputedSubject, FSComponent, VNode } from 'msfssdk';
import { AirportFacility, ICAO } from 'msfssdk/navigation';

import { Regions } from '../../Navigation/Regions';
import { AirportWaypoint, FacilityWaypoint, Waypoint } from '../../Navigation/Waypoint';
import { WaypointComponent, WaypointComponentProps } from './WaypointComponent';

/**
 * Component props for WaypointRegion.
 */
export interface WaypointRegionProps extends WaypointComponentProps {
  /** CSS class(es) to add to the root of the region component. */
  class?: string;
}

/**
 * A text display for waypoint region.
 */
export class WaypointRegion extends WaypointComponent<WaypointRegionProps> {
  protected readonly textSub = ComputedSubject.create<Waypoint | null, string>(null, (waypoint): string => {
    if (waypoint instanceof FacilityWaypoint) {
      if (waypoint instanceof AirportWaypoint) {
        // airports don't have region codes in their ICAO strings, we will try to grab the code from the first 2
        // letters of the ident. However, some airports (e.g. in the US and those w/o 4-letter idents) don't use the
        // region code for the ident, so we need a third fallback, which is to just display the city name instead.
        const airport = waypoint.facility as AirportFacility;
        const ident = ICAO.getIdent(airport.icao).trim();
        let text = ident.length === 4 ? Regions.getName(ident.substr(0, 2)) : '';
        if (text === '' && airport.city !== '') {
          text = airport.city.split(', ').map(name => Utils.Translate(name)).join(', ');
        }

        if (text) {
          return text;
        }
      } else {
        return Regions.getName(waypoint.facility.icao.substr(1, 2));
      }
    }

    return '__________';
  });

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onWaypointChanged(waypoint: Waypoint | null): void {
    this.textSub.set(waypoint);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public render(): VNode {
    return (
      <div class={this.props.class ?? ''}>{this.textSub}</div>
    );
  }
}
