import { ComponentProps, DisplayComponent, FSComponent, Subscribable, VNode } from 'msfssdk';

import { MapDeclutterMode } from '../modules/MapDeclutterModule';

import './MapDetailIndicator.css';

/**
 * Component props for MapDetailIndicator.
 */
export interface MapDetailIndicatorProps extends ComponentProps {
  /** A subscribable which provides the declutter mode. */
  declutterMode: Subscribable<MapDeclutterMode>;

  /** Whether to show the title. */
  showTitle: boolean;
}

/**
 * Displays a map detail level indication.
 */
export class MapDetailIndicator extends DisplayComponent<MapDetailIndicatorProps> {
  private static readonly MODE_CLASSES = {
    [MapDeclutterMode.All]: 'detail-4',
    [MapDeclutterMode.Level3]: 'detail-3',
    [MapDeclutterMode.Level2]: 'detail-2',
    [MapDeclutterMode.Level1]: 'detail-1',
  };

  private readonly rootRef = FSComponent.createRef<HTMLDivElement>();

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onAfterRender(): void {
    this.props.declutterMode.sub(this.onDeclutterModeChanged.bind(this), true);
  }

  /**
   * A callback which is called when the declutter mode setting value changes.
   * @param mode The new declutter mode setting value.
   */
  private onDeclutterModeChanged(mode: MapDeclutterMode): void {
    this.rootRef.instance.classList.remove('detail-4', 'detail-3', 'detail-2', 'detail-1');
    this.rootRef.instance.classList.add(MapDetailIndicator.MODE_CLASSES[mode]);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public render(): VNode {
    return (
      <div ref={this.rootRef} class='map-detail'>
        {this.props.showTitle ? <div>Detail</div> : null}
        <div class='map-detail-icon'>
          <div class='map-detail-block map-detail-top' />
          <div class='map-detail-block map-detail-middle' />
          <div class='map-detail-block map-detail-bottom' />
          <div class='map-detail-clip' />
        </div>
      </div>
    );
  }
}