import { FSComponent, Subject, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { FacilityLoader, FacilityRespository } from 'msfssdk/navigation';
import { ViewService } from '../../../../Shared/UI/ViewService';
import { Fms } from '../../../../Shared/FlightPlan/Fms';
import { MFDFPLDetails } from './MFDFPLDetails';
import { GroupBox } from '../GroupBox';
import { MFDFPLVNavProfile } from './MFDFPLVNavProfile';
import { FlightPlanFocus, FlightPlanSelection } from '../../../../Shared/UI/FPL/FPLTypesAndProps';
import { MFDFPLWeather } from './MFDFPLWeather';

import './MFDFPL.css';
import { UiControl2, UiControl2Props } from '../../../../Shared/UI/UiControl2';
import { FmsHEvent } from '../../../../Shared/UI/FmsHEvent';

/**
 * Component props for MFDFPL.
 */
export interface MFDFPLProps extends UiControl2Props {
  /** An instance of the event bus. */
  bus: EventBus;

  /** The view service. */
  viewService: ViewService;

  /** The flight management system. */
  fms: Fms;

  /** A subject to provide the flight plan focus. */
  focus: Subject<FlightPlanFocus>;
}

/**
 * The FPL popup container encapsulates the actual popup logic.
 */
export class MFDFPL extends UiControl2<MFDFPLProps> {
  private readonly fplDetailsRef = FSComponent.createRef<MFDFPLDetails>();

  private readonly selectionSub = Subject.create<FlightPlanSelection>(null);

  /** Called when the view is resumed. */
  public onViewResumed(): void {
    if (this.fplDetailsRef.instance !== undefined) {
      this.fplDetailsRef.instance.fplViewResumed();
    }
  }

  /** Called when the view is opened. */
  public onViewOpened(): void {
    if (this.fplDetailsRef.instance !== undefined) {
      this.fplDetailsRef.instance.fplViewOpened();
    }
  }

  /** @inheritdoc */
  protected onBlurred(): void {
    this.selectionSub.set(null);
  }

  /** Scrolls to the active leg in the flight plan. */
  public resetAutoScroll(): void {
    this.fplDetailsRef.instance.resetAutoScroll();
  }

  /** @inheritdoc */
  public onInteractionEvent(evt: FmsHEvent): boolean {
    if (!this.isFocused && evt === FmsHEvent.MENU) {
      return this.fplDetailsRef.instance.openDetailsMenu();
    }

    return super.onInteractionEvent(evt);
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class='mfd-fpl mfd-dark-background wide'>
        <MFDFPLDetails
          ref={this.fplDetailsRef} bus={this.props.bus}
          viewService={this.props.viewService} fms={this.props.fms}
          selection={this.selectionSub} focus={this.props.focus}
        />
        <GroupBox title="Active VNV Profile">
          <MFDFPLVNavProfile bus={this.props.bus} flightPlanner={this.props.fms.flightPlanner} />
        </GroupBox>
        <GroupBox title="Selected Waypoint Weather">
          <MFDFPLWeather facLoader={new FacilityLoader(FacilityRespository.getRepository(this.props.bus))} fms={this.props.fms} selection={this.selectionSub} />
        </GroupBox>
        <div class="mfd-fpl-bottom-prompt">Press the "FPL" key to view the previous page</div>
      </div>
    );
  }
}