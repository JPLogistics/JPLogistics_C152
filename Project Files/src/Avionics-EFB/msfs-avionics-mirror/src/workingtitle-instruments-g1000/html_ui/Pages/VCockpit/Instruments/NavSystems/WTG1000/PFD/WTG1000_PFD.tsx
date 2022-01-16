/// <reference types="msfstypes/Pages/VCockpit/Instruments/Shared/BaseInstrument" />
/// <reference types="msfstypes/Pages/VCockpit/Core/VCockpit" />
/// <reference types="msfstypes/JS/simvar" />
/// <reference types="msfstypes/JS/NetBingMap" />

import { FSComponent, Wait } from 'msfssdk';
import { SoundPublisher, SoundServer } from 'msfssdk/utils/SoundServer';
import { CompositeLogicXMLHost, EventBus, HEventPublisher, ControlPublisher, SimVarValueType } from 'msfssdk/data';
import { FacilityLoader, FacilityRespository } from 'msfssdk/navigation';
import { ADCPublisher, NavComInstrument, InstrumentBackplane, AutopilotInstrument, NavProcessor, GNSSPublisher, Clock, XPDRInstrument, TrafficInstrument, ElectricalPublisher } from 'msfssdk/instruments';
import { FlightPathCalculator, FlightPlanner } from 'msfssdk/flightplan';
import { TCASOperatingMode } from 'msfssdk/traffic';
import { XMLAnnunciationFactory } from 'msfssdk/components/Annunciatons';
import { XMLWarningFactory } from 'msfssdk/components/Warnings';
import { UserSettingSaveManager } from 'msfssdk/settings';

