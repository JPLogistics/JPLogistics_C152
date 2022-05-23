import { FSComponent, GeoCircleResampler, Subscribable, VecNSubject, VNode } from 'msfssdk';
import { GeoProjectionPathStreamStack, MapCachedCanvasLayer, MapLayer, MapLayerProps, MapProjection, MapSyncedCanvasLayer } from 'msfssdk/components/map';
import { EventBus } from 'msfssdk/data';
import { FlightPlan } from 'msfssdk/flightplan';
import { FacilityLoader, FacilityRepository, FacilityWaypointCache } from 'msfssdk/navigation';
import { ClippedPathStream, NullPathStream } from 'msfssdk/graphics/path';

import { ProcedureType } from 'garminsdk/flightplan';

import { MapFlightPlanWaypointIconFactory } from '../../../../Shared/Map/MapFlightPlanWaypointIconFactory';
import { MapFlightPlanWaypointLabelFactory } from '../../../../Shared/Map/MapFlightPlanWaypointLabelFactory';
import { MapFlightPlanWaypointRecordManager } from '../../../../Shared/Map/MapFlightPlanWaypointRecordManager';
import { MapWaypointRenderer, MapWaypointRenderRole } from '../../../../Shared/Map/MapWaypointRenderer';
import { MapWaypointFlightPlanStyles } from '../../../../Shared/Map/MapWaypointStyles';
import { MFDProcMapFlightPathPlanRenderer } from './MFDProcMapFlightPathPlanRenderer';
import { MFDProcMapTransitionWaypointRecordManager } from './MFDProcMapTransitionWaypointRecordManager';

/**
 * Component props for MFDProcMapPreviewLayer.
 */
export interface MFDProcMapPreviewLayerProps extends MapLayerProps<any> {
  /** The event bus. */
  bus: EventBus;

  /** A subscribable which provides the procedure type previewed by the layer. */
  procedureType: Subscribable<ProcedureType>;

  /** A subscribable which provides the flight plan containing the procedure to be previewed. */
  procedurePlan: Subscribable<FlightPlan | null>;

  /** A subscribable which provides the flight plan containing the transitions to be previewed. */
  transitionPlan: Subscribable<FlightPlan | null>;

  /** The waypoint renderer to use. */
  waypointRenderer: MapWaypointRenderer;

  /** Styling options for procedure preview waypoints. */
  procedureWaypointStyles: MapWaypointFlightPlanStyles;

  /** Styling options for transition preview waypoints. */
  transitionWaypointStyles: MapWaypointFlightPlanStyles;
}

/**
 * A map layer which displays a procedure preview.
 */
export class MFDProcMapPreviewLayer extends MapLayer<MFDProcMapPreviewLayerProps> {
  private static readonly CLIP_BOUNDS_BUFFER = 10; // number of pixels from edge of canvas to extend the clipping bounds, in pixels

  private readonly flightPathLayerRef = FSComponent.createRef<MapCachedCanvasLayer>();
  private readonly waypointLayerRef = FSComponent.createRef<MapSyncedCanvasLayer>();

  private readonly resampler = new GeoCircleResampler(Math.PI / 12, 0.25, 8);
  private readonly facLoader = new FacilityLoader(FacilityRepository.getRepository(this.props.bus));
  private readonly facWaypointCache = FacilityWaypointCache.getCache();

  private readonly procedureIconFactory: MapFlightPlanWaypointIconFactory = new MapFlightPlanWaypointIconFactory(this.props.procedureWaypointStyles);
  private readonly procedureLabelFactory: MapFlightPlanWaypointLabelFactory = new MapFlightPlanWaypointLabelFactory(this.props.procedureWaypointStyles);
  private readonly transitionIconFactory: MapFlightPlanWaypointIconFactory = new MapFlightPlanWaypointIconFactory(this.props.transitionWaypointStyles);
  private readonly transitionLabelFactory: MapFlightPlanWaypointLabelFactory = new MapFlightPlanWaypointLabelFactory(this.props.transitionWaypointStyles);

  private readonly clipBoundsSub = VecNSubject.createFromVector(new Float64Array(4));
  private readonly clippedPathStream = new ClippedPathStream(NullPathStream.INSTANCE, this.clipBoundsSub);

  private readonly pathStreamStack = new GeoProjectionPathStreamStack(NullPathStream.INSTANCE, this.props.mapProjection.getGeoProjection(), this.resampler);
  private readonly pathRenderer = new MFDProcMapFlightPathPlanRenderer();

  private readonly procedureWaypointRecordManager = new MapFlightPlanWaypointRecordManager(
    this.facLoader, this.facWaypointCache, this.props.waypointRenderer,
    MapWaypointRenderRole.FlightPlanInactive, MapWaypointRenderRole.FlightPlanInactive
  );
  private readonly transitionWaypointRecordManager = new MFDProcMapTransitionWaypointRecordManager(
    this.facLoader, this.facWaypointCache, this.props.waypointRenderer,
    MapWaypointRenderRole.Normal
  );

  private needDrawRoute = false;
  private needRefreshProcedureWaypoints = false;
  private needRepickProcedureWaypoints = false;
  private needRefreshTransitionWaypoints = false;
  private needRepickTransitionWaypoints = false;

