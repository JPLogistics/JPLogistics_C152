import { FSComponent, NumberUnitInterface, UnitFamily, UnitType, VNode } from 'msfssdk';
import { MapDetailIndicator } from '../../../Shared/Map/Indicators/MapDetailIndicator';
import { MapRangeSettings } from '../../../Shared/Map/MapRangeSettings';

import { NavMapComponent, NavMapRangeTargetRotationController } from '../../../Shared/UI/NavMap/NavMapComponent';

/**
 * The PFD HSI map.
 */
export class HSINavMapComponent extends NavMapComponent {
  // eslint-disable-next-line jsdoc/require-jsdoc
  protected createRangeTargetRotationController(): NavMapRangeTargetRotationController {
    return new HSINavMapRangeTargetRotationController(
      this.props.model,
      this.mapProjection,
      this.deadZone,
      this.props.settingManager,
      this.rangeSettingManager, 'pfdMapRangeIndex',
      MapRangeSettings.getRangeArraySubscribable(this.props.bus),
      this.pointerBoundsSub
    );
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected renderIndicatorGroups(): (VNode | null)[] {
    return [
      this.renderBottomLeftIndicatorGroup(),
      this.renderBottomCenterIndicatorGroup()
    ];
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
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

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected renderOrientationDisplayLayer(): VNode | null {
    return null;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected renderMiniCompassLayer(): VNode | null {
    return null;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected renderRangeRingLayer(): VNode | null {
    return null;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected renderRangeCompassLayer(): VNode | null {
    return null;
  }

  /** @inheritdoc */
  protected renderPointerInfoLayer(): VNode | null {
    return null;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected renderDetailIndicator(): VNode | null {
    return (
      <MapDetailIndicator declutterMode={this.props.model.getModule('declutter').mode} showTitle={false} />
    );
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
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
  public static readonly TARGET_OFFSET = new Float64Array(2);

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected convertToTrueRange(nominalRange: NumberUnitInterface<UnitFamily.Distance>): number {
    const projectedHeight = this.mapProjection.getProjectedSize()[1];
    const correctedHeight = projectedHeight - this.deadZone[1] - this.deadZone[3];
    return nominalRange.asUnit(UnitType.GA_RADIAN) as number * projectedHeight / correctedHeight * 2;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected getDesiredTargetOffset(): Float64Array {
    return HSINavMapRangeTargetRotationController.TARGET_OFFSET;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected updateOrientation(): void {
    // noop
  }
}