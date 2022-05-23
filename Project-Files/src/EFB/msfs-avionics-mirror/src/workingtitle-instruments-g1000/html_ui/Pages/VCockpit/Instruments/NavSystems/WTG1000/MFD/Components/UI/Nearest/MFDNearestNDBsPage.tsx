import { VNode, FSComponent } from 'msfssdk';
import { Facility, NdbFacility, NearestNdbSubscription, NearestSubscription } from 'msfssdk/navigation';
import { G1000UiControl, G1000UiControlProps } from '../../../../Shared/UI/G1000UiControl';
import { WaypointIconImageCache } from '../../../../Shared/WaypointIconImageCache';
import { MFDNearestPage } from './MFDNearestPage';
import { FrequencyGroup, InformationGroup } from './NDBs';

/**
 * A page that displays the nearest intersections and related information on the MFD.
 */
export class MFDNearestNdbsPage extends MFDNearestPage<NdbFacility> {

  private readonly informationGroup = FSComponent.createRef<InformationGroup>();
  private readonly frequencyGroup = FSComponent.createRef<FrequencyGroup>();

  /** @inheritdoc */
  protected getSelectedGroup(): G1000UiControl<G1000UiControlProps> {
    return this.uiRoot.instance;
  }

  /** @inheritdoc */
  protected getPageClass(): string {
    return 'mfd-nearest-ndbs';
  }

  /** @inheritdoc */
  protected getFacilityGroupTitle(): string {
    return 'Nearest NDB';
  }

  /** @inheritdoc */
  protected buildNearestSubscription(): NearestSubscription<NdbFacility> {
    return new NearestNdbSubscription(this.props.loader);
  }

  /** @inheritdoc */
  protected onFacilitySelected(facility: NdbFacility): void {
    super.onFacilitySelected(facility);

    this.informationGroup.instance.set(facility);
    this.frequencyGroup.instance.set(facility);
  }

  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getIconSource(facility: Facility): string {
    return WaypointIconImageCache.get('NDB').src;
  }

  /** @inheritdoc */
  public onViewOpened(): void {
    super.onViewOpened();

    this.props.menuSystem.clear();
    this.props.menuSystem.pushMenu('navmap-root');
  }

  /** @inheritdoc */
  protected renderGroups(): VNode {
    return (
      <>
        <InformationGroup ref={this.informationGroup} />
        <FrequencyGroup ref={this.frequencyGroup} />
      </>
    );
  }
}
