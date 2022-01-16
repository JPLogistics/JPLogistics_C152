import { EventBus } from 'msfssdk/data';
import { G1000ControlEvents } from '../../../Shared/G1000Events';
import { FmsHEvent } from '../../../Shared/UI/FmsHEvent';
import { ViewService } from '../../../Shared/UI/ViewService';
import { FPL } from './FPL/FPL';
import { PFDProc } from './Procedure/PFDProc';
import { TimerRef } from './TimerRef/TimerRef';
import { Nearest } from './Nearest';
import { ADFDME } from './ADF-DME/ADFDME';
import { PFDSetup } from './PFDSetup';
import { Alerts } from './Alerts/Alerts';

/**
 * A service to manage views.
 */
export class PFDViewService extends ViewService {

  protected readonly fmsEventMap: Map<string, FmsHEvent> = new Map([
    ['AS1000_PFD_FMS_Upper_INC', FmsHEvent.UPPER_INC],
    ['AS1000_PFD_FMS_Upper_DEC', FmsHEvent.UPPER_DEC],
    ['AS1000_PFD_FMS_Lower_INC', FmsHEvent.LOWER_INC],
    ['AS1000_PFD_FMS_Lower_DEC', FmsHEvent.LOWER_DEC],
    ['AS1000_PFD_MENU_Push', FmsHEvent.MENU],
    ['AS1000_PFD_CLR', FmsHEvent.CLR],
    ['AS1000_PFD_ENT_Push', FmsHEvent.ENT],
    ['AS1000_PFD_FMS_Upper_PUSH', FmsHEvent.UPPER_PUSH],
    ['AS1000_PFD_DIRECTTO', FmsHEvent.DIRECTTO],
    ['AS1000_PFD_FPL_Push', FmsHEvent.FPL],
    ['AS1000_PFD_PROC_Push', FmsHEvent.PROC],
    ['AS1000_PFD_RANGE_INC', FmsHEvent.RANGE_INC],
    ['AS1000_PFD_RANGE_DEC', FmsHEvent.RANGE_DEC]
  ])

  /**
   * Constructs the view service.
   * @param bus The event bus.
   */
  constructor(readonly bus: EventBus) {
    super(bus);
    const g1000Pub = this.bus.getSubscriber<G1000ControlEvents>();
    g1000Pub.on('pfd_timerref_push').handle(() => {
      this.onInteractionEvent('pfd_timerref_push');
    });
    g1000Pub.on('pfd_nearest_push').handle(() => {
      this.onInteractionEvent('pfd_nearest_push');
    });
    g1000Pub.on('pfd_dme_push').handle(() => {
      this.onInteractionEvent('pfd_dme_push');
    });
    g1000Pub.on('pfd_alert_push').handle(() => {
      this.onInteractionEvent('pfd_alert_push');
    });
  }

  /**
   * Routes the HEvents to the views.
   * @param hEvent The event identifier.
   */
  protected onInteractionEvent(hEvent: string): void {
    // Handling a few special cases here to keep the other stuff nice ;)

    const activeView = this.activeView.get();

    // No active view and MENU pressed
    if (hEvent === 'AS1000_PFD_MENU_Push') {
      if (!activeView) {
        this.open(PFDSetup.name);
        return;
      } else if (activeView instanceof PFDSetup) {
        activeView.close();
        return;
      }
    }

    const evt = this.fmsEventMap.get(hEvent);
    if (evt !== undefined && this.routeInteractionEventToViews(evt)) {
      return;
    }


    switch (hEvent) {
      // TODO move these events out in the next iteration, since we dont want type refs to the views in here
      case 'AS1000_PFD_FPL_Push':
        if (activeView instanceof FPL) {
          this.clearStack(false);
        } else {
          this.open('FPL');
        }
        break;
      case 'AS1000_PFD_PROC_Push':
        if (activeView instanceof PFDProc) {
          this.clearStack(false);
        } else {
          this.open('PROC');
        }
        break;
      case 'pfd_timerref_push':
        if (activeView instanceof TimerRef) {
          this.clearStack(false);
        } else {
          this.open(TimerRef.name);
        }
        break;
      case 'pfd_nearest_push':
        if (activeView instanceof Nearest) {
          this.clearStack(false);
        } else {
          this.open(Nearest.name);
        }
        break;
      case 'pfd_dme_push':
        if (activeView instanceof ADFDME) {
          this.clearStack(false);
        } else {
          this.open(ADFDME.name);
        }
        break;
      case 'pfd_alert_push':
        if (this.activeView.get() instanceof Alerts) {
          this.clearStack(false);
        } else {
          this.open(Alerts.name);
        }
        break;
      case 'AS1000_PFD_DIRECTTO':
        this.open('DirectTo');
        break;
    }
  }
}