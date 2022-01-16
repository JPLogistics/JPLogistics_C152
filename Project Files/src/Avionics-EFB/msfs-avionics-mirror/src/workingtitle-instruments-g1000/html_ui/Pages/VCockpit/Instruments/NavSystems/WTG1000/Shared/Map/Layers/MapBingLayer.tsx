import { ArraySubject, FSComponent, MappedSubject, Subject, VNode } from 'msfssdk';
import { MapBingLayer as BingLayer, MapIndexedRangeModule, MapLayer, MapLayerProps, MapOwnAirplanePropsModule, MapProjection } from 'msfssdk/components/map';

import { MapTerrainMode, MapTerrainModule } from '../Modules/MapTerrainModule';
import { MapUtils } from '../MapUtils';
import { MapNexradModule } from '../Modules/MapNexradModule';

/**
 * Modules required by MapBingLayer.
 */
export interface MapBingLayerModules {
  /** Range module. */
  range: MapIndexedRangeModule;

  /** Own airplane properties module. */
  ownAirplaneProps: MapOwnAirplanePropsModule;

  /** Terrain module. */
  terrain: MapTerrainModule;

  /** NEXRAD mode module. */
  nexrad: MapNexradModule;
}

/**
 * Component props for MapBingLayer.
 */
export interface MapBingLayerProps extends MapLayerProps<MapBingLayerModules> {
  /** The unique ID to assign to this layer's Bing component. */
  bingId: string;
}

/**
 * A map layer which displays the Bing map.
 */
export class MapBingLayer extends MapLayer<MapBingLayerProps> {
  private static readonly NO_TERRAIN_COLORS = MapUtils.createNoTerrainEarthColors();
  private static readonly ABSOLUTE_TERRAIN_COLORS = MapUtils.createAbsoluteTerrainEarthColors();
  private static readonly RELATIVE_TERRAIN_COLORS = MapUtils.createRelativeTerrainEarthColors();

  private static readonly MIN_NEXRAD_RANGE_INDEX = 13; // 5 nm/10 km

  private readonly bingLayerRef = FSComponent.createRef<BingLayer<MapBingLayerModules>>();

  private readonly earthColorsSub = ArraySubject.create(MapBingLayer.ABSOLUTE_TERRAIN_COLORS.slice());
  private readonly referenceSub = Subject.create(EBingReference.SEA);

  private readonly isNexradVisibleSub = MappedSubject.create(
    ([showNexrad, rangeIndex]) => showNexrad && rangeIndex >= MapBingLayer.MIN_NEXRAD_RANGE_INDEX,
    this.props.model.getModule('nexrad').showNexrad,
    this.props.model.getModule('range').nominalRangeIndex
  );
  private readonly wxrModeSub = this.isNexradVisibleSub.map(isVisible => { return { mode: isVisible ? EWeatherRadar.TOPVIEW : EWeatherRadar.OFF, arcRadians: 2 }; });

  /** @inheritdoc */
  public onAttached(): void {
    this.props.model.getModule('terrain').terrainMode.sub(this.onTerrainModeChanged.bind(this), true);

    this.bingLayerRef.instance.onAttached();
  }

  /** @inheritdoc */
  public onWake(): void {
    this.bingLayerRef.instance.onWake();
  }

  /** @inheritdoc */
  public onSleep(): void {
    this.bingLayerRef.instance.onSleep();
  }

  /** @inheritdoc */
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    this.bingLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);
  }

  /** @inheritdoc */
  public onUpdated(time: number, elapsed: number): void {
    this.bingLayerRef.instance.onUpdated(time, elapsed);
  }

  /**
   * A callback which is called when the terrain mode changes.
   * @param mode The new terrain mode.
   */
  private onTerrainModeChanged(mode: MapTerrainMode): void {
    let colors = MapBingLayer.NO_TERRAIN_COLORS;
    let reference = EBingReference.SEA;
    switch (mode) {
      case MapTerrainMode.Absolute:
        colors = MapBingLayer.ABSOLUTE_TERRAIN_COLORS;
        break;
      case MapTerrainMode.Relative:
        colors = MapBingLayer.RELATIVE_TERRAIN_COLORS;
        reference = EBingReference.PLANE;
        break;
    }

    this.earthColorsSub.set(colors);
    this.referenceSub.set(reference);
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <BingLayer
        ref={this.bingLayerRef}
        model={this.props.model} mapProjection={this.props.mapProjection}
        bingId={this.props.bingId}
        earthColors={this.earthColorsSub} reference={this.referenceSub}
        class={this.props.class}
        wxrMode={this.wxrModeSub}
      />
    );
  }
}