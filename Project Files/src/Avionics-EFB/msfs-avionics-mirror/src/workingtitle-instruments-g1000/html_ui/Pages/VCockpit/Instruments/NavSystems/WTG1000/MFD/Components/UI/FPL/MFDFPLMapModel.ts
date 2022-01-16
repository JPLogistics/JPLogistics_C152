import { MapModel } from 'msfssdk/components/map';
import { TCAS } from 'msfssdk/traffic';
import { NavMapModel, NavMapModelModules, NavMapModelOptions } from '../../../../Shared/UI/NavMap/NavMapModel';
import { MapFlightPlanFocusModule } from '../../../../Shared/Map/Modules/MapFlightPlanFocusModule';
import { EventBus } from 'msfssdk/data';

/**
 * Modules available in a MFDFPLMapModel.
 */
export interface MFDFPLMapModelModules extends NavMapModelModules {
  /** Focus module. */
  focus: MapFlightPlanFocusModule;
}

/**
 * Class for creating MFD FPL map models.
 */
export class MFDFPLMapModel {
  /**
   * Creates an instance of an MFD FPL map model.
   * @param bus The event bus.
   * @param tcas A TCAS to use to get traffic avoidance information.
   * @param options Initialization options for the new model.
   * @returns a navmap model instance.
   */
  public static createModel(bus: EventBus, tcas: TCAS, options?: NavMapModelOptions): MapModel<MFDFPLMapModelModules> {
    const model = NavMapModel.createModel(bus, tcas, options) as MapModel<MFDFPLMapModelModules>;

    model.addModule('focus', new MapFlightPlanFocusModule());

    return model;
  }
}