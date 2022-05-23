import {
  LatLongInterface, NavAngleSubject, NavAngleUnit, NavAngleUnitReferenceNorth, NavMath, NumberUnitInterface,
  NumberUnitSubject, Subject, UnitFamily, UnitType
} from 'msfssdk';
import { VNavDataEvents, VNavEvents, LNavEvents } from 'msfssdk/autopilot';
import { EventBus } from 'msfssdk/data';
import { ADCEvents, ClockEvents, EngineEvents, GNSSEvents } from 'msfssdk/instruments';
import { FlightPlanCopiedEvent, FlightPlanIndicationEvent, FlightPlannerEvents, FlightPlanOriginDestEvent, OriginDestChangeType } from 'msfssdk/flightplan';
import { ICAO } from 'msfssdk/navigation';
import { Fms } from '../../flightplan/Fms';
import { LNavDataEvents } from '../../navigation/LNavDataEvents';
import { NavDataFieldType } from '../navdatafield/NavDataFieldType';
import {
  NavDataBarFieldConsumerModel, NavDataBarFieldConsumerNumberUnitModel, NavDataBarFieldGenericModel,
  NavDataBarFieldModel, NavDataBarFieldModelFactory, NavDataBarFieldTypeModelMap
} from './NavDataBarFieldModel';

/**
 * A factory which creates data models for a single type of navigation data bar field.
 */
export interface NavDataBarFieldTypeModelFactory<T extends NavDataFieldType> {
  /**
   * Creates a navigation data bar field data model for this factory's data field type.
   * @returns A navigation data bar field data model for this factory's data field type.
   */
  create(): NavDataBarFieldTypeModelMap[T];
}

/**
 * A generic implementation of a factory for navigation data bar field data models. For each data field type, a
 * single-type model factory can be registered. Once registered, the single-type model factory is used to create data
 * models for its assigned data field type.
 */
export class GenericNavDataBarFieldModelFactory implements NavDataBarFieldModelFactory {
  private readonly factories = new Map<NavDataFieldType, NavDataBarFieldTypeModelFactory<NavDataFieldType>>();

  /**
   * Registers a single-type model factory with this factory.
   * @param type The data field type of the single-type model factory to register.
   * @param factory The single-type model factory to register.
   */
  public register<T extends NavDataFieldType>(type: T, factory: NavDataBarFieldTypeModelFactory<T>): void {
    this.factories.set(type, factory);
  }

  /**
   * Deregisters a single-type model factory from this factory.
   * @param type The data field type of the single-type model factory to deregister.
   * @returns Whether a single-type model factory was deregistered.
   */
  public deregister<T extends NavDataFieldType>(type: T): boolean {
    return this.factories.delete(type);
  }

  /**
   * Creates a navigation data bar field data model for a given type of field.
   * @param type A data bar field type.
   * @returns A navigation data bar field data model for the given field type.
   * @throws Error if an unsupported field type is specified.
   */
  public create<T extends NavDataFieldType>(type: T): NavDataBarFieldTypeModelMap[T] {
    const model = this.factories.get(type)?.create();

    if (!model) {
      throw new Error(`GenericNavDataBarFieldModelFactory: no single-type model factory of data field type [${type}] is registered`);
    }

    return model as NavDataBarFieldTypeModelMap[T];
  }
}

/**
 * An abstract implementation of {@link NavDataBarFieldTypeModelFactory} which accesses data from the event bus to use
 * to create its data models.
 */
export abstract class EventBusNavDataBarFieldTypeModelFactory<T extends NavDataFieldType, E> implements NavDataBarFieldTypeModelFactory<T> {
  protected readonly sub = this.bus.getSubscriber<E>();

  /**
   * Constructor.
   * @param bus The event bus.
   */
  constructor(private readonly bus: EventBus) {
  }

  /** @inheritdoc */
  public abstract create(): NavDataBarFieldTypeModelMap[T];
}

/**
 * Creates data models for Bearing to Waypoint navigation data bar fields.
 */
export class NavDataBarFieldBrgModelFactory extends EventBusNavDataBarFieldTypeModelFactory<NavDataFieldType.BearingToWaypoint, GNSSEvents & LNavEvents & LNavDataEvents> {
  /** @inheritdoc */
  public create(): NavDataBarFieldModel<NumberUnitInterface<typeof NavAngleUnit.FAMILY>> {
    return new NavDataBarFieldConsumerModel(
      NavAngleSubject.createFromNavAngle(new NavAngleUnit(NavAngleUnitReferenceNorth.Magnetic, 0, 0).createNumber(0)),
      [
        this.sub.on('lnav_is_tracking').whenChanged(),
        this.sub.on('lnavdata_waypoint_bearing_mag').whenChanged(),
        this.sub.on('gps-position')
      ],
      [false, 0, { lat: 0, long: 0 }] as [boolean, number, LatLongInterface],
      (sub, [isTracking, bearing, planePos]) => {
        const latLong = planePos.get();
        sub.set(isTracking.get() ? bearing.get() : NaN, latLong.lat, latLong.long);
      }
    );
  }
}

