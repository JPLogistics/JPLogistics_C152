import { DisplayComponent, FSComponent, Subscribable, VNode } from 'msfssdk';
import { TCASOperatingMode } from 'msfssdk/traffic';

import './TrafficMapStandbyBannerIndicator.css';

/**
 * Component props for TrafficMapStandbyBannerIndicator.
 */
export interface TrafficMapStandbyBannerIndicatorProps {
  /** A subscribable which provides the current traffic system operating mode. */
  operatingMode: Subscribable<TCASOperatingMode>;

  /** A subscribable which provides whether the airplane is on the ground. */
  isOnGround: Subscribable<boolean>;
}

/**
 * Displays a traffic system standby mode banner indicator.
 */
export class TrafficMapStandbyBannerIndicator extends DisplayComponent<TrafficMapStandbyBannerIndicatorProps> {
  private readonly rootRef = FSComponent.createRef<HTMLDivElement>();

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onAfterRender(): void {
    this.props.operatingMode.sub(mode => {
      this.rootRef.instance.style.display = mode === TCASOperatingMode.Standby ? '' : 'none';
    }, true);

    this.props.isOnGround.sub(isOnGround => {
      isOnGround
        ? this.rootRef.instance.classList.add('map-traffic-standby-onground')
        : this.rootRef.instance.classList.remove('map-traffic-standby-onground');
    }, true);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public render(): VNode {
    return (
      <div ref={this.rootRef} class='map-traffic-standby'>STANDBY</div>
    );
  }
}