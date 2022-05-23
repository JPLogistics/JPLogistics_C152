import {
  FSComponent, GeodesicResampler, NumberUnitInterface, SubEvent, Subscribable, UnitFamily, UnitType, VNode
} from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { FacilityLoader, FacilityRepository, FacilityWaypointCache, VNavWaypoint, Waypoint } from 'msfssdk/navigation';
import { FlightPlan, FlightPlanSegmentType } from 'msfssdk/flightplan';
import { VNavPathMode, VNavState } from 'msfssdk/autopilot';
import {
  MapLayerProps, MapSyncedCanvasLayer, MapProjection, MapLayer, MapCullableTextLabelManager, MapCullableTextLabel,
  MapCullableLocationTextLabel, MapCachedCanvasLayer, MapWaypointRendererIconFactory, MapWaypointRendererLabelFactory, MapWaypointIcon
} from 'msfssdk/components/map';

import { MapWaypointRenderer, MapWaypointRenderRole } from '../MapWaypointRenderer';
import { MapVNavWaypointIcon } from '../MapWaypointIcon';
import { MapWaypointFlightPlanStyles } from '../MapWaypointStyles';
import { FmsUtils } from '../../FlightPlan/FmsUtils';
import { MapDefaultFlightPlanPathRenderer, MapDefaultFlightPlanPathRendererLNavData } from '../MapDefaultFlightPlanPathRenderer';
import { MapFlightPlanWaypointRecordManager } from '../MapFlightPlanWaypointRecordManager';
import { MapFlightPlanWaypointIconFactory } from '../MapFlightPlanWaypointIconFactory';
import { MapFlightPlanWaypointLabelFactory } from '../MapFlightPlanWaypointLabelFactory';

/**
 * LNav data used by MapFlightPlanLayer.
 */
export type MapFlightPlanLayerLNavData = MapDefaultFlightPlanPathRendererLNavData;

/**
 * A provider of flight plan data for MapFlightPlanLayer.
 */
export interface MapFlightPlanLayerDataProvider {
  /** A subscribable which provides the flight plan to be displayed. */
  readonly plan: Subscribable<FlightPlan | null>;

  /** An event which notifies when the displayed plan has been modified. */
  readonly planModified: SubEvent<void>;

  /** An event which notifies when the displayed plan has been calculated.  */
  readonly planCalculated: SubEvent<void>;

  /**
   * A subscribable which provides the index of the active lateral leg of the displayed flight plan, or -1 if no such
   * leg exists.
   */
  readonly activeLateralLegIndex: Subscribable<number>;

  /**
   * A subscribable which provides the index of the flight path vector in the active lateral leg currently being
   * tracked by LNAV.
   */
  readonly lnavData: Subscribable<MapFlightPlanLayerLNavData | undefined>;

  /** A subscribable which provides the current VNAV mode. */
  readonly vnavState: Subscribable<VNavState>;

  /** A subscribable which provides the currently active VNAV path mode. */
  readonly vnavPathMode: Subscribable<VNavPathMode>;

  /**
   * A subscribable which provides the index of the leg within which the VNAV top-of-descent point lies, or -1 if no
   * such leg exists.
   */
  readonly vnavTodLegIndex: Subscribable<number>;

  /**
   * A subscribable which provides the index of the leg within which the VNAV bottom-of-descent point lies, or -1 if
   * no such leg exists.
   */
  readonly vnavBodLegIndex: Subscribable<number>;

  /**
   * A subscribable which provides the distance along the flight path from the VNAV top-of-descent point to the end
   * of the TOD leg.
   */
  readonly vnavTodLegDistance: Subscribable<NumberUnitInterface<UnitFamily.Distance>>;

  /**
   * A subscribable which provides the distance along the flight path from the plane's current position to the next
   * top-of-descent.
   */
  readonly vnavDistanceToTod: Subscribable<NumberUnitInterface<UnitFamily.Distance>>;

  /** A subscribable which provides the current OBS course, or undefined if OBS is not active. */
  readonly obsCourse: Subscribable<number | undefined>;
}