/**
 * Creates data models for Bearing to Waypoint navigation data bar fields.
 */
export class NavDataBarFieldDestModelFactory extends EventBusNavDataBarFieldTypeModelFactory<NavDataFieldType.Destination, FlightPlannerEvents> {
  /**
   * Constructor.
   * @param bus The event bus.
   * @param fms The flight management system.
   */
  constructor(bus: EventBus, private readonly fms: Fms) {
    super(bus);
  }

  /** @inheritdoc */
  public create(): NavDataBarFieldModel<string> {
    let destinationIdent = '____';

    const originDestHandler = (event: FlightPlanOriginDestEvent): void => {
      if (event.planIndex === Fms.PRIMARY_PLAN_INDEX && event.type === OriginDestChangeType.DestinationAdded) {
        destinationIdent = event.airport === undefined ? '____' : ICAO.getIdent(event.airport);
      } else if (event.type === OriginDestChangeType.DestinationRemoved) {
        destinationIdent = '____';
      }
    };
    const loadHandler = (event: FlightPlanIndicationEvent): void => {
      if (event.planIndex !== Fms.PRIMARY_PLAN_INDEX) {
        return;
      }

      const primaryPlan = this.fms.getPrimaryFlightPlan();
      destinationIdent = primaryPlan.destinationAirport === undefined ? '____' : ICAO.getIdent(primaryPlan.destinationAirport);
    };
    const copyHandler = (event: FlightPlanCopiedEvent): void => {
      if (event.targetPlanIndex !== Fms.PRIMARY_PLAN_INDEX) {
        return;
      }

      const primaryPlan = this.fms.getPrimaryFlightPlan();
      destinationIdent = primaryPlan.destinationAirport === undefined ? '____' : ICAO.getIdent(primaryPlan.destinationAirport);
    };

    const originDestConsumer = this.sub.on('fplOriginDestChanged');
    originDestConsumer.handle(originDestHandler);

    const loadConsumer = this.sub.on('fplLoaded');
    loadConsumer.handle(loadHandler);

    const copyConsumer = this.sub.on('fplCopied');
    copyConsumer.handle(copyHandler);

    return new NavDataBarFieldGenericModel(
      Subject.create('____'),
      (sub) => {
        sub.set(destinationIdent);
      },
      () => {
        originDestConsumer.off(originDestHandler);
        loadConsumer.off(loadHandler);
        copyConsumer.off(copyHandler);
      }
    );
  }
}

/**
 * Creates data models for Distance to Waypoint navigation data bar fields.
 */
export class NavDataBarFieldDisModelFactory extends EventBusNavDataBarFieldTypeModelFactory<NavDataFieldType.DistanceToWaypoint, LNavEvents & LNavDataEvents> {
  /** @inheritdoc */
  public create(): NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Distance>> {
    return new NavDataBarFieldConsumerModel(
      NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(NaN)),
      [
        this.sub.on('lnav_is_tracking').whenChanged(),
        this.sub.on('lnavdata_waypoint_distance').whenChanged()
      ],
      [false, 0] as [boolean, number],
      (sub, [isTracking, distance]) => {
        sub.set(isTracking.get() ? distance.get() : NaN);
      }
    );
  }
}

/**
 * Creates data models for Distance to Destination navigation data bar fields.
 */
export class NavDataBarFieldDtgModelFactory extends EventBusNavDataBarFieldTypeModelFactory<NavDataFieldType.DistanceToDestination, LNavEvents & LNavDataEvents> {
  /** @inheritdoc */
  public create(): NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Distance>> {
    return new NavDataBarFieldConsumerModel(
      NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(NaN)),
      [
        this.sub.on('lnav_is_tracking').whenChanged(),
        this.sub.on('lnavdata_destination_distance').whenChanged()
      ],
      [false, 0] as [boolean, number],
      (sub, [isTracking, distance]) => {
        sub.set(isTracking.get() ? distance.get() : NaN);
      }
    );
  }
}

/**
 * Creates data models for Desired Track navigation data bar fields.
 */
