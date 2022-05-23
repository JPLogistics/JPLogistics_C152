import { VNode } from 'msfssdk';
import { FmsHEvent } from '../../../Shared/UI/FmsHEvent';
import { MenuSystem } from '../../../Shared/UI/Menus/MenuSystem';
import { UiPage, UiPageProps } from '../../../Shared/UI/UiPage';
import { MFDPageSelect } from './MFDPageSelect';

import './MFDUiPage.css';

/**
 * Component props for MFDUiPage.
 */
export interface MFDUiPageProps extends UiPageProps {
  /** The softkey menu system. */
  menuSystem: MenuSystem;
}

/**
 * An MFD page.
 */
export abstract class MFDUiPage<T extends MFDUiPageProps = MFDUiPageProps> extends UiPage<T> {
  protected isSoftkeyMenuHidden = false;

  /** @inheritdoc */
  public onAfterRender(thisNode: VNode): void {
    super.onAfterRender(thisNode);

    this.scrollController.gotoFirst();
    this.setScrollEnabled(false);

    this.props.viewService.activeView.sub(view => {
      // hide the softkey menu if a view is opened on top of the page unless it is the page select menu.
      if (view && this.props.viewService.openPage.get() === this) {
        if (view instanceof MFDPageSelect || view === this) {
          this.setSoftkeyMenuHidden(false);
        } else {
          this.setSoftkeyMenuHidden(true);
        }
      }
    });
  }

  /** @inheritdoc */
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.UPPER_INC:
      case FmsHEvent.UPPER_DEC:
      case FmsHEvent.LOWER_INC:
      case FmsHEvent.LOWER_DEC:
        if (!this.scrollController.getIsScrollEnabled()) {
          this.props.viewService.open('PageSelect', true);
        }
        break;
      case FmsHEvent.FPL:
        return this.onFPLPressed();
      case FmsHEvent.PROC:
        return this.onPROCPressed();
      case FmsHEvent.DIRECTTO:
        return this.onDirectToPressed();
      case FmsHEvent.MENU:
        return this.onMenuPressed();
    }

    return false;
  }

  /**
   * This method is called when a MENU button event occurs.
   * @returns whether the event was handled.
   */
  protected onMenuPressed(): boolean {
    return false;
  }

  /**
   * This method is called when a PROC button event occurs.
   * @returns whether the event was handled.
   */
  protected onDirectToPressed(): boolean {
    this.props.viewService.open('DirectTo');
    return true;
  }

  /**
   * This method is called when a FPL button event occurs.
   * @returns whether the event was handled.
   */
  protected onFPLPressed(): boolean {
    this.props.viewService.open('FPLPage');
    return true;
  }

  /**
   * This method is called when a PROC button event occurs.
   * @returns whether the event was handled.
   */
  protected onPROCPressed(): boolean {
    this.props.viewService.open('PROC');
    return true;
  }

  /** @inheritdoc */
  protected onViewClosed(): void {
    super.onViewClosed();

    this.setScrollEnabled(false);
    this.setSoftkeyMenuHidden(false);
  }

  /**
   * Sets whether the softkey menu is hidden.
   * @param hide Whether to hide the softkey menu.
   */
  protected setSoftkeyMenuHidden(hide: boolean): void {
    if (hide === this.isSoftkeyMenuHidden) {
      return;
    }

    if (hide) {
      this.props.menuSystem.pushMenu('empty');
    } else {
      this.props.menuSystem.back();
    }
    this.isSoftkeyMenuHidden = hide;
  }
}