/**
 * Properties on the MapFlightPlanLayer component.
 */
export interface MapFlightPlanLayerProps extends MapLayerProps<any> {
  /** The event bus. */
  bus: EventBus;

  /** A flight plan data provider. */
  dataProvider: MapFlightPlanLayerDataProvider;

  /**
   * A subscribable which provides whether the layer should draw the entire plan instead of only from the active
   * lateral leg.
   */
  drawEntirePlan: Subscribable<boolean>;

  /** The waypoint renderer to use. */
  waypointRenderer: MapWaypointRenderer;

  /** The text manager to use to manage the waypoint labels. */
  textManager: MapCullableTextLabelManager;

  /** Styling options for active waypoints. */
  activeWaypointStyles: MapWaypointFlightPlanStyles;

  /** Styling options for inactive waypoints. */
  inactiveWaypointStyles: MapWaypointFlightPlanStyles;
}

/**
 * A map layer which displays a flight plan.
 */
export class MapFlightPlanLayer extends MapLayer<MapFlightPlanLayerProps> {
  private static readonly TOD_DISTANCE_THRESHOLD = UnitType.METER.createNumber(100); // minimum distance from TOD for which to display TOD waypoint

  private readonly flightPathLayerRef = FSComponent.createRef<MapCachedCanvasLayer<any>>();
  private readonly waypointLayerRef = FSComponent.createRef<MapSyncedCanvasLayer<any>>();

  private readonly resampler = new GeodesicResampler(Math.PI / 12, 0.25, 8);
  private readonly facLoader = new FacilityLoader(FacilityRepository.getRepository(this.props.bus));
  private readonly facWaypointCache = FacilityWaypointCache.getCache();

  private readonly iconFactoryInactive: MapFlightPlanWaypointIconFactory;
  private readonly labelFactoryInactive: MapFlightPlanWaypointLabelFactory;
  private readonly iconFactoryActive: MapFlightPlanWaypointIconFactory;
  private readonly labelFactoryActive: MapFlightPlanWaypointLabelFactory;

  private readonly vnavIconFactory: VNavWaypointIconFactory;
  private readonly vnavLabelFactory: VNavWaypointLabelFactory;

  private readonly waypointRecordManager = new MapFlightPlanWaypointRecordManager(
    this.facLoader, this.facWaypointCache, this.props.waypointRenderer,
    MapWaypointRenderRole.FlightPlanInactive, MapWaypointRenderRole.FlightPlanActive
  );

  private readonly pathRenderer = new MapDefaultFlightPlanPathRenderer(this.resampler);

  private todWaypoint?: VNavWaypoint;
  private bodWaypoint?: VNavWaypoint;

  private isObsActive = false;
  private obsCourse = 0;

  private needDrawRoute = false;
  private needRefreshWaypoints = false;
  private needRepickWaypoints = false;

  /** @inheritdoc */
  constructor(props: MapFlightPlanLayerProps) {
    super(props);

    this.iconFactoryInactive = new MapFlightPlanWaypointIconFactory(this.props.inactiveWaypointStyles);
    this.labelFactoryInactive = new MapFlightPlanWaypointLabelFactory(this.props.inactiveWaypointStyles);

    this.iconFactoryActive = new MapFlightPlanWaypointIconFactory(this.props.activeWaypointStyles);
    this.labelFactoryActive = new MapFlightPlanWaypointLabelFactory(this.props.activeWaypointStyles);

    this.vnavIconFactory = new VNavWaypointIconFactory(this.props.activeWaypointStyles);
    this.vnavLabelFactory = new VNavWaypointLabelFactory(this.props.activeWaypointStyles);
  }

  /** @inheritdoc */
  public onAttached(): void {
    super.onAttached();

    this.flightPathLayerRef.instance.onAttached();
    this.waypointLayerRef.instance.onAttached();
    this.initWaypointRenderer();
    this.initFlightPlanHandlers();
    this.onTodBodChanged();
  }