import { G1000ControlPublisher } from '../Shared/G1000Events';
import { LNavSimVarPublisher } from '../Shared/Autopilot/LNavSimVars';
import { VNavSimVarPublisher } from '../Shared/Autopilot/VNavSimVars';
import { MapHSIMenu } from '../Shared/UI/Menus/MapHSIMenu';
import { MapHSILayoutMenu } from '../Shared/UI/Menus/MapHSILayoutMenu';
import { MenuSystem } from '../Shared/UI/Menus/MenuSystem';
import { PFDOptMenu } from '../Shared/UI/Menus/PFDOptMenu';
import { SVTMenu } from '../Shared/UI/Menus/SVTMenu';
import { WindMenu } from '../Shared/UI/Menus/WindMenu';
import { ALTUnitsMenu } from '../Shared/UI/Menus/ALTUnitsMenu';
import { RootMenu } from '../Shared/UI/Menus/RootMenu';
import { XPDRMenu } from '../Shared/UI/Menus/XPDRMenu';
import { XPDRCodeMenu } from '../Shared/UI/Menus/XPDRCodeMenu';
import { SoftKeyBar } from '../Shared/UI/SoftKeyBar';
import { AirspeedIndicator } from './Components/FlightInstruments/AirspeedIndicator';
import { HSI } from './Components/HSI/HSI';
import { VerticalDeviation } from './Components/FlightInstruments/VerticalDeviation';
import { MarkerBeacon } from './Components/FlightInstruments/MarkerBeacon';
import { Altimeter } from './Components/FlightInstruments/Altimeter';
import { FlightDirector } from './Components/FlightInstruments/FlightDirector';
import { NavComRadio } from '../Shared/NavCom/NavComRadio';
import { VerticalSpeedIndicator } from './Components/FlightInstruments/VerticalSpeedIndicator';
import { Fma } from './Components/Overlays/Fma/Fma';
import { BottomInfoPanel } from './Components/Overlays/BottomInfoPanel';
import { G1000Config } from '../Shared/NavComConfig';
import { NPConfig } from '../Shared/NavProcessorConfig';
import { Fms } from '../Shared/FlightPlan/Fms';
import { PFDProc } from './Components/UI/Procedure/PFDProc';
import { PFDWptInfo } from './Components/UI/WptInfo/PFDWptInfo';
import { MapInset } from '../PFD/Components/Overlays/MapInset';
import { FPL } from './Components/UI/FPL/FPL';
import { CAS } from './Components/FlightInstruments/CAS';
import { NavIndicatorController } from '../Shared/Navigation/NavIndicatorController';
import { TimerRef } from './Components/UI/TimerRef/TimerRef';
import { Nearest } from './Components/UI/Nearest';
import { ContextMenuDialog } from '../Shared/UI/Dialogs/ContextMenuDialog';
import { PFDSelectApproachView } from './Components/UI/Procedure/Approach/PFDSelectApproachView';
import { PFDDirectTo } from './Components/UI/DirectTo/PFDDirectTo';
import { PFDSetRunway } from './Components/UI/SetRunway/PFDSetRunway';
import { PFDSelectDepartureView } from './Components/UI/Procedure/DepArr/PFDSelectDepartureView';
import { PFDSelectArrivalView } from './Components/UI/Procedure/DepArr/PFDSelectArrivalView';
import { PFDPageMenuDialog } from './Components/UI/PFDPageMenuDialog';
import { WaypointIconImageCache } from '../Shared/WaypointIconImageCache';
import { MessageDialog } from '../Shared/UI/Dialogs/MessageDialog';
import { PFDViewService } from './Components/UI/PFDViewService';
import { WarningDisplay } from './Components/Warnings';
import { PFDWptDupDialog } from './Components/UI/WptDup/PFDWptDupDialog';
import { PFDSetup } from './Components/UI/PFDSetup';
import { FlightPlanAsoboSync } from '../Shared/FlightPlanAsoboSync';
import { PFDSelectAirway } from './Components/UI/Airway/PFDSelectAirway';
import { DMEWindow } from './Components/Overlays/DMEWindow';
import { WindOverlay } from './Components/Overlays/Wind/WindOverlay';
import { ADFDME } from './Components/UI/ADF-DME/ADFDME';
import { TrafficAdvisorySystem } from '../Shared/Traffic/TrafficAdvisorySystem';
import { BacklightManager } from '../Shared/Backlight/BacklightManager';
import { G1000SettingSaveManager } from '../Shared/Profiles/G1000SettingSaveManager';
import { PFDHold } from './Components/UI/Hold/PFDHold';
import { PrimaryHorizonDisplay } from './Components/FlightInstruments/PrimaryHorizonDisplay';
import { StartupLogo } from '../Shared/StartupLogo';
import { EIS } from '../MFD/Components/EIS';
import { PanelLoader } from '../MFD/Components/EngineInstruments/NewPanels/PanelLoader';
import { XMLGaugeConfigFactory } from 'msfssdk/components/XMLGauges';
import { EngineMenu } from '../Shared/UI/Menus/MFD/EngineMenu';
import { LeanMenu } from '../Shared/UI/Menus/MFD/LeanMenu';
import { SystemMenu } from '../Shared/UI/Menus/MFD/SystemMenu';
import { FuelRemMenu } from '../Shared/UI/Menus/MFD/FuelRemMenu';
import { ADCAvionicsSystem, AHRSSystem, AvionicsComputerSystem, EngineAirframeSystem, G1000AvionicsSystem, MagnetometerSystem, TransponderSystem } from '../Shared/Systems';
import { Alerts } from './Components/UI/Alerts/Alerts';
import { AlertsSubject } from './Components/UI/Alerts/AlertsSubject';

import '../Shared/UI/Common/g1k_common.css';
import './WTG1000_PFD.css';
import '../Shared/UI/Common/LatLonDisplay.css';

/**
 * The base G1000 PFD instrument class.
 */
class WTG1000_PFD extends BaseInstrument {
  bus: EventBus;
  adcPublisher: ADCPublisher;
  controlPublisher: ControlPublisher;
  g1000ControlPublisher: G1000ControlPublisher;
  lNavPublisher: LNavSimVarPublisher;
  vNavPublisher: VNavSimVarPublisher;
  gnssPublisher: GNSSPublisher;
  electricalPublisher: ElectricalPublisher;
  backplane: InstrumentBackplane;
  hEventPublisher: HEventPublisher;
  soundPublisher: SoundPublisher;
  navComInstrument: NavComInstrument;
  apInstrument: AutopilotInstrument;
  navProcessor: NavProcessor;
  xpdrInstrument: XPDRInstrument;
  private readonly trafficInstrument: TrafficInstrument;
  private readonly clock: Clock;
  navIndicatorController: NavIndicatorController;
  fms: Fms;
  planner: FlightPlanner;
  facLoader: FacilityLoader;
  calculator: FlightPathCalculator;
  soundServer: SoundServer;

