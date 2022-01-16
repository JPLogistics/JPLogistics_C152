import { UnitType } from 'msfssdk';
import { MapIndexedRangeModule, MapModel, MapOwnAirplaneIconModule, MapOwnAirplanePropsModule } from 'msfssdk/components/map';
import { TCAS } from 'msfssdk/traffic';
import { MapOrientationModule } from '../../Map/Modules/MapOrientationModule';
import { MapTrafficModule } from '../../Map/Modules/MapTrafficModule';

/**
 * Modules available in a traffic map model.
 */
export interface TrafficMapModelModules {
  /** Range module. */
  range: MapIndexedRangeModule;

  /** Orientation module. */
  orientation: MapOrientationModule;

  /** Own airplane properties module. */
  ownAirplaneProps: MapOwnAirplanePropsModule;

  /** Own airplane icon module. */
  ownAirplaneIcon: MapOwnAirplaneIconModule;

  /** Traffic module. */
  traffic: MapTrafficModule;
}

/**
 * Class for creating traffic map models.
 */
export class TrafficMapModel {
  public static readonly DEFAULT_RANGES = [
    ...[
      500,
      500,
      500,
      1000,
      1000,
      1000,
      2000,
      2000
    ].map(value => UnitType.FOOT.createNumber(value)),
    ...[
      1,
      1,
      2,
      2,
      6,
      6,
      12,
      12,
      24,
      24,
      40,
      40,
      40,
      40,
      40,
      40,
      40,
      40,
      40,
      40
    ].map(value => UnitType.NMILE.createNumber(value))
  ];

  /**
   * Creates an instance of a traffic map model.
   * @param tcas A TCAS.
   * @returns a traffic map model instance.
   */
  public static createModel(tcas: TCAS): MapModel<TrafficMapModelModules> {
    const model = new MapModel<TrafficMapModelModules>();

    model.addModule('range', new MapIndexedRangeModule());
    model.addModule('orientation', new MapOrientationModule());
    model.addModule('ownAirplaneProps', new MapOwnAirplanePropsModule());
    model.addModule('ownAirplaneIcon', new MapOwnAirplaneIconModule());
    model.addModule('traffic', new MapTrafficModule(tcas));

    model.getModule('range').nominalRanges.set(TrafficMapModel.DEFAULT_RANGES);

    return model;
  }
}