export class NavDataBarFieldDtkModelFactory extends EventBusNavDataBarFieldTypeModelFactory<NavDataFieldType.DesiredTrack, GNSSEvents & LNavEvents & LNavDataEvents> {
  /** @inheritdoc */
  public create(): NavDataBarFieldModel<NumberUnitInterface<typeof NavAngleUnit.FAMILY>> {
    return new NavDataBarFieldConsumerModel(
      NavAngleSubject.createFromNavAngle(new NavAngleUnit(NavAngleUnitReferenceNorth.Magnetic, 0, 0).createNumber(0)),
      [
        this.sub.on('lnav_is_tracking').whenChanged(),
        this.sub.on('lnavdata_dtk_mag').whenChanged(),
        this.sub.on('gps-position')
      ],
      [false, 0, { lat: 0, long: 0 }] as [boolean, number, LatLongInterface],
      (sub, [isTracking, track, planePos]) => {
        const latLong = planePos.get();
        sub.set(isTracking.get() ? track.get() : NaN, latLong.lat, latLong.long);
      }
    );
  }
}

/**
 * Creates data models for Endurance navigation data bar fields.
 */
export class NavDataBarFieldEndModelFactory extends EventBusNavDataBarFieldTypeModelFactory<NavDataFieldType.Endurance, EngineEvents> {
  /** @inheritdoc */
  public create(): NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Duration>> {
    return new NavDataBarFieldConsumerModel(
      NumberUnitSubject.createFromNumberUnit(UnitType.HOUR.createNumber(NaN)),
      [
        this.sub.on('fuel_total').whenChanged(),
        this.sub.on('fuel_flow_total').whenChanged()
      ],
      [0, 0] as [number, number],
      (sub, [fuelRemaining, fuelFlow]) => {
        let endurance = NaN;
        const fuelFlowGph = fuelFlow.get();
        if (fuelFlowGph > 0) {
          const fuelGal = fuelRemaining.get();
          endurance = fuelGal / fuelFlowGph;
        }
        sub.set(endurance);
      }
    );
  }
}

/**
 * Creates data models for Time To Destination navigation data bar fields.
 */
export class NavDataBarFieldEnrModelFactory extends EventBusNavDataBarFieldTypeModelFactory<NavDataFieldType.TimeToDestination, GNSSEvents & LNavEvents & LNavDataEvents> {
  /** @inheritdoc */
  public create(): NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Duration>> {
    return new NavDataBarFieldConsumerModel(
      NumberUnitSubject.createFromNumberUnit(UnitType.HOUR.createNumber(NaN)),
      [
        this.sub.on('lnav_is_tracking').whenChanged(),
        this.sub.on('lnavdata_destination_distance').whenChanged(),
        this.sub.on('ground_speed').whenChanged()
      ],
      [false, 0, 0] as [boolean, number, number],
      (sub, [isTracking, distance, gs]) => {
        let time = NaN;
        if (isTracking.get()) {
          const gsKnots = gs.get();
          if (gsKnots > 30) {
            const distanceNM = distance.get();
            time = distanceNM / gsKnots;
          }
        }
        sub.set(time);
      }
    );
  }
}

/**
 * Creates data models for Estimated Time of Arrival navigation data bar fields.
 */
export class NavDataBarFieldEtaModelFactory
  extends EventBusNavDataBarFieldTypeModelFactory<NavDataFieldType.TimeOfWaypointArrival, GNSSEvents & LNavEvents & LNavDataEvents & ClockEvents> {

  /** @inheritdoc */
  public create(): NavDataBarFieldModel<number> {
    return new NavDataBarFieldConsumerModel(
      Subject.create(NaN),
      [
        this.sub.on('lnav_is_tracking').whenChanged(),
        this.sub.on('lnavdata_waypoint_distance').whenChanged(),
        this.sub.on('ground_speed').whenChanged(),
        this.sub.on('simTime')
      ],
      [false, 0, 0, NaN] as [boolean, number, number, number],
      (sub, [isTracking, distance, gs, time]) => {
        let eta = NaN;
        if (isTracking.get()) {
          const gsKnots = gs.get();
          if (gsKnots > 30) {
            const distanceNM = distance.get();
            eta = UnitType.HOUR.convertTo(distanceNM / gsKnots, UnitType.MILLISECOND) + time.get();
          }
        }
        sub.set(eta);
      }
    );
  }
}

/**
 * Creates data models for Time To Waypoint navigation data bar fields.
 */
