/* eslint-disable max-len */
// TODO:  Remove the above disable whenever all the verbose commented out code put in place for flight plan
// debugging has been removed for good, so we have proper line length checking.
/// <reference types="msfstypes/Pages/VCockpit/Instruments/Shared/BaseInstrument" />
/// <reference types="msfstypes/Pages/VCockpit/Core/VCockpit" />
/// <reference types="msfstypes/JS/simvar" />

import { FSComponent } from 'msfssdk';
import { ControlPublisher, EventBus, HEvent, HEventPublisher, CompositeLogicXMLHost } from 'msfssdk/data';
import { FacilityLoader, FacilityRespository } from 'msfssdk/navigation';
import { ADCPublisher, AutopilotInstrument, GNSSPublisher, EISPublisher, Clock, InstrumentBackplane, TrafficInstrument, ElectricalPublisher } from 'msfssdk/instruments';
import { FlightPathCalculator, FlightPlanner } from 'msfssdk/flightplan';
import { TCASOperatingMode } from 'msfssdk/traffic';
import { XMLGaugeConfigFactory } from 'msfssdk/components/XMLGauges';
import { UserSettingSaveManager } from 'msfssdk/settings';
import { EIS } from './Components/EIS';
import { NavComRadio } from '../Shared/NavCom/NavComRadio';
import { MenuSystem } from '../Shared/UI/Menus/MenuSystem';
import { SoftKeyMenu } from '../Shared/UI/Menus/SoftKeyMenu';
import { SoftKeyBar } from '../Shared/UI/SoftKeyBar';
import { MFDNavMapRootMenu } from '../Shared/UI/Menus/MFD/MFDNavMapRootMenu';
import { EngineMenu } from '../Shared/UI/Menus/MFD/EngineMenu';
import { LeanMenu } from '../Shared/UI/Menus/MFD/LeanMenu';
import { SystemMenu } from '../Shared/UI/Menus/MFD/SystemMenu';
import { FuelRemMenu } from '../Shared/UI/Menus/MFD/FuelRemMenu';
import { MapOptMenu } from '../Shared/UI/Menus/MFD/MapOptMenu';
import { InsetMenu } from '../Shared/UI/Menus/MFD/InsetMenu';
import { Fms } from '../Shared/FlightPlan/Fms';
import { EventSubscriber } from 'msfssdk/data/EventSubscriber';
import { LNavSimVarPublisher } from '../Shared/Autopilot/LNavSimVars';
import { VNavSimVarPublisher } from '../Shared/Autopilot/VNavSimVars';
import { G1000Autopilot } from '../Shared/Autopilot/G1000Autopilot';
import { G1000APConfig } from '../Shared/Autopilot/G1000APConfig';
import { G1000APStateManager } from '../Shared/Autopilot/G1000APStateManager';
import { WaypointIconImageCache } from '../Shared/WaypointIconImageCache';
import { NavdataComputer } from '../Shared/Navigation/NavdataComputer';
import { MFDViewService } from './Components/UI/MFDViewService';
import { MFDNavMapPage as MFDNavMapPage } from './Components/UI/NavMap/MFDNavMapPage';
import { MFDFPLPage } from './Components/UI/FPL/MFDFPLPage';
import { MFDProc } from './Components/UI/Procedure/MFDProc';
import { MFDSelectProcedurePage } from './Components/UI/Procedure/MFDSelectProcedurePage';
import { ContextMenuDialog } from '../Shared/UI/Dialogs/ContextMenuDialog';
import { G1000ControlPublisher } from '../Shared/G1000Events';
import { MFDDirectTo } from './Components/UI/DirectTo/MFDDirectTo';
import { MFDMapSettings } from './Components/UI/MapSettings/MFDMapSettings';
import { MFDWptInfo } from './Components/UI/WptInfo/MFDWptInfo';
import { MFDSetRunway } from './Components/UI/SetRunway/MFDSetRunway';
import { APRadioNavInstrument } from '../Shared/Navigation/APRadioNavInstrument';
import { MFDWptDupDialog } from './Components/UI/WptDup/MFDWptDupDialog';
import { MFDSelectAirway } from './Components/UI/Airway/MFDSelectAirway';
import { MessageDialog } from '../Shared/UI/Dialogs/MessageDialog';
import { TrafficAdvisorySystem } from '../Shared/Traffic/TrafficAdvisorySystem';
import { BacklightManager } from '../Shared/Backlight/BacklightManager';
import { G1000SettingSaveManager } from '../Shared/Profiles/G1000SettingSaveManager';
import { FuelComputer } from '../Shared/FuelComputer';
import { MFDHold } from './Components/UI/Hold/MFDHold';
import { MFDPageMenuDialog } from './Components/UI/MFDPageMenuDialog';
import { MFDNearestAirportsPage } from './Components/UI/Nearest/MFDNearestAirportsPage';
import { MFDPageSelect } from './Components/UI/MFDPageSelect';
import { MFDTrafficMapPage } from './Components/UI/Traffic/MFDTrafficMapPage';
import { MFDTrafficMapRootMenu } from './Components/UI/Traffic/MFDTrafficMapRootMenu';
import { MFDTrafficMapAltitudeMenu } from './Components/UI/Traffic/MFDTrafficMapAltitudeMenu';
import { MFDTrafficMapMotionMenu } from './Components/UI/Traffic/MFDTrafficMapMotionMenu';
import { MFDTrafficMapMotionDurationMenu } from './Components/UI/Traffic/MFDTrafficMapMotionDurationMenu';
import { PanelLoader } from './Components/EngineInstruments/NewPanels/PanelLoader';
import { GpsSynchronizer } from '../Shared/Navigation/GpsSynchronizer';
import { MFDFPLRootMenu } from '../Shared/UI/Menus/MFD/MFDFPLRootMenu';
import { MFDNearestAirportRootMenu } from '../Shared/UI/Menus/MFD/MFDNearestAirportRootMenu';
import { MFDNearestIntersectionsPage } from './Components/UI/Nearest/MFDNearestIntersectionsPage';
import { MFDNearestNdbsPage } from './Components/UI/Nearest/MFDNearestNDBsPage';
import { MFDNearestVorsPage } from './Components/UI/Nearest/MFDNearestVORsPage';
import { MFDNearestVorRootMenu } from '../Shared/UI/Menus/MFD/MFDNearestVorRootMenu';
import { MFDAirportInformationPage } from './Components/UI/Information/Airport/MFDAirportInformationPage';
import { MFDIntersectionInformationPage } from './Components/UI/Information/Intersection/MFDIntersectionInformationPage';
import { MFDNdbInformationPage } from './Components/UI/Information/NDB/MFDNdbInformationPage';
import { MFDVorInformationPage } from './Components/UI/Information/VOR/MFDVorInformationPage';
import { StartupLogo } from '../Shared/StartupLogo';
import { ADCAvionicsSystem, AHRSSystem, AvionicsComputerSystem, EngineAirframeSystem, G1000AvionicsSystem, MagnetometerSystem, TransponderSystem } from '../Shared/Systems';
import { MFDNavDataBar } from './Components/UI/NavDataBar/MFDNavDataBar';
import { DefaultMFDNavDataBarFieldModelFactory } from './Components/UI/NavDataBar/DefaultMFDNavDataBarModelFactory';
import { MFDNavDataBarUserSettings } from './Components/UI/NavDataBar/MFDNavDataBarUserSettings';
import { MFDSystemSetupPage } from './Components/UI/SystemSetup/MFDSystemSetupPage';
import { MFDSystemSetupRootMenu } from '../Shared/UI/Menus/MFD/MFDSystemSetupRootMenu';
import { MFDSelectProcedureRootMenu } from '../Shared/UI/Menus/MFD/MFDSelectProcedureRootMenu';
import { UnitsUserSettings } from '../Shared/Units/UnitsUserSettings';

