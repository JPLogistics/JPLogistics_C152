import { FSComponent, MappedSubject, SubscribableMapFunctions, UnitType, Vec2Math, Vec2Subject, VNode } from 'msfssdk';
import { MapAutopilotModule, MapLayer, MapLayerProps, MapOwnAirplanePropsModule, MapProjection, MapSyncedCanvasLayer } from 'msfssdk/components/map';
import { MapAltitudeArcModule } from '../modules/MapAltitudeArcModule';

/**
 * Modules required for MapAltitudeArcLayer.
 */
export interface MapAltitudeArcLayerModules {
  /** Own airplane properties module. */
  ownAirplaneProps: MapOwnAirplanePropsModule;

  /** Autopilot module. */
  autopilot: MapAutopilotModule;

  /** Altitude intercept arc module. */
  altitudeArc: MapAltitudeArcModule;
}

/**
 * A map layer which displays an altitude intercept arc.
 */
export class MapAltitudeArcLayer extends MapLayer<MapLayerProps<MapAltitudeArcLayerModules>> {
  private static readonly VS_PRECISION = 50; // Vertical speed precision, in feet per minute.
  private static readonly MIN_VS = 150; // Minimum vertical speed to display the arc, in feet per minute.
  private static readonly MIN_ALT_DEV = 150; // Minimum altitude deviation from preselector to display the arc, in feet.

  private static readonly ARC_ANGULAR_WIDTH = 60 * Avionics.Utils.DEG2RAD; // radians
  private static readonly ARC_HALF_ANGULAR_WIDTH = MapAltitudeArcLayer.ARC_ANGULAR_WIDTH / 2;
  private static readonly ARC_RADIUS = 64; // px
  private static readonly STROKE_WIDTH = 2; // px
  private static readonly STROKE_COLOR = 'cyan';
  private static readonly OUTLINE_WIDTH = 1; // px
  private static readonly OUTLINE_COLOR = '#505050';

  private static readonly vec2Cache = [new Float64Array(2), new Float64Array(2)];

  private readonly canvasLayerRef = FSComponent.createRef<MapSyncedCanvasLayer>();

  private readonly ownAirplanePropsModule = this.props.model.getModule('ownAirplaneProps');
  private readonly autopilotModule = this.props.model.getModule('autopilot');
  private readonly altitudeArcModule = this.props.model.getModule('altitudeArc');

  private readonly vsFpmSub = this.ownAirplanePropsModule.verticalSpeed
    .map(vs => vs.asUnit(UnitType.FPM))
    .map(SubscribableMapFunctions.withPrecision(MapAltitudeArcLayer.VS_PRECISION));

  private readonly projectedPlanePositionSub = Vec2Subject.createFromVector(new Float64Array(2));
  private readonly projectPlanePositionHandler = (): void => {
    const projected = this.props.mapProjection.project(this.ownAirplanePropsModule.position.get(), MapAltitudeArcLayer.vec2Cache[0]);
    this.projectedPlanePositionSub.set(projected);
  };

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

    MappedSubject.create(([show, vsFpm, alt, selectedAlt]) => {
      if (!show || Math.abs(vsFpm) < MapAltitudeArcLayer.MIN_VS) {
        return false;
      }

      const altDevFeet = selectedAlt.asUnit(UnitType.FOOT) - alt.asUnit(UnitType.FOOT);
      return Math.abs(altDevFeet) >= MapAltitudeArcLayer.MIN_ALT_DEV && altDevFeet * vsFpm > 0;
    }, this.altitudeArcModule.show, this.vsFpmSub, this.ownAirplanePropsModule.altitude, this.autopilotModule.selectedAltitude,
    ).sub(
      isVisible => { this.setVisible(isVisible); },
      true
    );

    this.projectedPlanePositionSub.sub(scheduleUpdate);

    this.ownAirplanePropsModule.trackTrue.sub(scheduleUpdate);
    this.ownAirplanePropsModule.groundSpeed.sub(scheduleUpdate);
    this.ownAirplanePropsModule.altitude.sub(scheduleUpdate);
    this.vsFpmSub.sub(scheduleUpdate);

    this.autopilotModule.selectedAltitude.sub(scheduleUpdate, true);
  }

  /** @inheritdoc */
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    this.canvasLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);
    this.projectPlanePositionHandler();
    this.needUpdate = true;
  }

  /** @inheritdoc */
  public onUpdated(): void {
    if (!this.needUpdate || !this.isVisible()) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const display = this.canvasLayerRef.instance.display!;
    display.clear();

    const track = this.ownAirplanePropsModule.trackTrue.get();
    const groundSpeed = this.ownAirplanePropsModule.groundSpeed.get();
    const altitude = this.ownAirplanePropsModule.altitude.get();
    const selectedAltitude = this.autopilotModule.selectedAltitude.get();
    const vsFpm = this.vsFpmSub.get();

    const timeToAltitudeMinute = (selectedAltitude.asUnit(UnitType.FOOT) - altitude.asUnit(UnitType.FOOT)) / vsFpm;
    const distanceToAltitudeFeet = groundSpeed.asUnit(UnitType.FPM) * timeToAltitudeMinute;
    const distancePx = UnitType.FOOT.convertTo(distanceToAltitudeFeet, UnitType.GA_RADIAN) / this.props.mapProjection.getProjectedResolution();
    const projectedTrackAngle = track * Avionics.Utils.DEG2RAD + this.props.mapProjection.getRotation() - Math.PI / 2;

    const projectedPlanePos = this.projectedPlanePositionSub.get();

    display.context.beginPath();

    const center = Vec2Math.add(
      Vec2Math.setFromPolar(distancePx - MapAltitudeArcLayer.ARC_RADIUS, projectedTrackAngle, MapAltitudeArcLayer.vec2Cache[0]),
      projectedPlanePos,
      MapAltitudeArcLayer.vec2Cache[0]
    );
    const arcStart = Vec2Math.add(
      Vec2Math.setFromPolar(MapAltitudeArcLayer.ARC_RADIUS, projectedTrackAngle - MapAltitudeArcLayer.ARC_HALF_ANGULAR_WIDTH, MapAltitudeArcLayer.vec2Cache[1]),
      center,
      MapAltitudeArcLayer.vec2Cache[1]
    );

    display.context.moveTo(arcStart[0], arcStart[1]);
    display.context.arc(
      center[0], center[1],
      MapAltitudeArcLayer.ARC_RADIUS,
      projectedTrackAngle - MapAltitudeArcLayer.ARC_HALF_ANGULAR_WIDTH, projectedTrackAngle + MapAltitudeArcLayer.ARC_HALF_ANGULAR_WIDTH
    );

    display.context.lineWidth = MapAltitudeArcLayer.STROKE_WIDTH + MapAltitudeArcLayer.OUTLINE_WIDTH * 2;
    display.context.strokeStyle = MapAltitudeArcLayer.OUTLINE_COLOR;
    display.context.stroke();

    display.context.lineWidth = MapAltitudeArcLayer.STROKE_WIDTH;
    display.context.strokeStyle = MapAltitudeArcLayer.STROKE_COLOR;
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