import { BitFlags, FSComponent, GeoPoint, GeoPointInterface, NumberUnitInterface, Subject, UnitFamily, UnitType, Vec2Math, VNode } from 'msfssdk';
import { MapIndexedRangeModule, MapLayer, MapLayerProps, MapOwnAirplanePropsModule, MapProjection, MapProjectionChangeType, MapSyncedCanvasLayer } from 'msfssdk/components/map';
import { EventBus } from 'msfssdk/data';
import { TCASAlertLevel, TCASEvents, TCASIntruder, TCASOperatingMode } from 'msfssdk/traffic';

import { MapTrafficAlertLevelMode, MapTrafficModule, MapTrafficMotionVectorMode } from '../modules/MapTrafficModule';
import { MapTrafficIntruderOffScaleIndicatorMode } from '../indicators/MapTrafficOffScaleIndicator';

/**
 * Modules required for MapTrafficIntruderLayer.
 */
export interface MapTrafficIntruderLayerModules {
  /** Range module. */
  range: MapIndexedRangeModule;

  /** Own airplane properties module. */
  ownAirplaneProps: MapOwnAirplanePropsModule;

  /** Traffic module. */
  traffic: MapTrafficModule;
}

/**
 * Component props for MapTrafficIntruderLayer.
 */
export interface MapTrafficIntruderLayerProps extends MapLayerProps<MapTrafficIntruderLayerModules> {
  /** The event bus. */
  bus: EventBus;

  /** The font size, in pixels. */
  fontSize: number;

  /** The size of the intruder icons, in pixels. */
  iconSize: number;

  /** Whether to limit the display of intruders to the outer range defined in the traffic module. */
  useOuterRangeMaxScale: boolean;

  /**
   * A Subject which allows binding of off-scale indicator mode. If defined, the intruder layer will automatically
   * update the Subject with the appropriate mode.
   */
  offScaleIndicatorMode?: Subject<MapTrafficIntruderOffScaleIndicatorMode>;
}

/**
 * A map layer which displays traffic intruders.
 */
export class MapTrafficIntruderLayer extends MapLayer<MapTrafficIntruderLayerProps> {
  private readonly iconLayerRef = FSComponent.createRef<MapSyncedCanvasLayer<any>>();

  private readonly trafficModule = this.props.model.getModule('traffic');

  private readonly intruderViews = {
    [TCASAlertLevel.None]: new Map<TCASIntruder, MapTrafficIntruderView>(),
    [TCASAlertLevel.ProximityAdvisory]: new Map<TCASIntruder, MapTrafficIntruderView>(),
    [TCASAlertLevel.TrafficAdvisory]: new Map<TCASIntruder, MapTrafficIntruderView>(),
    [TCASAlertLevel.ResolutionAdvisory]: new Map<TCASIntruder, MapTrafficIntruderView>()
  };

  private isInit = false;

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onVisibilityChanged(isVisible: boolean): void {
    if (!isVisible) {
      this.props.offScaleIndicatorMode?.set(MapTrafficIntruderOffScaleIndicatorMode.Off);

      if (this.isInit) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.iconLayerRef.instance.display!.clear();
      }
    }
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onAttached(): void {
    this.iconLayerRef.instance.onAttached();

    this.trafficModule.operatingMode.sub(this.updateVisibility.bind(this));
    this.trafficModule.show.sub(this.updateVisibility.bind(this), true);
    this.initCanvasStyles();
    this.initIntruders();
    this.initTCASHandlers();

    this.isInit = true;
  }

