import { FSComponent, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { FlightPathCalculator } from 'msfssdk/flightplan';
import { Fms } from 'garminsdk/flightplan';
import { UiView, UiViewProps } from '../../../../../Shared/UI/UiView';
import { PFDSelectArrival } from './PFDSelectArrival';

/**
 * Component props for PFDSelectArrivalView.
 */
export interface PFDSelectArrivalViewProps extends UiViewProps {
  /** The event bus. */
  bus: EventBus;

  /** The flight management system. */
  fms: Fms;

  /** A flight path calculator to use to build preview flight plans. */
  calculator: FlightPathCalculator;
}

/**
 * A PFD view for selecting arrivals.
 */
export class PFDSelectArrivalView extends UiView<PFDSelectArrivalViewProps> {
  private readonly selectArrivalRef = FSComponent.createRef<PFDSelectArrival>();

  /** @inheritdoc */
  protected onViewOpened(): void {
    super.onViewOpened();

    this.selectArrivalRef.instance.initializeIcaoInput();
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class='popout-dialog' ref={this.viewContainerRef}>
        <h1>{this.props.title}</h1>
        <PFDSelectArrival
          ref={this.selectArrivalRef}
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