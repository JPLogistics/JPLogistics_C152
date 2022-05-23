import { DisplayComponent, FSComponent, GeoPoint, GeoPointSubject, Subject, VNode } from 'msfssdk';
import { LatLonDisplay } from 'msfssdk/components/common';
import { VorClass, VorFacility } from 'msfssdk/navigation';
import { GroupBox } from '../../GroupBox';
import { MagVarDisplay } from '../../../../../Shared/UI/Common/MagVarDisplay';

import './InformationGroup.css';

/**
 * A component that displays information about an VOR on the
 * MFD nearest VORs page.
 */
export class InformationGroup extends DisplayComponent<any> {

  private readonly content = FSComponent.createRef<HTMLDivElement>();
  private readonly facilityPos = GeoPointSubject.createFromGeoPoint(new GeoPoint(0, 0));
  private readonly class = Subject.create<string>('');
  private readonly magvar = Subject.create<number>(0);

  /**
   * Sets the facility to display in this group.
   * @param facility The facility to display.
   */
  public set(facility: VorFacility | null): void {
    if (facility !== null) {
      this.facilityPos.set(facility.lat, facility.lon);

      switch (facility.vorClass) {
        case VorClass.HighAlt:
          this.class.set('High Altitude');
          break;
        case VorClass.LowAlt:
          this.class.set('Low Altitude');
          break;
        case VorClass.Terminal:
          this.class.set('Terminal');
          break;
        default:
          this.class.set('VOR');
          break;
      }

      // The magvar values we get with the facility info are different from the usual
      // convention of negative west, positive east.   Instead, we seem to get an unsigned
      // number from 0 to 359, with positive values up to 180 being west and values over
      // 180 the inversion of eastern declination -- e.g. 353 is 7 east.
      if (facility.magneticVariation > 180) {
        this.magvar.set(360 - facility.magneticVariation);
      } else {
        this.magvar.set(facility.magneticVariation * -1);
      }

      this.content.instance.classList.remove('hidden-element');
    } else {
      this.content.instance.classList.add('hidden-element');
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <GroupBox title='Information'>
        <div class="mfd-nearest-vor-info hidden-element" ref={this.content}>
          <div class='mfd-nearest-vor-info-class'>{this.class}</div>
          <MagVarDisplay magvar={this.magvar} class={'mfd-nearest-vor-info-magvar'} />
          <LatLonDisplay location={this.facilityPos} class='mfd-nearest-vor-info-latlon' />
        </div>
      </GroupBox>
    );
  }
}