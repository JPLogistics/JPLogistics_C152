import { ComputedSubject, FSComponent, NavMath, Subscribable, VNode } from 'msfssdk';
import { AirportFacility, AirportPrivateType, Facility, FacilityType, ICAO, VorFacility, VorType } from 'msfssdk/navigation';

import { AirportWaypoint, FacilityWaypoint, Waypoint } from '../../Navigation/Waypoint';
import { WaypointComponent, WaypointComponentProps } from './WaypointComponent';

/**
 * Component props for WaypointIcon.
 */
export interface WaypointIconProps extends WaypointComponentProps {
  /** A subscribable which provides the airplane's current true heading. */
  planeHeading?: Subscribable<number>;

  /** CSS class(es) to add to the root of the icon component. */
  class?: string;
}

/**
 * A waypoint icon.
 */
export class WaypointIcon extends WaypointComponent<WaypointIconProps> {
  private static readonly PATH = 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/icons-map';

  private readonly imgRef = FSComponent.createRef<HTMLImageElement>();

  private readonly planeHeadingChangedHandler = this.onPlaneHeadingChanged.bind(this);

  private readonly srcSub = ComputedSubject.create<Waypoint | null, string>(null, (waypoint): string => {
    if (!waypoint) {
      return '';
    }

    if (waypoint instanceof FacilityWaypoint) {
      return this.getFacilityIconSrc(waypoint);
    }

    return '';
  });
  private readonly needUpdateAirportSpriteSub = ComputedSubject.create<Waypoint | null, boolean>(null, (waypoint): boolean => {
    if (!waypoint) {
      return false;
    }

    return !!this.props.planeHeading && waypoint instanceof AirportWaypoint;
  });

  private imgFrameRowCount = 1;
  private imgFrameColCount = 1;
  private imgOffset = '0px 0px';

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onAfterRender(): void {
    this.initImageLoadListener();

    super.onAfterRender();

    this.initPlaneHeadingListener();
  }

  /**
   * Initializes the image onload listener.
   */
  private initImageLoadListener(): void {
    this.imgRef.instance.onload = this.onImageLoaded.bind(this);
  }

