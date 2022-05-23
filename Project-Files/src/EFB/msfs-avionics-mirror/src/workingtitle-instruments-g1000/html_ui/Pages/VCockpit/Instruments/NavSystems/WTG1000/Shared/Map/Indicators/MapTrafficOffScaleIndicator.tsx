import { ComponentProps, DisplayComponent, FSComponent, Subscribable, VNode } from 'msfssdk';

import './MapTrafficOffScaleIndicator.css';

export enum MapTrafficIntruderOffScaleIndicatorMode {
  Off,
  TA,
  RA
}

/**
 * Component props for MapTrafficIntruderOffScaleIndicator.
 */
export interface MapTrafficIntruderOffScaleIndicatorProps extends ComponentProps {
  /** A subscribable which provides the indicator mode. */
  mode: Subscribable<MapTrafficIntruderOffScaleIndicatorMode>;
}

/**
 * Displays a traffic off-scale indication.
 */
export class MapTrafficIntruderOffScaleIndicator extends DisplayComponent<MapTrafficIntruderOffScaleIndicatorProps> {
  private static readonly CLASSES = {
    [MapTrafficIntruderOffScaleIndicatorMode.Off]: 'offscale-mode-off',
    [MapTrafficIntruderOffScaleIndicatorMode.TA]: 'offscale-mode-ta',
    [MapTrafficIntruderOffScaleIndicatorMode.RA]: 'offscale-mode-ra'
  };
  private static readonly TEXT = {
    [MapTrafficIntruderOffScaleIndicatorMode.Off]: '',
    [MapTrafficIntruderOffScaleIndicatorMode.TA]: 'TA OFF SCALE',
    [MapTrafficIntruderOffScaleIndicatorMode.RA]: 'RA OFF SCALE'
  };

  private readonly ref = FSComponent.createRef<HTMLDivElement>();

  private readonly textSub = this.props.mode.map(mode => {
    return MapTrafficIntruderOffScaleIndicator.TEXT[mode];
  });

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onAfterRender(): void {
    this.props.mode.sub(this.onModeChanged.bind(this), true);
  }

  /**
   * A callback which is called when the indicator mode changes.
   * @param mode The new mode.
   */
  private onModeChanged(mode: MapTrafficIntruderOffScaleIndicatorMode): void {
    this.ref.instance.classList.remove(...Object.values(MapTrafficIntruderOffScaleIndicator.CLASSES));
    this.ref.instance.classList.add(MapTrafficIntruderOffScaleIndicator.CLASSES[mode]);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public render(): VNode {
    return (
      <div ref={this.ref} class='map-traffic-offscale'>{this.textSub}</div>
    );
  }
}