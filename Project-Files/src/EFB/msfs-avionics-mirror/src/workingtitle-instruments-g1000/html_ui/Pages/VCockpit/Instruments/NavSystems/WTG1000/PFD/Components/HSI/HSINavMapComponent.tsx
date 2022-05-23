import { FSComponent, Vec2Math, VNode } from 'msfssdk';
import { MapDetailIndicator } from '../../../Shared/Map/Indicators/MapDetailIndicator';
import { MapRangeSettings } from '../../../Shared/Map/MapRangeSettings';
import { NavMapComponent, NavMapComponentProps, NavMapRangeTargetRotationController } from '../../../Shared/UI/NavMap/NavMapComponent';
import { NavMapModelModules } from '../../../Shared/UI/NavMap/NavMapModel';

/**
 * The PFD HSI map.
 */
export class HSINavMapComponent extends NavMapComponent<NavMapModelModules, NavMapComponentProps, HSINavMapRangeTargetRotationController> {
  protected readonly rtrController = new HSINavMapRangeTargetRotationController(
    this.props.model,
    this.mapProjection,
    this.deadZone,
    MapRangeSettings.getRangeArraySubscribable(this.props.bus),
    this.pointerBoundsSub,
    this.props.settingManager,
    this.rangeSettingManager, 'pfdMapRangeIndex'
  );

  /** @inheritdoc */
  protected renderIndicatorGroups(): (VNode | null)[] {
    return [
      this.renderBottomLeftIndicatorGroup(),
      this.renderBottomCenterIndicatorGroup()
    ];
  }

  /** @inheritdoc */
  protected renderBottomLeftIndicators(): (VNode | null)[] {
    return [
      this.renderDetailIndicator(),
      this.renderRangeIndicator()
    ];
  }

  /**
   * Renders the bottom-left indicator group.
   * @returns the bottom-left indicator group.
   */
  protected renderBottomCenterIndicatorGroup(): VNode | null {
    return (
      <div class='hsimap-indicators-bottom-center'>
        {this.renderTrafficOffScaleIndicator()}
        {this.renderTrafficStatusIndicator(false)}
      </div>
    );
  }

  /** @inheritdoc */
  protected renderOrientationDisplayLayer(): VNode | null {
    return null;
  }

  /** @inheritdoc */
  protected renderMiniCompassLayer(): VNode | null {
    return null;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected renderRangeRingLayer(): VNode | null {
    return null;
  }

  /** @inheritdoc */
  protected renderRangeCompassLayer(): VNode | null {
    return null;
  }

  /** @inheritdoc */
  protected renderPointerInfoLayer(): VNode | null {
    return null;
  }

  /** @inheritdoc */
  protected renderDetailIndicator(): VNode | null {
    return (
      <MapDetailIndicator declutterMode={this.props.model.getModule('declutter').mode} showTitle={false} />
    );
  }

  /** @inheritdoc */
  protected renderTerrainScaleIndicator(): VNode | null {
    return null;
  }

  /** @inheritdoc */
  protected renderWaypointHighlightLayer(): VNode | null {
    return null;
  }

  /** @inheritdoc */
  protected renderHighlightLineLayer(): VNode | null {
    return null;
  }

  /** @inheritdoc */
  protected renderNoGpsPositionIndicator(): VNode | null {
    return null;
  }

  /** @inheritdoc */
  public setValidGpsSignal(isValid: boolean): void {
    super.setValidGpsSignal(isValid);

    if (isValid) {
      this.rootRef.instance.classList.remove('hidden-element');
    } else {
      this.rootRef.instance.classList.add('hidden-element');
    }
  }
}

/**
 * A controller for handling map range, target, and rotation changes for the MFD navigation map.
 */
class HSINavMapRangeTargetRotationController extends NavMapRangeTargetRotationController {
  /** @inheritdoc */
  protected getDesiredRangeEndpoints(out: Float64Array): Float64Array {
    const trueCenterRelX = this.nominalToTrueRelativeX(0.5);
    const trueCenterRelY = this.nominalToTrueRelativeY(0.5);

    out[0] = trueCenterRelX;
    out[1] = trueCenterRelY;
    out[2] = trueCenterRelX;
    out[3] = this.nominalToTrueRelativeY(1);
    return out;
  }

  /** @inheritdoc */
  protected getDesiredTargetOffset(out: Float64Array): Float64Array {
    const deadZone = this.deadZone.get();
    const trueCenterOffsetX = (deadZone[0] - deadZone[2]) / 2;
    const trueCenterOffsetY = (deadZone[1] - deadZone[3]) / 2;

    return Vec2Math.set(trueCenterOffsetX, trueCenterOffsetY, out);
  }

  /** @inheritdoc */
  protected updateOrientation(): void {
    // noop
  }
}