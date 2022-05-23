import { EventBus } from 'msfssdk/data';
import { Fms } from '../../flightplan/Fms';
import {
  GenericNavDataBarFieldModelFactory, NavDataBarFieldBrgModelFactory, NavDataBarFieldDestModelFactory,
  NavDataBarFieldDisModelFactory, NavDataBarFieldDtgModelFactory, NavDataBarFieldDtkModelFactory,
  NavDataBarFieldEndModelFactory, NavDataBarFieldEtaModelFactory, NavDataBarFieldEteModelFactory,
  NavDataBarFieldFobModelFactory, NavDataBarFieldFodModelFactory, NavDataBarFieldGsModelFactory,
  NavDataBarFieldIsaModelFactory, NavDataBarFieldLdgModelFactory, NavDataBarFieldTasModelFactory,
  NavDataBarFieldTkeModelFactory, NavDataBarFieldTrkModelFactory, NavDataBarFieldVsrModelFactory,
  NavDataBarFieldXtkModelFactory
} from './GenericNavDataBarFieldModelFactory';
import { NavDataFieldType } from '../navdatafield/NavDataFieldType';
import { NavDataBarFieldModelFactory, NavDataBarFieldTypeModelMap } from './NavDataBarFieldModel';

/**
 * A default implementation of NavDataBarFieldModelFactory.
 */
export class DefaultNavDataBarFieldModelFactory implements NavDataBarFieldModelFactory {
  private readonly factory: GenericNavDataBarFieldModelFactory;

  /**
   * Constructor.
   * @param bus The event bus.
   * @param fms The flight management system.
   */
  constructor(bus: EventBus, fms: Fms) {
    this.factory = new GenericNavDataBarFieldModelFactory();

    this.factory.register(NavDataFieldType.BearingToWaypoint, new NavDataBarFieldBrgModelFactory(bus));
    this.factory.register(NavDataFieldType.Destination, new NavDataBarFieldDestModelFactory(bus, fms));
    this.factory.register(NavDataFieldType.DistanceToWaypoint, new NavDataBarFieldDisModelFactory(bus));
    this.factory.register(NavDataFieldType.DistanceToDestination, new NavDataBarFieldDtgModelFactory(bus));
    this.factory.register(NavDataFieldType.DesiredTrack, new NavDataBarFieldDtkModelFactory(bus));
    this.factory.register(NavDataFieldType.Endurance, new NavDataBarFieldEndModelFactory(bus));
    this.factory.register(NavDataFieldType.TimeOfWaypointArrival, new NavDataBarFieldEtaModelFactory(bus));
    this.factory.register(NavDataFieldType.TimeToWaypoint, new NavDataBarFieldEteModelFactory(bus));
    this.factory.register(NavDataFieldType.FuelOnBoard, new NavDataBarFieldFobModelFactory(bus));
    this.factory.register(NavDataFieldType.FuelOverDestination, new NavDataBarFieldFodModelFactory(bus));
    this.factory.register(NavDataFieldType.GroundSpeed, new NavDataBarFieldGsModelFactory(bus));
    this.factory.register(NavDataFieldType.ISA, new NavDataBarFieldIsaModelFactory(bus));
    this.factory.register(NavDataFieldType.TimeOfDestinationArrival, new NavDataBarFieldLdgModelFactory(bus));
    this.factory.register(NavDataFieldType.TrueAirspeed, new NavDataBarFieldTasModelFactory(bus));
    this.factory.register(NavDataFieldType.TrackAngleError, new NavDataBarFieldTkeModelFactory(bus));
    this.factory.register(NavDataFieldType.GroundTrack, new NavDataBarFieldTrkModelFactory(bus));
    this.factory.register(NavDataFieldType.VerticalSpeedRequired, new NavDataBarFieldVsrModelFactory(bus));
    this.factory.register(NavDataFieldType.CrossTrack, new NavDataBarFieldXtkModelFactory(bus));
  }

  /**
   * Creates a navigation data bar field data model for a given type of field.
   * @param type A data bar field type.
   * @returns A navigation data bar field data model for the given field type.
   * @throws Error if an unsupported field type is specified.
   */
  public create<T extends NavDataFieldType>(type: T): NavDataBarFieldTypeModelMap[T] {
    return this.factory.create(type);
  }
}