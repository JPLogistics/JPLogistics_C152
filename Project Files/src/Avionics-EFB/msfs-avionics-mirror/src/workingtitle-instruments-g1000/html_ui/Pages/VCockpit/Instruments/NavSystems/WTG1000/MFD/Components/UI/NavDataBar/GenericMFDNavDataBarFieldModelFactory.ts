import { LatLongInterface, NavAngleSubject, NavAngleUnit, NavAngleUnitReferenceNorth, NavMath, NumberUnitInterface, NumberUnitSubject, Subject, UnitFamily, UnitType } from 'msfssdk';
import { VNavSimVarEvents } from 'msfssdk/autopilot';
import { EventBus } from 'msfssdk/data';
import { ADCEvents, EngineEvents, GNSSEvents } from 'msfssdk/instruments';
import { LNavSimVars } from '../../../../Shared/Autopilot/LNavSimVars';
import { G1000ControlEvents } from '../../../../Shared/G1000Events';
import { MFDNavDataBarFieldConsumerModel, MFDNavDataBarFieldConsumerNumberUnitModel, MFDNavDataBarFieldGenericModel, MFDNavDataBarFieldModel, MFDNavDataBarFieldModelFactory, MFDNavDataBarFieldTypeModelMap } from './MFDNavDataBarFieldModel';
import { NavDataFieldType } from '../../../../Shared/UI/NavDataField/NavDataFieldType';
import { FlightPlanCopiedEvent, FlightPlanIndicationEvent, FlightPlannerEvents, FlightPlanOriginDestEvent, OriginDestChangeType } from 'msfssdk/flightplan';
import { ICAO } from 'msfssdk/navigation';
import { Fms } from '../../../../Shared/FlightPlan/Fms';

/**
 * A factory which creates data models for a single type of navigation data bar field.
 */
export interface MFDNavDataBarFieldTypeModelFactory<T extends NavDataFieldType> {
  /**
   * Creates a navigation data bar field data model for this factory's data field type.
   * @returns A navigation data bar field data model for this factory's data field type.
   */
  create(): MFDNavDataBarFieldTypeModelMap[T];
}

/**
 * A generic implementation of a factory for MFD navigation data bar field data models. For each data field type, a
 * single-type model factory can be registered. Once registered, the single-type model factory is used to create data
 * models for its assigned data field type.
 */
export class GenericMFDNavDataBarFieldModelFactory implements MFDNavDataBarFieldModelFactory {
  private readonly factories = new Map<NavDataFieldType, MFDNavDataBarFieldTypeModelFactory<NavDataFieldType>>();

  /**
   * Registers a single-type model factory with this factory.
   * @param type The data field type of the single-type model factory to register.
   * @param factory The single-type model factory to register.
   */
  public register<T extends NavDataFieldType>(type: T, factory: MFDNavDataBarFieldTypeModelFactory<T>): void {
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
  public create<T extends NavDataFieldType>(type: T): MFDNavDataBarFieldTypeModelMap[T] {
    const model = this.factories.get(type)?.create();

    if (!model) {
      throw new Error(`DefaultMFDNavDataBarFieldModelFactory: no single-type model factory of data field type [${type}] is registered`);
    }

    return model as MFDNavDataBarFieldTypeModelMap[T];
  }
}

/**
 * An abstract implementation of MFDNavDataBarFieldTypeModelFactory which accesses data from the event bus to use to
 * create its data models.
 */
export abstract class EventBusMFDNavDataBarFieldTypeModelFactory<T extends NavDataFieldType, E> implements MFDNavDataBarFieldTypeModelFactory<T> {
  protected readonly sub = this.bus.getSubscriber<E>();

  /**
   * Constructor.
   * @param bus The event bus.
   */
  constructor(private readonly bus: EventBus) {
  }

