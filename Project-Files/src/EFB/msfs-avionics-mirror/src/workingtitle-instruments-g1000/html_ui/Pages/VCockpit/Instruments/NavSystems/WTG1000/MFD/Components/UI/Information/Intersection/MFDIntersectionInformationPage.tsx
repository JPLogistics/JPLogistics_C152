import { FSComponent, VNode } from 'msfssdk';
import { FacilityType, FacilityWaypoint, IntersectionFacility } from 'msfssdk/navigation';

import { InformationGroup, ReferenceVorGroup } from '../../Nearest/Intersections';
import { FacilityGroup } from '../FacilityGroup';
import { MFDInformationPage } from '../MFDInformationPage';

/**
 * A component that displays a page of information about an intersection facility.
 */
export class MFDIntersectionInformationPage extends MFDInformationPage {

  private readonly informationGroup = FSComponent.createRef<InformationGroup>();
  private readonly referenceVorGroup = FSComponent.createRef<ReferenceVorGroup>();

  /**
   * A callback called when a new waypoint is selected.
   * @param waypoint The waypoint that was selected.
   */
  private onSelected(waypoint: FacilityWaypoint<IntersectionFacility> | null): void {
    if (waypoint !== null) {
      this.informationGroup.instance.set(waypoint.facility);
      this.referenceVorGroup.instance.set(waypoint.facility);
    } else {
      this.informationGroup.instance.set(null);
      this.referenceVorGroup.instance.set(null);
    }

    this.waypoint.set(waypoint);
  }

  /** @inheritdoc */
  protected renderGroups(): VNode {
    return (
      <>
        <FacilityGroup bus={this.props.bus} facilityLoader={this.props.facilityLoader} facilityType={FacilityType.Intersection}
          viewService={this.props.viewService} title='Intersection' onSelected={this.onSelected.bind(this)} ref={this.facilityGroup} />
        <InformationGroup ref={this.informationGroup} />
        <ReferenceVorGroup ref={this.referenceVorGroup} unitsSettingManager={this.unitsSettingManager} />
      </>
    );
  }

  /** @inheritdoc */
  protected getPageClass(): string {
    return 'mfd-intersection-information';
  }
}