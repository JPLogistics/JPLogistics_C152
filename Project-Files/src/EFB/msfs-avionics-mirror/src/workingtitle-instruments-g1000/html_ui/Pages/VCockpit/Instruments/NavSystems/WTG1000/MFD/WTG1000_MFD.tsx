/* eslint-disable max-len */
// TODO:  Remove the above disable whenever all the verbose commented out code put in place for flight plan
// debugging has been removed for good, so we have proper line length checking.
/// <reference types="msfstypes/Pages/VCockpit/Instruments/Shared/BaseInstrument" />
/// <reference types="msfstypes/Pages/VCockpit/Core/VCockpit" />
/// <reference types="msfstypes/JS/simvar" />

import { FSComponent } from 'msfssdk';
import { BottomTargetPathCalculator, GpsSynchronizer, LNavSimVarPublisher, VNavSimVarPublisher } from 'msfssdk/autopilot';
import { XMLGaugeConfigFactory } from 'msfssdk/components/XMLGauges';
import { CompositeLogicXMLHost, ControlPublisher, EventBus, HEvent, HEventPublisher } from 'msfssdk/data';
import { EventSubscriber } from 'msfssdk/data/EventSubscriber';
import { FlightPathCalculator, FlightPlanner } from 'msfssdk/flightplan';
import {
  ADCPublisher, APRadioNavInstrument, AutopilotInstrument, BaseInstrumentPublisher, Clock, EISPublisher,
  ElectricalPublisher, GNSSPublisher, InstrumentBackplane, InstrumentEvents, NavComSimVarPublisher,
  TrafficInstrument
} from 'msfssdk/instruments';
import { FacilityLoader, FacilityRepository } from 'msfssdk/navigation';
import { UserSettingSaveManager } from 'msfssdk/settings';
import { TCASOperatingMode } from 'msfssdk/traffic';

import { GarminAPConfig, GarminAPStateManager } from 'garminsdk/autopilot';
import { Fms } from 'garminsdk/flightplan';
import { LNavDataSimVarPublisher, NavdataComputer } from 'garminsdk/navigation';
import { DateTimeUserSettings, UnitsUserSettings } from 'garminsdk/settings';

import { PFDUserSettings } from '../PFD/PFDUserSettings';
import { G1000Autopilot } from '../Shared/Autopilot/G1000Autopilot';
import { BacklightManager } from '../Shared/Backlight/BacklightManager';
import { FuelComputer } from '../Shared/FuelComputer';
import { G1000ControlPublisher } from '../Shared/G1000Events';
import { NavComRadio } from '../Shared/NavCom/NavComRadio';
import { G1000SettingSaveManager } from '../Shared/Profiles/G1000SettingSaveManager';
import { StartupLogo } from '../Shared/StartupLogo';
import {
  ADCAvionicsSystem, AHRSSystem, AvionicsComputerSystem, EngineAirframeSystem, G1000AvionicsSystem, MagnetometerSystem, TransponderSystem
} from '../Shared/Systems';
import { TrafficAdvisorySystem } from '../Shared/Traffic/TrafficAdvisorySystem';
import { ContextMenuDialog } from '../Shared/UI/Dialogs/ContextMenuDialog';
import { MessageDialog } from '../Shared/UI/Dialogs/MessageDialog';
import { MenuSystem } from '../Shared/UI/Menus/MenuSystem';
import { EngineMenu } from '../Shared/UI/Menus/MFD/EngineMenu';
import { FuelRemMenu } from '../Shared/UI/Menus/MFD/FuelRemMenu';
import { InsetMenu } from '../Shared/UI/Menus/MFD/InsetMenu';
import { LeanMenu } from '../Shared/UI/Menus/MFD/LeanMenu';
import { MapOptMenu } from '../Shared/UI/Menus/MFD/MapOptMenu';
import { MFDFPLRootMenu } from '../Shared/UI/Menus/MFD/MFDFPLRootMenu';
import { MFDNavMapRootMenu } from '../Shared/UI/Menus/MFD/MFDNavMapRootMenu';
import { MFDNearestAirportRootMenu } from '../Shared/UI/Menus/MFD/MFDNearestAirportRootMenu';
import { MFDNearestVorRootMenu } from '../Shared/UI/Menus/MFD/MFDNearestVorRootMenu';
import { MFDSelectProcedureRootMenu } from '../Shared/UI/Menus/MFD/MFDSelectProcedureRootMenu';
import { MFDSystemSetupRootMenu } from '../Shared/UI/Menus/MFD/MFDSystemSetupRootMenu';
import { SystemMenu } from '../Shared/UI/Menus/MFD/SystemMenu';
import { SoftKeyMenu } from '../Shared/UI/Menus/SoftKeyMenu';
import { SoftKeyBar } from '../Shared/UI/SoftKeyBar';
import { WaypointIconImageCache } from '../Shared/WaypointIconImageCache';
import { EIS } from './Components/EIS';
import { PanelLoader } from './Components/EngineInstruments/NewPanels/PanelLoader';
import { MFDSelectAirway } from './Components/UI/Airway/MFDSelectAirway';
import { MFDDirectTo } from './Components/UI/DirectTo/MFDDirectTo';
import { MFDFPLPage } from './Components/UI/FPL/MFDFPLPage';
import { MFDHold } from './Components/UI/Hold/MFDHold';
import { MFDAirportInformationPage } from './Components/UI/Information/Airport/MFDAirportInformationPage';
import { MFDIntersectionInformationPage } from './Components/UI/Information/Intersection/MFDIntersectionInformationPage';
import { MFDNdbInformationPage } from './Components/UI/Information/NDB/MFDNdbInformationPage';
import { MFDVorInformationPage } from './Components/UI/Information/VOR/MFDVorInformationPage';
import { MFDMapSettings } from './Components/UI/MapSettings/MFDMapSettings';
import { MFDPageMenuDialog } from './Components/UI/MFDPageMenuDialog';
import { MFDPageSelect } from './Components/UI/MFDPageSelect';
import { MFDViewService } from './Components/UI/MFDViewService';
import { MFDNavDataBar } from './Components/UI/NavDataBar/MFDNavDataBar';
import { MFDNavDataBarUserSettings } from './Components/UI/NavDataBar/MFDNavDataBarUserSettings';
import { MFDNavMapPage as MFDNavMapPage } from './Components/UI/NavMap/MFDNavMapPage';
import { MFDNearestAirportsPage } from './Components/UI/Nearest/MFDNearestAirportsPage';
import { MFDNearestIntersectionsPage } from './Components/UI/Nearest/MFDNearestIntersectionsPage';
import { MFDNearestNdbsPage } from './Components/UI/Nearest/MFDNearestNDBsPage';
import { MFDNearestVorsPage } from './Components/UI/Nearest/MFDNearestVORsPage';
import { MFDProc } from './Components/UI/Procedure/MFDProc';
import { MFDSelectProcedurePage } from './Components/UI/Procedure/MFDSelectProcedurePage';
import { MFDSetRunway } from './Components/UI/SetRunway/MFDSetRunway';
import { MFDSystemSetupPage } from './Components/UI/SystemSetup/MFDSystemSetupPage';
import { MFDTrafficMapAltitudeMenu } from './Components/UI/Traffic/MFDTrafficMapAltitudeMenu';
import { MFDTrafficMapMotionDurationMenu } from './Components/UI/Traffic/MFDTrafficMapMotionDurationMenu';
import { MFDTrafficMapMotionMenu } from './Components/UI/Traffic/MFDTrafficMapMotionMenu';
import { MFDTrafficMapPage } from './Components/UI/Traffic/MFDTrafficMapPage';
import { MFDTrafficMapRootMenu } from './Components/UI/Traffic/MFDTrafficMapRootMenu';
import { MFDWptDupDialog } from './Components/UI/WptDup/MFDWptDupDialog';
import { MFDWptInfo } from './Components/UI/WptInfo/MFDWptInfo';

