import { VNode, FSComponent } from 'msfssdk';
import { Facility, NearestSubscription, NearestVorSubscription, VorFacility } from 'msfssdk/navigation';
import { FocusPosition, UiControl2, UiControl2Props } from '../../../../Shared/UI/UiControl2';
import { WaypointIconImageCache } from '../../../../Shared/WaypointIconImageCache';
import { MFDNearestPage, MFDNearestPageProps } from './MFDNearestPage';
import { FrequencyGroup, InformationGroup } from './VORs';

export enum NearestVorSoftKey {
  VOR,
  FREQ
}

/**
 * A page that displays the nearest intersections and related information on the MFD.
 */
export class MFDNearestVorsPage extends MFDNearestPage<VorFacility> {

  private readonly informationGroup = FSComponent.createRef<InformationGroup>();
  private readonly frequencyGroup = FSComponent.createRef<FrequencyGroup>();

  /**
   * Creates an instance of the MFDNearestVorsPage component.
   * @param props The props for this component.
   */
  constructor(props: MFDNearestPageProps) {
    super(props);

    this.props.bus.on('nearest_vors_key', (group: number) => {
      switch (group) {
        case NearestVorSoftKey.VOR:
          this.facilitiesGroup.instance.focus(FocusPosition.MostRecent);
          break;
        case NearestVorSoftKey.FREQ:
          this.frequencyGroup.instance.focus(FocusPosition.MostRecent);
          break;
      }
    });
  }

  /** @inheritdoc */
  protected getSelectedGroup(): UiControl2<UiControl2Props> {
    return this.uiRoot.instance;
  }

  /** @inheritdoc */
  protected getPageClass(): string {
    return 'mfd-nearest-ndbs';
  }

  /** @inheritdoc */
  protected getFacilityGroupTitle(): string {
    return 'Nearest VOR';
  }

  /** @inheritdoc */
  protected buildNearestSubscription(): NearestSubscription<VorFacility, any, any> {
    return new NearestVorSubscription(this.props.loader);
  }

  /** @inheritdoc */
  protected getIconSource(facility: Facility): string {
    return WaypointIconImageCache.getVorIcon((facility as VorFacility).type).src;
  }

  /** @inheritdoc */
  protected onFacilitySelected(facility: VorFacility): void {
    super.onFacilitySelected(facility);

    this.informationGroup.instance.set(facility);
    this.frequencyGroup.instance.set(facility);
  }

  /** @inheritdoc */
  public onViewOpened(): void {
    super.onViewOpened();

    this.props.menuSystem.clear();
    this.props.menuSystem.pushMenu('nearest-vors-menu');
  }

  /** @inheritdoc */
  protected renderGroups(): VNode {
    return (
      <>
        <InformationGroup ref={this.informationGroup} />
        <FrequencyGroup ref={this.frequencyGroup} controlPublisher={this.props.publisher} isolateScroll />
      </>
    );
  }
}