export class NavDataBarFieldEteModelFactory extends EventBusNavDataBarFieldTypeModelFactory<NavDataFieldType.TimeToWaypoint, GNSSEvents & LNavEvents & LNavDataEvents> {
  /** @inheritdoc */
  public create(): NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Duration>> {
    return new NavDataBarFieldConsumerModel(
      NumberUnitSubject.createFromNumberUnit(UnitType.HOUR.createNumber(NaN)),
      [
        this.sub.on('lnav_is_tracking').whenChanged(),
        this.sub.on('lnavdata_waypoint_distance').whenChanged(),
        this.sub.on('ground_speed').whenChanged()
      ],
      [false, 0, 0] as [boolean, number, number],
      (sub, [isTracking, distance, gs]) => {
        let time = NaN;
        if (isTracking.get()) {
          const gsKnots = gs.get();
          if (gsKnots > 30) {
            const distanceNM = distance.get();
            time = distanceNM / gsKnots;
          }
        }
        sub.set(time);
      }
    );
  }
}

/**
 * Creates data models for Fuel on Board navigation data bar fields.
 */
export class NavDataBarFieldFobModelFactory extends EventBusNavDataBarFieldTypeModelFactory<NavDataFieldType.FuelOnBoard, EngineEvents> {
  /** @inheritdoc */
  public create(): NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Weight>> {
    return new NavDataBarFieldConsumerNumberUnitModel(
      this.sub.on('fuel_total'), 0, UnitType.GALLON_FUEL
    );
  }
}

/**
 * Creates data models for Fuel Over Destination navigation data bar fields.
 */
export class NavDataBarFieldFodModelFactory
  extends EventBusNavDataBarFieldTypeModelFactory<NavDataFieldType.FuelOverDestination, GNSSEvents & LNavEvents & LNavDataEvents & EngineEvents> {

  /** @inheritdoc */
  public create(): NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Weight>> {
    return new NavDataBarFieldConsumerModel(
      NumberUnitSubject.createFromNumberUnit(UnitType.GALLON_FUEL.createNumber(NaN)),
      [
        this.sub.on('lnav_is_tracking').whenChanged(),
        this.sub.on('lnavdata_destination_distance').whenChanged(),
        this.sub.on('ground_speed').whenChanged(),
        this.sub.on('fuel_total').whenChanged(),
        this.sub.on('fuel_flow_total').whenChanged()
      ],
      [false, 0, 0, 0, 0] as [boolean, number, number, number, number],
      (sub, [isTracking, distance, gs, fuelRemaining, fuelFlow]) => {
        let fod = NaN;
        if (isTracking.get()) {
          const gsKnots = gs.get();
          const fuelFlowGph = fuelFlow.get();
          if (gsKnots > 30 && fuelFlowGph > 0) {
            const distanceNM = distance.get();
            const fuelGal = fuelRemaining.get();
            fod = fuelGal - distanceNM / gsKnots * fuelFlowGph;
          }
        }
        sub.set(fod);
      }
    );
  }
}

/**
 * Creates data models for Ground Speed navigation data bar fields.
 */
export class NavDataBarFieldGsModelFactory extends EventBusNavDataBarFieldTypeModelFactory<NavDataFieldType.GroundSpeed, GNSSEvents> {
  /** @inheritdoc */
  public create(): NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Speed>> {
    return new NavDataBarFieldConsumerNumberUnitModel(
      this.sub.on('ground_speed'), 0, UnitType.KNOT
    );
  }
}

/**
 * Creates data models for ISA navigation data bar fields.
 */
export class NavDataBarFieldIsaModelFactory extends EventBusNavDataBarFieldTypeModelFactory<NavDataFieldType.ISA, ADCEvents> {
  /** @inheritdoc */
  public create(): NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Temperature>> {
    return new NavDataBarFieldConsumerNumberUnitModel(
      this.sub.on('isa_temp_c'), 0, UnitType.CELSIUS
    );
  }
}

/**
 * Creates data models for Estimated Time of Arrival at Destination navigation data bar fields.
 */
export class NavDataBarFieldLdgModelFactory
  extends EventBusNavDataBarFieldTypeModelFactory<NavDataFieldType.TimeOfDestinationArrival, GNSSEvents & LNavEvents & LNavDataEvents & ClockEvents> {

  /** @inheritdoc */
  public create(): NavDataBarFieldModel<number> {
    return new NavDataBarFieldConsumerModel(
      Subject.create(NaN),
      [
        this.sub.on('lnav_is_tracking').whenChanged(),
        this.sub.on('lnavdata_destination_distance').whenChanged(),
        this.sub.on('ground_speed').whenChanged(),
        this.sub.on('simTime')
      ],
      [false, 0, 0, NaN] as [boolean, number, number, number],
      (sub, [isTracking, distance, gs, time]) => {
        let eta = NaN;
        if (isTracking.get()) {
          const gsKnots = gs.get();
          if (gsKnots > 30) {
            const distanceNM = distance.get();
            eta = UnitType.HOUR.convertTo(distanceNM / gsKnots, UnitType.MILLISECOND) + time.get();
          }
        }
        sub.set(eta);
      }
    );
  }
}