  /** @inheritdoc */
  public onAttached(): void {
    super.onAttached();

    this.flightPathLayerRef.instance.onAttached();
    this.waypointLayerRef.instance.onAttached();

    this.pathStreamStack.pushPostProjected(this.clippedPathStream);
    this.pathStreamStack.setConsumer(this.flightPathLayerRef.instance.display.context);

    this.initWaypointRenderer();
    this.initFlightPlanHandlers();
  }

  /**
   * Initializes the waypoint renderer.
   */
  private initWaypointRenderer(): void {
    this.props.waypointRenderer.setCanvasContext(MapWaypointRenderRole.Normal, this.waypointLayerRef.instance.display.context);
    this.props.waypointRenderer.setIconFactory(MapWaypointRenderRole.Normal, this.transitionIconFactory);
    this.props.waypointRenderer.setLabelFactory(MapWaypointRenderRole.Normal, this.transitionLabelFactory);

    this.props.waypointRenderer.setCanvasContext(MapWaypointRenderRole.FlightPlanInactive, this.waypointLayerRef.instance.display.context);
    this.props.waypointRenderer.setIconFactory(MapWaypointRenderRole.FlightPlanInactive, this.procedureIconFactory);
    this.props.waypointRenderer.setLabelFactory(MapWaypointRenderRole.FlightPlanInactive, this.procedureLabelFactory);
  }

  /**
   * Initializes handlers to respond to flight plan events.
   */
  private initFlightPlanHandlers(): void {
    this.props.procedurePlan.sub(() => { this.scheduleUpdates(true, true, true, false, false); }, true);
    this.props.transitionPlan.sub(() => { this.scheduleUpdates(true, false, false, true, true); }, true);
  }

  /** @inheritdoc */
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    this.flightPathLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);
    this.waypointLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);

    this.updateClipBounds();
  }

  /**
   * Updates this layer's canvas clipping bounds.
   */
  private updateClipBounds(): void {
    const size = this.flightPathLayerRef.instance.getSize();
    this.clipBoundsSub.set(
      -MFDProcMapPreviewLayer.CLIP_BOUNDS_BUFFER,
      -MFDProcMapPreviewLayer.CLIP_BOUNDS_BUFFER,
      size + MFDProcMapPreviewLayer.CLIP_BOUNDS_BUFFER,
      size + MFDProcMapPreviewLayer.CLIP_BOUNDS_BUFFER
    );
  }

  /** @inheritdoc */
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

    const procedurePlan = this.props.procedurePlan.get();
    const transitionPlan = this.props.transitionPlan.get();

    this.pathStreamStack.setProjection(display.geoProjection);
    if (transitionPlan) {
      this.pathRenderer.render(transitionPlan, context, this.pathStreamStack, false);
    }
    if (procedurePlan) {
      this.pathRenderer.render(procedurePlan, context, this.pathStreamStack, true);
    }
  }

  /**
   * Refreshes this layer's flight plan leg waypoint records if a refresh is scheduled.
   */
  private updateRefreshWaypoints(): void {
    if (this.needRefreshProcedureWaypoints && !this.procedureWaypointRecordManager.isBusy()) {
      const plan = this.props.procedurePlan.get();
      this.procedureWaypointRecordManager.refreshWaypoints(plan, -1, this.needRepickProcedureWaypoints);
      this.needRefreshProcedureWaypoints = false;
      this.needRepickProcedureWaypoints = false;
    }

    if (this.needRefreshTransitionWaypoints && !this.transitionWaypointRecordManager.isBusy()) {
      const plan = this.props.transitionPlan.get();
      const pickPosition = this.props.procedureType.get() === ProcedureType.DEPARTURE ? 'last' : 'first';
      this.transitionWaypointRecordManager.refreshWaypoints(plan, this.needRepickTransitionWaypoints, pickPosition);
      this.needRefreshTransitionWaypoints = false;
      this.needRepickTransitionWaypoints = false;
    }
  }

  /**
   * Schedules flight plan drawing updates.
   * @param scheduleRedrawRoute Whether to schedule a redraw of the flight path.
   * @param scheduleRefreshProcedureWaypoints Whether to schedule a refresh of procedure waypoint records.
   * @param scheduleRepickProcedureWaypoints Whether to schedule a repick of procedure waypoint records.
   * @param scheduleRefreshTransitionWaypoints Whether to schedule a refresh of transition waypoint records.
   * @param scheduleRepickTransitionWaypoints Whether to schedule a repick of transition waypoint records.
   */
  private scheduleUpdates(
    scheduleRedrawRoute: boolean,
    scheduleRefreshProcedureWaypoints: boolean,
    scheduleRepickProcedureWaypoints: boolean,
    scheduleRefreshTransitionWaypoints: boolean,
    scheduleRepickTransitionWaypoints: boolean
  ): void {
    this.needDrawRoute ||= scheduleRedrawRoute;
    this.needRefreshProcedureWaypoints ||= scheduleRefreshProcedureWaypoints;
    this.needRepickProcedureWaypoints ||= scheduleRepickProcedureWaypoints;
    this.needRefreshTransitionWaypoints ||= scheduleRefreshTransitionWaypoints;
    this.needRepickTransitionWaypoints ||= scheduleRepickTransitionWaypoints;
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <>
        <MapCachedCanvasLayer
          ref={this.flightPathLayerRef}
          model={this.props.model}
          mapProjection={this.props.mapProjection}
          useBuffer={true}
          overdrawFactor={Math.SQRT2}
        />
        <MapSyncedCanvasLayer ref={this.waypointLayerRef} model={this.props.model} mapProjection={this.props.mapProjection} />
      </>
    );
  }
}