import { FSComponent, GeoPointSubject, GeoPoint, VNode, Subject, UnitType, DisplayComponent, NavAngleSubject, NumberUnitSubject, NavAngleUnit, ComponentProps } from 'msfssdk';
import { ICAO, IntersectionFacility } from 'msfssdk/navigation';
import { NumberFormatter } from 'msfssdk/graphics/text';
import { BearingDisplay } from '../../../../../Shared/UI/Common/BearingDisplay';
import { NumberUnitDisplay } from '../../../../../Shared/UI/Common/NumberUnitDisplay';
import { UnitsUserSettingManager } from '../../../../../Shared/Units/UnitsUserSettings';
import { WaypointIconImageCache } from '../../../../../Shared/WaypointIconImageCache';
import { GroupBox } from '../../GroupBox';

import './ReferenceVorGroup.css';

/** Props on the ReferenceVorGroup component. */
export interface ReferenceVorGroupProps extends ComponentProps {
  /** A user setting manager for measurement units. */
  unitsSettingManager: UnitsUserSettingManager;
}

/**
 * A component that displays the reference VOR information for an intersection
 * on the MFD nearest intersections page.
 */
export class ReferenceVorGroup extends DisplayComponent<ReferenceVorGroupProps> {
  private readonly content = FSComponent.createRef<HTMLDivElement>();

  private readonly name = Subject.create<string>('');
  private readonly iconSrc = Subject.create<string>('');
  private readonly frequency = Subject.create<string>('');
  private readonly bearing = NavAngleSubject.createFromNavAngle(NavAngleUnit.create(false).createNumber(NaN));
  private readonly distance = NumberUnitSubject.createFromNumberUnit(UnitType.METER.createNumber(NaN));

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
      this.bearing.set(facility.nearestVorMagneticRadial, facility.lat, facility.lon);
      this.distance.set(facility.nearestVorDistance);

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
            <BearingDisplay
              value={this.bearing}
              displayUnit={this.props.unitsSettingManager.navAngleUnits}
              formatter={NumberFormatter.create({ precision: 1, pad: 3, nanString: '___' })}
              class='mfd-nearest-intersection-vor-bearing'
            />
            <NumberUnitDisplay
              value={this.distance}
              displayUnit={this.props.unitsSettingManager.distanceUnitsLarge}
              formatter={NumberFormatter.create({ precision: 0.1, maxDigits: 3, nanString: '__._' })}
              class='mfd-nearest-intersection-vor-distance'
            />
          </div>
        </div>
      </GroupBox>
    );
  }
}