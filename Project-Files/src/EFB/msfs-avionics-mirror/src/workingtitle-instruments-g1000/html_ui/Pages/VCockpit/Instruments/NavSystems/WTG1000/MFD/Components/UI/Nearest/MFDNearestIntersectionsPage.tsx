import { VNode, FSComponent } from 'msfssdk';
import { Facility, IntersectionFacility, NearestIntersectionSubscription, NearestSubscription } from 'msfssdk/navigation';
import { G1000UiControl, G1000UiControlProps } from '../../../../Shared/UI/G1000UiControl';
import { WaypointIconImageCache } from '../../../../Shared/WaypointIconImageCache';
import { InformationGroup, ReferenceVorGroup } from './Intersections';
import { MFDNearestPage } from './MFDNearestPage';

/**
 * A page that displays the nearest intersections and related information on the MFD.
 */
export class MFDNearestIntersectionsPage extends MFDNearestPage<IntersectionFacility> {

  private readonly informationGroup = FSComponent.createRef<InformationGroup>();
  private readonly referenceVorGroup = FSComponent.createRef<ReferenceVorGroup>();

  /** @inheritdoc */
  protected getSelectedGroup(): G1000UiControl<G1000UiControlProps> {
    return this.uiRoot.instance;
  }

  /** @inheritdoc */
  protected getPageClass(): string {
    return 'mfd-nearest-intersections';
  }

  /** @inheritdoc */
  protected getFacilityGroupTitle(): string {
    return 'Nearest Intersections';
  }

  /** @inheritdoc */
  protected buildNearestSubscription(): NearestSubscription<IntersectionFacility> {
    return new NearestIntersectionSubscription(this.props.loader);
  }

  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getIconSource(facility: Facility): string {
    return WaypointIconImageCache.get('INTERSECTION_CYAN').src;
  }

  /** @inheritdoc */
  protected onFacilitySelected(facility: IntersectionFacility): void {
    super.onFacilitySelected(facility);

    this.informationGroup.instance.set(facility);
    this.referenceVorGroup.instance.set(facility);
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
        <ReferenceVorGroup ref={this.referenceVorGroup} unitsSettingManager={this.unitsSettingManager} />
      </>
    );
  }
}
