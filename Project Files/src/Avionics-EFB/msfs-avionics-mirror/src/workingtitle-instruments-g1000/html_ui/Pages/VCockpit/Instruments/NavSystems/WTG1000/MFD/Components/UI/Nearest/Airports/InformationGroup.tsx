import { FSComponent, Subject, UnitType, VNode } from 'msfssdk';
import { AirportFacility, ICAO } from 'msfssdk/navigation';
import { Regions } from '../../../../../Shared/Navigation/Regions';
import { UiControl2 } from '../../../../../Shared/UI/UiControl2';
import { GroupBox } from '../../GroupBox';

import './InformationGroup.css';

/**
 * A component that displays airport location information on the
 * MFD nearest airports page.
 */
export class InformationGroup extends UiControl2 {

  private readonly name = Subject.create<string>('');
  private readonly location = Subject.create<string>('');
  private readonly elevation = Subject.create<string>('');

  private readonly content = FSComponent.createRef<HTMLDivElement>();
  private data: AirportFacility | null = null;

  /**
   * Sets the subscription for the information display.
   * @param airport The airport data to subscribe to.
   */
  public set(airport: AirportFacility | null): void {
    this.onChanged(airport);
    this.data = airport;
  }

  /**
   * A callback fired when the data changes in the nearest airport
   * subscription.
   * @param facility The airport data that was changed.
   */
  private onChanged = (facility: AirportFacility | null): void => {
    if (facility !== null) {
      this.content.instance.classList.remove('hidden-element');

      this.name.set(Utils.Translate(facility.name));
      this.location.set(this.getLocation(facility));

      const averageElevation = facility.runways.reduce((prev, cur) => prev + cur.elevation, 0) / facility.runways.length;
      this.elevation.set(UnitType.METER.convertTo(averageElevation, UnitType.FOOT).toFixed(0));
    } else {
      this.content.instance.classList.add('hidden-element');

      this.name.set('');
      this.location.set('');
      this.elevation.set('');
    }
  }

  /**
   * Gets a location string from airport facility data.
   * @param facility The facility to get the location string from.
   * @returns The built airport location string for display.
   */
  private getLocation(facility: AirportFacility): string {
    const ident = ICAO.getIdent(facility.icao).trim();
    let location = ident.length === 4 ? Regions.getName(ident.substr(0, 2)) : '';

    if (location === '' && facility.city !== '') {
      location = facility.city.split(', ').map(name => Utils.Translate(name)).join(', ');
    }

    return location;
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <GroupBox title='Information'>
        <div class="mfd-nearest-airport-info" ref={this.content}>
          <div class='mfd-nearest-airport-info-name'>{this.name}</div>
          <div class='mfd-nearest-airport-info-location'>{this.location}</div>
          <div class='mfd-nearest-airport-info-elevation'>
            <span>{this.elevation}</span>
            <span class='smaller'>FT</span>
          </div>
        </div>
      </GroupBox>
    );
  }
}