import { EventBus } from 'msfssdk/data';
import { Fms } from '../../../../Shared/FlightPlan/Fms';
import { NavDataFieldType } from '../../../../Shared/UI/NavDataField/NavDataFieldType';
import {
  GenericMFDNavDataBarFieldModelFactory, MFDNavDataBarFieldBrgModelFactory, MFDNavDataBarFieldDestModelFactory,
  MFDNavDataBarFieldDisModelFactory, MFDNavDataBarFieldDtgModelFactory, MFDNavDataBarFieldDtkModelFactory,
  MFDNavDataBarFieldEndModelFactory, MFDNavDataBarFieldEtaModelFactory, MFDNavDataBarFieldEteModelFactory,
  MFDNavDataBarFieldFobModelFactory, MFDNavDataBarFieldFodModelFactory, MFDNavDataBarFieldGsModelFactory,
  MFDNavDataBarFieldTasModelFactory, MFDNavDataBarFieldTkeModelFactory, MFDNavDataBarFieldTrkModelFactory,
  MFDNavDataBarFieldVsrModelFactory, MFDNavDataBarFieldXtkModelFactory
} from './GenericMFDNavDataBarFieldModelFactory';
import { MFDNavDataBarFieldModelFactory, MFDNavDataBarFieldTypeModelMap } from './MFDNavDataBarFieldModel';

/**
 * A default implementation of MFDNavDataBarFieldModelFactory.
 */
export class DefaultMFDNavDataBarFieldModelFactory implements MFDNavDataBarFieldModelFactory {
  private readonly factory: GenericMFDNavDataBarFieldModelFactory;

  /**
   * Constructor.
   * @param bus The event bus.
   * @param fms The flight management system.
   */
  constructor(bus: EventBus, fms: Fms) {
    this.factory = new GenericMFDNavDataBarFieldModelFactory();

    this.factory.register(NavDataFieldType.BearingToWaypoint, new MFDNavDataBarFieldBrgModelFactory(bus));
    this.factory.register(NavDataFieldType.Destination, new MFDNavDataBarFieldDestModelFactory(bus, fms));
    this.factory.register(NavDataFieldType.DistanceToWaypoint, new MFDNavDataBarFieldDisModelFactory(bus));
    this.factory.register(NavDataFieldType.DistanceToDestination, new MFDNavDataBarFieldDtgModelFactory(bus));
    this.factory.register(NavDataFieldType.DesiredTrack, new MFDNavDataBarFieldDtkModelFactory(bus));
    this.factory.register(NavDataFieldType.Endurance, new MFDNavDataBarFieldEndModelFactory(bus));
    this.factory.register(NavDataFieldType.TimeToDestination, new MFDNavDataBarFieldEtaModelFactory(bus));
    this.factory.register(NavDataFieldType.TimeToWaypoint, new MFDNavDataBarFieldEteModelFactory(bus));
    this.factory.register(NavDataFieldType.FuelOnBoard, new MFDNavDataBarFieldFobModelFactory(bus));
    this.factory.register(NavDataFieldType.FuelOverDestination, new MFDNavDataBarFieldFodModelFactory(bus));
    this.factory.register(NavDataFieldType.GroundSpeed, new MFDNavDataBarFieldGsModelFactory(bus));
    this.factory.register(NavDataFieldType.TrueAirspeed, new MFDNavDataBarFieldTasModelFactory(bus));
    this.factory.register(NavDataFieldType.TrackAngleError, new MFDNavDataBarFieldTkeModelFactory(bus));
    this.factory.register(NavDataFieldType.GroundTrack, new MFDNavDataBarFieldTrkModelFactory(bus));
    this.factory.register(NavDataFieldType.VerticalSpeedRequired, new MFDNavDataBarFieldVsrModelFactory(bus));
    this.factory.register(NavDataFieldType.CrossTrack, new MFDNavDataBarFieldXtkModelFactory(bus));
  }

  /**
   * Creates a navigation data bar field data model for a given type of field.
   * @param type A data bar field type.
   * @returns A navigation data bar field data model for the given field type.
   * @throws Error if an unsupported field type is specified.
   */
  public create<T extends NavDataFieldType>(type: T): MFDNavDataBarFieldTypeModelMap[T] {
    return this.factory.create(type);
  }
}