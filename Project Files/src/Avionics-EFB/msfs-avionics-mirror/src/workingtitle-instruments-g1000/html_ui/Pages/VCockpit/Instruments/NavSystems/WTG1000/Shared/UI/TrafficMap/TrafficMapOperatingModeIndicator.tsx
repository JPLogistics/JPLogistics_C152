import { DisplayComponent, FSComponent, Subscribable, VNode } from 'msfssdk';
import { TCASOperatingMode } from 'msfssdk/traffic';

import './TrafficMapOperatingModeIndicator.css';

/**
 * Component props for TrafficMapOperatingModeIndicator.
 */
export interface TrafficMapOperatingModeIndicatorProps {
  /** A subscribable which provides the current traffic system operating mode. */
  operatingMode: Subscribable<TCASOperatingMode>;

  /** The text to display for each operating mode. */
  text: Record<TCASOperatingMode, string>;
}

/**
 * Displays a traffic system operating mode indication.
 */
export class TrafficMapOperatingModeIndicator extends DisplayComponent<TrafficMapOperatingModeIndicatorProps> {
  private readonly textSub = this.props.operatingMode.map(mode => this.props.text[mode]);

  // eslint-disable-next-line jsdoc/require-jsdoc
  public render(): VNode {
    return (
      <div class='map-traffic-opmode'>{this.textSub}</div>
    );
  }
}