  /**
   * Initializes the waypoint renderer.
   */
  private initWaypointRenderer(): void {
    this.props.waypointRenderer.setCanvasContext(MapWaypointRenderRole.FlightPlanInactive, this.waypointLayerRef.instance.display.context);
    this.props.waypointRenderer.setIconFactory(MapWaypointRenderRole.FlightPlanInactive, this.iconFactoryInactive);
    this.props.waypointRenderer.setLabelFactory(MapWaypointRenderRole.FlightPlanInactive, this.labelFactoryInactive);

    this.props.waypointRenderer.setCanvasContext(MapWaypointRenderRole.FlightPlanActive, this.waypointLayerRef.instance.display.context);
    this.props.waypointRenderer.setIconFactory(MapWaypointRenderRole.FlightPlanActive, this.iconFactoryActive);
    this.props.waypointRenderer.setLabelFactory(MapWaypointRenderRole.FlightPlanActive, this.labelFactoryActive);

    this.props.waypointRenderer.setCanvasContext(MapWaypointRenderRole.VNav, this.waypointLayerRef.instance.display.context);
    this.props.waypointRenderer.setIconFactory(MapWaypointRenderRole.VNav, this.vnavIconFactory);
    this.props.waypointRenderer.setLabelFactory(MapWaypointRenderRole.VNav, this.vnavLabelFactory);
  }

  /**
   * Initializes handlers to respond to flight plan events.
   */
  private initFlightPlanHandlers(): void {
    this.props.drawEntirePlan.sub(() => { this.scheduleUpdates(true, true, true); });

    this.props.dataProvider.plan.sub(() => { this.scheduleUpdates(true, true, true); }, true);
    this.props.dataProvider.planModified.on(() => { this.scheduleUpdates(false, true, true); });
    this.props.dataProvider.planCalculated.on(() => {
      this.scheduleUpdates(true, true, false);
      this.onTodBodChanged();
    });
    this.props.dataProvider.activeLateralLegIndex.sub(() => { this.scheduleUpdates(true, true, true); });

    this.props.dataProvider.lnavData.sub(() => { this.scheduleUpdates(true, false, false); });

    this.props.dataProvider.vnavState.sub(() => { this.onTodBodChanged(); });
    this.props.dataProvider.vnavPathMode.sub(() => { this.onTodBodChanged(); });
    this.props.dataProvider.vnavTodLegIndex.sub(() => { this.onTodBodChanged(); });
    this.props.dataProvider.vnavBodLegIndex.sub(() => { this.onTodBodChanged(); });
    this.props.dataProvider.vnavTodLegDistance.sub(() => { this.todWaypoint && this.onTodBodChanged(); });
    this.props.dataProvider.vnavDistanceToTod.sub(distance => {
      const comparison = distance.compare(MapFlightPlanLayer.TOD_DISTANCE_THRESHOLD);
      if ((comparison < 0 && this.todWaypoint) || (comparison >= 0 && !this.todWaypoint)) {
        this.onTodBodChanged();
      }
    });

    this.props.dataProvider.obsCourse.sub((course: number | undefined) => {
      const isActive = course !== undefined;
      const needFullUpdate = isActive !== this.isObsActive;
      this.isObsActive = isActive;
      this.obsCourse = course ?? this.obsCourse;

      this.scheduleUpdates(this.isObsActive, needFullUpdate, needFullUpdate);
    });
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    this.flightPathLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);
    this.waypointLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onUpdated(time: number, elapsed: number): void {
    this.flightPathLayerRef.instance.onUpdated(time, elapsed);

    this.updateFromFlightPathLayerInvalidation();
    this.updateRedrawRoute();
    this.updateRefreshWaypoints();
  }

  /**
   * Checks if the flight path layer's display canvas has been invalidated, and if so, clears it and schedules a redraw.
   */
  private updateFromFlightPathLayerInvalidation(): void {
    const display = this.flightPathLayerRef.instance.display;

    this.needDrawRoute ||= display.isInvalid;

    if (display.isInvalid) {
      display.clear();
      display.syncWithMapProjection(this.props.mapProjection);
    }
  }

  /**
   * Redraws the flight path if a redraw is scheduled.
   */
  private updateRedrawRoute(): void {
    if (this.needDrawRoute) {
      this.drawRoute();
      this.needDrawRoute = false;
    }
  }