  /**
   * Initializes canvas styles.
   */
  private initCanvasStyles(): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const iconContext = this.iconLayerRef.instance.display!.context;
    iconContext.textAlign = 'center';
    iconContext.font = `${this.props.fontSize}px Roboto-Bold`;
  }

  /**
   * Initializes all currently existing TCAS intruders.
   */
  private initIntruders(): void {
    const intruders = this.trafficModule.tcas.getIntruders();
    const len = intruders.length;
    for (let i = 0; i < len; i++) {
      this.onIntruderAdded(intruders[i]);
    }
  }

  /**
   * Initializes handlers to respond to TCAS events.
   */
  private initTCASHandlers(): void {
    const tcasSub = this.props.bus.getSubscriber<TCASEvents>();

    tcasSub.on('tcas_intruder_added').handle(this.onIntruderAdded.bind(this));
    tcasSub.on('tcas_intruder_removed').handle(this.onIntruderRemoved.bind(this));
    tcasSub.on('tcas_intruder_alert_changed').handle(this.onIntruderAlertLevelChanged.bind(this));
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    this.iconLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);

    if (BitFlags.isAll(changeFlags, MapProjectionChangeType.ProjectedSize)) {
      this.initCanvasStyles();
    }
  }

  // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/no-unused-vars
  public onUpdated(time: number, elapsed: number): void {
    if (!this.isVisible()) {
      return;
    }

    this.redrawIntruders();
  }

  /**
   * Redraws all tracked intruders.
   */
  private redrawIntruders(): void {
    const showLabel = this.trafficModule.showIntruderLabel.get();
    const offScaleRange = this.props.useOuterRangeMaxScale ?
      this.props.model.getModule('range').nominalRanges.get()[this.trafficModule.outerRangeIndex.get()]
      : undefined;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const iconDisplay = this.iconLayerRef.instance.display!;

    iconDisplay.clear();

    let offScaleRACount = 0;
    let offScaleTACount = 0;

    this.intruderViews[TCASAlertLevel.None].forEach(view => {
      view.draw(this.props.mapProjection, iconDisplay.context, showLabel, offScaleRange);
    });
    this.intruderViews[TCASAlertLevel.ProximityAdvisory].forEach(view => {
      view.draw(this.props.mapProjection, iconDisplay.context, showLabel, offScaleRange);
    });

    this.intruderViews[TCASAlertLevel.TrafficAdvisory].forEach(view => {
      view.draw(this.props.mapProjection, iconDisplay.context, showLabel, offScaleRange);
      if (view.isOffScale) {
        offScaleTACount++;
      }
    });
    this.intruderViews[TCASAlertLevel.ResolutionAdvisory].forEach(view => {
      view.draw(this.props.mapProjection, iconDisplay.context, showLabel, offScaleRange);
      if (view.isOffScale) {
        offScaleRACount++;
      }
    });

    if (this.props.offScaleIndicatorMode) {
      if (offScaleRACount > 0) {
        this.props.offScaleIndicatorMode.set(MapTrafficIntruderOffScaleIndicatorMode.RA);
      } else if (offScaleTACount > 0) {
        this.props.offScaleIndicatorMode.set(MapTrafficIntruderOffScaleIndicatorMode.TA);
      } else {
        this.props.offScaleIndicatorMode.set(MapTrafficIntruderOffScaleIndicatorMode.Off);
      }
    }
  }

  /**
   * Updates this layer's visibility.
   */
  private updateVisibility(): void {
    this.setVisible(this.trafficModule.tcas.getOperatingMode() !== TCASOperatingMode.Standby && this.trafficModule.show.get());
  }

  /**
   * A callback which is called when a TCAS intruder is added.
   * @param intruder The new intruder.
   */
  private onIntruderAdded(intruder: TCASIntruder): void {
    const view = new MapTrafficIntruderView(intruder, this.props.model.getModule('ownAirplaneProps'), this.trafficModule, this.props.fontSize, this.props.iconSize);
    this.intruderViews[intruder.alertLevel.get()].set(intruder, view);
  }

  /**
   * A callback which is called when a TCAS intruder is removed.
   * @param intruder The removed intruder.
   */
  private onIntruderRemoved(intruder: TCASIntruder): void {
    this.intruderViews[intruder.alertLevel.get()].delete(intruder);
  }

  /**
   * A callback which is called when the alert level of a TCAS intruder is changed.
   * @param intruder The intruder.
   */
  private onIntruderAlertLevelChanged(intruder: TCASIntruder): void {
    let oldAlertLevel;
    let view = this.intruderViews[oldAlertLevel = TCASAlertLevel.None].get(intruder);
    view ??= this.intruderViews[oldAlertLevel = TCASAlertLevel.ProximityAdvisory].get(intruder);
    view ??= this.intruderViews[oldAlertLevel = TCASAlertLevel.TrafficAdvisory].get(intruder);
    view ??= this.intruderViews[oldAlertLevel = TCASAlertLevel.ResolutionAdvisory].get(intruder);

    if (view) {
      this.intruderViews[oldAlertLevel].delete(intruder);
      this.intruderViews[intruder.alertLevel.get()].set(intruder, view);
    }
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public render(): VNode {
    return (
      <MapSyncedCanvasLayer ref={this.iconLayerRef} model={this.props.model} mapProjection={this.props.mapProjection} />
    );
  }
}

