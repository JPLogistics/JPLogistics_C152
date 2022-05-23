import { FSComponent, VNode } from 'msfssdk';
import { FacilityType, FacilityWaypoint, NdbFacility } from 'msfssdk/navigation';

import { FrequencyGroup, InformationGroup } from '../../Nearest/NDBs';
import { FacilityGroup } from '../FacilityGroup';
import { MFDInformationPage } from '../MFDInformationPage';

/**
 * A component that displays a page of information about an intersection facility.
 */
export class MFDNdbInformationPage extends MFDInformationPage {

  private readonly informationGroup = FSComponent.createRef<InformationGroup>();
  private readonly frequencyGroup = FSComponent.createRef<FrequencyGroup>();

  /**
   * A callback called when a new waypoint is selected.
   * @param waypoint The waypoint that was selected.
   */
  private onSelected(waypoint: FacilityWaypoint<NdbFacility> | null): void {
    if (waypoint !== null) {
      this.informationGroup.instance.set(waypoint.facility);
      this.frequencyGroup.instance.set(waypoint.facility);
    } else {
      this.informationGroup.instance.set(null);
      this.frequencyGroup.instance.set(null);
    }

    this.waypoint.set(waypoint);
  }

  /** @inheritdoc */
  protected renderGroups(): VNode {
    return (
      <>
        <FacilityGroup bus={this.props.bus} facilityLoader={this.props.facilityLoader} facilityType={FacilityType.NDB}
          viewService={this.props.viewService} title='NDB' onSelected={this.onSelected.bind(this)} ref={this.facilityGroup} />
        <InformationGroup ref={this.informationGroup} />
        <FrequencyGroup ref={this.frequencyGroup} />
      </>
    );
  }

  /** @inheritdoc */
  protected getPageClass(): string {
    return 'mfd-ndb-information';
  }
}