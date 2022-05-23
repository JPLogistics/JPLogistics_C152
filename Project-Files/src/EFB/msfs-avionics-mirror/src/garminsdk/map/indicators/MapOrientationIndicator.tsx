import { ComponentProps, DisplayComponent, FSComponent, Subscribable, VNode } from 'msfssdk';

import { MapOrientation } from '../modules/MapOrientationModule';

import './MapOrientationIndicator.css';

/**
 * Component props for MapOrientationIndicator.
 */
export interface MapOrientationIndicatorProps extends ComponentProps {
  /** A subscribable which provides the orientation mode. */
  orientation: Subscribable<MapOrientation>;

  /** The text to display for each orientation mode. */
  text: Record<MapOrientation, string>;

  /** A subscribable which provides whether the indicator should be visible. */
  isVisible: Subscribable<boolean>;
}

/**
 * Displays a map orientation indication.
 */
export class MapOrientationIndicator extends DisplayComponent<MapOrientationIndicatorProps> {
  private readonly rootRef = FSComponent.createRef<HTMLDivElement>();

  private readonly textSub = this.props.orientation.map(mode => {
    return this.props.text[mode];
  });

  /** @inheritdoc */
  public onAfterRender(): void {
    this.props.isVisible.sub(isVisible => { this.rootRef.instance.style.visibility = isVisible ? '' : 'hidden'; });
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div ref={this.rootRef} class='map-orientation'>{this.textSub}</div>
    );
  }
}