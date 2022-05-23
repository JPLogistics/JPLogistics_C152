import { MapRangeSettings } from '../../../../Shared/Map/MapRangeSettings';
import { NavMapComponentProps } from '../../../../Shared/UI/NavMap/NavMapComponent';
import { NavMapModelModules } from '../../../../Shared/UI/NavMap/NavMapModel';
import { MFDNavMapComponent, MFDNavMapRangeTargetRotationController } from '../NavMap/MFDNavMapComponent';

/**
 * A nav map component for the nearest page that adds the ability to set the range directly,
 * with or without settings sync.
 */
export class MFDNearestNavMapComponent extends MFDNavMapComponent<NavMapModelModules, NavMapComponentProps, MFDNearestNavMapRTRController> {
  /** @inheritdoc */
  protected createRangeTargetRotationController(): MFDNearestNavMapRTRController {
    return new MFDNearestNavMapRTRController(
      this.props.model,
      this.mapProjection,
      this.deadZone,
      MapRangeSettings.getRangeArraySubscribable(this.props.bus),
      this.pointerBoundsSub,
      this.props.settingManager,
      this.rangeSettingManager, 'mfdMapRangeIndex'
    );
  }

  /**
   * Sets the current range index to the provided value.
   * @param index The range index to set to.
   * @param sync True if this setting should sync to the saved map settings system, false otherwise.
   */
  public setRangeIndex(index: number, sync = false): void {
    this.rtrController.setRangeIndex(index, sync);
  }

  /**
   * Gets the current map range index.
   * @returns The current map range index.
   */
  public getCurrentRangeIndex(): number {
    return this.rtrController.getCurrentRangeIndex();
  }
}

/**
 * A range target rotation controller that adds the ability to set the range directly,
 * with or without settings sync.
 */
export class MFDNearestNavMapRTRController extends MFDNavMapRangeTargetRotationController {

  /**
   * Sets the current range index to the provided value.
   * @param index The range index to set to.
   * @param sync True if this setting should sync to the saved map settings system, false otherwise.
   */
  public setRangeIndex(index: number, sync: boolean): void {
    index = Utils.Clamp(index, 0, this.rangeArray.get().length - 1);
    if (sync) {
      this.rangeSetting.value = index;
    } else {
      if (index !== this.currentMapRangeIndex) {
        this.currentMapRangeIndex = index;
        this.updateRangeFromIndex();
        this.scheduleProjectionUpdate();
      }
    }
  }

  /**
   * Gets the current map range index.
   * @returns The current map range index.
   */
  public getCurrentRangeIndex(): number {
    return this.currentMapRangeIndex;
  }
}