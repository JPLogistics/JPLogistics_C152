import { NumberUnitSubject, Subscribable, Unit } from 'msfssdk';
import { Consumer, ConsumerSubject } from 'msfssdk/data';
import { NavDataFieldModel } from '../../../../Shared/UI/NavDataField/NavDataFieldModel';
import { NavDataFieldType, NavDataFieldTypeModelMap } from '../../../../Shared/UI/NavDataField/NavDataFieldType';

/**
 * A data model for an MFD navigation data bar field.
 */
export interface MFDNavDataBarFieldModel<T> extends NavDataFieldModel<T> {
  /**
   * Updates this model.
   */
  update(): void;

  /**
   * Destroys this model.
   */
  destroy(): void;
}

/** A map from navigation data field type to MFD navigational data bar field data model type. */
export type MFDNavDataBarFieldTypeModelMap = {
  [Type in keyof NavDataFieldTypeModelMap]: MFDNavDataBarFieldModel<NavDataFieldTypeModelMap[Type] extends NavDataFieldModel<infer T> ? T : never>;
}

/**
 * A factory for MFD navigation data bar field data models.
 */
export interface MFDNavDataBarFieldModelFactory {
  /**
   * Creates a navigation data bar field data model for a given type of field.
   * @param type A data field type.
   * @returns A navigation data bar field data model for the given field type.
   */
  create<T extends NavDataFieldType>(type: T): MFDNavDataBarFieldTypeModelMap[T];
}

/**
 * Infers the type of a subscribable's value.
 */
type SubscribableType<S> = S extends Subscribable<infer T> ? T : never;

/**
 * An MFD navigation data bar field data model which uses an arbitrary subscribable to provide its value and function
 * to update the value.
 */
export class MFDNavDataBarFieldGenericModel<S extends Subscribable<any>, U extends (sub: S, ...args: any[]) => void = (sub: S) => void>
  implements MFDNavDataBarFieldModel<SubscribableType<S>> {

  public readonly value: Subscribable<SubscribableType<S>>;

  /**
   * Constructor.
   * @param sub The subscribable used to provide this model's value.
   * @param updateFunc The function used to update this model's value. Can take an arbitrary number of arguments, but
   * the first must be the subscribable used to provide this model's value.
   * @param destroyFunc A function which is executed when this model is destroyed.
   */
  constructor(sub: S, protected readonly updateFunc: U, protected readonly destroyFunc?: () => void) {
    this.value = sub;
  }

  /** @inheritdoc */
  public update(): void {
    this.updateFunc(this.value as S);
  }

  /** @inheritdoc */
  public destroy(): void {
    this.destroyFunc && this.destroyFunc();
  }
}

/**
 * Extracts the length property from a tuple.
 */
// eslint-disable-next-line jsdoc/require-jsdoc
type TupleLength<T extends [...any[]]> = { length: T['length'] };

/**
 * Maps a tuple of types to a tuple of Consumers of the same types.
 */
type ConsumerTypeMap<Types extends [...any[]]> = {
  [Index in keyof Types]: Consumer<Types[Index]>;
} & TupleLength<Types>;

/**
 * Maps a tuple of types to a tuple of ConsumerSubjects providing the same types.
 */
type ConsumerSubjectTypeMap<Types extends [...any[]]> = {
  [Index in keyof Types]: ConsumerSubject<Types[Index]>;
} & TupleLength<Types>;

/**
 * Maps a tuple of types to a tuple of Subscribables providing the same types.
 */
type SubscribableTypeMap<Types extends [...any[]]> = {
  [Index in keyof Types]: Subscribable<Types[Index]>;
} & TupleLength<Types>;

/**
 * An MFD navigation data bar field data model which uses an arbitrary subscribable to provide its value and function
 * to update the value using data cached from one or more event bus consumers.
 */
export class MFDNavDataBarFieldConsumerModel<S extends Subscribable<any>, C extends [...any[]]>
  extends MFDNavDataBarFieldGenericModel<S, (sub: S, consumerSubs: Readonly<SubscribableTypeMap<C>>) => void> {

  protected readonly consumerSubs: ConsumerSubjectTypeMap<C>;

  /**
   * Constructor.
   * @param sub The subscribable used to provide this model's value.
   * @param consumers The event bus consumers used by this model.
   * @param initialValues The initial consumer values with which to initialize this model. These values will be used
   * until they are replaced by consumed values from the event bus.
   * @param updateFunc The function used to update this model's value. The first argument taken by the function is the
   * subscribable used to provide this model's value. The second argument is a tuple of Subscribables providing the
   * cached values from this model's consumers.
   */
  constructor(sub: S, consumers: ConsumerTypeMap<C>, initialValues: C, updateFunc: (sub: S, consumerSubs: Readonly<SubscribableTypeMap<C>>) => void) {
    super(sub, updateFunc, () => {
      for (let i = 0; i < this.consumerSubs.length; i++) {
        this.consumerSubs[i].destroy();
      }
    });

    this.consumerSubs = consumers.map((consumer, index) => ConsumerSubject.create(consumer, initialValues[index])) as ConsumerSubjectTypeMap<C>;
  }

  /** @inheritdoc */
  public update(): void {
    this.updateFunc(this.value as S, this.consumerSubs);
  }
}

/**
 * An MFD navigation data bar field data model which provides a NumberUnitInterface value that is derived directly
 * from an event bus consumer.
 */
export class MFDNavDataBarFieldConsumerNumberUnitModel<F extends string, U extends Unit<F> = Unit<F>> extends MFDNavDataBarFieldConsumerModel<NumberUnitSubject<F, U>, [number]> {
  /**
   * Constructor.
   * @param consumer The event bus consumer used to derive this model's value.
   * @param initialVal The initial consumer value with which to initialize this model. This value will be used until it
   * is replaced by a consumed value from the event bus.
   * @param consumerUnit The unit type of the values consumed from the event bus.
   */
  constructor(consumer: Consumer<number>, initialVal: number, consumerUnit: U) {
    super(
      NumberUnitSubject.createFromNumberUnit(consumerUnit.createNumber(initialVal)),
      [consumer],
      [initialVal],
      (sub, consumerSubs) => { sub.set(consumerSubs[0].get()); }
    );
  }
}