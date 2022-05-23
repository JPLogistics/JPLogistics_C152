import { ComponentProps, DisplayComponent, FSComponent, Subscribable, VNode } from 'msfssdk';

import './MapNoGpsPositionMessage.css';

/**
 * Component props for MapDetailIndicator.
 */
export interface MapDetailIndicatorProps extends ComponentProps {
  /** A subscribable which provides the declutter mode. */
  hasGpsSignal: Subscribable<boolean>;
}

/**
 * Displays a map detail level indication.
 */
export class MapNoGpsPositionMessage extends DisplayComponent<MapDetailIndicatorProps> {
  private readonly rootRef = FSComponent.createRef<HTMLDivElement>();

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onAfterRender(): void {
    this.props.hasGpsSignal.sub(hasGpsSignal => {
      if (hasGpsSignal) {
        this.rootRef.instance.classList.add('hidden');
      } else {
        this.rootRef.instance.classList.remove('hidden');
      }
    }, true);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public render(): VNode {
    return (
      <div ref={this.rootRef} class='map-no-gps-position-msg'>
        NO GPS POSITION
      </div>
    );
  }
}