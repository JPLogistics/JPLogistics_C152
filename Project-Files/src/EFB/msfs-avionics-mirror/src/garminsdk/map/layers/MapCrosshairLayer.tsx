import { BitFlags, FSComponent, VNode } from 'msfssdk';
import { MapLayer, MapLayerProps, MapProjection, MapProjectionChangeType } from 'msfssdk/components/map';
import { MapCrosshairModule } from '../modules/MapCrosshairModule';

import './MapCrosshairLayer.css';

/**
 * Modules required for MapCrosshairLayer.
 */
export interface MapCrosshairLayerModules {
  /** Crosshair module. */
  crosshair: MapCrosshairModule;
}

/**
 * A map layer which displays a crosshair at the projected position of the map target.
 */
export class MapCrosshairLayer extends MapLayer<MapLayerProps<MapCrosshairLayerModules>> {
  private readonly crosshairRef = FSComponent.createRef<HTMLElement>();

  private needReposition = true;

  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onVisibilityChanged(isVisible: boolean): void {
    this.crosshairRef.getOrDefault() && this.updateFromVisibility();
  }

  /**
   * Updates this layer according to its current visibility.
   */
  private updateFromVisibility(): void {
    this.crosshairRef.instance.style.display = this.isVisible() ? '' : 'none';
  }

  /** @inheritdoc */
  public onAfterRender(): void {
    this.props.model.getModule('crosshair').show.sub(show => { this.setVisible(show); }, true);
    this.updateFromVisibility();
  }

  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    this.needReposition ||= BitFlags.isAny(changeFlags, MapProjectionChangeType.TargetProjected);
  }

  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onUpdated(time: number, elapsed: number): void {
    if (!this.needReposition || !this.isVisible()) {
      return;
    }

    this.repositionCrosshair();
    this.needReposition = false;
  }

  /**
   * Repositions this layer's crosshair.
   */
  private repositionCrosshair(): void {
    const position = this.props.mapProjection.getTargetProjected();
    this.crosshairRef.instance.style.transform = `translate(-50%, -50%) translate3d(${position[0]}px, ${position[1]}px, 0)`;
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <svg
        ref={this.crosshairRef}
        class='map-crosshair' viewBox='0 0 100 100'
        style='position: absolute; left: 0; top: 0; transform: translate(-50%, -50%) translate3d(0, 0, 0);'
      >
        <line class='map-crosshair-outline' x1='50' y1='0' x2='50' y2='100' />
        <line class='map-crosshair-outline' x1='0' y1='50' x2='100' y2='50' />
        <line class='map-crosshair-stroke' x1='50' y1='0' x2='50' y2='100' />
        <line class='map-crosshair-stroke' x1='0' y1='50' x2='100' y2='50' />
      </svg>
    );
  }
}