  /** @inheritdoc */
  public abstract create(): MFDNavDataBarFieldTypeModelMap[T];
}

/**
 * Creates data models for Bearing to Waypoint navigation data bar fields.
 */
export class MFDNavDataBarFieldBrgModelFactory extends EventBusMFDNavDataBarFieldTypeModelFactory<NavDataFieldType.BearingToWaypoint, GNSSEvents & LNavSimVars> {
  /** @inheritdoc */
  public create(): MFDNavDataBarFieldModel<NumberUnitInterface<typeof NavAngleUnit.FAMILY>> {
    return new MFDNavDataBarFieldConsumerModel(
      NavAngleSubject.createFromNavAngle(new NavAngleUnit(NavAngleUnitReferenceNorth.Magnetic, 0, 0).createNumber(0)),
      [
        this.sub.on('lnavIsTracking').whenChanged(),
        this.sub.on('lnavBrgMag').whenChanged(),
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
export class MFDNavDataBarFieldDestModelFactory extends EventBusMFDNavDataBarFieldTypeModelFactory<NavDataFieldType.Destination, FlightPlannerEvents> {
  /**
   * Constructor.
   * @param bus The event bus.
   * @param fms The flight management system.
   */
  constructor(bus: EventBus, private readonly fms: Fms) {
    super(bus);
  }

  /** @inheritdoc */
  public create(): MFDNavDataBarFieldModel<string> {
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

    return new MFDNavDataBarFieldGenericModel(
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
export class MFDNavDataBarFieldDisModelFactory extends EventBusMFDNavDataBarFieldTypeModelFactory<NavDataFieldType.DistanceToWaypoint, LNavSimVars> {
  /** @inheritdoc */
  public create(): MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Distance>> {
    return new MFDNavDataBarFieldConsumerModel(
      NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(NaN)),
      [
        this.sub.on('lnavIsTracking').whenChanged(),
        this.sub.on('lnavDis').whenChanged()
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
export class MFDNavDataBarFieldDtgModelFactory extends EventBusMFDNavDataBarFieldTypeModelFactory<NavDataFieldType.DistanceToDestination, LNavSimVars> {
  /** @inheritdoc */
  public create(): MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Distance>> {
    return new MFDNavDataBarFieldConsumerModel(
      NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(NaN)),
      [
        this.sub.on('lnavIsTracking').whenChanged(),
        this.sub.on('lnavDistanceToDestination').whenChanged()
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
export class MFDNavDataBarFieldDtkModelFactory extends EventBusMFDNavDataBarFieldTypeModelFactory<NavDataFieldType.DesiredTrack, GNSSEvents & LNavSimVars> {
  /** @inheritdoc */
  public create(): MFDNavDataBarFieldModel<NumberUnitInterface<typeof NavAngleUnit.FAMILY>> {
    return new MFDNavDataBarFieldConsumerModel(
      NavAngleSubject.createFromNavAngle(new NavAngleUnit(NavAngleUnitReferenceNorth.Magnetic, 0, 0).createNumber(0)),
      [
        this.sub.on('lnavIsTracking').whenChanged(),
        this.sub.on('lnavDtkMag').whenChanged(),
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
export class MFDNavDataBarFieldEndModelFactory extends EventBusMFDNavDataBarFieldTypeModelFactory<NavDataFieldType.Endurance, EngineEvents> {
  /** @inheritdoc */
  public create(): MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Duration>> {
    return new MFDNavDataBarFieldConsumerModel(
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
export class MFDNavDataBarFieldEtaModelFactory extends EventBusMFDNavDataBarFieldTypeModelFactory<NavDataFieldType.TimeToDestination, GNSSEvents & LNavSimVars> {
  /** @inheritdoc */
  public create(): MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Duration>> {
    return new MFDNavDataBarFieldConsumerModel(
      NumberUnitSubject.createFromNumberUnit(UnitType.HOUR.createNumber(NaN)),
      [
        this.sub.on('lnavIsTracking').whenChanged(),
        this.sub.on('lnavDistanceToDestination').whenChanged(),
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
 * Creates data models for Time To Waypoint navigation data bar fields.
 */
export class MFDNavDataBarFieldEteModelFactory extends EventBusMFDNavDataBarFieldTypeModelFactory<NavDataFieldType.TimeToWaypoint, GNSSEvents & LNavSimVars> {
  /** @inheritdoc */
  public create(): MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Duration>> {
    return new MFDNavDataBarFieldConsumerModel(
      NumberUnitSubject.createFromNumberUnit(UnitType.HOUR.createNumber(NaN)),
      [
        this.sub.on('lnavIsTracking').whenChanged(),
        this.sub.on('lnavDis').whenChanged(),
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
export class MFDNavDataBarFieldFobModelFactory extends EventBusMFDNavDataBarFieldTypeModelFactory<NavDataFieldType.FuelOnBoard, EngineEvents> {
  /** @inheritdoc */
  public create(): MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Weight>> {
    return new MFDNavDataBarFieldConsumerNumberUnitModel(
      this.sub.on('fuel_total'), 0, UnitType.GALLON_FUEL
    );
  }
}

/**
 * Creates data models for Fuel Over Destination navigation data bar fields.
 */
export class MFDNavDataBarFieldFodModelFactory extends EventBusMFDNavDataBarFieldTypeModelFactory<NavDataFieldType.FuelOverDestination, GNSSEvents & LNavSimVars & EngineEvents> {
  /** @inheritdoc */
  public create(): MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Weight>> {
    return new MFDNavDataBarFieldConsumerModel(
      NumberUnitSubject.createFromNumberUnit(UnitType.GALLON_FUEL.createNumber(NaN)),
      [
        this.sub.on('lnavIsTracking').whenChanged(),
        this.sub.on('lnavDistanceToDestination').whenChanged(),
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
export class MFDNavDataBarFieldGsModelFactory extends EventBusMFDNavDataBarFieldTypeModelFactory<NavDataFieldType.GroundSpeed, GNSSEvents> {
  /** @inheritdoc */
  public create(): MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Speed>> {
    return new MFDNavDataBarFieldConsumerNumberUnitModel(
      this.sub.on('ground_speed'), 0, UnitType.KNOT
    );
  }
}

/**
 * Creates data models for True Airspeed navigation data bar fields.
 */
export class MFDNavDataBarFieldTasModelFactory extends EventBusMFDNavDataBarFieldTypeModelFactory<NavDataFieldType.TrueAirspeed, ADCEvents> {
  /** @inheritdoc */
  public create(): MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Speed>> {
    return new MFDNavDataBarFieldConsumerNumberUnitModel(
      this.sub.on('tas'), 0, UnitType.KNOT
    );
  }
}

/**
 * Creates data models for Track Angle Error navigation data bar fields.
 */
export class MFDNavDataBarFieldTkeModelFactory extends EventBusMFDNavDataBarFieldTypeModelFactory<NavDataFieldType.TrackAngleError, GNSSEvents & LNavSimVars> {
  /** @inheritdoc */
  public create(): MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Angle>> {
    return new MFDNavDataBarFieldConsumerModel(
      NumberUnitSubject.createFromNumberUnit(UnitType.DEGREE.createNumber(NaN)),
      [
        this.sub.on('lnavIsTracking').whenChanged(),
        this.sub.on('lnavDtkMag').whenChanged(),
        this.sub.on('track_deg_magnetic').whenChanged()
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
export class MFDNavDataBarFieldTrkModelFactory extends EventBusMFDNavDataBarFieldTypeModelFactory<NavDataFieldType.GroundTrack, GNSSEvents> {
  /** @inheritdoc */
  public create(): MFDNavDataBarFieldModel<NumberUnitInterface<typeof NavAngleUnit.FAMILY>> {
    return new MFDNavDataBarFieldConsumerModel(
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
export class MFDNavDataBarFieldVsrModelFactory extends EventBusMFDNavDataBarFieldTypeModelFactory<NavDataFieldType.VerticalSpeedRequired, VNavSimVarEvents & G1000ControlEvents> {
  /** @inheritdoc */
  public create(): MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Speed>> {
    return new MFDNavDataBarFieldConsumerModel(
      NumberUnitSubject.createFromNumberUnit(UnitType.FPM.createNumber(NaN)),
      [
        this.sub.on('vnav_path_display').whenChanged(),
        this.sub.on('vnavRequiredVs').whenChanged()
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
export class MFDNavDataBarFieldXtkModelFactory extends EventBusMFDNavDataBarFieldTypeModelFactory<NavDataFieldType.CrossTrack, LNavSimVars> {
  /** @inheritdoc */
  public create(): MFDNavDataBarFieldModel<NumberUnitInterface<UnitFamily.Distance>> {
    return new MFDNavDataBarFieldConsumerModel(
      NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(NaN)),
      [
        this.sub.on('lnavIsTracking').whenChanged(),
        this.sub.on('lnavXtk').whenChanged()
      ],
      [false, 0] as [boolean, number],
      (sub, [isTracking, xtk]) => {
        sub.set(isTracking.get() ? xtk.get() : NaN);
      }
    );
  }
}