  lastCalculate = 0;

  private readonly tas: TrafficAdvisorySystem;

  private viewService: PFDViewService;

  private xmlLogicHost: CompositeLogicXMLHost;
  private annunciationFactory: XMLAnnunciationFactory;
  private warningFactory: XMLWarningFactory;

  private readonly backlightManager: BacklightManager;

  private readonly settingSaveManager: UserSettingSaveManager;
  private previousScreenState: ScreenState | undefined;
  private gaugeFactory: XMLGaugeConfigFactory;

  private systems: G1000AvionicsSystem[] = [];
  private alerts: AlertsSubject;

  private isMfdPoweredOn = false;

  /**
   * Creates an instance of the WTG1000_PFD.
   */
  constructor() {
    super();
    RegisterViewListener('JS_LISTENER_INSTRUMENTS');

    WaypointIconImageCache.init();

    this.bus = new EventBus();

    this.hEventPublisher = new HEventPublisher(this.bus);
    this.adcPublisher = new ADCPublisher(this.bus);
    this.gnssPublisher = new GNSSPublisher(this.bus);
    this.soundPublisher = new SoundPublisher(this.bus);
    this.lNavPublisher = new LNavSimVarPublisher(this.bus);
    this.vNavPublisher = new VNavSimVarPublisher(this.bus);
    this.electricalPublisher = new ElectricalPublisher(this.bus);

    this.controlPublisher = new ControlPublisher(this.bus);
    this.g1000ControlPublisher = new G1000ControlPublisher(this.bus);
    this.navComInstrument = new NavComInstrument(this.bus, G1000Config, 2, 2, true);
    this.apInstrument = new AutopilotInstrument(this.bus);

    this.xpdrInstrument = new XPDRInstrument(this.bus);
    this.trafficInstrument = new TrafficInstrument(this.bus, { realTimeUpdateFreq: 2, simTimeUpdateFreq: 1, contactDeprecateTime: 10 });

    this.clock = new Clock(this.bus);

    this.facLoader = new FacilityLoader(FacilityRespository.getRepository(this.bus));
    this.calculator = new FlightPathCalculator(this.facLoader, { defaultClimbRate: 300, defaultSpeed: 85, bankAngle: 17.5 });
    this.planner = FlightPlanner.getPlanner(this.bus, this.calculator);
    this.viewService = new PFDViewService(this.bus);

    this.navProcessor = new NavProcessor(this.bus, new NPConfig(this.bus, this.planner));

    this.backplane = new InstrumentBackplane();
    this.backplane.addPublisher('adc', this.adcPublisher);
    this.backplane.addPublisher('lnav', this.lNavPublisher);
    this.backplane.addPublisher('vnav', this.vNavPublisher);
    this.backplane.addPublisher('hEvents', this.hEventPublisher);
    this.backplane.addPublisher('control', this.controlPublisher);
    this.backplane.addPublisher('g1000', this.g1000ControlPublisher);
    this.backplane.addPublisher('gnss', this.gnssPublisher);
    this.backplane.addPublisher('sound', this.soundPublisher);
    this.backplane.addPublisher('electrical', this.electricalPublisher);

    this.backplane.addInstrument('navcom', this.navComInstrument);
    this.backplane.addInstrument('ap', this.apInstrument);
    this.backplane.addInstrument('nav', this.navProcessor);
    this.backplane.addInstrument('xpdr', this.xpdrInstrument);
    this.backplane.addInstrument('traffic', this.trafficInstrument);

    this.gaugeFactory = new XMLGaugeConfigFactory(this, this.bus);

    this.tas = new TrafficAdvisorySystem(this.bus, this.trafficInstrument, 30, 2, 1);

    this.fms = new Fms(this.bus, this.planner, this.viewService, this.g1000ControlPublisher);
    FlightPlanAsoboSync.init();

    this.navIndicatorController = new NavIndicatorController(this.bus, this.fms);

    this.xmlLogicHost = new CompositeLogicXMLHost();
    this.annunciationFactory = new XMLAnnunciationFactory(this);
    this.warningFactory = new XMLWarningFactory(this);

    this.soundServer = new SoundServer(this.bus, this.soundPublisher, this);

    this.backlightManager = new BacklightManager('pfd', this.bus);

    // TODO: Support pilot profiles.
    this.settingSaveManager = new G1000SettingSaveManager(this.bus);
    const saveKey = `${SimVar.GetSimVarValue('ATC MODEL', 'string')}.profile_1`;
    this.settingSaveManager.load(saveKey);

    this.alerts = new AlertsSubject(this.bus);
    this.initDuration = 5000;
  }