  /**
   * Draws the flight path route.
   */
  private drawRoute(): void {
    const display = this.flightPathLayerRef.instance.display;
    const context = display.context;
    display.clear();

    const plan = this.props.dataProvider.plan.get();
    if (plan) {
      this.pathRenderer.render(
        plan,
        display.geoProjection,
        context, context,
        this.props.drawEntirePlan.get(),
        this.props.dataProvider.activeLateralLegIndex.get(),
        this.props.dataProvider.lnavData.get(),
        this.isObsActive ? this.obsCourse : undefined
      );
    }
  }

  /**
   * Refreshes this layer's flight plan leg waypoint records if a refresh is scheduled.
   */
  private updateRefreshWaypoints(): void {
    if (this.needRefreshWaypoints && !this.waypointRecordManager.isBusy()) {
      const plan = this.props.dataProvider.plan.get();
      const activeLegIndex = this.props.dataProvider.activeLateralLegIndex.get();
      const startIndex = plan ? this.getPickWaypointsStartIndex(plan, activeLegIndex, this.props.drawEntirePlan.get(), this.isObsActive) : undefined;

      this.waypointRecordManager.refreshWaypoints(plan, activeLegIndex, this.needRepickWaypoints, startIndex);
      this.needRefreshWaypoints = false;
      this.needRepickWaypoints = false;
    }
  }

  /**
   * Gets the global index of the first leg in a flight plan for which to display waypoints.
   * @param plan A flight plan.
   * @param activeLegIndex The global index of the active flight plan leg, or -1 if there is no active leg.
   * @param drawEntirePlan Whether to display the entire flight plan.
   * @param isObsActive Whether OBS is active.
   * @returns The global index of the first leg in a flight plan for which to display waypoints.
   */
  private getPickWaypointsStartIndex(plan: FlightPlan, activeLegIndex: number, drawEntirePlan: boolean, isObsActive: boolean): number {
    if (drawEntirePlan) {
      return 0;
    }

    if (activeLegIndex < 0) {
      return plan.length;
    }

    if (isObsActive) {
      return activeLegIndex;
    }

    return Math.max(0, this.getActiveFromLegIndex(plan, activeLegIndex) - 1);
  }

  /**
   * Gets the global leg index of the leg from which the active leg of a flight plan originates.
   * @param plan A flight plan.
   * @param activeLegIndex The global leg index of the active leg.
   * @returns The global leg index of the leg from which the active leg originates, or -1 if one could not be found.
   */
  private getActiveFromLegIndex(plan: FlightPlan, activeLegIndex: number): number {
    const activeLeg = plan.tryGetLeg(activeLegIndex);

    if (!activeLeg) {
      return -1;
    }

    const segmentIndex = plan.getSegmentIndex(activeLegIndex);
    const segmentLegIndex = activeLegIndex - plan.getSegment(segmentIndex).offset;

    return FmsUtils.getNominalFromLegIndex(plan, segmentIndex, segmentLegIndex);
  }

  /**
   * Schedules flight plan drawing updates.
   * @param scheduleRedrawRoute Whether to schedule a redraw of the flight path.
   * @param scheduleRefreshWaypoints Whether to schedule a refresh of waypoints records.
   * @param scheduleRepickWaypoints Whether to schedule a repick of waypoints records.
   */
  private scheduleUpdates(
    scheduleRedrawRoute: boolean,
    scheduleRefreshWaypoints: boolean,
    scheduleRepickWaypoints: boolean
  ): void {
    this.needDrawRoute ||= scheduleRedrawRoute;
    this.needRefreshWaypoints ||= scheduleRefreshWaypoints;
    this.needRepickWaypoints ||= scheduleRepickWaypoints;
  }

