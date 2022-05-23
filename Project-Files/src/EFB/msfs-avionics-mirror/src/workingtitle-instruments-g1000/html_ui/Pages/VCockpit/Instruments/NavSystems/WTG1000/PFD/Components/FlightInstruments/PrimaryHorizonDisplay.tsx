import { FSComponent, DisplayComponent, VNode, Subject, ComponentProps, Vec2Subject } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { ClockEvents, GNSSEvents } from 'msfssdk/instruments';
import { ADCEvents } from 'msfssdk/instruments/ADC';
import { AHRSSystemEvents } from '../../../Shared/Systems/AHRSSystem';
import { AvionicsSystemState, AvionicsSystemStateEvent } from '../../../Shared/Systems/G1000AvionicsSystem';
import { PFDUserSettings } from '../../PFDUserSettings';
import { ArtificialHorizon } from './ArtificialHorizon';
import { AttitudeIndicator } from './AttitudeIndicator';
import { FlightPathMarker } from './FlightPathMarker';
import { G1000SynVis } from './G1000SynVis';

import './PrimaryHorizonDisplay.css';

/**
 * The properties on the primary horizon display component.
 */
interface PrimaryHorizonDisplayProps extends ComponentProps {

  /** An instance of the event bus. */
  bus: EventBus;
}

/**
 * Structure to hold the current roll,pitch,heading and altitude situation of the plane.
 */
export interface PlaneStateInfo {
  /** The current roll of the plane. */
  roll: number;
  /** The current pitch of the plane. */
  pitch: number;
  /** The current heading of the plane. */
  heading: number;
  /** The current track of the plane. */
  track: number;
  /** The current altitude of the plane in feet. */
  altitude: number;
  /** The current ground speed of the plane in knots. */
  gs: number;
  /** The current vertical speed of the plane in feet per minute. */
  vs: number;
  /** The current angle of attack of the plane. */
  aoa: number;
}

/**
 * The PFD primary horizon display.
 */
export class PrimaryHorizonDisplay extends DisplayComponent<PrimaryHorizonDisplayProps> {

  private readonly artificalHorizonRef = FSComponent.createRef<ArtificialHorizon>();
  private readonly attitudeIndicatorRef = FSComponent.createRef<AttitudeIndicator>();
  private readonly flightPathMarkerRef = FSComponent.createRef<FlightPathMarker>();
  private readonly synVisRef = FSComponent.createRef<G1000SynVis>();
  private readonly horizonContainer = FSComponent.createRef<HTMLDivElement>();

  private readonly isSvtActiveSub = Subject.create(false);

  private planeState: PlaneStateInfo = {
    roll: 0,
    pitch: 0,
    heading: 0,
    track: 0,
    altitude: 0,
    gs: 0,
    vs: 0,
    aoa: 0
  };

  private shouldUpdate = true;
  private lastUpdateTime = 0;

  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    const sub = this.props.bus.getSubscriber<ADCEvents & GNSSEvents & ClockEvents & AHRSSystemEvents>();
    sub.on('pitch_deg')
      .withPrecision(2)
      .handle(this.onUpdatePitch);
    sub.on('roll_deg')
      .withPrecision(3)
      .handle(this.onUpdateRoll);
    sub.on('alt')
      .whenChanged()
      .handle(this.onUpdateAltitude);
    sub.on('hdg_deg')
      .withPrecision(2)
      .handle(this.onUpdateHeading);
    sub.on('track_deg_magnetic')
      .withPrecision(2)
      .handle(this.onUpdateTrack);
    sub.on('ground_speed')
      .withPrecision(2)
      .handle(this.onUpdateGroundSpeed);
    sub.on('vs')
      .withPrecision(2)
      .handle(this.onUpdateVerticalSpeed);
    sub.on('aoa')
      .withPrecision(2)
      .handle(this.onUpdateAoA);

    sub.on('ahrs_state').handle(this.onAhrsState);
    sub.on('realTime').handle(this.onFrameUpdate);

