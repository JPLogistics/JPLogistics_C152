import { DisplayComponent, FSComponent, ObjectSubject, Subscribable, VNode } from 'msfssdk';
import { TCASOperatingMode } from 'msfssdk/traffic';
import { MapTrafficAltitudeRestrictionMode } from '../Modules/MapTrafficModule';

import './MapTrafficStatusIndicator.css';

/**
 * Component props for MapTrafficStatusIndicator.
 */
export interface MapTrafficStatusIndicatorProps {
  /** Whether the indicator should show the altitude restriction mode. */
  showAltitudeRestrictionMode: boolean;

  /** A subscribable which provides whether to show the indicator. */
  show: Subscribable<boolean>;

  /** A subscribable which provides the current traffic system operating mode. */
  operatingMode: Subscribable<number>;

  /** A subscribable which provides the current map traffic altitude restriction mode. */
  altitudeRestrictionMode: Subscribable<MapTrafficAltitudeRestrictionMode>;
}

/**
 * Displays a traffic operating status and optional altitude restriction mode indications.
 */
export class MapTrafficStatusIndicator extends DisplayComponent<MapTrafficStatusIndicatorProps> {
  private static readonly ALT_RESTRICTION_TEXT = {
    [MapTrafficAltitudeRestrictionMode.Unrestricted]: 'UNRES',
    [MapTrafficAltitudeRestrictionMode.Above]: 'ABOVE',
    [MapTrafficAltitudeRestrictionMode.Normal]: 'NORM',
    [MapTrafficAltitudeRestrictionMode.Below]: 'BELOW'
  };

  private readonly rootStyleSub = ObjectSubject.create({ display: '' });
  private readonly showHandler = (show: boolean): void => { this.rootStyleSub.set('display', show ? '' : 'none'); };

  private readonly disabledStyleSub = ObjectSubject.create({ display: '' });
  private readonly operatingModeHandler = (mode: TCASOperatingMode): void => { this.disabledStyleSub.set('display', mode === TCASOperatingMode.Standby ? 'inherit' : 'none'); };

  private readonly altitudeRestrictionTextSub = this.props.altitudeRestrictionMode.map(mode => {
    return MapTrafficStatusIndicator.ALT_RESTRICTION_TEXT[mode];
  });

  /** @inheritdoc */
  public onAfterRender(): void {
    this.props.show.sub(this.showHandler, true);
    this.props.operatingMode.sub(this.operatingModeHandler, true);
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div style={this.rootStyleSub} class='map-traffic-status'>
        {this.props.showAltitudeRestrictionMode ? <div class='traffic-status-alt'>{this.altitudeRestrictionTextSub}</div> : null}
        <svg class='traffic-status-symbol' viewBox='0 0 150 100'>
          <path d='M 50 5 L 95 50 L 50 95 L 5 50 Z' />
          <path d='M 115 10 L 135 35 L 122.5 35 L 122.5 80 L 107.5 80 L 107.5 35 L 95 35 Z' />
          <g style={this.disabledStyleSub} class='traffic-status-disabled'>
            <path class='traffic-status-disabledcross traffic-status-disabledcross-outline' d='M 10 10 L 140 90 M 10 90 L 140 10' />
            <path class='traffic-status-disabledcross traffic-status-disabledcross-stroke' d='M 10 10 L 140 90 M 10 90 L 140 10' />
          </g>
        </svg>
      </div>
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();

    this.props.show.unsub(this.showHandler);
    this.props.operatingMode.unsub(this.operatingModeHandler);
    this.altitudeRestrictionTextSub.destroy();
  }
}