/**
 * A view representation of a TCAS intruder for MapTrafficIntruderLayer.
 */
class MapTrafficIntruderView {
  private static readonly VERTICAL_SPEED_THRESHOLD = UnitType.FPM.createNumber(500);

  private static readonly TA_COLOR = '#ffdc24';
  private static readonly RA_COLOR = 'red';

  private static readonly VECTOR_STROKE_WIDTH = 2;
  private static readonly VECTOR_ABS_COLOR = 'white';
  private static readonly VECTOR_REL_COLOR = '#4ecc3d';
  private static readonly VECTOR_LINE_DASH = [5, 5];
  private static readonly VECTOR_EMPTY_LINE_DASH = [];

  private static readonly geoPointCache = [new GeoPoint(0, 0)];
  private static readonly vec2Cache = [new Float64Array(2)];

  private readonly projectedPos = new Float64Array(2);

  private _isOffScale = false;
  // eslint-disable-next-line jsdoc/require-returns
  /** Whether this view is off-scale. */
  public get isOffScale(): boolean {
    return this._isOffScale;
  }

  private isVisible = false;

  /**
   * Constructor.
   * @param intruder This view's associated intruder.
   * @param ownAirplaneProps The own airplane properties module for this view's parent map.
   * @param trafficModule The traffic module for this view's parent map.
   * @param fontSize This view's font size, in pixels.
   * @param iconSize This view's icon size, in pixels.
   */
  constructor(
    public readonly intruder: TCASIntruder,
    private readonly ownAirplaneProps: MapOwnAirplanePropsModule,
    private readonly trafficModule: MapTrafficModule,
    private readonly fontSize: number,
    private readonly iconSize: number
  ) { }

  /**
   * Draws this view.
   * @param projection The map projection.
   * @param context The canvas rendering context to which to draw this view.
   * @param showLabel Whether to show this view's label.
   * @param offScaleRange The maximum distance from the own airplane this view's intruder can be before it is
   * considered off-scale. If not defined, the map projection boundaries will be used to determine whether this view's
   * intruder is off-scale.
   */
  public draw(
    projection: MapProjection,
    context: CanvasRenderingContext2D,
    showLabel: boolean,
    offScaleRange?: NumberUnitInterface<UnitFamily.Distance>
  ): void {
    this.updatePosition(projection, offScaleRange);
    this.updateVisibility(!!offScaleRange);

    if (this.isVisible) {
      this.drawIcon(context, projection, showLabel);
    }
  }

  /**
   * Updates this view's intruder's projected position and off-scale status.
   * @param projection The map projection.
   * @param offScaleRange The maximum distance from the own airplane this view's intruder can be before it is
   * considered off-scale. If not defined, the map projection boundaries will be used to determine whether this view's
   * intruder is off-scale.
   */
  private updatePosition(projection: MapProjection, offScaleRange?: NumberUnitInterface<UnitFamily.Distance>): void {
    const ownAirplanePos = this.ownAirplaneProps.position.get();
    if (offScaleRange) {
      this.handleOffScaleRange(projection, ownAirplanePos, offScaleRange);
    } else {
      this.handleOffScaleMapProjection(projection);
    }
  }

  /**
   * Updates this view's intruder's projected position and off-scale status using the map projection boundaries to
   * define off-scale.
   * @param projection The map projection.
   */
  private handleOffScaleMapProjection(projection: MapProjection): void {
    projection.project(this.intruder.position, this.projectedPos);
    this._isOffScale = !projection.isInProjectedBounds(this.projectedPos);
  }