  /**
   * The instrument template ID.
   * @returns The instrument template ID.
   */
  get templateID(): string {
    return 'AS1000_PFD';
  }

  /**
   * Whether or not the instrument is interactive (a touchscreen instrument).
   * @returns True
   */
  get isInteractive(): boolean {
    return true;
  }

  /**
   * A callback called when the element is attached to the DOM.
   */
  public connectedCallback(): void {
    super.connectedCallback();

    this.classList.add('hidden-element');

    this.backplane.init();

    let gaugeConfig = this.gaugeFactory.parseConfig(this.xmlConfig);
    // TODO Undo this when new panels are in the base game.
    if (!gaugeConfig.override) {
      const loader = new PanelLoader(this.gaugeFactory);
      const extPanel = loader.loadConfigForModel(SimVar.GetSimVarValue('ATC MODEL', 'string'));
      if (extPanel) {
        gaugeConfig = extPanel;
      }
    }

    const menuSystem = new MenuSystem(this.bus, 'AS1000_PFD_SOFTKEYS_');
    // if (alertsPopoutRef.instance !== null) {
    menuSystem.addMenu('root', new RootMenu(menuSystem, this.controlPublisher, this.g1000ControlPublisher, this.bus));
    // }
    menuSystem.addMenu('map-hsi', new MapHSIMenu(menuSystem));
    menuSystem.addMenu('map-hsi-layout', new MapHSILayoutMenu(menuSystem));
    menuSystem.addMenu('pfd-opt', new PFDOptMenu(menuSystem, this.controlPublisher, this.g1000ControlPublisher, this.bus));
    menuSystem.addMenu('svt', new SVTMenu(menuSystem));
    menuSystem.addMenu('wind', new WindMenu(menuSystem));
    menuSystem.addMenu('alt-units', new ALTUnitsMenu(menuSystem));
    menuSystem.addMenu('xpdr', new XPDRMenu(menuSystem, this.controlPublisher, this.g1000ControlPublisher, this.bus));
    menuSystem.addMenu('xpdr-code', new XPDRCodeMenu(menuSystem, this.bus, this.g1000ControlPublisher));

    menuSystem.addMenu('engine-menu', new EngineMenu(menuSystem, gaugeConfig, this.g1000ControlPublisher));
    menuSystem.addMenu('lean-menu', new LeanMenu(menuSystem, gaugeConfig, this.g1000ControlPublisher));
    menuSystem.addMenu('system-menu', new SystemMenu(menuSystem, gaugeConfig, this.g1000ControlPublisher));
    menuSystem.addMenu('fuel-rem-menu', new FuelRemMenu(menuSystem, gaugeConfig, this.g1000ControlPublisher));

    menuSystem.pushMenu('root');

    FSComponent.render(<PrimaryHorizonDisplay bus={this.bus} />, document.getElementById('HorizonContainer'));

    FSComponent.render(<HSI bus={this.bus} flightPlanner={this.planner} navIndicatorController={this.navIndicatorController} tas={this.tas} />, document.getElementById('InstrumentsContainer'));
    FSComponent.render(<FlightDirector bus={this.bus} />, document.getElementById('InstrumentsContainer'));
    FSComponent.render(<AirspeedIndicator bus={this.bus} />, document.getElementById('InstrumentsContainer'));
    FSComponent.render(<VerticalSpeedIndicator bus={this.bus} navIndicatorController={this.navIndicatorController} />, document.getElementById('InstrumentsContainer'));
    FSComponent.render(<Altimeter bus={this.bus} g1000Publisher={this.g1000ControlPublisher} />, document.getElementById('InstrumentsContainer'));
    FSComponent.render(<MarkerBeacon bus={this.bus} />, document.getElementById('InstrumentsContainer'));
    FSComponent.render(<DMEWindow bus={this.bus} navIndicatorController={this.navIndicatorController} />, document.getElementById('InstrumentsContainer'));
    FSComponent.render(<VerticalDeviation bus={this.bus} navIndicatorController={this.navIndicatorController} />, document.getElementById('InstrumentsContainer'));
    FSComponent.render(<NavComRadio bus={this.bus} title='NAV' position='left' />, document.querySelector('#NavComBox #Left'));
    FSComponent.render(<NavComRadio bus={this.bus} title='COM' position='right' />, document.querySelector('#NavComBox #Right'));
    FSComponent.render(<Fma bus={this.bus} planner={this.planner} navController={this.navIndicatorController} />, document.getElementById('NavComBox'));
    FSComponent.render(<BottomInfoPanel bus={this.bus} controlPublisher={this.controlPublisher} />, document.getElementById('InstrumentsContainer'));
    FSComponent.render(<SoftKeyBar menuSystem={menuSystem} />, document.getElementById('Electricity'));
    FSComponent.render(<WindOverlay bus={this.bus} />, document.getElementById('InstrumentsContainer'));
    FSComponent.render(<MapInset bus={this.bus} flightPlanner={this.planner} tas={this.tas} />,
      document.getElementById('InstrumentsContainer'));
    FSComponent.render(<CAS bus={this.bus} logicHandler={this.xmlLogicHost} annunciations={this.annunciationFactory.parseConfig(this.xmlConfig)} />, document.getElementById('cas'));
    FSComponent.render(<WarningDisplay bus={this.bus} soundPublisher={this.soundPublisher} logicHandler={this.xmlLogicHost} warnings={this.warningFactory.parseConfig(this.xmlConfig)} />, document.getElementById('warnings'));

    FSComponent.render(<StartupLogo bus={this.bus} eventPrefix='AS1000_PFD' />, this);
    FSComponent.render(<EIS bus={this.bus} logicHandler={this.xmlLogicHost} gaugeConfig={gaugeConfig} />, document.getElementsByClassName('eis')[0] as HTMLDivElement);



    this.viewService.registerView('FPL', () => <FPL viewService={this.viewService} bus={this.bus} fms={this.fms} title="Flight Plan" showTitle={true} />);
    this.viewService.registerView('PROC', () => <PFDProc viewService={this.viewService} title="Procedures" showTitle={true} fms={this.fms} />);
    this.viewService.registerView('DirectTo', () => <PFDDirectTo viewService={this.viewService} bus={this.bus} fms={this.fms} title="Direct To" showTitle={true} />);
    this.viewService.registerView('WptInfo', () => <PFDWptInfo viewService={this.viewService} bus={this.bus} title="Waypoint Information" showTitle={true} />);
    this.viewService.registerView('MessageDialog', () => <MessageDialog viewService={this.viewService} title="" showTitle={false} />);
    this.viewService.registerView('SetRunway', () => <PFDSetRunway viewService={this.viewService} title="Set Runway" showTitle={true} />);
    this.viewService.registerView('SelectDeparture', () => <PFDSelectDepartureView viewService={this.viewService} bus={this.bus} fms={this.fms} calculator={this.calculator} title="Select Departure" showTitle={true} />);
    this.viewService.registerView('SelectApproach', () => <PFDSelectApproachView viewService={this.viewService} bus={this.bus} fms={this.fms} calculator={this.calculator} title="Select Approach" showTitle={true} />);
    this.viewService.registerView('SelectArrival', () => <PFDSelectArrivalView viewService={this.viewService} bus={this.bus} fms={this.fms} calculator={this.calculator} title="Select Arrival" showTitle={true} />);
    this.viewService.registerView(ContextMenuDialog.name, () => <ContextMenuDialog viewService={this.viewService} title="" showTitle={false} upperKnobCanScroll={true} />);
    this.viewService.registerView('PageMenuDialog', () => <PFDPageMenuDialog viewService={this.viewService} title="Page Menu" showTitle={true} />);
    this.viewService.registerView(TimerRef.name, () => <TimerRef viewService={this.viewService} bus={this.bus} fms={this.fms} title="TimerRef" showTitle={false} />);
    this.viewService.registerView(ADFDME.name, () => <ADFDME viewService={this.viewService} bus={this.bus} title="ADF/DME TUNING" showTitle={true} navIndicatorController={this.navIndicatorController} />);
    this.viewService.registerView('WptDup', () => <PFDWptDupDialog viewService={this.viewService} title="Duplicate Waypoints" showTitle={true} />);
    this.viewService.registerView(Nearest.name, () => <Nearest viewService={this.viewService} bus={this.bus} fms={this.fms} loader={this.facLoader} publisher={this.controlPublisher} title="Nearest Airports" showTitle={true} />);
    this.viewService.registerView(PFDSetup.name, () => <PFDSetup viewService={this.viewService} title="PFD Setup Menu" showTitle={true} bus={this.bus} />);
    this.viewService.registerView(Alerts.name, () => <Alerts data={this.alerts} viewService={this.viewService} title="Alerts" showTitle={true} />);
    this.viewService.registerView('SelectAirway', () => <PFDSelectAirway viewService={this.viewService} title="Select Airway" showTitle={true} fms={this.fms} />);
    this.viewService.registerView('HoldAt', () => <PFDHold viewService={this.viewService} title="Hold at" showTitle={true} fms={this.fms} bus={this.bus} />);

    this.controlPublisher.publishEvent('init_cdi', true);
    this.bus.on('mfd_power_on', this.onMfdPowerOn);

    // force enable animations
    document.documentElement.classList.add('animationsEnabled');
  }