  /**
   * Recreates the TOD and BOD leg indexes when any values change.
   */
  private onTodBodChanged(): void {
    this.todWaypoint && this.props.waypointRenderer.deregister(this.todWaypoint, MapWaypointRenderRole.VNav, 'flightplan-layer');
    this.bodWaypoint && this.props.waypointRenderer.deregister(this.bodWaypoint, MapWaypointRenderRole.VNav, 'flightplan-layer');
    this.todWaypoint = undefined;
    this.bodWaypoint = undefined;

    const plan = this.props.dataProvider.plan.get();
    if (!plan || plan.segmentCount < 1 || plan.getSegment(0).segmentType === FlightPlanSegmentType.RandomDirectTo) {
      return;
    }

    const vnavState = this.props.dataProvider.vnavState.get();

    if (vnavState === VNavState.Disabled) {
      return;
    }

    const vnavPathMode = this.props.dataProvider.vnavPathMode.get();
    const todLegIndex = this.props.dataProvider.vnavTodLegIndex.get();
    const bodLegIndex = this.props.dataProvider.vnavBodLegIndex.get();
    const todLegEndDistance = this.props.dataProvider.vnavTodLegDistance.get();
    const distanceToTod = this.props.dataProvider.vnavDistanceToTod.get();

    if (todLegIndex >= 0 && distanceToTod.compare(MapFlightPlanLayer.TOD_DISTANCE_THRESHOLD) >= 0 && vnavPathMode !== VNavPathMode.PathActive) {
      if (isFinite(todLegEndDistance.number) && plan.length > 0) {
        try {
          const leg = plan.getLeg(todLegIndex);
          this.todWaypoint = new VNavWaypoint(leg, todLegEndDistance.asUnit(UnitType.METER), 'tod');
          this.props.waypointRenderer.register(this.todWaypoint, MapWaypointRenderRole.VNav, 'flightplan-layer');
        } catch {
          console.warn(`Invalid tod leg at: ${todLegIndex}`);
        }
      } else if (!isFinite(todLegEndDistance.number)) {
        console.warn(`Invalid TOD leg end distance: ${todLegEndDistance}`);
      }
    } else if (bodLegIndex >= 0) {
      try {
        const leg = plan.getLeg(bodLegIndex);
        this.bodWaypoint = new VNavWaypoint(leg, 0, 'bod');
        this.props.waypointRenderer.register(this.bodWaypoint, MapWaypointRenderRole.VNav, 'flightplan-layer');
      } catch {
        console.warn(`Invalid bod leg at: ${bodLegIndex}`);
      }
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div style='position: absolute; left: 0; top: 0; width: 100%; height: 100%;'>
        <MapCachedCanvasLayer ref={this.flightPathLayerRef} model={this.props.model} mapProjection={this.props.mapProjection}
          useBuffer={true} overdrawFactor={Math.SQRT2} />
        <MapSyncedCanvasLayer ref={this.waypointLayerRef} model={this.props.model} mapProjection={this.props.mapProjection} />
      </div>
    );
  }
}

/**
 * A waypoint icon factory for VNAV waypoints.
 */
class VNavWaypointIconFactory implements MapWaypointRendererIconFactory<Waypoint> {
  /**
   * Constructor.
   * @param styles Styling options used by this factory.
   */
  constructor(private readonly styles: MapWaypointFlightPlanStyles) {
  }

  /** @inheritdoc */
  public getIcon<T extends Waypoint>(waypoint: T): MapWaypointIcon<T> {
    return new MapVNavWaypointIcon(waypoint as any, this.styles.vnavIconPriority, this.styles.vnavIconSize, this.styles.vnavIconSize) as unknown as MapWaypointIcon<T>;
  }
}

/**
 * A waypoint label factory for VNAV waypoints.
 */
class VNavWaypointLabelFactory implements MapWaypointRendererLabelFactory<Waypoint> {
  /**
   * Constructor.
   * @param styles Styling options used by this factory.
   */
  constructor(private readonly styles: MapWaypointFlightPlanStyles) {
  }

  /** @inheritdoc */
  public getLabel(waypoint: Waypoint): MapCullableTextLabel {
    return new MapCullableLocationTextLabel(waypoint.uid === 'vnav-tod' ? 'TOD' : 'BOD', this.styles.vnavLabelPriority, waypoint.location, true, this.styles.vnavLabelOptions);
  }
}