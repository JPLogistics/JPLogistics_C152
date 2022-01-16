import { FSComponent, ComponentProps, DisplayComponent, VNode, NodeReference } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { GNSSEvents } from 'msfssdk/instruments';
import { LNavSimVars } from '../../../Shared/Autopilot/LNavSimVars';

import './WaypointAlerter.css';

/**
 * The props for the WaypointAlerter component.
 */
interface WaypointAlerterProps extends ComponentProps {

  /** An instance of the event bus. */
  bus: EventBus;
}

/**
 * A component that alerts when the waypoint is about to change.
 */
export class WaypointAlerter extends DisplayComponent<WaypointAlerterProps> {

  private readonly el = new NodeReference<HTMLDivElement>();

  private currentSpeed = 0;

  private currentTimeout?: NodeJS.Timeout;

  private secondsRemaining = 0;

  private nextDTK = 0;

  private flashing = false;

  /**
   * A callback called after the component is rendered.
   */
  public onAfterRender(): void {
    const lnav = this.props.bus.getSubscriber<LNavSimVars>();

    this.props.bus.getSubscriber<GNSSEvents>().on('ground_speed').handle(spd => this.currentSpeed = spd);
    lnav.on('lnavDisTurn').handle(this.onDistanceUpdated);
    lnav.on('lnavNextDtkMag').handle(dtk => this.nextDTK = dtk);
  }

  /**
   * A callback called when the LNAV distance to go is updated.
   * @param distance The distance to go.
   */
  public onDistanceUpdated = (distance: number): void => {
    if (distance !== 0) {
      const secondsRemaining = (distance / this.currentSpeed) * 60 * 60;
      if (secondsRemaining <= 5.25 && !this.flashing) {
        this.el.instance && this.el.instance.classList.add('flashing');
        this.el.instance && (this.el.instance.style.display = 'block');

        this.secondsRemaining = Math.floor(secondsRemaining);
        this.startFlash();
      }
    }
  }

  /**
   * Starts the waypoint alerter flashing.
   */
  private startFlash = (): void => {
    if (this.secondsRemaining > 0) {
      this.flashing = true;
      this.el.instance && (this.el.instance.textContent = `Next DTK ${this.nextDTK.toFixed(0)}° in ${this.secondsRemaining} sec`);
      this.secondsRemaining--;

      this.currentTimeout = setTimeout(this.startFlash, 1000);
    } else {
      this.flashing = false;
      this.showNowMessage();
    }
  }

  /**
   * Shows the waypoint dtk now message.
   */
  private showNowMessage(): void {
    this.el.instance && (this.el.instance.classList.remove('flashing'));
    this.el.instance && (this.el.instance.textContent = `Next DTK ${this.nextDTK.toFixed(0)}° now`);
    setTimeout(() => this.el.instance && (this.el.instance.style.display = 'none'), 3000);
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class='waypoint-alerter flashing' ref={this.el}>Next DTK 275° in 5 sec</div>
    );
  }
}