import '../Shared/UI/Common/g1k_common.css';
import './WTG1000_MFD.css';
import '../Shared/UI/Common/LatLonDisplay.css';

/**
 * The base G1000 MFD instrument class.
 */
export class WTG1000_MFD extends BaseInstrument {
  private bus: EventBus;
  private gnss: GNSSPublisher;
  private adc: ADCPublisher;
  private eis: EISPublisher;
  private hEventPublisher: HEventPublisher;
  private g1000ControlPublisher: G1000ControlPublisher;
  private controlPublisher: ControlPublisher;
  private electricalPublisher: ElectricalPublisher;

  private lNavPublisher: LNavSimVarPublisher;
  private vNavPublisher: VNavSimVarPublisher;
  private fms!: Fms;


  private apInstrument: AutopilotInstrument;
  private apRadioNav: APRadioNavInstrument;
  private readonly trafficInstrument: TrafficInstrument;
  private readonly clock: Clock;

  private backplane: InstrumentBackplane;
  private xmlLogicHost: CompositeLogicXMLHost;
  private loader: FacilityLoader;
  private calculator: FlightPathCalculator;
  private planner: FlightPlanner;
  private heventSub: EventSubscriber<HEvent>;
  private gaugeFactory: XMLGaugeConfigFactory;

  private autopilot!: G1000Autopilot;