  /**
   * Updates this view's intruder's projected position and off-scale status using a specific range from the own
   * airplane to define off-scale.
   * @param projection The map projection.
   * @param ownAirplanePos The position of the own airplane.
   * @param offScaleRange The maximum distance from the own airplane this intruder can be before it is considered
   * off-scale.
   */
  private handleOffScaleRange(projection: MapProjection, ownAirplanePos: GeoPointInterface, offScaleRange: NumberUnitInterface<UnitFamily.Distance>): void {
    const intruderPos = this.intruder.position;
    const horizontalSeparation = intruderPos.distance(ownAirplanePos);
    const offscaleRangeRad = offScaleRange.asUnit(UnitType.GA_RADIAN);
    if (horizontalSeparation > offscaleRangeRad) {
      this._isOffScale = true;
      projection.project(ownAirplanePos.offset(ownAirplanePos.bearingTo(intruderPos), offscaleRangeRad, MapTrafficIntruderView.geoPointCache[0]), this.projectedPos);
    } else {
      this._isOffScale = false;
      projection.project(intruderPos, this.projectedPos);
    }
  }

  /**
   * Updates the visibility of this view.
   * @param useOffScaleRange Whether off-scale is defined by distance from the own airplane.
   */
  private updateVisibility(useOffScaleRange: boolean): void {
    let isVisible = false;
    const alertLevel = this.intruder.alertLevel.get();
    const alertLevelMode = this.trafficModule.alertLevelMode.get();

    switch (alertLevel) {
      case TCASAlertLevel.ResolutionAdvisory:
        isVisible = true;
        break;
      case TCASAlertLevel.TrafficAdvisory:
        if (alertLevelMode === MapTrafficAlertLevelMode.TA_RA) {
          isVisible = true;
          break;
        }
      // eslint-disable-next-line no-fallthrough
      case TCASAlertLevel.ProximityAdvisory:
        if (alertLevelMode === MapTrafficAlertLevelMode.Advisories) {
          isVisible = true;
          break;
        }
      // eslint-disable-next-line no-fallthrough
      case TCASAlertLevel.None:
        if (alertLevelMode === MapTrafficAlertLevelMode.All) {
          isVisible = true;
        }
    }

    if (alertLevel === TCASAlertLevel.ResolutionAdvisory || alertLevel === TCASAlertLevel.TrafficAdvisory) {
      isVisible &&= useOffScaleRange || !this._isOffScale;
    } else {
      const altitudeMeters = this.intruder.relativePositionVec[2];
      const isWithinAltitude = altitudeMeters <= this.trafficModule.altitudeRestrictionAbove.get().asUnit(UnitType.METER)
        && altitudeMeters >= -this.trafficModule.altitudeRestrictionBelow.get().asUnit(UnitType.METER);
      isVisible &&= !this._isOffScale && isWithinAltitude;
    }

    this.isVisible = isVisible;
  }

  /**
   * Draws this view's icon.
   * @param context The canvas rendering context to which to draw the icon.
   * @param projection The map projection.
   * @param showLabel Whether to show the icon label.
   */
  private drawIcon(context: CanvasRenderingContext2D, projection: MapProjection, showLabel: boolean): void {
    const alertLevel = this.intruder.alertLevel.get();

    context.translate(this.projectedPos[0], this.projectedPos[1]);

    if (showLabel) {
      this.drawIconVSArrow(context, alertLevel);
      this.drawIconAltitudeLabel(context, alertLevel);
    }

    this.drawMotionVector(context, projection);

    this.drawIconBackground(context, projection, alertLevel);
    this.drawIconArrow(context, projection, alertLevel);

    context.resetTransform();
  }

