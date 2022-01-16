import { FSComponent, GeoPoint, GeoPointSubject, NavMath, NumberUnit, NumberUnitSubject, Subject, UnitType, VNode } from 'msfssdk';
import { LatLonDisplay } from 'msfssdk/components/common';
import { AirportFacility, FacilityType } from 'msfssdk/navigation';
import { FacilityWaypoint } from '../../../../../Shared/Navigation/Waypoint';
import { NumberUnitDisplay } from '../../../../../Shared/UI/Common/NumberUnitDisplay';
import { FrequenciesGroup, RunwaysGroup } from '../../Nearest/Airports';
import { FacilityGroup } from '../FacilityGroup';
import { MFDInformationPage } from '../MFDInformationPage';

import './MFDAirportInformationPage.css';

/**
 * A component that displays a page of information about an airport facility.
 */
export class MFDAirportInformationPage extends MFDInformationPage {
  private readonly runwaysGroup = FSComponent.createRef<RunwaysGroup>();
  private readonly frequenciesGroup = FSComponent.createRef<FrequenciesGroup>();

  private readonly elevation = NumberUnitSubject.createFromNumberUnit(new NumberUnit(NaN, UnitType.FOOT));
  private readonly location = GeoPointSubject.createFromGeoPoint(new GeoPoint(NaN, NaN));

  /**
   * A callback called when a waypoint is selected for information display.
   * @param waypoint The waypoint that was selected.
   */
  private onSelected(waypoint: FacilityWaypoint<AirportFacility> | null): void {
    if (waypoint !== null) {
      this.runwaysGroup.instance.set(waypoint.facility);
      this.frequenciesGroup.instance.set(waypoint.facility);

      this.runwaysGroup.instance.setDisabled(false);
      this.frequenciesGroup.instance.setDisabled(false);

      let currentDistance = 0;
      const runwayPosition = new GeoPoint(NaN, NaN);

      for (let i = 0; i < waypoint.facility.runways.length; i++) {
        const runway = waypoint.facility.runways[i];
        const runwayLengthRadians = UnitType.METER.convertTo(runway.length, UnitType.GA_RADIAN);
        runwayPosition.set(runway.latitude, runway.longitude);

        runwayPosition.offset(runway.direction, runwayLengthRadians / 2);
        const primaryDistance = runwayPosition.distance(waypoint.location);

        runwayPosition.offset(NavMath.normalizeHeading(runway.direction + 180), runwayLengthRadians);
        const secondaryDistance = runwayPosition.distance(waypoint.location);
        currentDistance = Math.max(currentDistance, primaryDistance, secondaryDistance);
      }

      currentDistance = UnitType.GA_RADIAN.convertTo(currentDistance, UnitType.METER);

      const ranges = this.mapModel.getModule('range').nominalRanges.get();
      for (let i = 0; i < ranges.length; i++) {
        const rangeInMeters = ranges[i].asUnit(UnitType.METER) * 2;
        if (rangeInMeters > currentDistance) {
          this.mapRangeIndexSub.set(i);
          break;
        }
      }

      const elevation = waypoint.facility.runways.reduce((v, c) => v + c.elevation, 0) / waypoint.facility.runways.length;

      this.elevation.set(elevation);
      this.location.set(waypoint.facility.lat, waypoint.facility.lon);
    } else {
      this.runwaysGroup.instance.set(null);
      this.frequenciesGroup.instance.set(null);

      this.runwaysGroup.instance.setDisabled(true);
      this.frequenciesGroup.instance.setDisabled(true);

      this.elevation.set(NaN);
      this.location.set(NaN, NaN);
    }

    this.waypoint.set(waypoint);
  }

  /** @inheritdoc */
  protected onViewOpened(): void {
    super.onViewOpened();

    if (this.waypoint.get() === null) {
      this.runwaysGroup.instance.setDisabled(true);
      this.frequenciesGroup.instance.setDisabled(true);
    }
  }

  /** @inheritdoc */
  protected renderGroups(): VNode {
    return (
      <>
        <FacilityGroup onSelected={this.onSelected.bind(this)} bus={this.props.bus} facilityType={FacilityType.Airport}
          facilityLoader={this.props.facilityLoader} viewService={this.props.viewService} title='Airport' ref={this.facilityGroup}>
          <div class='mfd-airport-information-apt'>
            <LatLonDisplay class='mfd-airport-information-location' location={this.location} />
            <NumberUnitDisplay class='mfd-airport-information-elevation' formatter={(v): string => isFinite(v) ? v.toFixed(0) : '_____'}
              value={this.elevation} displayUnit={Subject.create(UnitType.FOOT)} />
          </div>
        </FacilityGroup>
        <RunwaysGroup ref={this.runwaysGroup} innerScrollOnly />
        <FrequenciesGroup ref={this.frequenciesGroup} controlPublisher={this.props.controlPublisher} />
      </>
    );
  }

  /** @inheritdoc */
  protected getPageClass(): string {
    return 'mfd-airport-information';
  }
}