  private viewService: MFDViewService;

  private navdataComputer: NavdataComputer;
  private gpsSynchronizer: GpsSynchronizer;

  private lastCalculate = 0;

  private readonly tas: TrafficAdvisorySystem;

  private readonly backlightManager: BacklightManager;

  private readonly settingSaveManager: UserSettingSaveManager;
  private fuelComputer: FuelComputer;

  private previousScreenState: ScreenState | undefined;
  private systems: G1000AvionicsSystem[] = [];

  /**
   * Creates an instance of the WTG1000_MFD.
   */
  constructor() {
    super();

    WaypointIconImageCache.init();

    this.bus = new EventBus();
    this.gnss = new GNSSPublisher(this.bus);
    this.adc = new ADCPublisher(this.bus);
    this.controlPublisher = new ControlPublisher(this.bus);

    this.eis = new EISPublisher(this.bus);
    this.electricalPublisher = new ElectricalPublisher(this.bus);
    this.lNavPublisher = new LNavSimVarPublisher(this.bus);
    this.vNavPublisher = new VNavSimVarPublisher(this.bus);
    this.apRadioNav = new APRadioNavInstrument(this.bus);

    this.hEventPublisher = new HEventPublisher(this.bus);
    this.g1000ControlPublisher = new G1000ControlPublisher(this.bus);
    this.controlPublisher = new ControlPublisher(this.bus);
    this.apInstrument = new AutopilotInstrument(this.bus);
    this.trafficInstrument = new TrafficInstrument(this.bus, { realTimeUpdateFreq: 2, simTimeUpdateFreq: 1, contactDeprecateTime: 10 });

    this.clock = new Clock(this.bus);
    this.fuelComputer = new FuelComputer(this.bus);

    this.backplane = new InstrumentBackplane();
    this.backplane.addPublisher('adc', this.adc);
    this.backplane.addPublisher('hEvents', this.hEventPublisher);
    this.backplane.addPublisher('gnss', this.gnss);
    this.backplane.addPublisher('eis', this.eis);
    this.backplane.addPublisher('control', this.controlPublisher);
    this.backplane.addPublisher('g1000', this.g1000ControlPublisher);
    this.backplane.addPublisher('lnav', this.lNavPublisher);
    this.backplane.addPublisher('vnav', this.vNavPublisher);
    this.backplane.addPublisher('electrical', this.electricalPublisher);
    this.backplane.addInstrument('ap', this.apInstrument);
    this.backplane.addInstrument('apRadioNav', this.apRadioNav);
    this.backplane.addInstrument('fuelComputer', this.fuelComputer);
    this.backplane.addInstrument('traffic', this.trafficInstrument);

    this.viewService = new MFDViewService(this.bus);

    this.loader = new FacilityLoader(FacilityRespository.getRepository(this.bus));
    this.calculator = new FlightPathCalculator(this.loader, { defaultClimbRate: 300, defaultSpeed: 85, bankAngle: 17.5 });
    this.planner = FlightPlanner.getPlanner(this.bus, this.calculator);
    this.gpsSynchronizer = new GpsSynchronizer(this.bus, this.planner, this.loader);

    (window as any)['planner'] = this.planner;
    (window as any)['calculator'] = this.calculator;

    this.heventSub = this.bus.getSubscriber<HEvent>();
    this.xmlLogicHost = new CompositeLogicXMLHost();

    this.gaugeFactory = new XMLGaugeConfigFactory(this, this.bus);

    this.navdataComputer = new NavdataComputer(this.bus, this.planner, this.loader);

    this.tas = new TrafficAdvisorySystem(this.bus, this.trafficInstrument, 30, 2, 1);

    this.backlightManager = new BacklightManager('mfd', this.bus);

    // TODO: Support pilot profiles.
    this.settingSaveManager = new G1000SettingSaveManager(this.bus);
    const saveKey = `${SimVar.GetSimVarValue('ATC MODEL', 'string')}.profile_1`;
    this.settingSaveManager.load(saveKey);
    this.settingSaveManager.startAutoSave(saveKey);

    this.initDuration = 3000;
    this.needValidationAfterInit = true;
  }

