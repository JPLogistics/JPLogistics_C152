import { FSComponent, Subject, VNode } from 'msfssdk';
import { EventBus, Consumer, ControlPublisher } from 'msfssdk/data';
import { FacilityLoader } from 'msfssdk/navigation';
import { ADCEvents, GNSSEvents } from 'msfssdk/instruments';

import { Fms } from '../../../Shared/FlightPlan/Fms';
import { UiViewProps, UiView } from '../../../Shared/UI/UiView';
import { NearbyAirport, NearestStore } from '../../../Shared/UI/Controllers/NearestStore';
import { NearestController } from '../../../Shared/UI/Controllers/NearestController';
import { ScrollBar } from '../../../Shared/UI/ScrollBar';
import { List } from '../../../Shared/UI/List';
import { FmsHEvent } from '../../../Shared/UI/FmsHEvent';
import { UiControl } from '../../../Shared/UI/UiControl';
import { NearestAirportItem } from './NearestAirportItem';

import './Nearest.css';

/**
 * The properties on the nearest airports popout component.
 */
interface NearestProps extends UiViewProps {
  /** An instance of the event bus. */
  bus: EventBus;
  /** A fms state manager. */
  fms: Fms;
  /** A facility loader. */
  loader: FacilityLoader
  /** A ControlPublisher */
  publisher: ControlPublisher
}

/**
 * The PFD nearest airports popout.
 */
export class Nearest extends UiView<NearestProps> {
  private readonly nearestListContainerRef = FSComponent.createRef<HTMLElement>();
  private readonly noneMsgRef = FSComponent.createRef<HTMLDivElement>();

  private readonly store: NearestStore;
  private readonly controller: NearestController;
  private readonly planePosConsumer: Consumer<LatLongAlt>;
  private readonly planeHeadingConsumer: Consumer<number>;
  private readonly publisher: ControlPublisher;

  private readonly planePosHandler = this.onGps.bind(this);
  private readonly planeHeadingHandler = this.onPlaneHeadingChanged.bind(this);

  /**
   * Creates an instance of a nearest airport box.
   * @param props The props.
   */
  constructor(props: NearestProps) {
    super(props);
    this.store = new NearestStore(this.props.loader);
    this.publisher = this.props.publisher;
    this.controller = new NearestController(this.store, this.publisher);
    this.planePosConsumer = this.props.bus.getSubscriber<GNSSEvents>().on('gps-position').atFrequency(1);
    this.planeHeadingConsumer = this.props.bus.getSubscriber<ADCEvents>().on('hdg_deg_true').atFrequency(1);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onAfterRender(): void {
    this.store.airportCount.sub(this.onAirportCountChanged.bind(this), true);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.UPPER_PUSH:
        this.toggleScroll();
        return true;
      case FmsHEvent.CLR:
        this.close();
        return true;
    }

    return false;
  }

  /**
   * Set up the strobed update when the nearest popup is open.
   */
  protected onViewOpened(): void {
    this.setScrollEnabled(true);
    this.scrollController.gotoFirst();

    this.planePosConsumer.handle(this.planePosHandler);
    this.planeHeadingConsumer.handle(this.planeHeadingHandler);
  }

  /**
   * When the popup is closed, kill the update to save cycles.
   */
  protected onViewClosed(): void {
    this.planePosConsumer.off(this.planePosHandler);
    this.planeHeadingConsumer.off(this.planeHeadingHandler);
  }

  /**
   * Handle a GPS update.
   * @param pos The current LatLongAlt
   */
  private onGps(pos: LatLongAlt): void {
    this.store.planePos.set(pos.lat, pos.long);
  }

  /**
   * A callback which is called when the airplane's true heading changes.
   * @param heading The airplane's current true heading.
   */
  private onPlaneHeadingChanged(heading: number): void {
    this.store.planeHeading.set(heading);
  }

  /**
   * A callback which is called when the number of airports in the nearest list changes.
   * @param count The number of airports in the nearest list.
   */
  private onAirportCountChanged(count: number): void {
    if (count === 0) {
      this.noneMsgRef.instance.style.display = '';
    } else {
      this.noneMsgRef.instance.style.display = 'none';
    }
  }

  public buildNearestItem = (data: Subject<NearbyAirport>, registerFn: (ctrl: UiControl) => void): VNode => {
    return (
      <NearestAirportItem
        onRegister={registerFn} data={data} planeHeading={this.store.planeHeading}
        directToHandler={this.controller.onDirectIdentHandler}
        frequencyHandler={this.controller.onEnterFreqHandler}
      />
    );
  }

  /**
   * Render the component.
   * @returns a VNode
   */
  public render(): VNode {
    return (
      <div class='popout-dialog pfd-nearest-airport' ref={this.viewContainerRef}>
        <h1>{this.props.title}</h1>
        <div class='nearest-airport-popout-container' ref={this.nearestListContainerRef} >
          <List onRegister={this.register} data={this.store.nearestSubjectList} renderItem={this.buildNearestItem} scrollContainer={this.nearestListContainerRef} />
          <div ref={this.noneMsgRef} class='nearest-airport-none'>None within 200<span class='nearest-airport-none-unit'>NM</span></div>
        </div>
        <ScrollBar />
      </div>
    );
  }
}