import { FSComponent, NavMath, NumberUnitSubject, Subject, UnitFamily, VNode } from 'msfssdk';
import { MapModel } from 'msfssdk/components/map';
import { FmsHEvent } from '../../../../Shared/UI/FmsHEvent';
import { ActionButton } from '../../../../Shared/UI/UIControls/ActionButton';
import { ArrowToggle } from '../../../../Shared/UI/UIControls/ArrowToggle';
import { NumberInput } from '../../../../Shared/UI/UIControls/NumberInput';
import { TimeDistanceInput } from '../../../../Shared/UI/UIControls/TimeDistanceInput';
import { Hold } from '../../../../Shared/UI/Hold/Hold';
import { WaypointMapComponent, WaypointMapRangeTargetRotationController } from '../../../../Shared/UI/WaypointMap/WaypointMapComponent';
import { WaypointMapModelModules, WaypointMapModel } from '../../../../Shared/UI/WaypointMap/WaypointMapModel';
import { GroupBox } from '../GroupBox';
import { MapPointerInfoLayerSize } from '../../../../Shared/Map/Layers/MapPointerInfoLayer';

import './MFDHold.css';

/**
 * A class that displays the MFD hold dialog.
 */
export class MFDHold extends Hold {

  private static readonly MAP_UPDATE_FREQ = 30; // Hz
  private static readonly MAP_DATA_UPDATE_FREQ = 4; // Hz

  private readonly mapRef = FSComponent.createRef<WaypointMapComponent>();

  private readonly mapModel = this.createMapModel();
  private readonly mapRangeIndexSub = Subject.create(WaypointMapRangeTargetRotationController.DEFAULT_MAP_RANGE_INDEX);

  /** @inheritdoc */
  public onAfterRender(): void {
    super.onAfterRender();

    this.mapRef.instance.sleep();
  }

  /** @inheritdoc */
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
   * Changes the MFD map range index setting.
   * @param delta The change in index to apply.
   */
  private changeMapRangeIndex(delta: number): void {
    const newIndex = Utils.Clamp(this.mapRangeIndexSub.get() + delta, 0, WaypointMapRangeTargetRotationController.DEFAULT_MAP_RANGES.length - 1);
    this.mapRangeIndexSub.set(newIndex);
  }

  /**
   * Creates the model for this component's map.
   * @returns a map model.
   */
  private createMapModel(): MapModel<WaypointMapModelModules> {
    return WaypointMapModel.createModel(this.props.bus);
  }

  /**
   * Renders the MFD hold dialog.
   * @returns The rendered VNode.
   */
  public render(): VNode {
    const legName = this.createLegNameSubscribable();
    const directionString = this.createDirectionStringSubscribable();

    return (
      <div class='popout-dialog mfd-hold' ref={this.viewContainerRef}>
        <h1>{this.props.title}</h1>
        <GroupBox title='Direction, Course'>
          <div class='mfd-hold-gridcontainer'>
            <div>Hold <span>{directionString}</span> of</div>
            <div>{legName}</div>
            <div>
              Course <NumberInput class='mfd-hold-course' minValue={1} maxValue={360} wrap
                dataSubject={this.store.course} increment={1} onRegister={this.register} formatter={(v): string => `${NavMath.normalizeHeading(v).toFixed(0).padStart(3, '0')}°`} />
            </div>
            <div>
              <ArrowToggle class='mfd-hold-inbound' options={['Inbound', 'Outbound']} dataref={this.store.isInbound} onRegister={this.register} />
            </div>
          </div>
        </GroupBox>
        <GroupBox title='Leg Time, Distance'>
          <div class='mfd-hold-gridcontainer'>
            <div>
              Leg <ArrowToggle class='mfd-hold-time' options={['Time', 'Distance']} dataref={this.store.isTime} onRegister={this.register} />
            </div>
            <div>
              <TimeDistanceInput
                ref={this.distanceInput} class='mfd-hold-distance'
                timeSubject={this.store.time as unknown as NumberUnitSubject<UnitFamily.Duration>}
                distanceSubject={this.store.distance as unknown as NumberUnitSubject<UnitFamily.Distance>}
                onRegister={this.register}
              />
            </div>
          </div>
        </GroupBox>
        <GroupBox title='Turns'>
          <div class='mfd-hold-gridcontainer'>
            <div>Turn Direction</div>
            <div>
              <ArrowToggle class='mfd-hold-direction' options={['Left', 'Right']} dataref={this.store.turnDirection} onRegister={this.register} />
            </div>
          </div>
        </GroupBox>
        <GroupBox title='Map' class='mfd-hold-map-box'>
          <WaypointMapComponent
            ref={this.mapRef} model={this.mapModel} bus={this.props.bus}
            updateFreq={Subject.create(MFDHold.MAP_UPDATE_FREQ)}
            dataUpdateFreq={Subject.create(MFDHold.MAP_DATA_UPDATE_FREQ)}
            projectedWidth={290} projectedHeight={300}
            bingId='mfd_wptinfo_map'
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
        <ActionButton class='mfd-hold-load' text='Load?' onExecute={(): void => { this.controller.accept(); this.close(); }} onRegister={this.register} />
      </div>
    );
  }
}