  /**
   * The instrument template ID.
   * @returns The instrument template ID.
   */
  get templateID(): string {
    return 'AS1000_MFD';
  }

  /**
   * Whether or not the instrument is interactive (a touchscreen instrument).
   * @returns True
   */
  get isInteractive(): boolean {
    return true;
  }

  /**
   * A callback called when the element has connection to the DOM.
   */
  public connectedCallback(): void {
    super.connectedCallback();

    this.autopilot = new G1000Autopilot(this.bus, this.planner, new G1000APConfig(this.bus, this.planner), new G1000APStateManager(this.bus));
    this.fms = new Fms(this.bus, this.planner, this.viewService, this.g1000ControlPublisher, this.autopilot);

    const menuSystem = new MenuSystem(this.bus, 'AS1000_MFD_SOFTKEYS_');
    //// BEGIN CURRENT
    let gaugeConfig = this.gaugeFactory.parseConfig(this.xmlConfig);
    // TODO Undo this when new panels are in the base game.
    if (!gaugeConfig.override) {
      const loader = new PanelLoader(this.gaugeFactory);
      const extPanel = loader.loadConfigForModel(SimVar.GetSimVarValue('ATC MODEL', 'string'));
      if (extPanel) {
        gaugeConfig = extPanel;
      }
    }

    menuSystem.addMenu('empty', new SoftKeyMenu(menuSystem));
    menuSystem.addMenu('navmap-root', new MFDNavMapRootMenu(menuSystem));
    menuSystem.addMenu('map-opt', new MapOptMenu(menuSystem, this.controlPublisher));
    menuSystem.addMenu('traffic-root', new MFDTrafficMapRootMenu(menuSystem));
    menuSystem.addMenu('traffic-motion', new MFDTrafficMapMotionMenu(menuSystem));
    menuSystem.addMenu('traffic-motion-duration', new MFDTrafficMapMotionDurationMenu(menuSystem));
    menuSystem.addMenu('traffic-alt', new MFDTrafficMapAltitudeMenu(menuSystem));
    menuSystem.addMenu('selectproc-root', new MFDSelectProcedureRootMenu(menuSystem, this.viewService, this.bus));
    menuSystem.addMenu('engine-menu', new EngineMenu(menuSystem, gaugeConfig, this.g1000ControlPublisher));
    menuSystem.addMenu('lean-menu', new LeanMenu(menuSystem, gaugeConfig, this.g1000ControlPublisher));
    menuSystem.addMenu('system-menu', new SystemMenu(menuSystem, gaugeConfig, this.g1000ControlPublisher));
    menuSystem.addMenu('fuel-rem-menu', new FuelRemMenu(menuSystem, gaugeConfig, this.g1000ControlPublisher));
    menuSystem.addMenu('inset-menu', new InsetMenu(menuSystem, this.controlPublisher));
    menuSystem.addMenu('fpln-menu', new MFDFPLRootMenu(menuSystem, this.controlPublisher));
    menuSystem.addMenu('nearest-airports-menu', new MFDNearestAirportRootMenu(menuSystem, this.g1000ControlPublisher));
    menuSystem.addMenu('nearest-vors-menu', new MFDNearestVorRootMenu(menuSystem, this.g1000ControlPublisher));
    menuSystem.addMenu('systemsetup-root', new MFDSystemSetupRootMenu(menuSystem));
    // menuSystem.addMenu('fpln-opt', new FlightPlanPopoutMenu(menuSystem, this.controlPublisher));
    // menuSystem.addMenu('view-opt', new ViewMenu(menuSystem, this.controlPublisher));

    menuSystem.pushMenu('navmap-root');

    FSComponent.render(<EIS bus={this.bus} logicHandler={this.xmlLogicHost} gaugeConfig={gaugeConfig} />, document.getElementsByClassName('eis')[0] as HTMLDivElement);
    FSComponent.render(
      <MFDNavDataBar
        bus={this.bus}
        modelFactory={new DefaultMFDNavDataBarFieldModelFactory(this.bus, this.fms)}
        dataBarSettingManager={MFDNavDataBarUserSettings.getManager(this.bus)}
        unitsSettingManager={UnitsUserSettings.getManager(this.bus)}
        updateFreq={1}
        openPage={this.viewService.openPage}
      />,
      document.getElementById('NavComBox')
    );
    FSComponent.render(<NavComRadio bus={this.bus} title='NAV' position='left' />, document.querySelector('#NavComBox #Left'));
    FSComponent.render(<NavComRadio bus={this.bus} title='COM' position='right' />, document.querySelector('#NavComBox #Right'));
    FSComponent.render(<SoftKeyBar menuSystem={menuSystem} />, document.getElementById('Electricity'));

    FSComponent.render(<StartupLogo bus={this.bus} eventPrefix='AS1000_MFD' onConfirmation={(): any => this.initAcknowledged = true} />, this);

    this.backplane.init();
    this.controlPublisher.publishEvent('publish_radio_states', true);

    this.viewService.registerView('NavMapPage', () => <MFDNavMapPage viewService={this.viewService} bus={this.bus} menuSystem={menuSystem} flightPlanner={this.planner} tas={this.tas} />);
    this.viewService.registerView('FPLPage', () => <MFDFPLPage viewService={this.viewService} fms={this.fms} bus={this.bus} menuSystem={menuSystem} tas={this.tas} />);
    this.viewService.registerView('TrafficPage', () => <MFDTrafficMapPage viewService={this.viewService} bus={this.bus} menuSystem={menuSystem} flightPlanner={this.planner} tas={this.tas} />);

    this.viewService.registerView('SelectProcedurePage', () => <MFDSelectProcedurePage viewService={this.viewService} fms={this.fms} bus={this.bus} calculator={this.calculator} menuSystem={menuSystem} />);

    this.viewService.registerView('NearestAirports', () => <MFDNearestAirportsPage viewService={this.viewService} fms={this.fms} menuSystem={menuSystem} bus={this.bus} loader={this.loader} publisher={this.controlPublisher} tas={this.tas} />);
    this.viewService.registerView('NearestIntersections', () => <MFDNearestIntersectionsPage viewService={this.viewService} fms={this.fms} menuSystem={menuSystem} bus={this.bus} loader={this.loader} publisher={this.controlPublisher} tas={this.tas} />);
    this.viewService.registerView('NearestNDBs', () => <MFDNearestNdbsPage viewService={this.viewService} fms={this.fms} menuSystem={menuSystem} bus={this.bus} loader={this.loader} publisher={this.controlPublisher} tas={this.tas} />);
    this.viewService.registerView('NearestVORs', () => <MFDNearestVorsPage viewService={this.viewService} fms={this.fms} menuSystem={menuSystem} bus={this.bus} loader={this.loader} publisher={this.controlPublisher} tas={this.tas} />);

    this.viewService.registerView('AirportInformation', () => <MFDAirportInformationPage viewService={this.viewService} fms={this.fms} menuSystem={menuSystem} bus={this.bus} facilityLoader={this.loader} controlPublisher={this.controlPublisher} tas={this.tas} />);
    this.viewService.registerView('IntersectionInformation', () => <MFDIntersectionInformationPage viewService={this.viewService} fms={this.fms} menuSystem={menuSystem} bus={this.bus} facilityLoader={this.loader} controlPublisher={this.controlPublisher} tas={this.tas} />);
    this.viewService.registerView('NdbInformation', () => <MFDNdbInformationPage viewService={this.viewService} fms={this.fms} menuSystem={menuSystem} bus={this.bus} facilityLoader={this.loader} controlPublisher={this.controlPublisher} tas={this.tas} />);
    this.viewService.registerView('VorInformation', () => <MFDVorInformationPage viewService={this.viewService} fms={this.fms} menuSystem={menuSystem} bus={this.bus} facilityLoader={this.loader} controlPublisher={this.controlPublisher} tas={this.tas} />);

    this.viewService.registerView('SystemSetupPage', () => <MFDSystemSetupPage viewService={this.viewService} bus={this.bus} menuSystem={menuSystem} />);

    this.viewService.registerView('PageSelect', () => <MFDPageSelect viewService={this.viewService} title="Page Select" showTitle={false} />);
    this.viewService.registerView('ContextMenuDialog', () => <ContextMenuDialog viewService={this.viewService} title="" showTitle={false} upperKnobCanScroll={true} />);
    this.viewService.registerView('PROC', () => <MFDProc viewService={this.viewService} title="Procedures" showTitle={true} fms={this.fms} />);
    this.viewService.registerView('DirectTo', () => <MFDDirectTo viewService={this.viewService} bus={this.bus} fms={this.fms} title="Direct To" showTitle={true} />);
    this.viewService.registerView('MapSettings', () => <MFDMapSettings viewService={this.viewService} title='Map Settings' showTitle={true} bus={this.bus} menuSystem={menuSystem} />);
    this.viewService.registerView('WptInfo', () => <MFDWptInfo viewService={this.viewService} title="Waypoint Information" showTitle={true} bus={this.bus} />);
    this.viewService.registerView('SetRunway', () => <MFDSetRunway viewService={this.viewService} title="Set Runway" showTitle={true} />);
    this.viewService.registerView('MessageDialog', () => <MessageDialog viewService={this.viewService} title="" showTitle={false} />);
    this.viewService.registerView('PageMenuDialog', () => <MFDPageMenuDialog viewService={this.viewService} title="Page Menu" showTitle={true} />);
    this.viewService.registerView('SelectAirway', () => <MFDSelectAirway viewService={this.viewService} title="Select Airway" showTitle={true} fms={this.fms} bus={this.bus} />);
    this.viewService.registerView('HoldAt', () => <MFDHold viewService={this.viewService} title="Hold at" showTitle={true} fms={this.fms} bus={this.bus} />);
    this.viewService.registerView('WptDup', () => <MFDWptDupDialog viewService={this.viewService} title='Duplicate Waypoints' showTitle={true} bus={this.bus} />);

    this.viewService.open('NavMapPage');

    // force enable animations
    document.documentElement.classList.add('animationsEnabled');
    this.controlPublisher.publishEvent('init_cdi', true);
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
  private initPrimaryFlightPlan(): void {
    // Do not create a new flight plan ourselves; instead we will sync it from the PFD.
    this.fms.flightPlanner.requestSync();
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
  }

  /** @inheritdoc */
  public onShutDown(): void {
    super.onShutDown();

    this.bus.pub('vc_powered', false);
  }

  /**
   * A callback called when the instrument gets a frame update.
   */
  public Update(): void {
    super.Update();

    const now = Date.now();
    if (now - this.lastCalculate > 3000) {
      this.lastCalculate = now;
    }

    this.clock.onUpdate();
    this.backplane.onUpdate();
    this.autopilot?.update();
    this.xmlLogicHost.update(this.deltaTime);
    this.gpsSynchronizer.update();

    if (this.previousScreenState !== this.screenState) {
      this.onScreenStateChanged();
    }
  }

  /**
   * Handles when the instrument screen state has changed.
   */
  private onScreenStateChanged(): void {
    this.bus.pub('vc_screen_state', { previous: this.previousScreenState, current: this.screenState });
    this.previousScreenState = this.screenState;

    if (this.screenState === ScreenState.ON) {
      this.bus.pub('mfd_power_on', true, true, true);
    } else {
      this.bus.pub('mfd_power_on', false, true, true);
    }
  }

  /**
   * Starts data publishers to the bus.
   */
  protected startPublishers(): void {
    this.adc.subscribe('hdg_deg');
    this.adc.subscribe('hdg_deg_true');
    this.adc.subscribe('tas');
    this.adc.subscribe('ambient_wind_direction');
    this.adc.subscribe('ambient_wind_velocity');
    this.adc.subscribe('alt');
    this.adc.subscribe('on_ground');
    this.adc.subscribe('vs');
    this.adc.subscribe('pitch_deg');
    this.adc.subscribe('ias');
    this.adc.subscribe('roll_deg');
    this.adc.subscribe('delta_heading_rate');

    this.eis.subscribe('rpm_1');
    this.eis.subscribe('recip_ff_1');
    this.eis.subscribe('oil_press_1');
    this.eis.subscribe('oil_temp_1');
    this.eis.subscribe('egt_1');
    this.eis.subscribe('vac');
    this.eis.subscribe('fuel_left');
    this.eis.subscribe('fuel_right');
    this.eis.subscribe('fuel_total');
    this.eis.subscribe('fuel_flow_total');
    this.eis.subscribe('eng_hours_1');
    this.eis.subscribe('elec_bus_main_v');
    this.eis.subscribe('elec_bus_main_a');
    this.eis.subscribe('elec_bus_avionics_v');
    this.eis.subscribe('elec_bus_avionics_a');
    this.eis.subscribe('elec_bus_genalt_1_v');
    this.eis.subscribe('elec_bus_genalt_1_a');
    this.eis.subscribe('elec_bat_v');
    this.eis.subscribe('elec_bat_a');

    this.electricalPublisher.subscribe('elec_av1_bus');
    this.electricalPublisher.subscribe('elec_av2_bus');
    this.electricalPublisher.subscribe('elec_circuit_navcom1_on');
    this.electricalPublisher.subscribe('elec_circuit_navcom2_on');

    this.lNavPublisher.subscribe('lnavBrgMag');
    this.lNavPublisher.subscribe('lnavDis');
    this.lNavPublisher.subscribe('lnavDtkMag');
    this.lNavPublisher.subscribe('lnavXtk');
    this.lNavPublisher.subscribe('lnavCurrentVector');
    this.lNavPublisher.subscribe('lnavIsTracking');
    this.lNavPublisher.subscribe('lnavDistanceToDestination');

    this.vNavPublisher.subscribe('vnavTodLegIndex');
    this.vNavPublisher.subscribe('vnavTodLegDistance');
    this.vNavPublisher.subscribe('vnavBodLegIndex');
    this.vNavPublisher.subscribe('vnavMode');
    this.vNavPublisher.subscribe('vnavPathMode');
    this.vNavPublisher.subscribe('vnavFpa');
    this.vNavPublisher.subscribe('vnavTodDistance');
    this.vNavPublisher.subscribe('vnavTargetAlt');
    this.vNavPublisher.subscribe('vnavVDev');
    this.vNavPublisher.subscribe('vnavAltCaptureType');
    this.vNavPublisher.subscribe('vnavBodDistance');
    this.vNavPublisher.subscribe('vnavConstraintAltitude');
    this.vNavPublisher.subscribe('vnavConstraintLegIndex');
    this.vNavPublisher.subscribe('vnavRequiredVs');
    this.vNavPublisher.subscribe('vnavNextConstraintAltitude');
  }

  /**
   * Callback called when the flight starts.
   */
  protected onFlightStart(): void {
    super.onFlightStart();
    this.autopilot.stateManager.initialize();
  }

  /**
   * A callback called when the instrument received a H event.
   * @param args The H event and associated arguments, if any.
   */
  public onInteractionEvent(args: string[]): void {
    this.hEventPublisher.dispatchHEvent(args[0]);
  }
}

registerInstrument('wtg1000-mfd', WTG1000_MFD);
