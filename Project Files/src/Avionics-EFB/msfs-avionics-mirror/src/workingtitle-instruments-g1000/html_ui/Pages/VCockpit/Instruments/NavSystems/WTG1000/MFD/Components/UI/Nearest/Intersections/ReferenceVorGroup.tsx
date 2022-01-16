import { FSComponent, GeoPointSubject, GeoPoint, VNode, Subject, UnitType, DisplayComponent } from 'msfssdk';
import { ICAO, IntersectionFacility } from 'msfssdk/navigation';
import { WaypointIconImageCache } from '../../../../../Shared/WaypointIconImageCache';
import { GroupBox } from '../../GroupBox';

import './ReferenceVorGroup.css';

/**
 * A component that displays the reference VOR information for an intersection
 * on the MFD nearest intersections page.
 */
export class ReferenceVorGroup extends DisplayComponent<any> {
  private readonly content = FSComponent.createRef<HTMLDivElement>();

  private readonly name = Subject.create<string>('');
  private readonly iconSrc = Subject.create<string>('');
  private readonly frequency = Subject.create<string>('');
  private readonly bearing = Subject.create<string>('');
  private readonly distance = Subject.create<string>('');

  private facilityPos = GeoPointSubject.createFromGeoPoint(new GeoPoint(0, 0));

  /**
   * Sets the facility to display in this group.
   * @param facility The facility to display.
   */
  public set(facility: IntersectionFacility | null): void {
    if (facility !== null) {
      this.facilityPos.set(facility.lat, facility.lon);

      this.name.set(ICAO.getIdent(facility.nearestVorICAO));
      this.iconSrc.set(WaypointIconImageCache.getVorIcon(facility.nearestVorType).src);
      this.frequency.set(facility.nearestVorFrequencyMHz.toFixed(2));
      this.bearing.set(facility.nearestVorMagneticRadial.toFixed(0).padStart(3, '0'));
      this.distance.set(UnitType.METER.convertTo(facility.nearestVorDistance, UnitType.NMILE).toFixed(1));

      this.content.instance.classList.remove('hidden-element');
    } else {
      this.content.instance.classList.add('hidden-element');
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <GroupBox title='Reference VOR'>
        <div class="mfd-nearest-intersection-vor hidden-element" ref={this.content}>
          <div>
            <div class='mfd-nearest-intersection-vor-name'>{this.name}</div>
            <img class='mfd-nearest-intersection-vor-icon' src={this.iconSrc} />
            <div class='mfd-nearest-intersection-vor-frequency'>{this.frequency}</div>
          </div>
          <div>
            <div class='mfd-nearest-intersection-vor-bearing'>{this.bearing}°</div>
            <div class='mfd-nearest-intersection-vor-distance'><span>{this.distance}</span><span class='smaller'>NM</span></div>
          </div>
        </div>
      </GroupBox>
    );
  }
}