import { MapCrosshairController, MapCrosshairControllerModules } from '../../../../Shared/Map/Controllers/MapCrosshairController';
import { MapFlightPlanFocusModule } from '../../../../Shared/Map/Modules/MapFlightPlanFocusModule';
import { MFDFPLMapCrosshairControllerModules } from '../FPL/MFDFPLMapCrosshairController';

/**
 * Modules required for MFDFPLMapCrosshairController.
 */
export interface MFDProcMapCrosshairControllerModules extends MapCrosshairControllerModules {
  /** Focus module. */
  focus: MapFlightPlanFocusModule;
}

/**
 * Controls the map crosshair. Shows the crosshair when the map pointer or flight plan focus is active, and hides the
 * crosshair otherwise.
 */
export class MFDProcMapCrosshairController<M extends MFDFPLMapCrosshairControllerModules> extends MapCrosshairController<M> {
  /** @inheritdoc */
  protected initListeners(): void {
    super.initListeners();

    const focusModule = this.mapModel.getModule('focus');
    focusModule.isActive.sub(this.handler);
    focusModule.focus.sub(this.handler);
  }

  /** @inheritdoc */
  protected updateCrosshairShow(): void {
    const focusModule = this.mapModel.getModule('focus');
    const isPointerActive = this.mapModel.getModule('pointer').isActive.get();
    const isFocusActive = focusModule.isActive.get();
    const doesFocusExist = focusModule.focus.get() !== null;
    this.mapModel.getModule('crosshair').show.set(isPointerActive || (isFocusActive && doesFocusExist));
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();

    const focusModule = this.mapModel.getModule('focus');
    focusModule.isActive.unsub(this.handler);
    focusModule.focus.unsub(this.handler);
  }
}