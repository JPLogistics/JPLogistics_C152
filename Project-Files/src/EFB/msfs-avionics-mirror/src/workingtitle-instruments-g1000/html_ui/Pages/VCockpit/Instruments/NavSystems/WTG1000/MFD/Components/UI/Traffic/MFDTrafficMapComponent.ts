import { TrafficMapComponent, TrafficMapComponentProps, TrafficMapRangeTargetRotationController } from '../../../../Shared/UI/TrafficMap/TrafficMapComponent';
import { TrafficMapModel, TrafficMapModelModules } from '../../../../Shared/UI/TrafficMap/TrafficMapModel';

/**
 * A MFD traffic map component.
 */
export class MFDTrafficMapComponent extends TrafficMapComponent<TrafficMapModelModules, TrafficMapComponentProps, MFDTrafficMapRangeTargetRotationController> {
  protected readonly rtrController = new MFDTrafficMapRangeTargetRotationController(
    this.props.model,
    this.mapProjection,
    this.deadZone,
    TrafficMapModel.DEFAULT_RANGES,
    this.rangeSettingManager, 'mfdMapRangeIndex'
  );
}

/**
 * A controller for handling map range, target, and rotation changes for the MFD traffic map.
 */
class MFDTrafficMapRangeTargetRotationController extends TrafficMapRangeTargetRotationController {
  /** @inheritdoc */
  protected getDesiredRangeEndpoints(out: Float64Array): Float64Array {
    const trueCenterRelX = this.nominalToTrueRelativeX(0.5);
    const trueCenterRelY = this.nominalToTrueRelativeY(0.5);

    out[0] = trueCenterRelX;
    out[1] = trueCenterRelY;
    out[2] = trueCenterRelX;
    out[3] = this.nominalToTrueRelativeY(0.95);
    return out;
  }
}