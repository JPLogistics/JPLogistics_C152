import { FSComponent, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { FlightPathCalculator } from 'msfssdk/flightplan';
import { Fms } from '../../../../../Shared/FlightPlan/Fms';
import { UiView, UiViewProps } from '../../../../../Shared/UI/UiView';
import { PFDSelectApproach } from './PFDSelectApproach';

/**
 * Component props for PFDSelectApproachView.
 */
export interface PFDSelectApproachViewProps extends UiViewProps {
  /** The event bus. */
  bus: EventBus;

  /** The flight management system. */
  fms: Fms;

  /** A flight path calculator to use to build preview flight plans. */
  calculator: FlightPathCalculator;
}

/**
 * A PFD view for selecting approaches.
 */
export class PFDSelectApproachView extends UiView<PFDSelectApproachViewProps> {
  private readonly selectApproachRef = FSComponent.createRef<PFDSelectApproach>();

  /**
   * Initializes the default approach selection page display.
   */
  public initDefaults(): void {
    this.selectApproachRef.getOrDefault()?.initDefaults();
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class='popout-dialog' ref={this.viewContainerRef}>
        <h1>{this.props.title}</h1>
        <PFDSelectApproach
          ref={this.selectApproachRef}
          onRegister={this.register}
          viewService={this.props.viewService}
          bus={this.props.bus}
          fms={this.props.fms}
          calculator={this.props.calculator}
        />
      </div>
    );
  }
}