  /**
   * A callback called when the instrument is initialized.
   */
  public Init(): void {
    super.Init();

    this.initPrimaryFlightPlan();
    this.clock.init();
    this.tas.setOperatingMode(TCASOperatingMode.TA_RA); // TODO: putting this here until we get user control set up
    this.tas.init();
    this.backlightManager.init();

    this.initializeAvElectrical();

    this.systems.push(new MagnetometerSystem(1, this.bus));
    this.systems.push(new ADCAvionicsSystem(1, this.bus));
    this.systems.push(new AHRSSystem(1, this.bus));
    this.systems.push(new TransponderSystem(1, this.bus));
    this.systems.push(new AvionicsComputerSystem(1, this.bus));
    this.systems.push(new AvionicsComputerSystem(2, this.bus));
    this.systems.push(new EngineAirframeSystem(1, this.bus));

    if (this.getGameState() === GameState.briefing || this.getGameState() === GameState.ingame) {
      this.startPublishers();
    }
  }

  /**
   * Initialized the avionics electrical bus XML logic.
   */
  private initializeAvElectrical(): void {
    let pfdId = 'AS1000_PFD';
    let mfdId = 'AS1000_MFD';

    const logicElement = this.xmlConfig.getElementsByTagName('Logic');
    if (logicElement.length > 0) {
      pfdId = logicElement[0].getElementsByTagName('PFD')[0].textContent ?? 'AS1000_PFD';
      mfdId = logicElement[0].getElementsByTagName('MFD')[0].textContent ?? 'AS1000_MFD';
    }

    const pfdBusLogic = this.getElectricalLogicForName(pfdId);
    const mfdBusLogic = this.getElectricalLogicForName(mfdId);

    if (pfdBusLogic !== undefined) {
      this.electricalPublisher.setAv1Bus(pfdBusLogic);
    }

    if (mfdBusLogic !== undefined) {
      this.electricalPublisher.setAv2Bus(mfdBusLogic);
    }
  }

