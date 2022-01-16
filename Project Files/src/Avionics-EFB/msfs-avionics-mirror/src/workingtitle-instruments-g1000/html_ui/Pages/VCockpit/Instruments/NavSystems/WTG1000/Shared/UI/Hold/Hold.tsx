import { FSComponent, NavMath, Subject, Subscribable } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { Fms } from '../../FlightPlan/Fms';
import { HoldController } from '../Hold/HoldController';
import { HoldStore } from '../Hold/HoldStore';
import { FmsHEvent } from '../FmsHEvent';
import { TimeDistanceInput } from '../UIControls/TimeDistanceInput';
import { UiView, UiViewProps } from '../UiView';

/**
 * The properties on the procedures popout component.
 */
export interface HoldProps extends UiViewProps {
  /** A fms state manager. */
  fms: Fms;

  /** The event bus */
  bus: EventBus;
}

/**
 * The properties for Hold input data.
 */
export interface HoldInputData {
  /** The selected plan index for the hold. */
  planIndex: number;

  /** The selected segment index for the hold. */
  segmentIndex: number;

  /** The selected leg index for the hold. */
  legIndex: number;
}

/**
 * A class that displays a hold dialog.
 */
export abstract class Hold<P extends HoldProps = HoldProps> extends UiView<P, undefined, HoldInputData> {

  protected readonly store: HoldStore;
  protected readonly controller: HoldController;
  protected readonly distanceInput = FSComponent.createRef<TimeDistanceInput>();

  /**
   * Creates an instance of PFDHold.
   * @param props The props for this instance.
   */
  constructor(props: P) {
    super(props);

    this.store = new HoldStore();
    this.controller = new HoldController(this.store, props.fms);
    this.controller.reset();
  }

  /** @inheritdoc */
  public onAfterRender(): void {
    this.store.isTime.sub(v => this.distanceInput.instance.setMode(v === 0 ? true : false));
  }

  /** @inheritdoc */
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.CLR:
        this.close();
        return true;
    }

    return super.onInteractionEvent(evt);
  }

  /** @inheritdoc */
  protected onInputDataSet(input: HoldInputData | undefined): void {
    if (input !== undefined) {
      this.store.indexes.set(input);
    } else {
      this.controller.reset();
    }
  }

  /** @inheritdoc */
  protected onViewClosed(): void {
    this.controller.reset();
  }

  /**
   * Creates a subscribable which provides the name of the selected flight plan leg.
   * @returns A subscribable which provides the name of the selected flight plan leg.
   */
  protected createLegNameSubscribable(): Subscribable<string> {
    return this.store.indexes.map(indexes => {
      let leg;
      try {
        leg = this.props.fms.getFlightPlan(this.store.indexes.get().planIndex).getSegment(indexes.segmentIndex).legs[indexes.legIndex];
      } catch {
        // noop
      }

      return leg?.name ?? '';
    });
  }

  /**
   * Creates a subscribable which provides a direction string based on the set hold inbound course.
   * @returns A subscribable which provides a direction string based on the set hold inbound course.
   */
  protected createDirectionStringSubscribable(): Subscribable<string> {
    const courseString = Subject.create('');
    const courseStringHandler = (): void => {
      const course = this.store.course.get();
      courseString.set(this.controller.getDirectionString(this.store.isInbound.get() === 0 ? course : NavMath.normalizeHeading(course + 180)));
    };
    this.store.course.sub(courseStringHandler);
    this.store.isInbound.sub(courseStringHandler, true);

    return courseString;
  }
}