/**
 * Creates data models for True Airspeed navigation data bar fields.
 */
export class NavDataBarFieldTasModelFactory extends EventBusNavDataBarFieldTypeModelFactory<NavDataFieldType.TrueAirspeed, ADCEvents> {
  /** @inheritdoc */
  public create(): NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Speed>> {
    return new NavDataBarFieldConsumerNumberUnitModel(
      this.sub.on('tas'), 0, UnitType.KNOT
    );
  }
}

/**
 * Creates data models for Track Angle Error navigation data bar fields.
 */
export class NavDataBarFieldTkeModelFactory extends EventBusNavDataBarFieldTypeModelFactory<NavDataFieldType.TrackAngleError, GNSSEvents & LNavEvents & LNavDataEvents> {
  /** @inheritdoc */
  public create(): NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Angle>> {
    return new NavDataBarFieldConsumerModel(
      NumberUnitSubject.createFromNumberUnit(UnitType.DEGREE.createNumber(NaN)),
      [
        this.sub.on('lnav_is_tracking').whenChanged(),
        this.sub.on('lnavdata_dtk_true').whenChanged(),
        this.sub.on('track_deg_true').whenChanged()
      ],
      [false, 0, 0] as [boolean, number, number],
      (sub, [isTracking, dtk, track]) => {
        sub.set(isTracking.get() ? NavMath.diffAngle(dtk.get(), track.get()) : NaN);
      }
    );
  }
}

/**
 * Creates data models for Ground Track navigation data bar fields.
 */
export class NavDataBarFieldTrkModelFactory extends EventBusNavDataBarFieldTypeModelFactory<NavDataFieldType.GroundTrack, GNSSEvents> {
  /** @inheritdoc */
  public create(): NavDataBarFieldModel<NumberUnitInterface<typeof NavAngleUnit.FAMILY>> {
    return new NavDataBarFieldConsumerModel(
      NavAngleSubject.createFromNavAngle(new NavAngleUnit(NavAngleUnitReferenceNorth.Magnetic, 0, 0).createNumber(0)),
      [
        this.sub.on('track_deg_magnetic'),
        this.sub.on('gps-position')
      ],
      [0, { lat: 0, long: 0 }] as [number, LatLongInterface],
      (sub, [track, planePos]) => {
        const latLong = planePos.get();
        sub.set(track.get(), latLong.lat, latLong.long);
      }
    );
  }
}

/**
 * Creates data models for Vertical Speed Required navigation data bar fields.
 */
export class NavDataBarFieldVsrModelFactory extends EventBusNavDataBarFieldTypeModelFactory<NavDataFieldType.VerticalSpeedRequired, VNavDataEvents & VNavEvents> {
  /** @inheritdoc */
  public create(): NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Speed>> {
    return new NavDataBarFieldConsumerModel(
      NumberUnitSubject.createFromNumberUnit(UnitType.FPM.createNumber(NaN)),
      [
        this.sub.on('vnav_path_display').whenChanged(),
        this.sub.on('vnav_required_vs').whenChanged()
      ],
      [false, 0] as [boolean, number],
      (sub, [shouldDisplay, vsr]) => {
        sub.set(shouldDisplay.get() ? vsr.get() : NaN);
      }
    );
  }
}

/**
 * Creates data models for Cross Track navigation data bar fields.
 */
export class NavDataBarFieldXtkModelFactory extends EventBusNavDataBarFieldTypeModelFactory<NavDataFieldType.CrossTrack, LNavEvents & LNavDataEvents> {
  /** @inheritdoc */
  public create(): NavDataBarFieldModel<NumberUnitInterface<UnitFamily.Distance>> {
    return new NavDataBarFieldConsumerModel(
      NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(NaN)),
      [
        this.sub.on('lnav_is_tracking').whenChanged(),
        this.sub.on('lnavdata_xtk').whenChanged()
      ],
      [false, 0] as [boolean, number],
      (sub, [isTracking, xtk]) => {
        sub.set(isTracking.get() ? xtk.get() : NaN);
      }
    );
  }
}