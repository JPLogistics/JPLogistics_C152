import { EventBus } from 'msfssdk/data';
import { MFDSelectProcedurePage } from '../../../../MFD/Components/UI/Procedure/MFDSelectProcedurePage';
import { ProcedureType } from 'garminsdk/flightplan';
import { G1000ControlEvents } from '../../../G1000Events';
import { ViewService } from '../../ViewService';
import { MenuSystem } from '../MenuSystem';
import { MFDRootMenu } from './MFDRootMenu';

/**
 * The MFD select procedure pages root softkey menu.
 */
export class MFDSelectProcedureRootMenu extends MFDRootMenu {
  /**
   * Creates an instance of the MFD System Setup page root softkey menu.
   * @param menuSystem The menu system.
   * @param viewService The view service.
   * @param bus The event bus.
   */
  constructor(menuSystem: MenuSystem, viewService: ViewService, bus: EventBus) {
    super(menuSystem);

    this.addItem(5, 'DP', () => {
      let page = viewService.openPage.get();
      if (!(page instanceof MFDSelectProcedurePage)) {
        page = viewService.open('SelectProcedurePage') as MFDSelectProcedurePage;
      }
      (page as MFDSelectProcedurePage).setActiveProcedureType(ProcedureType.DEPARTURE);
    }, false);

    this.addItem(6, 'STAR', () => {
      let page = viewService.openPage.get();
      if (!(page instanceof MFDSelectProcedurePage)) {
        page = viewService.open('SelectProcedurePage') as MFDSelectProcedurePage;
      }
      (page as MFDSelectProcedurePage).setActiveProcedureType(ProcedureType.ARRIVAL);
    }, false);

    this.addItem(7, 'APR', () => {
      let page = viewService.openPage.get();
      if (!(page instanceof MFDSelectProcedurePage)) {
        page = viewService.open('SelectProcedurePage') as MFDSelectProcedurePage;
      }
      (page as MFDSelectProcedurePage).setActiveProcedureType(ProcedureType.APPROACH)?.initDefaults();
    }, false);

    this.addItem(10, 'Go Back', () => { viewService.openLastPage(); });
    this.addItem(11, 'Checklist');

    bus.getSubscriber<G1000ControlEvents>().on('mfd_proc_page_type').whenChanged().handle(this.onProcedureTypeChanged.bind(this));
  }

  /**
   * Responds to changes in the MFD select procedure page's active procedure type.
   * @param type The active procedure type.
   */
  private onProcedureTypeChanged(type: ProcedureType): void {
    const depButton = this.getItem(5);
    const arrButton = this.getItem(6);
    const aprButton = this.getItem(7);

    depButton.value.set(false);
    arrButton.value.set(false);
    aprButton.value.set(false);

    switch (type) {
      case ProcedureType.DEPARTURE:
        depButton.value.set(true);
        break;
      case ProcedureType.ARRIVAL:
        arrButton.value.set(true);
        break;
      case ProcedureType.APPROACH:
      case ProcedureType.VISUALAPPROACH:
        aprButton.value.set(true);
        break;
    }
  }
}