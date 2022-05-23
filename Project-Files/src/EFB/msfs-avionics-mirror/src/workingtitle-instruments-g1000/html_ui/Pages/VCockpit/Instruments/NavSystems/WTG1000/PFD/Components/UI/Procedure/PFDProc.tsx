import { FSComponent, VNode } from 'msfssdk';
import { ListMenuDialog, ListMenuDialogProps } from '../../../../Shared/UI/Dialogs/ListMenuDialog';
import { MenuItemDefinition } from '../../../../Shared/UI/Dialogs/PopoutMenuItem';
import { Fms } from 'garminsdk/flightplan';
import { PFDSelectApproachView } from './Approach/PFDSelectApproachView';

import './PFDProc.css';

/** The properties on the PROC popout component. */
interface PFDProcProps extends ListMenuDialogProps {
  /** An instance of the fms. */
  fms: Fms;
}

/**
 * The PFD procedures popout.
 */
export class PFDProc extends ListMenuDialog<PFDProcProps> {

  /** @inheritdoc */
  protected onViewResumed(): void {
    const menuItems = this.buildMenuList();
    this.setMenuItems(menuItems);
  }

  /**
   * Method to dynamically build the menu list
   * @returns an array of menu item definitions
   */
  public buildMenuList(): MenuItemDefinition[] {
    const approachLoaded = this.props.fms.canActivateApproach();
    const canVtfActivate = this.props.fms.canActivateVtf();
    const canMissedActivate = this.props.fms.canMissedApproachActivate();

    const menuItems = [
      {
        id: 'activate-vector-to-final', renderContent: (): VNode => <span>Activate Vector-to-Final</span>, isEnabled: canVtfActivate,
        action: (): void => {
          this.props.fms.activateVtf();
        }
      },
      {
        id: 'activate-approach', renderContent: (): VNode => <span>Activate Approach</span>, isEnabled: approachLoaded,
        action: (): void => {
          this.props.fms.activateApproach();
        }
      },
      {
        id: 'activate-missed', renderContent: (): VNode => <span>Activate Missed Approach</span>, isEnabled: canMissedActivate,
        action: (): void => {
          this.props.fms.activateMissedApproach();
        }
      },
      {
        id: 'select-approach', renderContent: (): VNode => <span>Select Approach</span>, isEnabled: true,
        action: (): void => {
          (this.props.viewService.open('SelectApproach', false) as PFDSelectApproachView).initDefaults();
        }, closeAfterAction: false
      },
      {
        id: 'select-arrival', renderContent: (): VNode => <span>Select Arrival</span>, isEnabled: true,
        action: (): void => {
          this.props.viewService.open('SelectArrival', false);
        }, closeAfterAction: false
      },
      {
        id: 'select-departure', renderContent: (): VNode => <span>Select Departure</span>, isEnabled: true,
        action: (): void => {
          this.props.viewService.open('SelectDeparture', false);
        }, closeAfterAction: false
      },
    ];
    return menuItems;
  }

  /** @inheritdoc */
  protected buildMenuItems(): MenuItemDefinition[] {
    return this.buildMenuList();
  }
}
