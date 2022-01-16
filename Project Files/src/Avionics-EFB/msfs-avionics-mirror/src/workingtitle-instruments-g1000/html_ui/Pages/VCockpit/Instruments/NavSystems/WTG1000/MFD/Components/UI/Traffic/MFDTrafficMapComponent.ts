import { NumberUnitInterface, UnitFamily, UnitType } from 'msfssdk';
import { TrafficMapComponent, TrafficMapRangeTargetRotationController } from '../../../../Shared/UI/TrafficMap/TrafficMapComponent';
import { TrafficMapModel } from '../../../../Shared/UI/TrafficMap/TrafficMapModel';

/**
 * A MFD traffic map component.
 */
export class MFDTrafficMapComponent extends TrafficMapComponent {
  // eslint-disable-next-line jsdoc/require-jsdoc
  protected createRangeTargetRotationController(): TrafficMapRangeTargetRotationController {
    return new MFDTrafficMapRangeTargetRotationController(
      this.props.model, this.mapProjection,
      TrafficMapModel.DEFAULT_RANGES,
      this.rangeSettingManager, 'mfdMapRangeIndex'
    );
  }
}

/**
 * A controller for handling map range, target, and rotation changes.
 */
class MFDTrafficMapRangeTargetRotationController extends TrafficMapRangeTargetRotationController {
  // eslint-disable-next-line jsdoc/require-jsdoc
  protected convertToTrueRange(nominalRange: NumberUnitInterface<UnitFamily.Distance>): number {
    return nominalRange.asUnit(UnitType.GA_RADIAN) / 0.45;
  }
}