  /**
   * Initializes the plane heading listener.
   */
  private initPlaneHeadingListener(): void {
    if (this.props.planeHeading) {
      this.props.planeHeading.sub(this.planeHeadingChangedHandler, true);
    }
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onWaypointChanged(waypoint: Waypoint | null): void {
    this.srcSub.set(waypoint);
    this.needUpdateAirportSpriteSub.set(waypoint);
  }

  /**
   * A callback which is called when this component's image element finishes loading an image.
   */
  private onImageLoaded(): void {
    const img = this.imgRef.instance;
    this.imgFrameRowCount = Math.floor(img.naturalHeight / 32);
    this.imgFrameColCount = Math.floor(img.naturalWidth / 32);
  }

  /**
   * A callback which is called when plane heading changes.
   * @param planeHeading The true heading of the airplane, in degrees.
   */
  private onPlaneHeadingChanged(planeHeading: number): void {
    if (this.needUpdateAirportSpriteSub.get()) {
      this.updateAirportSprite(planeHeading);
    }
  }

  /**
   * Updates this icon's airport sprite.
   * @param planeHeading The true heading of the airplane, in degrees.
   */
  private updateAirportSprite(planeHeading: number): void {
    const waypoint = this.props.waypoint.get();
    if (!(waypoint instanceof AirportWaypoint) || !waypoint.longestRunway) {
      return;
    }

    const headingDelta = waypoint.longestRunway.direction - planeHeading;
    const frame = Math.round(NavMath.normalizeHeading(headingDelta) / 22.5) % 8;
    const row = Math.min(Math.floor(frame / 4), this.imgFrameRowCount - 1);
    const col = Math.min(frame % 4, this.imgFrameColCount - 1);
    const xOffset = col * -32;
    const yOffset = row * -32;

    this.setImgOffset(`${xOffset}px ${yOffset}px`);
  }

  /**
   * Sets the object offset of this icon's image element.
   * @param offset The new offset.
   */
  private setImgOffset(offset: string): void {
    if (offset === this.imgOffset) {
      return;
    }

    this.imgOffset = offset;
    this.imgRef.instance.style.objectPosition = offset;
  }

  /**
   * Gets the appropriate icon src for a facility waypoint.
   * @param waypoint A facility waypoint.
   * @returns the appropriate icon src for the facility waypoint.
   */
  private getFacilityIconSrc(waypoint: FacilityWaypoint<Facility>): string {
    switch (ICAO.getFacilityType(waypoint.facility.icao)) {
      case FacilityType.Airport:
        return this.getAirportIconSrc(waypoint as AirportWaypoint<AirportFacility>);
      case FacilityType.VOR:
        return this.getVorIconSrc(waypoint as FacilityWaypoint<VorFacility>);
      case FacilityType.NDB:
        return this.getNdbIconSrc();
      case FacilityType.Intersection:
        return this.getIntersectionIconSrc();
      case FacilityType.USR:
        return this.getUserIconSrc();
      case FacilityType.RWY:
        return this.getRunwayIconSrc();
      default:
        return '';
    }
  }

  /**
   * Gets the appropriate icon src for an airport waypoint.
   * @param waypoint An airport waypoint.
   * @returns the appropriate icon src for the airport waypoint.
   */
  private getAirportIconSrc(waypoint: AirportWaypoint<AirportFacility>): string {
    const airport = waypoint.facility;
    const serviced = (airport.fuel1 !== '' || airport.fuel2 !== '') || airport.airportClass === 1;
    if (airport.airportPrivateType !== AirportPrivateType.Public) {
      return `${WaypointIcon.PATH}/airport_r.png`;
    } else if (serviced) {
      if (airport.towered) {
        return `${WaypointIcon.PATH}/airport_large_blue.png`;
      } else if (airport.airportClass === 1) {
        return `${WaypointIcon.PATH}/airport_large_magenta.png`;
      } else {
        return `${WaypointIcon.PATH}/airport_small_b.png`;
      }
    } else {
      if (airport.towered) {
        return `${WaypointIcon.PATH}/airport_med_blue.png`;
      } else if (airport.airportClass === 1) {
        return `${WaypointIcon.PATH}/airport_med_magenta.png`;
      } else {
        return `${WaypointIcon.PATH}/airport_small_a.png`;
      }
    }
  }

  /**
   * Gets the appropriate icon src for a VOR waypoint.
   * @param waypoint A VOR waypoint.
   * @returns the appropriate icon src for the VOR waypoint.
   */
  private getVorIconSrc(waypoint: FacilityWaypoint<VorFacility>): string {
    switch (waypoint.facility.type) {
      case VorType.DME:
        return `${WaypointIcon.PATH}/dme.png`;
      case VorType.ILS:
      case VorType.VORDME:
        return `${WaypointIcon.PATH}/vor_dme.png`;
      case VorType.VORTAC:
      case VorType.TACAN:
        return `${WaypointIcon.PATH}/vortac.png`;
      default:
        return `${WaypointIcon.PATH}/vor.png`;
    }
  }

  /**
   * Gets the appropriate icon src for an NDB waypoint.
   * @returns the appropriate icon src for the NDB waypoint.
   */
  private getNdbIconSrc(): string {
    return `${WaypointIcon.PATH}/ndb.png`;
  }

  /**
   * Gets the appropriate icon src for an intersection waypoint.
   * @returns the appropriate icon src for the intersection waypoint.
   */
  private getIntersectionIconSrc(): string {
    return `${WaypointIcon.PATH}/intersection_cyan.png`;
  }

  /**
   * Gets the appropriate icon src for an intersection waypoint.
   * @returns the appropriate icon src for the intersection waypoint.
   */
  private getUserIconSrc(): string {
    return `${WaypointIcon.PATH}/user.png`;
  }

  /**
   * Gets the appropriate icon src for a runway waypoint.
   * @returns the appropriate icon src for the runway waypoint.
   */
  private getRunwayIconSrc(): string {
    return `${WaypointIcon.PATH}/intersection_cyan.png`;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public render(): VNode {
    return (
      <img ref={this.imgRef} class={this.props.class ?? ''} src={this.srcSub}
        style={`width: 32px; height: 32px; object-fit: none; object-position: ${this.imgOffset};`} />
    );
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public destroy(): void {
    super.destroy();

    if (this.props.planeHeading) {
      this.props.planeHeading.unsub(this.planeHeadingChangedHandler);
    }
  }
}