  /**
   * Draws the icon's background.
   * @param context The canvas rendering context to which to draw the icon.
   * @param projection The map projection.
   * @param alertLevel The alert level assigned to this view's intruder.
   */
  private drawIconBackground(context: CanvasRenderingContext2D, projection: MapProjection, alertLevel: TCASAlertLevel): void {
    if (alertLevel === TCASAlertLevel.None || alertLevel === TCASAlertLevel.ProximityAdvisory) {
      return;
    }

    context.strokeStyle = '#1a1d21';
    context.fillStyle = alertLevel === TCASAlertLevel.ResolutionAdvisory ? MapTrafficIntruderView.RA_COLOR : MapTrafficIntruderView.TA_COLOR;

    context.beginPath();
    context.arc(0, 0, 0.45 * this.iconSize, 0, 2 * Math.PI);
    context.fill();
    context.stroke();

    if (this._isOffScale) {
      const projectedAngle = Vec2Math.theta(Vec2Math.sub(this.projectedPos, projection.getTargetProjected(), MapTrafficIntruderView.vec2Cache[0]));

      context.beginPath();
      context.arc(0, 0, 0.45 * this.iconSize, projectedAngle - Math.PI / 2, projectedAngle + Math.PI / 2);

      context.fillStyle = 'black';
      context.fill();
    }
  }

  /**
   * Draws the icon's directional arrow.
   * @param context The canvas rendering context to which to draw the icon.
   * @param projection The map projection.
   * @param alertLevel The alert level assigned to this view's intruder.
   */
  private drawIconArrow(context: CanvasRenderingContext2D, projection: MapProjection, alertLevel: TCASAlertLevel): void {
    context.save();
    context.rotate(this.intruder.groundTrack * Avionics.Utils.DEG2RAD + projection.getRotation());
    this.drawIconArrowBackground(context, alertLevel);
    this.drawIconArrowOutline(context, alertLevel);
    context.restore();
  }

  /**
   * Draws the icon's directional arrow background.
   * @param context The canvas rendering context to which to draw the icon.
   * @param alertLevel The alert level assigned to this view's intruder.
   */
  private drawIconArrowBackground(context: CanvasRenderingContext2D, alertLevel: TCASAlertLevel): void {
    switch (alertLevel) {
      case TCASAlertLevel.None:
      case TCASAlertLevel.ProximityAdvisory:
        context.fillStyle = 'black';
        break;
      case TCASAlertLevel.TrafficAdvisory:
        context.fillStyle = MapTrafficIntruderView.TA_COLOR;
        break;
      case TCASAlertLevel.ResolutionAdvisory:
        context.fillStyle = MapTrafficIntruderView.RA_COLOR;
        break;
    }

    context.beginPath();
    context.moveTo(0, -0.3 * this.iconSize * 1.4);
    context.lineTo(0.212 * this.iconSize * 1.4, 0.212 * this.iconSize * 1.4);
    context.lineTo(0, 0.1 * this.iconSize * 1.4);
    context.lineTo(-0.212 * this.iconSize * 1.4, 0.212 * this.iconSize * 1.4);
    context.closePath();

    context.fill();
  }

  /**
   * Draws the icon's directional arrow outline.
   * @param context The canvas rendering context to which to draw the icon.
   * @param alertLevel The alert level assigned to this view's intruder.
   */
  private drawIconArrowOutline(context: CanvasRenderingContext2D, alertLevel: TCASAlertLevel): void {
    context.lineWidth = Math.max(1, this.iconSize * 0.05);

    switch (alertLevel) {
      case TCASAlertLevel.None:
        context.strokeStyle = 'white';
        context.fillStyle = 'black';
        break;
      case TCASAlertLevel.ProximityAdvisory:
        context.strokeStyle = 'transparent';
        context.fillStyle = 'white';
        break;
      case TCASAlertLevel.TrafficAdvisory:
        context.strokeStyle = 'black';
        context.fillStyle = MapTrafficIntruderView.TA_COLOR;
        break;
      case TCASAlertLevel.ResolutionAdvisory:
        context.strokeStyle = 'black';
        context.fillStyle = MapTrafficIntruderView.RA_COLOR;
        break;
    }

    context.beginPath();
    context.moveTo(0, -0.3 * this.iconSize);
    context.lineTo(0.212 * this.iconSize, 0.212 * this.iconSize);
    context.lineTo(0, 0.1 * this.iconSize);
    context.lineTo(-0.212 * this.iconSize, 0.212 * this.iconSize);
    context.closePath();

    context.fill();
    context.stroke();
  }

