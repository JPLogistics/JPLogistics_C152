import { DisplayComponent, FSComponent, VNode, ComponentProps, GeoPointInterface } from 'msfssdk';
import { AirportFacility, ICAO } from 'msfssdk/navigation';
import { SvtProjectionUtils } from '../../../../Shared/UI/SvtProjectionUtils';
import { PlaneStateInfo } from '../../FlightInstruments/PrimaryHorizonDisplay';

/**
 * The properties for the SvtAirportLabel component.
 */
interface SvtAirportLabelProps extends ComponentProps {
  /** The airport facility to display. */
  facility: AirportFacility;
}

/**
 * The SvtAirportLabel component.
 */
export class SvtAirportLabel extends DisplayComponent<SvtAirportLabelProps> {
  private static readonly vec3Cache = [new Float64Array(3)];

  private containerRef = FSComponent.createRef<HTMLElement>();

  private readonly facilityLatLong: LatLongAlt;
  private planeLatLongAlt: LatLongAlt = new LatLongAlt(0, 0, 0);

  /**
   * Ctor
   * @param props the props
   */
  constructor(props: SvtAirportLabelProps) {
    super(props);
    const rwy = this.props.facility.runways[0];
    this.facilityLatLong = new LatLongAlt(rwy.latitude, rwy.longitude, rwy.elevation);
  }

  /**
   * Updates svt airport label.
   * @param planePos Current plane position
   * @param planeState Plane state info
   */
  public update(planePos: GeoPointInterface, planeState: PlaneStateInfo): void {
    this.planeLatLongAlt.lat = planePos.lat;
    this.planeLatLongAlt.long = planePos.lon;
    this.planeLatLongAlt.alt = planeState.altitude * 3.281;

    const proj = SvtProjectionUtils.projectLatLongAlt(
      this.facilityLatLong,
      this.planeLatLongAlt,
      planeState.heading,
      planeState.roll * Avionics.Utils.DEG2RAD,
      SvtAirportLabel.vec3Cache[0]
    );
    this.containerRef.instance.style.transform = `translate3d(${proj[0]}px, ${Math.max(6, proj[1])}px, 0px)`;
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class="svt-airport-label" style="transform: translate3d(0px, 0px, 0px);" ref={this.containerRef}>
        <svg viewBox="-40 -60 80 120" width="50px">
          <rect x="-40" y="-60" width="100%" height="23px" stroke="white" fill="rgba(0,0,0,0.4)" />
          <text x="0" y="-49" text-anchor="middle" font-family="Roboto-Light" alignment-baseline="central" font-size="26" fill=" white">{ICAO.getIdent(this.props.facility.icao)}</text>
          <line x1="0" y1="-36" x2="0" y2="24" stroke="white" />
        </svg>
      </div>
    );
  }
}