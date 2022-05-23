import { MapModel } from 'msfssdk/components/map';
import { MapCrosshairModule } from '../modules/MapCrosshairModule';
import { MapPointerModule } from '../modules/MapPointerModule';

/**
 * Modules required for MapCrosshairController.
 */
export interface MapCrosshairControllerModules {
  /** Crosshair module. */
  crosshair: MapCrosshairModule;

  /** Pointer module. */
  pointer: MapPointerModule;
}

/**
 * Controls the map crosshair. Shows the crosshair when the map pointer is active, and hides the crosshair otherwise.
 */
export class MapCrosshairController<M extends MapCrosshairControllerModules = MapCrosshairControllerModules> {
  protected readonly handler = this.updateCrosshairShow.bind(this);

  protected isInit = false;

  /**
   * Constructor.
   * @param mapModel The model of the map associated with this controller.
   */
  constructor(
    protected readonly mapModel: MapModel<M>,
  ) {
  }

  /**
   * Initializes this controller. Once initialized, this controller will automatically update the map crosshair
   * visibility.
   */
  public init(): void {
    if (this.isInit) {
      return;
    }

    this.initListeners();
    this.updateCrosshairShow();

    this.isInit = true;
  }

  /**
   * Initializes this controller's listeners.
   */
  protected initListeners(): void {
    this.mapModel.getModule('pointer').isActive.sub(this.handler);
  }

  /**
   * Updates whether to show this controller's map crosshair.
   */
  protected updateCrosshairShow(): void {
    this.mapModel.getModule('crosshair').show.set(this.mapModel.getModule('pointer').isActive.get());
  }

  /**
   * Destroys this controller, freeing up resources associated with it. Once destroyed, this controller will no longer
   * automatically update the map crosshair visibility.
   */
  public destroy(): void {
    this.mapModel.getModule('pointer').isActive.unsub(this.handler);
  }
}