  /**
   * Gets the electrical bus XML logic for a given panel name.
   * @param name The name of the panel.
   * @returns The XML logic element, or undefined if none was found.
   */
  private getElectricalLogicForName(name: string): CompositeLogicXMLElement | undefined {
    const instrumentConfigs = this.xmlConfig.getElementsByTagName('Instrument');
    for (let i = 0; i < instrumentConfigs.length; i++) {
      const el = instrumentConfigs.item(i);

      if (el !== null) {
        const nameEl = el.getElementsByTagName('Name');
        if (nameEl.length > 0 && nameEl[0].textContent === name) {
          const electrics = el.getElementsByTagName('Electric');
          if (electrics.length > 0) {
            return new CompositeLogicXMLElement(this, electrics[0]);
          }
        }
      }
    }
  }

  /**
   * Initializes the primary flight plan.
   */
  private async initPrimaryFlightPlan(): Promise<void> {
    // Request a sync from the MFD in case of an instrument reload
    this.fms.flightPlanner.requestSync();
    await Wait.awaitDelay(500);
    // Initialize the primary plan in case one was not synced.
    this.fms.initPrimaryFlightPlan();
  }

  /**
   * Starts data publishers to the bus.
   */
  protected startPublishers(): void {
    this.adcPublisher.subscribe('tas');
    this.adcPublisher.subscribe('ias');
    this.adcPublisher.subscribe('hdg_deg');
    this.adcPublisher.subscribe('hdg_deg_true');
    this.adcPublisher.subscribe('vs');
    this.adcPublisher.subscribe('alt');
    this.adcPublisher.subscribe('pitch_deg');
    this.adcPublisher.subscribe('roll_deg');
    this.adcPublisher.subscribe('kohlsman_setting_hg_1');
    this.adcPublisher.subscribe('kohlsman_setting_mb_1');
    this.adcPublisher.subscribe('turn_coordinator_ball');
    this.adcPublisher.subscribe('delta_heading_rate');
    this.adcPublisher.subscribe('ambient_temp_c');
    this.adcPublisher.subscribe('ambient_wind_velocity');
    this.adcPublisher.subscribe('ambient_wind_direction');
    this.adcPublisher.subscribe('on_ground');
    this.adcPublisher.subscribe('aoa');

    this.lNavPublisher.subscribe('lnavBrgMag');
    this.lNavPublisher.subscribe('lnavDis');
    this.lNavPublisher.subscribe('lnavDisTurn');
    this.lNavPublisher.subscribe('lnavDtkMag');
    this.lNavPublisher.subscribe('lnavNextDtkMag');
    this.lNavPublisher.subscribe('lnavXtk');
    this.lNavPublisher.subscribe('lnavCdiScaling');
    this.lNavPublisher.subscribe('lnavCdiScalingLabel');
    this.lNavPublisher.subscribe('lnavCurrentVector');

    this.vNavPublisher.subscribe('vnavPathMode');
    this.vNavPublisher.subscribe('vnavMode');
    this.vNavPublisher.subscribe('vnavTodDistance');
    this.vNavPublisher.subscribe('vnavTodLegIndex');
    this.vNavPublisher.subscribe('vnavTodLegDistance');
    this.vNavPublisher.subscribe('vnavBodLegIndex');
    this.vNavPublisher.subscribe('vnavAltCaptureType');
    this.vNavPublisher.subscribe('vnavTargetAlt');
    this.vNavPublisher.subscribe('vnavVDev');
    this.vNavPublisher.subscribe('vnavFpa');
    this.vNavPublisher.subscribe('vnavLpvVDev');
    this.vNavPublisher.subscribe('vnavLpvDistance');
    this.vNavPublisher.subscribe('vnavApproachMode');
    this.vNavPublisher.subscribe('vnavAltCaptureType');
    this.vNavPublisher.subscribe('vnavBodDistance');
    this.vNavPublisher.subscribe('vnavConstraintAltitude');
    this.vNavPublisher.subscribe('vnavConstraintLegIndex');
    this.vNavPublisher.subscribe('vnavRequiredVs');

    this.electricalPublisher.subscribe('elec_av1_bus');
    this.electricalPublisher.subscribe('elec_av2_bus');
    this.electricalPublisher.subscribe('elec_circuit_navcom1_on');
    this.electricalPublisher.subscribe('elec_circuit_navcom2_on');
  }

