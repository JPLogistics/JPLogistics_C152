import { ObjectSubject, Subject, UnitType } from 'msfssdk';
import { AltitudeSelectManager, AltitudeSelectManagerOptions, APAltitudeModes, APConfig, APLateralModes, APStateManager, APVerticalModes, Autopilot, MetricAltitudeSettingsManager } from 'msfssdk/autopilot';
import { EventBus } from 'msfssdk/data';
import { FlightPlanner } from 'msfssdk/flightplan';
import { APEvents } from 'msfssdk/instruments';
import { G1000ControlEvents } from '../G1000Events';
import { FmaData } from './FmaData';

/**
 * A Garmin GFC700 autopilot.
 */
export class G1000Autopilot extends Autopilot {
  private static readonly ALT_SELECT_OPTIONS: AltitudeSelectManagerOptions = {
    supportMetric: true,
    minValue: UnitType.FOOT.createNumber(-1000),
    maxValue: UnitType.FOOT.createNumber(50000),
    inputIncrLargeThreshold: 999,
    incrSmall: UnitType.FOOT.createNumber(100),
    incrLarge: UnitType.FOOT.createNumber(1000),
    incrSmallMetric: UnitType.METER.createNumber(50),
    incrLargeMetric: UnitType.METER.createNumber(500),
    initToIndicatedAlt: true
  };

  public readonly externalAutopilotInstalled = Subject.create<boolean>(false);
  protected readonly lateralArmedModeSubject = Subject.create<APLateralModes>(APLateralModes.NONE);
  protected readonly altArmedSubject = Subject.create<boolean>(false);

  protected readonly altSelectManager = new AltitudeSelectManager(this.bus, this.settingsManager, G1000Autopilot.ALT_SELECT_OPTIONS);

  protected readonly fmaData: ObjectSubject<FmaData>;
  private fmaUpdateDebounce: NodeJS.Timeout | undefined;

  /**
   * Creates an instance of the G1000Autopilot.
   * @param bus The event bus.
   * @param flightPlanner This autopilot's associated flight planner.
   * @param config This autopilot's configuration.
   * @param stateManager This autopilot's state manager.
   * @param settingsManager The settings manager to pass to altitude preselect system.
   */
  constructor(bus: EventBus, flightPlanner: FlightPlanner, config: APConfig, stateManager: APStateManager,
    private readonly settingsManager: MetricAltitudeSettingsManager) {
    super(bus, flightPlanner, config, stateManager);

    this.fmaData = ObjectSubject.create<FmaData>({
      verticalActive: APVerticalModes.NONE,
      verticalArmed: APVerticalModes.NONE,
      verticalApproachArmed: APVerticalModes.NONE,
      verticalAltitudeArmed: APAltitudeModes.NONE,
      altitideCaptureArmed: false,
      altitideCaptureValue: -1,
      lateralActive: APLateralModes.NONE,
      lateralArmed: APLateralModes.NONE,
      lateralModeFailed: false
    });

    const publisher = this.bus.getPublisher<G1000ControlEvents>();
    this.fmaData.sub(() => {
      // dirty debounce, need better ObjectSubject
      if (this.fmaUpdateDebounce) {
        return;
      }

      this.fmaUpdateDebounce = setTimeout(() => {
        this.fmaUpdateDebounce = undefined;
        publisher.pub('fma_modes', this.fmaData.get(), true);
      }, 0);
    }, true);
  }

  /** @inheritdoc */
  protected onAfterUpdate(): void {
    if (!this.externalAutopilotInstalled.get()) {
      this.updateFma();
    } else {
      this.lateralArmedModeSubject.set(this.apValues.lateralArmed.get());
      this.altArmedSubject.set(this.altCapArmed);
    }
  }

  /** @inheritdoc */
  protected onInitialized(): void {
    this.bus.pub('vnav_set_state', true);

    this.monitorAdditionalEvents();
  }

  /** @inheritdoc */
  protected monitorAdditionalEvents(): void {
    //check for KAP140 installed
    this.bus.getSubscriber<APEvents>().on('kap_140_installed').handle(v => {
      this.externalAutopilotInstalled.set(v);
      if (v) {
        this.config.defaultVerticalMode = APVerticalModes.VS;
        this.config.defaultLateralMode = APLateralModes.LEVEL;
        this.altSelectManager.setEnabled(false);
        this.handleApFdStateChange();
        this.updateFma(true);
        this.bus.getPublisher<G1000ControlEvents>().pub('fd_not_installed', true, true);
      }
    });
  }

  /**
   * Publishes data for the FMA.
   * @param clear Is to clear the FMA
   */
  private updateFma(clear = false): void {
    const fmaTemp = this.fmaData;
    fmaTemp.set('verticalApproachArmed', (clear ? APVerticalModes.NONE : this.verticalApproachArmed));
    fmaTemp.set('verticalArmed', (clear ? APVerticalModes.NONE : this.apValues.verticalArmed.get()));
    fmaTemp.set('verticalActive', (clear ? APVerticalModes.NONE : this.apValues.verticalActive.get()));
    fmaTemp.set('verticalAltitudeArmed', (clear ? APAltitudeModes.NONE : this.verticalAltitudeArmed));
    fmaTemp.set('altitideCaptureArmed', (clear ? false : this.altCapArmed));
    fmaTemp.set('altitideCaptureValue', (clear ? -1 : this.apValues.capturedAltitude.get()));
    fmaTemp.set('lateralActive', (clear ? APLateralModes.NONE : this.apValues.lateralActive.get()));
    fmaTemp.set('lateralArmed', (clear ? APLateralModes.NONE : this.apValues.lateralArmed.get()));
    fmaTemp.set('lateralModeFailed', (clear ? false : this.lateralModeFailed));
  }
}