    PFDUserSettings.getManager(this.props.bus).whenSettingChanged('svtToggle').handle(isActive => { this.isSvtActiveSub.set(isActive); });
  }

  /**
   * A callback called when the pitch updates from the event bus.
   * @param pitch The current pitch value.
   */
  private onUpdatePitch = (pitch: number): void => {
    this.planeState.pitch = pitch;
    this.shouldUpdate = true;
  };

  /**
   * A callback called when the roll updates from the event bus.
   * @param roll The current ADC roll value.
   */
  private onUpdateRoll = (roll: number): void => {
    this.planeState.roll = roll;
    this.shouldUpdate = true;
  };

  /**
   * A callback called when the altitude updates from the event bus.
   * @param alt The current ADC altitude.
   */
  private onUpdateAltitude = (alt: number): void => {
    this.planeState.altitude = alt;
    this.shouldUpdate = true;
  };

  /**
   * A callback called when the true heading updates from the event bus.
   * @param hdg The current ADC true heading value.
   */
  private onUpdateHeading = (hdg: number): void => {
    this.planeState.heading = hdg;
    this.shouldUpdate = true;
  };

  /**
   * A callback called when the true track updates from the event bus.
   * @param track The current ADC true track value.
   */
  private onUpdateTrack = (track: number): void => {
    this.planeState.track = track;
    this.shouldUpdate = true;
  };

  /**
   * A callback called when the ground speed updates from the event bus.
   * @param gs The current ADC ground speed value.
   */
  private onUpdateGroundSpeed = (gs: number): void => {
    this.planeState.gs = gs;
    this.shouldUpdate = true;
  };

  /**
   * A callback called when the vertical speed updates from the event bus.
   * @param vs The current ADC vertical speed value.
   */
  private onUpdateVerticalSpeed = (vs: number): void => {
    this.planeState.vs = vs;
    this.shouldUpdate = true;
  };

  /**
   * A callback called when the angle of attack updates from the event bus.
   * @param aoa The current angle of attack.
   */
  private onUpdateAoA = (aoa: number): void => {
    this.planeState.aoa = aoa;
    this.shouldUpdate = true;
  };

  /**
   * A callback called when the AHRS system state changes.
   * @param state The state of the system.
   */
  private onAhrsState = (state: AvionicsSystemStateEvent): void => {
    if (state.current === AvionicsSystemState.On) {
      this.horizonContainer.instance.classList.remove('hidden-element');
    } else {
      this.horizonContainer.instance.classList.add('hidden-element');
    }
  };

  /**
   * A callback called when the frame updates.
   * @param realTime The current real timestamp
   */
  private onFrameUpdate = (realTime: number): void => {
    const dt = realTime - this.lastUpdateTime;

    if (this.shouldUpdate) {
      this.shouldUpdate = false;
      this.synVisRef.instance.update(this.planeState);
      this.attitudeIndicatorRef.instance.update(this.planeState);
      this.artificalHorizonRef.instance.update(this.planeState);
    }
    this.flightPathMarkerRef.instance.update(dt, this.planeState);
    // this.aptLabelsRef.instance.update(this.planeState);

    this.lastUpdateTime = realTime;
  };

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div>
        <div ref={this.horizonContainer}>
          <ArtificialHorizon ref={this.artificalHorizonRef} isActive={this.isSvtActiveSub.map(isActive => !isActive)} />
          <G1000SynVis
            ref={this.synVisRef}
            bus={this.props.bus}
            bingId='wtg1000-horizon'
            resolution={Vec2Subject.createFromVector(new Float64Array([1228, 921]))}
            isActive={this.isSvtActiveSub}
          />
          <FlightPathMarker ref={this.flightPathMarkerRef} isActive={this.isSvtActiveSub} />
        </div>
        <AttitudeIndicator ref={this.attitudeIndicatorRef} bus={this.props.bus} />
        {/* <SvtAirportLabels ref={this.aptLabelsRef} bus={this.props.bus} /> */}
      </div>
    );
  }
}
