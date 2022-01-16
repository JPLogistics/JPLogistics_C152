import { DisplayComponent, FSComponent, VNode, ComponentProps, NavMath, ExpSmoother, UnitType, Subscribable } from 'msfssdk';
import { SvtProjectionUtils } from '../../../Shared/UI/SvtProjectionUtils';
import { PlaneStateInfo } from './PrimaryHorizonDisplay';

/**
 * The properties for the FlightPathMarker component.
 */
export interface FlightPathMarkerProps extends ComponentProps {
  /** A subscribable which provides whether the flight path marker is active. */
  isActive: Subscribable<boolean>;
}

/**
 * The FlightPathMarker component.
 */
export class FlightPathMarker extends DisplayComponent<FlightPathMarkerProps> {
  private static readonly GROUND_TRACK_TIME_CONSTANT = 2000 / Math.LN2; // ms
  private static readonly VANGLE_TIME_CONSTANT = 2000 / Math.LN2; // ms

  private static readonly vec2Cache = [new Float64Array(2)];

  private readonly fpvMarkerRef = FSComponent.createRef<HTMLElement>();

  private readonly groundTrackSmoother = new ExpSmoother(FlightPathMarker.GROUND_TRACK_TIME_CONSTANT);
  private readonly vAngleSmoother = new ExpSmoother(FlightPathMarker.VANGLE_TIME_CONSTANT);

  private isVisible = true;

  /**
   * Updates flight path marker
   * @param dt The elapsed time, in milliseconds, since the previous update.
   * @param planeState The state of own airplane.
   */
  public update(dt: number, planeState: PlaneStateInfo): void {
    this.updateIsVisible(planeState);

    if (this.isVisible) {
      this.updatePosition(dt, planeState);
    }
  }

  /**
   * Updates whether this flight path marker should be visible.
   * @param planeState The state of own airplane.
   */
  private updateIsVisible(planeState: PlaneStateInfo): void {
    const isVisible = this.props.isActive.get() && planeState.gs > 30;
    if (this.isVisible !== isVisible) {
      this.isVisible = isVisible;
      this.fpvMarkerRef.instance.style.display = isVisible ? '' : 'none';
    }
  }

  /**
   * Updates this flight path marker's position.
   * @param dt The elapsed time, in milliseconds, since the previous update.
   * @param planeState The state of own airplane.
   */
  private updatePosition(dt: number, planeState: PlaneStateInfo): void {
    const vAngle = this.vAngleSmoother.next(Math.atan2(planeState.vs, UnitType.KNOT.convertTo(planeState.gs, UnitType.FPM)), dt);
    const pitch = planeState.pitch * Avionics.Utils.DEG2RAD + vAngle;

    const trkAvg = this.smoothGroundTrack(planeState.track, dt);
    const yaw = NavMath.diffAngle(planeState.heading, trkAvg) * Avionics.Utils.DEG2RAD;

    const roll = planeState.roll * Avionics.Utils.DEG2RAD;

    const offset = SvtProjectionUtils.projectYawPitch(yaw, pitch, roll, FlightPathMarker.vec2Cache[0]);
    this.fpvMarkerRef.instance.style.transform = `translate3d(${offset[0]}px, ${offset[1]}px, 0)`;
  }

  /**
   * Smooths a ground track value.
   * @param track A ground track value.
   * @param dt The elapsed time, in milliseconds, since the last smoothed value was calculated.
   * @returns A smoothed ground track value.
   */
  private smoothGroundTrack(track: number, dt: number): number {
    const last = this.groundTrackSmoother.last();

    if (last !== null && !isNaN(last)) {
      // need to handle wraparounds
      let delta = track - last;
      if (delta > 180) {
        delta = delta - 360;
      } else if (delta < -180) {
        delta = delta + 360;
      }
      track = last + delta;
    }

    const next = last !== null && isNaN(last) ? this.groundTrackSmoother.reset(track) : this.groundTrackSmoother.next(track, dt);
    const normalized = (next + 360) % 360; // enforce range 0-359
    return this.groundTrackSmoother.reset(normalized);
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class="fpv-marker" ref={this.fpvMarkerRef} style="transform3d(0, 0, 0); position: absolute; top: 33%; left: 42%; width: 58px;">
        <svg viewBox="-29 -25 58 42">
          <path d="M -14 0 a 14 14 0 1 0 28 0 m 16 0 l -16 0 a 14 14 0 1 0 -28 0 l -16 0 m 30 -14 l 0 -12" stroke="black" stroke-width="5" fill="none" />
          <path d="M -14 0 a 14 14 0 1 0 28 0 m 14 0 l -14 0 a 14 14 0 1 0 -28 0 l -14 0 m 28 -14 l 0 -10" stroke="rgb(0,255,0)" stroke-width="2" fill="none" />
        </svg>

      </div>
    );
  }
}