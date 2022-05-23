import { EventBus } from 'msfssdk/data';
import { BasePublisher } from 'msfssdk/instruments';
import { NearestAirportSoftKey } from '../MFD/Components/UI/Nearest/MFDNearestAirportsPage';
import { VSpeed } from '../PFD/Components/FlightInstruments/AirspeedIndicator';
import { EISPageTypes } from '../MFD/Components/EIS';
import { FuelRemaingAdjustment } from './FuelComputer';
import { FmaData } from './Autopilot/FmaData';
import { ProcedureType } from 'garminsdk/flightplan';
import { NearestVorSoftKey } from '../MFD/Components/UI/Nearest/MFDNearestVORsPage';

/** Extension of generic ControlEvents to handle G1000-specific events. */
export interface G1000ControlEvents {
  /** Event representing pfd alert button push. */
  pfd_alert_push: boolean

  /** Event representing pfd nearest button push. */
  pfd_nearest_push: boolean

  /** Event representing pfd DME button push */
  pfd_dme_push: boolean

  /** Event representing pfd timer/ref button push. */
  pfd_timerref_push: boolean

  /**Set if STD BARO is pressed or not **/
  std_baro_switch: boolean

  /** Event representing xpdr code menu button push. */
  xpdr_code_push: boolean

  /** Event representing xpdr code menu button push. */
  xpdr_code_digit: number

  /** Event for updating the v speeds from the soft menu to the airspeed indicator. */
  vspeed_set: VSpeed

  /** Event for updating the display of v speeds from the soft menu to the airspeed indicator. */
  vspeed_display: VSpeed

  /** Event for updating if minimums are displayed (true) or not (false). */
  show_minimums: boolean;

  /** Event for updating the timer display. */
  timer_value: number;

  /** Sending EIS page selections. */
  eis_page_select: EISPageTypes;

  /** Set the lean assist state. */
  eis_lean_assist: boolean;

  /**Set the cylinder select state */
  eis_cyl_slct: boolean;

  /** Adjust the remaining fuel total in the fuel computer. */
  fuel_adjustment: FuelRemaingAdjustment;

  /** Reset the fuel burn total. */
  fuel_comp_reset: boolean;

  /** FMA Event for Autopilot Modes. */
  fma_modes: FmaData;

  /** Cancel altitude alerter. */
  alt_alert_cancel: boolean;

  /** Event for disabling the FD in this aircraft. */
  fd_not_installed: boolean;

  /** Whether an autopilot selected altitude has been set. */
  ap_alt_sel_set: boolean;

  /** Event for selecting a vertical direct. */
  activate_vertical_direct: boolean;

  /** Set the focused group of the Nearest Airports page */
  nearest_airports_key: NearestAirportSoftKey;

  /** Set the focused group of the Nearest VORs page */
  nearest_vors_key: NearestVorSoftKey;

  /** Whether or not the LD APR softkey button is enabled on the nearest airports page. */
  ld_apr_enabled: boolean;

  /** An event fired when the VNV Prof softkey is pressed. */
  vnv_prof_key: boolean;

  /** The active procedure type of the MFD select procedure page. */
  mfd_proc_page_type: ProcedureType;
}

/** A control publisher that handles G1000 events too. */
export class G1000ControlPublisher extends BasePublisher<G1000ControlEvents> {
  /**
   * Create a ControlPublisher.
   * @param bus The EventBus to publish to.
   */
  public constructor(bus: EventBus) {
    super(bus);
  }

  /**
   * Publish a control event.
   * @param event The event from ControlEvents.
   * @param value The value of the event.
   */
  public publishEvent<K extends keyof G1000ControlEvents>(event: K, value: G1000ControlEvents[K]): void {
    this.publish(event, value, true);
  }
}
