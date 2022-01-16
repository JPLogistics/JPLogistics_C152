import { FSComponent, Subject, VNode } from 'msfssdk';
import { LatLonDisplay } from 'msfssdk/components/common';
import { MapModel } from 'msfssdk/components/map';

import { GroupBox } from '../GroupBox';
import { FmsHEvent } from '../../../../Shared/UI/FmsHEvent';
import { WptInfo, WptInfoProps } from '../../../../Shared/UI/WptInfo/WptInfo';
import { WaypointMapComponent, WaypointMapRangeTargetRotationController } from '../../../../Shared/UI/WaypointMap/WaypointMapComponent';
import { WaypointMapModel, WaypointMapModelModules } from '../../../../Shared/UI/WaypointMap/WaypointMapModel';
import { MapPointerController } from '../../../../Shared/Map/Controllers/MapPointerController';
import { MapPointerInfoLayerSize } from '../../../../Shared/Map/Layers/MapPointerInfoLayer';

import './MFDWptInfo.css';

/**
 * The MFD waypoint info popout.
 */
export class MFDWptInfo extends WptInfo<WptInfoProps> {
  private static readonly MAP_UPDATE_FREQ = 30; // Hz
  private static readonly MAP_DATA_UPDATE_FREQ = 4; // Hz
  private static readonly POINTER_MOVE_INCREMENT = 2; // pixels

  private readonly mapRef = FSComponent.createRef<WaypointMapComponent>();

  private readonly mapModel = this.createMapModel();
  private readonly pointerModule = this.mapModel.getModule('pointer');

  private readonly mapRangeIndexSub = Subject.create(WaypointMapRangeTargetRotationController.DEFAULT_MAP_RANGE_INDEX);

  private mapPointerController?: MapPointerController;

  /**
   * Creates the model for this component's map.
   * @returns a map model.
   */
  private createMapModel(): MapModel<WaypointMapModelModules> {
    return WaypointMapModel.createModel(this.props.bus);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.mapPointerController = new MapPointerController(this.mapModel, this.mapRef.instance.mapProjection);
    this.mapRef.instance.sleep();
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.RANGE_DEC:
        this.changeMapRangeIndex(-1);
        return true;
      case FmsHEvent.RANGE_INC:
        this.changeMapRangeIndex(1);
        return true;
      case FmsHEvent.JOYSTICK_PUSH:
        this.mapPointerController?.togglePointerActive();
        return true;
    }

    return this.handleMapPointerMoveEvent(evt) || super.onInteractionEvent(evt);
  }

  /**
   * Changes the MFD map range index setting.
   * @param delta The change in index to apply.
   */
  private changeMapRangeIndex(delta: number): void {
    const currentIndex = this.mapRangeIndexSub.get();
    const newIndex = Utils.Clamp(currentIndex + delta, 0, WaypointMapRangeTargetRotationController.DEFAULT_MAP_RANGES.length - 1);

    if (currentIndex !== newIndex) {
      this.mapPointerController?.targetPointer();
      this.mapRangeIndexSub.set(newIndex);
    }
  }

  /**
   * Handles events that move the map pointer.
   * @param evt The event.
   * @returns Whether the event was handled.
   */
  private handleMapPointerMoveEvent(evt: FmsHEvent): boolean {
    if (!this.pointerModule.isActive.get()) {
      return false;
    }

    switch (evt) {
      case FmsHEvent.JOYSTICK_LEFT:
        this.mapPointerController?.movePointer(-MFDWptInfo.POINTER_MOVE_INCREMENT, 0);
        return true;
      case FmsHEvent.JOYSTICK_UP:
        this.mapPointerController?.movePointer(0, -MFDWptInfo.POINTER_MOVE_INCREMENT);
        return true;
      case FmsHEvent.JOYSTICK_RIGHT:
        this.mapPointerController?.movePointer(MFDWptInfo.POINTER_MOVE_INCREMENT, 0);
        return true;
      case FmsHEvent.JOYSTICK_DOWN:
        this.mapPointerController?.movePointer(0, MFDWptInfo.POINTER_MOVE_INCREMENT);
        return true;
    }

    return false;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onWptDupDialogClose(): void {
    this.close();
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onViewOpened(): void {
    super.onViewOpened();

    this.mapRef.instance.wake();
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onViewClosed(): void {
    super.onViewClosed();

    this.mapPointerController?.setPointerActive(false);
    this.mapRef.instance.sleep();
    this.mapRangeIndexSub.set(WaypointMapRangeTargetRotationController.DEFAULT_MAP_RANGE_INDEX);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public render(): VNode {
    return (
      <div class='popout-dialog mfd-wptinfo' ref={this.viewContainerRef}>
        <h1>{this.props.title}</h1>
        <GroupBox title="Ident, Facility, City">
          {this.renderWaypointInput()}
        </GroupBox>
        <GroupBox title="Map" class='mfd-wptinfo-map-box'>
          <WaypointMapComponent
            ref={this.mapRef} model={this.mapModel} bus={this.props.bus}
            updateFreq={Subject.create(MFDWptInfo.MAP_UPDATE_FREQ)}
            dataUpdateFreq={Subject.create(MFDWptInfo.MAP_DATA_UPDATE_FREQ)}
            projectedWidth={290} projectedHeight={300}
            id='mfd_wptinfo_map'
            rangeIndex={this.mapRangeIndexSub}
            waypoint={this.store.waypoint}
            ownAirplaneLayerProps={{
              imageFilePath: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/own_airplane_icon.svg',
              iconSize: 40,
              iconAnchor: new Float64Array([0.5, 0])
            }}
            pointerInfoSize={MapPointerInfoLayerSize.Medium}
          />
        </GroupBox>
        <GroupBox title="Location">
          <div class='mfd-wptinfo-loc'>
            <div class='mfd-wptinfo-loc-field mfd-wptinfo-loc-bearing'>
              <div class='mfd-wptinfo-loc-title'>BRG</div>
              {this.renderBearing('mfd-wptinfo-loc-value')}
            </div>
            <div class='mfd-wptinfo-loc-field mfd-wptinfo-loc-distance'>
              <div class='mfd-wptinfo-loc-title'>DIS</div>
              {this.renderDistance('mfd-wptinfo-loc-value')}
            </div>
            <div class='mfd-wptinfo-loc-region'>{this.store.region}</div>
            <LatLonDisplay location={this.store.location} class='mfd-wptinfo-loc-latlon' />
          </div>
        </GroupBox>
        <div class="mfd-wptinfo-bottom-prompt">{this.store.prompt}</div>
      </div>
    );
  }
}