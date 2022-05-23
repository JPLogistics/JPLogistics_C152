import { ComponentProps, DisplayComponent, Subscribable, VNode } from 'msfssdk';
import { Waypoint } from 'msfssdk/navigation';

/**
 * Component props for WaypointComponent.
 */
export interface WaypointComponentProps extends ComponentProps {
  /** A subscribable which provides a waypoint to bind. */
  waypoint: Subscribable<Waypoint | null>;
}

/**
 * An abstract component which is bound to a waypoint.
 */
export abstract class WaypointComponent<T extends WaypointComponentProps> extends DisplayComponent<T> {
  private readonly waypointChangedHandler = this.onWaypointChanged.bind(this);

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onAfterRender(): void {
    this.props.waypoint.sub(this.waypointChangedHandler, true);
  }

  /**
   * A callback which is called when this component's waypoint changes.
   * @param waypoint The new waypoint.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onWaypointChanged(waypoint: Waypoint | null): void {
    // noop
  }

  public abstract render(): VNode;

  // eslint-disable-next-line jsdoc/require-jsdoc
  public destroy(): void {
    this.props.waypoint.unsub(this.waypointChangedHandler);
  }
}