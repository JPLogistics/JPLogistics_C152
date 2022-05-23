import { BitFlags, FSComponent, VNode } from 'msfssdk';
import { MapLayer, MapLayerProps, MapProjection, MapProjectionChangeType } from 'msfssdk/components/map';

/**
 * Component props for MapMiniCompassLayer.
 */
export interface MapMiniCompassLayerProps extends MapLayerProps<any> {
  /** The source for the arrow graphic. */
  imgSrc: string;
}

/**
 * The map layer showing a rotating compass arrow pointing to true north.
 */
export class MapMiniCompassLayer extends MapLayer<MapMiniCompassLayerProps> {
  private readonly imgRef = FSComponent.createRef<HTMLImageElement>();
  private needUpdate = false;

  /** @inheritdoc */
  public onAttached(): void {
    this.needUpdate = true;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    this.needUpdate = BitFlags.isAll(changeFlags, MapProjectionChangeType.Rotation);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/no-unused-vars
  public onUpdated(time: number, elapsed: number): void {
    if (!this.needUpdate) {
      return;
    }

    this.updateRotation();

    this.needUpdate = false;
  }

  /**
   * Updates the rotation of the arrow.
   */
  private updateRotation(): void {
    const rotation = this.props.mapProjection.getRotation();
    this.imgRef.instance.style.transform = `rotate3d(0,0,1,${rotation}rad)`;
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class={this.props.class ?? ''} style={'position: relative; width: var(--minicompass-size, 4em); height: var(--minicompass-size, 4em);'}>
        <img ref={this.imgRef} src={this.props.imgSrc} style={'width: 100%; height: 100%;'} />
        <div style={'position: absolute; top: 50%; width: 100%; transform: translateY(-50%); text-align: center; color: black;'}>N</div>
      </div>
    );
  }
}