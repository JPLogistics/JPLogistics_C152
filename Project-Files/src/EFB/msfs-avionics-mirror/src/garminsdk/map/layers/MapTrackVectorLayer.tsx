import { ExpSmoother, FSComponent, MappedSubject, UnitType, Vec2Math, Vec2Subject, VNode } from 'msfssdk';
import { MapLayer, MapLayerProps, MapOwnAirplanePropsModule, MapProjection, MapSyncedCanvasLayer } from 'msfssdk/components/map';
import { MapTrackVectorModule } from '../modules/MapTrackVectorModule';

/**
 * Modules required for MapTrackVectorLayer.
 */
export interface MapTrackVectorLayerModules {
  /** Own airplane properties module. */
  ownAirplaneProps: MapOwnAirplanePropsModule;

  /** Track vector module. */
  trackVector: MapTrackVectorModule;
}

/**
 * A map layer which displays a track vector.
 */
export class MapTrackVectorLayer extends MapLayer<MapLayerProps<MapTrackVectorLayerModules>> {
  private static readonly MIN_ARC_TURN_RATE = 0.25; // minimum turn rate, in degrees/sec, for which to draw an arc.
  private static readonly MAX_ARC_LOOKAHEAD_TIME = UnitType.SECOND.createNumber(60); // maximum lookahead time for which to draw an arc.

  private static readonly STROKE_WIDTH = 2; // px
  private static readonly STROKE_COLOR = 'cyan';
  private static readonly OUTLINE_WIDTH = 1; // px
  private static readonly OUTLINE_COLOR = '#505050';

  private static readonly vec2Cache = [new Float64Array(2)];

  private readonly canvasLayerRef = FSComponent.createRef<MapSyncedCanvasLayer>();

  private readonly ownAirplanePropsModule = this.props.model.getModule('ownAirplaneProps');
  private readonly trackVectorModule = this.props.model.getModule('trackVector');

  private readonly projectedPlanePositionSub = Vec2Subject.createFromVector(new Float64Array(2));
  private readonly projectPlanePositionHandler = (): void => {
    const projected = this.props.mapProjection.project(this.ownAirplanePropsModule.position.get(), MapTrackVectorLayer.vec2Cache[0]);
    this.projectedPlanePositionSub.set(projected);
  };

  private readonly turnRateSmoother = new ExpSmoother(500 / Math.LN2, undefined, 1000);

  private needUpdate = false;

  /** @inheritdoc */
  public onVisibilityChanged(isVisible: boolean): void {
    if (!isVisible) {
      this.canvasLayerRef.getOrDefault()?.tryGetDisplay()?.clear();
    }
  }

  /** @inheritdoc */
  public onAttached(): void {
    this.canvasLayerRef.instance.onAttached();

    this.ownAirplanePropsModule.position.sub(this.projectPlanePositionHandler);

    const scheduleUpdate = (): void => { this.needUpdate = true; };

    MappedSubject.create(([show, isOnGround]) => show && !isOnGround, this.trackVectorModule.show, this.ownAirplanePropsModule.isOnGround).sub(
      isVisible => { this.setVisible(isVisible); },
      true
    );

    this.projectedPlanePositionSub.sub(scheduleUpdate);

    this.ownAirplanePropsModule.turnRate.sub(scheduleUpdate);
    this.ownAirplanePropsModule.trackTrue.sub(scheduleUpdate);
    this.ownAirplanePropsModule.groundSpeed.sub(scheduleUpdate);

    this.trackVectorModule.lookaheadTime.sub(scheduleUpdate, true);
  }

  /** @inheritdoc */
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    this.canvasLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);
    this.projectPlanePositionHandler();
    this.needUpdate = true;
  }

  /** @inheritdoc */
  public onUpdated(time: number, elapsed: number): void {
    if (!this.needUpdate || !this.isVisible()) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const display = this.canvasLayerRef.instance.display!;
    display.clear();

    const lookaheadTime = this.trackVectorModule.lookaheadTime.get();

    const track = this.ownAirplanePropsModule.trackTrue.get();
    const groundSpeed = this.ownAirplanePropsModule.groundSpeed.get();
    const turnRate = this.turnRateSmoother.next(this.ownAirplanePropsModule.turnRate.get(), elapsed);

    const distanceNM = groundSpeed.asUnit(UnitType.KNOT) * lookaheadTime.asUnit(UnitType.HOUR);
    const distancePx = UnitType.NMILE.convertTo(distanceNM, UnitType.GA_RADIAN) / this.props.mapProjection.getProjectedResolution();
    const projectedTrackAngle = track * Avionics.Utils.DEG2RAD + this.props.mapProjection.getRotation() - Math.PI / 2;

    const projectedPlanePos = this.projectedPlanePositionSub.get();

    display.context.beginPath();
    display.context.moveTo(projectedPlanePos[0], projectedPlanePos[1]);
    if (Math.abs(turnRate) < MapTrackVectorLayer.MIN_ARC_TURN_RATE || lookaheadTime.compare(MapTrackVectorLayer.MAX_ARC_LOOKAHEAD_TIME) > 0) {
      // draw a line
      const delta = Vec2Math.setFromPolar(distancePx, projectedTrackAngle, MapTrackVectorLayer.vec2Cache[0]);

      display.context.lineTo(projectedPlanePos[0] + delta[0], projectedPlanePos[1] + delta[1]);
    } else {
      // draw an arc
      const groundSpeedPxPerSec = UnitType.NMILE.convertTo(groundSpeed.asUnit(UnitType.KNOT) / 3600, UnitType.GA_RADIAN) / this.props.mapProjection.getProjectedResolution();
      const turnRadius = groundSpeedPxPerSec / (turnRate * Avionics.Utils.DEG2RAD);
      const angularWidthDrawn = Utils.Clamp(distancePx / turnRadius, -Math.PI / 2, Math.PI / 2);

      const circleOffsetAngle = projectedTrackAngle + Math.PI / 2;
      const circleCenter = Vec2Math.add(
        Vec2Math.setFromPolar(turnRadius, circleOffsetAngle, MapTrackVectorLayer.vec2Cache[0]),
        projectedPlanePos,
        MapTrackVectorLayer.vec2Cache[0]
      );
      const startAngle = circleOffsetAngle + (turnRadius < 0 ? 0 : Math.PI);
      const endAngle = startAngle + angularWidthDrawn;

      display.context.arc(circleCenter[0], circleCenter[1], Math.abs(turnRadius), startAngle, endAngle, turnRadius < 0);
    }

    display.context.lineWidth = MapTrackVectorLayer.STROKE_WIDTH + MapTrackVectorLayer.OUTLINE_WIDTH * 2;
    display.context.strokeStyle = MapTrackVectorLayer.OUTLINE_COLOR;
    display.context.stroke();

    display.context.lineWidth = MapTrackVectorLayer.STROKE_WIDTH;
    display.context.strokeStyle = MapTrackVectorLayer.STROKE_COLOR;
    display.context.stroke();

    this.needUpdate = false;
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <MapSyncedCanvasLayer ref={this.canvasLayerRef} model={this.props.model} mapProjection={this.props.mapProjection} />
    );
  }
}