import { DisplayComponent, FSComponent, Subject, Subscribable, VNode } from 'msfssdk';

import { MapTerrainMode } from '../modules/MapTerrainModule';

import './MapTerrainScaleIndicator.css';

/**
 * Component props for MapTerrainScaleIndicator.
 */
export interface MapTerrainScaleIndicatorProps {
  /** A subscribable which provides whether to show the indicator. */
  show: Subscribable<boolean>;

  /** A subscribable which provides the current map terrain mode. */
  terrainMode: Subscribable<MapTerrainMode>;
}

/**
 * Displays a terrain color scale.
 */
export class MapTerrainScaleIndicator extends DisplayComponent<MapTerrainScaleIndicatorProps> {
  private readonly rootRef = FSComponent.createRef<HTMLDivElement>();

  private readonly absLabelTextSubs = [
    Subject.create('27000'),
    Subject.create('10000'),
    Subject.create('8000'),
    Subject.create('6000'),
    Subject.create('3000'),
    Subject.create('2000'),
    Subject.create('500'),
    Subject.create('0')
  ];
  private readonly relLabelTextSubs = [
    Subject.create('−500'),
    Subject.create('−1000'),
    Subject.create('−2000')
  ];
  private readonly unitTextSub = Subject.create('');

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onAfterRender(): void {
    this.props.show.sub(this.updateDisplay.bind(this));
    this.props.terrainMode.sub(this.updateDisplay.bind(this), true);
  }

  /**
   * Updates the display of this indicator.
   */
  private updateDisplay(): void {
    if (this.props.show.get()) {
      switch (this.props.terrainMode.get()) {
        case MapTerrainMode.None:
          this.rootRef.instance.style.display = 'none';
          this.rootRef.instance.classList.remove('terrain-abs', 'terrain-rel');
          this.unitTextSub.set('');
          break;
        case MapTerrainMode.Absolute:
          this.rootRef.instance.style.display = '';
          this.rootRef.instance.classList.remove('terrain-rel');
          this.rootRef.instance.classList.add('terrain-abs');
          this.unitTextSub.set('');
          break;
        case MapTerrainMode.Relative:
          this.rootRef.instance.style.display = '';
          this.rootRef.instance.classList.remove('terrain-abs');
          this.rootRef.instance.classList.add('terrain-rel');
          this.unitTextSub.set('FT');
          break;
      }
    } else {
      this.rootRef.instance.style.display = 'none';
      this.rootRef.instance.classList.remove('terrain-abs', 'terrain-rel');
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div ref={this.rootRef} class='map-terrainscale'>
        <div class='map-terrainscale-scale terrainscale-abs'>
          <div class='map-terrainscale-color' style='background: #c8c8c8;' />
          <div class='map-terrainscale-color' style='background: #939393;'>
            <div class='map-terrainscale-label'>{this.absLabelTextSubs[0]}</div>
          </div>
          <div class='map-terrainscale-color' style='background: #904522;'>
            <div class='map-terrainscale-label'>{this.absLabelTextSubs[1]}</div>
          </div>
          <div class='map-terrainscale-color' style='background: #904f25;'>
            <div class='map-terrainscale-label'>{this.absLabelTextSubs[2]}</div>
          </div>
          <div class='map-terrainscale-color' style='background: #9d6434;'>
            <div class='map-terrainscale-label'>{this.absLabelTextSubs[3]}</div>
          </div>
          <div class='map-terrainscale-color' style='background: #c58f45;'>
            <div class='map-terrainscale-label'>{this.absLabelTextSubs[4]}</div>
          </div>
          <div class='map-terrainscale-color' style='background: #d0aa43;'>
            <div class='map-terrainscale-label'>{this.absLabelTextSubs[5]}</div>
          </div>
          <div class='map-terrainscale-color' style='background: #456821;'>
            <div class='map-terrainscale-label'>{this.absLabelTextSubs[6]}</div>
          </div>
          <div class='map-terrainscale-color' style='background: #427238;'>
            <div class='map-terrainscale-label'>{this.absLabelTextSubs[7]}</div>
          </div>
        </div>
        <div class='map-terrainscale-scale terrainscale-rel'>
          <div class='map-terrainscale-color' style='background: #ff0000' />
          <div class='map-terrainscale-color' style='background: #ffff00;'>
            <div class='map-terrainscale-label'>{this.relLabelTextSubs[0]}</div>
          </div>
          <div class='map-terrainscale-color' style='background: #00ff00;'>
            <div class='map-terrainscale-label'>{this.relLabelTextSubs[1]}</div>
          </div>
          <div class='map-terrainscale-color' style='background: #000000;'>
            <div class='map-terrainscale-label'>{this.relLabelTextSubs[2]}</div>
          </div>
        </div>
        <div class='map-terrainscale-unit'>{this.unitTextSub}</div>
      </div>
    );
  }
}