  /**
   * Draws the icon's vertical speed indicator arrow.
   * @param context The canvas rendering context to which to draw the icon.
   * @param alertLevel The alert level assigned to this view's intruder.
   */
  private drawIconVSArrow(context: CanvasRenderingContext2D, alertLevel: TCASAlertLevel): void {
    const showArrow = MapTrafficIntruderView.VERTICAL_SPEED_THRESHOLD.compare(Math.abs(this.intruder.velocityVec[2]), UnitType.MPS) <= 0;

    if (!showArrow) {
      return;
    }

    const vsSign = Math.sign(this.intruder.velocityVec[2]);

    context.beginPath();
    context.moveTo(0.67 * this.iconSize, -0.16 * this.iconSize * vsSign);
    context.lineTo(0.67 * this.iconSize, 0.16 * this.iconSize * vsSign);
    context.moveTo(0.55 * this.iconSize, -0.04 * this.iconSize * vsSign);
    context.lineTo(0.67 * this.iconSize, -0.18 * this.iconSize * vsSign);
    context.lineTo(0.79 * this.iconSize, -0.04 * this.iconSize * vsSign);

    context.lineWidth = Math.max(1, this.iconSize * 0.125);
    context.strokeStyle = 'black';
    context.stroke();

    context.lineWidth = Math.max(1, this.iconSize * 0.075);
    switch (alertLevel) {
      case TCASAlertLevel.None:
      case TCASAlertLevel.ProximityAdvisory:
        context.strokeStyle = 'white';
        break;
      case TCASAlertLevel.TrafficAdvisory:
        context.strokeStyle = MapTrafficIntruderView.TA_COLOR;
        break;
      case TCASAlertLevel.ResolutionAdvisory:
        context.strokeStyle = MapTrafficIntruderView.RA_COLOR;
        break;
    }
    context.stroke();
  }

  /**
   * Draws the icon's altitude label.
   * @param context The canvas rendering context to which to draw the icon.
   * @param alertLevel The alert level assigned to this view's intruder.
   */
  private drawIconAltitudeLabel(context: CanvasRenderingContext2D, alertLevel: TCASAlertLevel): void {
    const isRelative = this.trafficModule.isAltitudeRelative.get();
    const isAltitudeAbove = this.intruder.relativePositionVec[2] >= 0;
    const altitudeFeet = this.trafficModule.isAltitudeRelative.get()
      ? UnitType.METER.convertTo(this.intruder.relativePositionVec[2], UnitType.FOOT)
      : this.intruder.altitude.asUnit(UnitType.FOOT);

    const altitudeRounded = Math.round(altitudeFeet / 100);
    const altitudeAbs = Math.abs(altitudeRounded);
    const prefix = altitudeRounded < 0 ? '−'
      : isRelative ? '+' : '';

    const altitudeText = `${prefix}${altitudeAbs}`;

    const textWidth = context.measureText(altitudeText).width;
    const textHeight = this.fontSize;

    // draw background

    context.fillStyle = 'black';
    if (isAltitudeAbove) {
      context.fillRect(-textWidth / 2 - 2, -0.5 * this.iconSize - textHeight - 2, textWidth + 4, textHeight + 2);
    } else {
      context.fillRect(-textWidth / 2 - 2, 0.5 * this.iconSize, textWidth + 4, textHeight + 2);
    }

    // draw text

    switch (alertLevel) {
      case TCASAlertLevel.None:
      case TCASAlertLevel.ProximityAdvisory:
        context.fillStyle = 'white';
        break;
      case TCASAlertLevel.TrafficAdvisory:
        context.fillStyle = MapTrafficIntruderView.TA_COLOR;
        break;
      case TCASAlertLevel.ResolutionAdvisory:
        context.fillStyle = MapTrafficIntruderView.RA_COLOR;
        break;
    }

    if (isAltitudeAbove) {
      context.textBaseline = 'bottom';
      context.fillText(altitudeText, 0, -0.5 * this.iconSize);
    } else {
      context.textBaseline = 'top';
      context.fillText(altitudeText, 0, 0.5 * this.iconSize);
    }
  }