import '../Shared/UI/Common/g1k_common.css';
import './WTG1000_MFD.css';
import '../Shared/UI/Common/LatLonDisplay.css';

/**
 * The base G1000 MFD instrument class.
 */
class WTG1000_MFD extends BaseInstrument {
  private readonly bus: EventBus;

  private readonly baseInstrumentPublisher: BaseInstrumentPublisher;
  private readonly gnss: GNSSPublisher;
  private readonly adc: ADCPublisher;
  private readonly eis: EISPublisher;
  private readonly hEventPublisher: HEventPublisher;
  private readonly g1000ControlPublisher: G1000ControlPublisher;
  private readonly controlPublisher: ControlPublisher;
  private readonly electricalPublisher: ElectricalPublisher;
  private readonly navComSimVarPublisher: NavComSimVarPublisher;

  private readonly lNavPublisher: LNavSimVarPublisher;
  private readonly lNavDataPublisher: LNavDataSimVarPublisher;
  private readonly vNavPublisher: VNavSimVarPublisher;
  private fms!: Fms;

  private readonly apInstrument: AutopilotInstrument;
  private readonly apRadioNav: APRadioNavInstrument;
  private readonly trafficInstrument: TrafficInstrument;
  private readonly clock: Clock;

  private readonly backplane: InstrumentBackplane;
  private readonly xmlLogicHost: CompositeLogicXMLHost;
  private readonly loader: FacilityLoader;
  private readonly calculator: FlightPathCalculator;
  private readonly planner: FlightPlanner;
  private readonly heventSub: EventSubscriber<HEvent>;
  private readonly gaugeFactory: XMLGaugeConfigFactory;

  private verticalPathCalculator!: BottomTargetPathCalculator;
  private autopilot!: G1000Autopilot;

  private viewService: MFDViewService;

  private readonly navdataComputer: NavdataComputer;
  private readonly gpsSynchronizer: GpsSynchronizer;

  private lastCalculate = 0;

  private readonly tas: TrafficAdvisorySystem;

  private readonly backlightManager: BacklightManager;

  private readonly settingSaveManager: UserSettingSaveManager;
  private readonly fuelComputer: FuelComputer;

  private readonly systems: G1000AvionicsSystem[] = [];