  /**
   * Callback called when the flight starts.
   */
  protected onFlightStart(): void {
    super.onFlightStart();
    Wait.awaitCondition(() => this.planner.hasFlightPlan(Fms.PRIMARY_PLAN_INDEX), 1000)
      .then(() => FlightPlanAsoboSync.loadFromGame(this.fms));
  }

  /** @inheritdoc */
  protected onGameStateChanged(oldState: GameState, newState: GameState): void {
    super.onGameStateChanged(oldState, newState);

    if (oldState !== newState) {
      this.bus.pub('vc_game_state', newState);
    }

    if (newState === GameState.briefing || newState === GameState.ingame) {
      this.startPublishers();
    }
  }

  /** @inheritdoc */
  public onPowerOn(): void {
    super.onPowerOn();

    this.bus.pub('vc_powered', true);
    this.classList.remove('hidden-element');
  }

  /** @inheritdoc */
  public onShutDown(): void {
    super.onShutDown();

    this.bus.pub('vc_powered', false);
    this.classList.add('hidden-element');
  }

  /**
   * A callback called when the instrument gets a frame update.
   */
  public Update(): void {
    super.Update();

    this.checkIsReversionary();

    this.clock.onUpdate();
    this.backplane.onUpdate();

    const now = Date.now();
    if (now - this.lastCalculate > 3000) {
      if (this.planner.hasFlightPlan(this.planner.activePlanIndex)) {
        this.planner.getActiveFlightPlan().calculate();
      }
      SimVar.SetSimVarValue('K:HEADING_GYRO_SET', SimVarValueType.Number, 0);
      this.lastCalculate = now;
    }
    this.xmlLogicHost.update(this.deltaTime);

    if (this.previousScreenState !== this.screenState) {
      this.onScreenStateChanged();
    }
  }