  /**
   * Draws this view's motion vector.
   * @param context The canvas rendering context to which to draw the vector.
   * @param projection The map projection.
   */
  private drawMotionVector(context: CanvasRenderingContext2D, projection: MapProjection): void {
    const vectorMode = this.trafficModule.motionVectorMode.get();
    if (vectorMode === MapTrafficMotionVectorMode.Off) {
      return;
    }

    const vector = vectorMode === MapTrafficMotionVectorMode.Absolute
      ? this.intruder.velocityVec
      : this.intruder.relativeVelocityVec;

    const alertLevel = this.intruder.alertLevel.get();
    if (alertLevel === TCASAlertLevel.None || alertLevel === TCASAlertLevel.ProximityAdvisory) {
      const color = vectorMode === MapTrafficMotionVectorMode.Absolute
        ? MapTrafficIntruderView.VECTOR_ABS_COLOR
        : MapTrafficIntruderView.VECTOR_REL_COLOR;
      this.drawNormalVector(projection, context, color, vector);
    } else {
      const color = alertLevel === TCASAlertLevel.ResolutionAdvisory ? MapTrafficIntruderView.RA_COLOR : MapTrafficIntruderView.TA_COLOR;
      this.drawTCAVector(projection, context, color, vector);
    }
  }

  /**
   * Draws a normal motion vector.
   * @param projection The map projection.
   * @param context The canvas rendering context to which to draw the vector.
   * @param color The color of the vector.
   * @param vector The vector to draw.
   */
  private drawNormalVector(projection: MapProjection, context: CanvasRenderingContext2D, color: string, vector: Float64Array): void {
    context.lineWidth = MapTrafficIntruderView.VECTOR_STROKE_WIDTH;
    context.strokeStyle = color;
    context.setLineDash(MapTrafficIntruderView.VECTOR_EMPTY_LINE_DASH);
    context.beginPath();

    const distance = Vec2Math.abs(vector) * this.trafficModule.motionVectorLookahead.get().asUnit(UnitType.SECOND);
    const distanceView = distance / UnitType.GA_RADIAN.convertTo(projection.getProjectedResolution(), UnitType.METER);
    const track = -Vec2Math.theta(vector);
    const angle = track + projection.getRotation();
    const end = Vec2Math.setFromPolar(distanceView, angle, MapTrafficIntruderView.vec2Cache[0]);
    context.moveTo(0, 0);
    context.lineTo(end[0], end[1]);

    context.stroke();
  }

  /**
   * Draws a motion vector projected to TCA.
   * @param projection The map projection.
   * @param context The canvas rendering context to which to draw the vector.
   * @param color The color of the vector.
   * @param vector The vector to draw.
   */
  private drawTCAVector(projection: MapProjection, context: CanvasRenderingContext2D, color: string, vector: Float64Array): void {
    const distanceToEnd = Vec2Math.abs(projection.getProjectedSize());
    if (distanceToEnd > 0) {
      context.lineWidth = MapTrafficIntruderView.VECTOR_STROKE_WIDTH;
      context.strokeStyle = color;

      context.setLineDash(MapTrafficIntruderView.VECTOR_LINE_DASH);
      context.beginPath();

      const track = -Vec2Math.theta(vector);
      const angle = track + projection.getRotation();
      const end = Vec2Math.setFromPolar(distanceToEnd, angle, MapTrafficIntruderView.vec2Cache[0]);
      context.moveTo(0, 0);
      context.lineTo(end[0], end[1]);

      context.stroke();

      context.setLineDash(MapTrafficIntruderView.VECTOR_EMPTY_LINE_DASH);

      const distanceToTCA = Vec2Math.abs(vector) * this.intruder.tca.asUnit(UnitType.SECOND);
      const distanceToTCAProjected = distanceToTCA / UnitType.GA_RADIAN.convertTo(projection.getProjectedResolution(), UnitType.METER);
      if (distanceToTCAProjected > 0) {
        context.beginPath();

        const tca = Vec2Math.setFromPolar(distanceToTCAProjected, angle, MapTrafficIntruderView.vec2Cache[0]);
        context.moveTo(0, 0);
        context.lineTo(tca[0], tca[1]);

        context.stroke();
      }
    }
  }
}