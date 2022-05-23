import { FSComponent, VNode } from 'msfssdk';
import { MapLayer, MapLayerProps } from 'msfssdk/components/map';
import { MapPointerModule } from '../modules/MapPointerModule';

import './MapPointerLayer.css';

/**
 * Modules required by MapPointerLayer.
 */
export interface MapPointerLayerModules {
  /** Pointer module. */
  pointer: MapPointerModule;
}

/**
 * A map layer which displays a pointer.
 */
export class MapPointerLayer extends MapLayer<MapLayerProps<MapPointerLayerModules>> {
  private readonly pointerRef = FSComponent.createRef<HTMLElement>();

  private readonly pointerModule = this.props.model.getModule('pointer');

  private readonly positionHandler = (): void => { this.needRepositionPointer = true; };

  private needRepositionPointer = false;

  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onVisibilityChanged(isVisible: boolean): void {
    this.pointerRef.getOrDefault() && this.updateFromVisibility();
  }

  /**
   * Updates this layer according to its current visibility.
   */
  private updateFromVisibility(): void {
    const isVisible = this.isVisible();
    this.pointerRef.instance.style.display = isVisible ? '' : 'none';
    if (isVisible) {
      this.pointerModule.position.sub(this.positionHandler, true);
    } else {
      this.pointerModule.position.unsub(this.positionHandler);
    }
  }

  /** @inheritdoc */
  public onAttached(): void {
    this.updateFromVisibility();

    this.pointerModule.isActive.sub(isActive => this.setVisible(isActive), true);
  }

  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onUpdated(time: number, elapsed: number): void {
    if (!this.needRepositionPointer) {
      return;
    }

    this.repositionPointer();
    this.needRepositionPointer = false;
  }

  /**
   * Repositions this layer's pointer.
   */
  private repositionPointer(): void {
    const position = this.pointerModule.position.get();
    this.pointerRef.instance.style.transform = `translate3d(${position[0]}px, ${position[1]}px, 0)`;
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <svg
        ref={this.pointerRef} class='map-pointer' viewBox='0 0 100 100'
        style='position: absolute; left: 0; top: 0; transform: translate3d(0, 0, 0);'
      >
        <polygon points='78.93 95.46 49.48 66.01 41.18 84.57 4.54 4.54 84.57 41.18 66.01 49.48 95.46 78.93 78.93 95.46' />
      </svg>
    );
  }
}