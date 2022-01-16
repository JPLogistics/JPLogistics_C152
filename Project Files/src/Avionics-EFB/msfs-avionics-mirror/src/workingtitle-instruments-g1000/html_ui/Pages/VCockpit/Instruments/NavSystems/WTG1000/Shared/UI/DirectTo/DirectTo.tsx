import { FSComponent, GeoPoint, GeoPointSubject, NumberFormatter, Subject, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { ADCEvents, GNSSEvents } from 'msfssdk/instruments';
import { FacilitySearchType } from 'msfssdk/navigation';

import { Fms } from '../../FlightPlan/Fms';
import { UnitsUserSettings } from '../../Units/UnitsUserSettings';
import { BearingDisplay } from '../Common/BearingDisplay';
import { NumberUnitDisplay } from '../Common/NumberUnitDisplay';
import { FmsHEvent } from '../FmsHEvent';
import { NumberInput } from '../UIControls/NumberInput';
import { WaypointInput } from '../UIControls/WaypointInput';
import { UiView, UiViewProps } from '../UiView';
import { DirectToController } from './DirectToController';
import { DirectToStore } from './DirectToStore';

/**
 * The properties on the procedures popout component.
 */
export interface DirectToProps extends UiViewProps {
  /** A fms state manager. */
  fms: Fms;

  /** The event bus */
  bus: EventBus;
}

/**
 * The properties for Direct To Input Data.
 */
export interface DirectToInputData {
  /** The selected segment index for the direct to existing. */
  segmentIndex?: number;
  /** The selected leg index for the direct to existing. */
  legIndex?: number;
  /** The icao of the fix */
  icao: string;
}

/**
 * A view which provides control of the Direct-To function.
 */
export abstract class DirectTo extends UiView<DirectToProps, undefined, DirectToInputData> {
  protected readonly courseOnesRef = FSComponent.createRef<NumberInput>();
  protected readonly courseTensRef = FSComponent.createRef<NumberInput>();

  protected readonly planePosSub = GeoPointSubject.createFromGeoPoint(new GeoPoint(NaN, NaN));
  protected readonly planeHeadingSub = Subject.create(NaN);

  private readonly planePosConsumer = this.props.bus.getSubscriber<GNSSEvents>().on('gps-position').whenChanged();
  private readonly planeHeadingConsumer = this.props.bus.getSubscriber<ADCEvents>().on('hdg_deg_true').withPrecision(1);
  private readonly planePosHandler = this.onPlanePosChanged.bind(this);
  private readonly planeHeadingHandler = this.onPlaneHeadingChanged.bind(this);

  protected readonly store = new DirectToStore(this.planePosSub);
  protected readonly controller = new DirectToController(this.store, this.props.fms, this.props.viewService, this.gotoActivateButton.bind(this));

  protected readonly unitSettingManager = UnitsUserSettings.getManager(this.props.bus);

  protected isOpen = false;

  /** @inheritdoc */
  public onInputDataSet(directToInputData: DirectToInputData | undefined): void {
    if (this.isOpen) {
      this.controller.initializeTarget(directToInputData);
    }
  }

  /**
   * Sets the course subject based on the number input fields.
   */
  protected setCourse(): void {
    setTimeout(() => {
      if (!this.courseOnesRef.instance.getIsFocused() && !this.courseTensRef.instance.getIsFocused()) {
        const crs = (10 * this.store.courseTens.get()) + this.store.courseOnes.get();
        this.store.course.set(crs === 0 ? 360 : crs);
      }
    });
  }

  /** @inheritdoc */
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.DIRECTTO:
      case FmsHEvent.CLR:
        this.close();
        return true;
    }
    return false;
  }

  /** @inheritdoc */
  protected gotoActivateButton(): void {
    this.scrollController.gotoIndex(this.getActivateScrollIndex());
  }

  /**
   * Method to get the activate scroll index for this instance.
   * @returns The Activate Scroll Index.
   */
  protected getActivateScrollIndex(): number {
    return 3;
  }

  /**
   * Callback for when the Hold button is pressed.
   */
  public onHoldButtonPressed = (): void => {
    this.controller.activateSelected(true);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onViewOpened(): void {
    this.isOpen = true;

    this.planePosConsumer.handle(this.planePosHandler);
    this.planeHeadingConsumer.handle(this.planeHeadingHandler);

    this.controller.initializeTarget(this.inputData.get());
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onViewClosed(): void {
    this.isOpen = false;

    this.planePosConsumer.off(this.planePosHandler);
    this.planeHeadingConsumer.off(this.planeHeadingHandler);
  }

  /**
   * A callback which is called when the plane's current position changes.
   * @param pos The new position.
   */
  private onPlanePosChanged(pos: LatLongAlt): void {
    this.planePosSub.set(pos.lat, pos.long);
  }

  /**
   * A callback which is called when the plane's current true heading changes.
   * @param heading The new heading, in degrees.
   */
  private onPlaneHeadingChanged(heading: number): void {
    this.planeHeadingSub.set(heading);
  }

  /**
   * Renders a waypoint input component.
   * @returns a waypoint input component, as a VNode.
   */
  protected renderWaypointInput(): VNode {
    return (
      <WaypointInput
        bus={this.props.bus}
        onRegister={this.register}
        onInputEnterPressed={this.controller.inputEnterPressedHandler}
        onWaypointChanged={this.controller.waypointChangedHandler}
        onMatchedWaypointsChanged={this.controller.matchedWaypointsChangedHandler}
        selectedIcao={this.controller.inputIcao}
        filter={FacilitySearchType.None}
      />
    );
  }

  /**
   * Renders a component which displays the bearing to the store's selected waypoint.
   * @param cssClass CSS class(es) to apply to the root of the component.
   * @returns a component which displays the bearing to the store's selected waypoint, as a VNode.
   */
  protected renderBearing(cssClass?: string): VNode {
    return (
      <BearingDisplay
        value={this.store.waypointInfoStore.bearing} displayUnit={this.unitSettingManager.navAngleUnits}
        formatter={NumberFormatter.create({ precision: 1, pad: 3, nanString: '___' })}
        class={cssClass}
      />
    );
  }

  /**
   * Renders a component which displays the distance to the store's selected waypoint.
   * @param cssClass CSS class(es) to apply to the root of the component.
   * @returns a component which displays the distance to the store's selected waypoint, as a VNode.
   */
  protected renderDistance(cssClass?: string): VNode {
    return (
      <NumberUnitDisplay
        value={this.store.waypointInfoStore.distance} displayUnit={this.unitSettingManager.distanceUnitsLarge}
        formatter={NumberFormatter.create({ precision: 0.1, maxDigits: 3, forceDecimalZeroes: true, nanString: '__._' })}
        class={cssClass}
      />
    );
  }

  /**
   * Renders a component which allows the user to input the direct-to course.
   * @returns A component which allows the user to input the direct-to course, as a VNode.
   */
  protected renderCourseInput(): VNode {
    const setCourse = this.setCourse.bind(this);
    return (
      <>
        <NumberInput ref={this.courseTensRef} minValue={0} maxValue={35} wrap
          dataSubject={this.store.courseTens} increment={1} onRegister={this.register} formatter={(v): string => `${v.toFixed(0).padStart(2, '0')}`}
          onBlurred={setCourse}
        />
        <NumberInput ref={this.courseOnesRef} minValue={0} maxValue={9} wrap
          dataSubject={this.store.courseOnes} increment={1} onRegister={this.register} formatter={(v): string => `${v.toFixed(0)}°`}
          onBlurred={setCourse}
        />
      </>
    );
  }

  /**
   * A callback which is called when the Load action is executed.
   */
  protected onLoadExecuted = (): void => {
    this.controller.activateSelected();
    this.close();
  }
}
