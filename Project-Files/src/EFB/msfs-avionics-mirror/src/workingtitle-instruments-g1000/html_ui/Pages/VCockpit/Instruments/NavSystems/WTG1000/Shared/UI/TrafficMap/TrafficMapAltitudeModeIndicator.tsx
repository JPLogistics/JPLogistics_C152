import { DisplayComponent, FSComponent, Subscribable, VNode } from 'msfssdk';
import { MapTrafficAltitudeRestrictionMode } from '../../Map/Modules/MapTrafficModule';

import './TrafficMapAltitudeModeIndicator.css';

/**
 * Component props for TrafficMapAltitudeModeIndicator.
 */
export interface TrafficMapAltitudeModeIndicatorProps {
  /** A subscribable which provides the current traffic altitude restriction mode. */
  altitudeRestrictionMode: Subscribable<MapTrafficAltitudeRestrictionMode>;

  /** The text to display for each altitude restriction mode. */
  text: Record<MapTrafficAltitudeRestrictionMode, string>;
}

/**
 * Displays a traffic system altitude restriction mode indication.
 */
export class TrafficMapAltitudeModeIndicator extends DisplayComponent<TrafficMapAltitudeModeIndicatorProps> {
  private readonly textSub = this.props.altitudeRestrictionMode.map(mode => this.props.text[mode]);

  // eslint-disable-next-line jsdoc/require-jsdoc
  public render(): VNode {
    return (
      <div class='map-traffic-altmode'>{this.textSub}</div>
    );
  }
}