import { FSComponent, VNode } from 'msfssdk';
import { FacilityType, VorFacility } from 'msfssdk/navigation';
import { FacilityWaypoint } from '../../../../../Shared/Navigation/Waypoint';
import { FrequencyGroup, InformationGroup } from '../../Nearest/VORs';
import { FacilityGroup } from '../FacilityGroup';
import { MFDInformationPage } from '../MFDInformationPage';

/**
 * A component that displays a page of information about an intersection facility.
 */
export class MFDVorInformationPage extends MFDInformationPage {

  private readonly informationGroup = FSComponent.createRef<InformationGroup>();
  private readonly frequencyGroup = FSComponent.createRef<FrequencyGroup>();

  /**
   * A callback called when a new waypoint is selected.
   * @param waypoint The waypoint that was selected.
   */
  private onSelected(waypoint: FacilityWaypoint<VorFacility> | null): void {
    if (waypoint !== null) {
      this.informationGroup.instance.set(waypoint.facility);
      this.frequencyGroup.instance.set(waypoint.facility);

      this.frequencyGroup.instance.setDisabled(false);
    } else {
      this.informationGroup.instance.set(null);
      this.frequencyGroup.instance.set(null);

      this.frequencyGroup.instance.setDisabled(true);
    }

    this.waypoint.set(waypoint);
  }

  /** @inheritdoc */
  protected onViewOpened(): void {
    super.onViewOpened();

    if (this.waypoint.get() === null) {
      this.frequencyGroup.instance.setDisabled(true);
    }
  }

  /** @inheritdoc */
  protected renderGroups(): VNode {
    return (
      <>
        <FacilityGroup bus={this.props.bus} facilityLoader={this.props.facilityLoader} facilityType={FacilityType.VOR}
          viewService={this.props.viewService} title='VOR' onSelected={this.onSelected.bind(this)} ref={this.facilityGroup} />
        <InformationGroup ref={this.informationGroup} />
        <FrequencyGroup ref={this.frequencyGroup} controlPublisher={this.props.controlPublisher} />
      </>
    );
  }

  /** @inheritdoc */
  protected getPageClass(): string {
    return 'mfd-vor-information';
  }
}