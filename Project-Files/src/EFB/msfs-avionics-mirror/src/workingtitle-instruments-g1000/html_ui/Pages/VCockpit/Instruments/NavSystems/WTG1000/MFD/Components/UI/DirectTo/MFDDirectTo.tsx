import { FSComponent, Subject, VNode } from 'msfssdk';
import { MapModel } from 'msfssdk/components/map';
import { MapPointerInfoLayerSize } from '../../../../Shared/Map/Layers/MapPointerInfoLayer';
import { DirectTo } from '../../../../Shared/UI/DirectTo/DirectTo';
import { FmsHEvent } from '../../../../Shared/UI/FmsHEvent';
import { ActionButton } from '../../../../Shared/UI/UIControls/ActionButton';
import { WaypointMapComponent, WaypointMapRangeTargetRotationController } from '../../../../Shared/UI/WaypointMap/WaypointMapComponent';
import { WaypointMapModel, WaypointMapModelModules } from '../../../../Shared/UI/WaypointMap/WaypointMapModel';
import { GroupBox } from '../GroupBox';

import './MFDDirectTo.css';

/**
 * The MFD direct-to popout.
 */
export class MFDDirectTo extends DirectTo {
  private static readonly MAP_UPDATE_FREQ = 30; // Hz
  private static readonly MAP_DATA_UPDATE_FREQ = 4; // Hz

  private readonly mapRef = FSComponent.createRef<WaypointMapComponent>();

  private readonly mapModel = this.createMapModel();
  private readonly mapRangeIndexSub = Subject.create(WaypointMapRangeTargetRotationController.DEFAULT_MAP_RANGE_INDEX);

  /**
   * Creates the model for this component's map.
   * @returns a map model.
   */
  private createMapModel(): MapModel<WaypointMapModelModules> {
    return WaypointMapModel.createModel(this.props.bus);
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
    }

    return super.onInteractionEvent(evt);
  }

  /**
   * Changes the MFD map range index setting.
   * @param delta The change in index to apply.
   */
  private changeMapRangeIndex(delta: number): void {
    const newIndex = Utils.Clamp(this.mapRangeIndexSub.get() + delta, 0, WaypointMapRangeTargetRotationController.DEFAULT_MAP_RANGES.length - 1);
    this.mapRangeIndexSub.set(newIndex);
  }

  /** @inheritdoc */
  protected onViewOpened(): void {
    super.onViewOpened();

    this.mapRef.instance.wake();
  }

  /** @inheritdoc */
  protected onViewClosed(): void {
    super.onViewClosed();

    this.mapRef.instance.sleep();
    this.mapRangeIndexSub.set(WaypointMapRangeTargetRotationController.DEFAULT_MAP_RANGE_INDEX);
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class='popout-dialog mfd-dto' ref={this.viewContainerRef}>
        <h1>{this.props.title}</h1>
        <GroupBox title="Ident, Facility, City">
          {this.renderWaypointInput()}
        </GroupBox>
        <GroupBox title="VNV">
          <div class="mfd-dto-vnv-box">
            <div>- - - - -<span class="size12">FT</span></div>
            <div>+0<span class="size12">NM</span></div>
          </div>
        </GroupBox>
        <GroupBox title="Map" class='mfd-dto-map-box'>
          <WaypointMapComponent
            ref={this.mapRef} model={this.mapModel} bus={this.props.bus}
            updateFreq={Subject.create(MFDDirectTo.MAP_UPDATE_FREQ)}
            dataUpdateFreq={Subject.create(MFDDirectTo.MAP_DATA_UPDATE_FREQ)}
            projectedWidth={290} projectedHeight={250}
            bingId='mfd_dto_map'
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
          <div class="mfd-dto-location">
            <div class='mfd-dto-location-field mfd-dto-bearing'>
              <div class='mfd-dto-location-field-title'>BRG</div>
              {this.renderBearing()}
            </div>
            <div class='mfd-dto-location-field mfd-dto-distance'>
              <div class='mfd-dto-location-field-title'>DIS</div>
              {this.renderDistance()}
            </div>
          </div>
        </GroupBox>
        <GroupBox title='Course' class='mfd-dto-course-box'>
          {this.renderCourseInput('mfd-dto-course-input')}
        </GroupBox>
        <div class="mfd-action-buttons mfd-dto-action-buttons">
          <ActionButton onRegister={this.register} isVisible={this.controller.canActivate} onExecute={this.onLoadExecuted} text="Activate?" />
          <ActionButton onRegister={this.register} isVisible={this.controller.canActivate} onExecute={this.onHoldButtonPressed} text="Hold?" />
        </div>
      </div>
    );
  }
}