  /**
   * Creates an instance of the WTG1000_MFD.
   */
  constructor() {
    super();

    WaypointIconImageCache.init();

    this.bus = new EventBus();

    this.baseInstrumentPublisher = new BaseInstrumentPublisher(this, this.bus);

    this.gnss = new GNSSPublisher(this.bus);
    this.adc = new ADCPublisher(this.bus);
    this.controlPublisher = new ControlPublisher(this.bus);

    this.eis = new EISPublisher(this.bus);
    this.electricalPublisher = new ElectricalPublisher(this.bus);
    this.lNavPublisher = new LNavSimVarPublisher(this.bus);
    this.lNavDataPublisher = new LNavDataSimVarPublisher(this.bus);
    this.vNavPublisher = new VNavSimVarPublisher(this.bus);
    this.apRadioNav = new APRadioNavInstrument(this.bus);
    this.navComSimVarPublisher = new NavComSimVarPublisher(this.bus);

    this.hEventPublisher = new HEventPublisher(this.bus);
    this.g1000ControlPublisher = new G1000ControlPublisher(this.bus);
    this.controlPublisher = new ControlPublisher(this.bus);
    this.apInstrument = new AutopilotInstrument(this.bus);
    this.trafficInstrument = new TrafficInstrument(this.bus, { realTimeUpdateFreq: 2, simTimeUpdateFreq: 1, contactDeprecateTime: 10 });

    this.clock = new Clock(this.bus);
    this.fuelComputer = new FuelComputer(this.bus);

    this.backplane = new InstrumentBackplane();
    this.backplane.addPublisher('base', this.baseInstrumentPublisher);
    this.backplane.addPublisher('adc', this.adc);
    this.backplane.addPublisher('hEvents', this.hEventPublisher);
    this.backplane.addPublisher('gnss', this.gnss);
    this.backplane.addPublisher('eis', this.eis);
    this.backplane.addPublisher('control', this.controlPublisher);
    this.backplane.addPublisher('g1000', this.g1000ControlPublisher);
    this.backplane.addPublisher('lnav', this.lNavPublisher);
    this.backplane.addPublisher('lnavdata', this.lNavDataPublisher);
    this.backplane.addPublisher('vnav', this.vNavPublisher);
    this.backplane.addPublisher('electrical', this.electricalPublisher);
    this.backplane.addPublisher('navComSimVar', this.navComSimVarPublisher);
    this.backplane.addInstrument('ap', this.apInstrument);
    this.backplane.addInstrument('apRadioNav', this.apRadioNav);
    this.backplane.addInstrument('fuelComputer', this.fuelComputer);
    this.backplane.addInstrument('traffic', this.trafficInstrument);

    this.viewService = new MFDViewService(this.bus);

    this.loader = new FacilityLoader(FacilityRepository.getRepository(this.bus));
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

    this.verticalPathCalculator = new BottomTargetPathCalculator(this.bus, this.planner, 0, 3, 6);

    this.autopilot = new G1000Autopilot(
      this.bus, this.planner,
      new GarminAPConfig(this.bus, this.planner, this.verticalPathCalculator),
      new GarminAPStateManager(this.bus),
      PFDUserSettings.getManager(this.bus)
    );

    this.fms = new Fms(this.bus, this.planner, this.verticalPathCalculator);

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
        fms={this.fms}
        dataBarSettingManager={MFDNavDataBarUserSettings.getManager(this.bus)}
        unitsSettingManager={UnitsUserSettings.getManager(this.bus)}
        dateTimeSettingManager={DateTimeUserSettings.getManager(this.bus)}
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

    const sub = this.bus.getSubscriber<InstrumentEvents>();

    // initialize onInGame callback
    const onInGameSub = sub.on('vc_game_state').whenChanged().handle(state => {
      if (state === GameState.briefing || state === GameState.ingame) {
        this.onInGame();
        onInGameSub.destroy();
      }
    }, true);
    onInGameSub.resume(true);

    // initialize screen state callback
    sub.on('vc_screen_state').handle(event => {
      if (event.current !== event.previous) {
        this.onScreenStateChanged(event.current);
      }
    });
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

  /**
   * Callback for when the game state transitions to either briefing or in-game.
   * This can be used as a "last chance" hook to initialize things that need to wait
   * until a plane has loaded and everything is in a stable state.
   */
  protected onInGame(): void {
    // If we have the electrical publisher publishing before this point, it will
    // send an off-state for the electrics that will cause the avionics bus logic
    // to act as though it was just turned on any time the game launches, even if
    // it's not a C&D start.   Since this is undesirable, we don't actually have
    // it start publishing until we're actually "on the tarmac".
    this.electricalPublisher.setFlightStarted(true);
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
  }

  /**
   * Handles when the instrument screen state has changed.
   * @param state The current screen state.
   */
  private onScreenStateChanged(state: ScreenState): void {
    if (state === ScreenState.ON) {
      this.bus.pub('mfd_power_on', true, true, true);
      this.xmlLogicHost.setIsPaused(false);
    } else {
      this.bus.pub('mfd_power_on', false, true, true);
      this.xmlLogicHost.setIsPaused(true);
    }
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