  /**
   * Handles when the instrument screen state has changed.
   */
  private onScreenStateChanged(): void {
    this.bus.pub('vc_screen_state', { previous: this.previousScreenState, current: this.screenState });
    const previousScreenState = this.previousScreenState;
    this.previousScreenState = this.screenState;

    const eisEl = document.getElementsByClassName('eis')[0] as HTMLDivElement | undefined;
    if (eisEl !== undefined) {
      if (this.screenState === ScreenState.REVERSIONARY) {
        setTimeout(() => {
          eisEl.classList.remove('hidden');

          if (previousScreenState === ScreenState.ON) {
            this.animateScreenModeChange();
          }
        }, 250);

      }
    }
  }

  /**
   * Handles when the MFD powers on, to remove reversionary mode.
   * @param isPoweredOn Whether or not the MFD is powered on.
   */
  private onMfdPowerOn = (isPoweredOn: boolean): void => {
    this.isMfdPoweredOn = isPoweredOn;

    if (isPoweredOn) {
      const eisEl = document.getElementsByClassName('eis')[0] as HTMLDivElement | undefined;
      if (eisEl !== undefined) {
        setTimeout(() => {
          eisEl.classList.add('hidden');
          this.animateScreenModeChange();
        }, 250);
      }
    }
  }

  /**
   * Performs a reversionary mode screen refresh animation.
   */
  private animateScreenModeChange(): void {
    this.electricity.style.opacity = '0.0';

    setTimeout(() => {
      this.electricity.style.transition = 'opacity 1s linear';
      this.electricity.style.opacity = '1.0';
      setTimeout(() => {
        this.electricity.style.opacity = '';
        this.electricity.style.transition = '';
      }, 1000);
    }, 100);
  }

  /**
   * Sets whether or not the instrument is in reversionary mode.
   */
  private checkIsReversionary(): void {
    if (document.body.hasAttribute('reversionary')) {
      const attr = document.body.getAttribute('reversionary');
      if (attr == 'true') {
        this.reversionaryMode = true;
        return;
      }
    }

    if (this.screenState === ScreenState.ON && !this.isMfdPoweredOn) {
      this.screenState = ScreenState.REVERSIONARY;
      this.reversionaryMode = true;
      return;
    }

    this.reversionaryMode = false;
  }

  /**
   * A callback for when sounds are done playing.  This is needed to support the sound server.
   * @param soundEventId The sound that got played.
   */
  public onSoundEnd(soundEventId: Name_Z): void {
    this.soundServer.onSoundEnd(soundEventId);
  }

  /**
   * A callback called when the instrument received a H event.
   * @param args The H event and associated arguments, if any.
   */
  public onInteractionEvent(args: string[]): void {
    this.hEventPublisher.dispatchHEvent(args[0]);
  }
}

registerInstrument('wtg1000-pfd', WTG1000_PFD);