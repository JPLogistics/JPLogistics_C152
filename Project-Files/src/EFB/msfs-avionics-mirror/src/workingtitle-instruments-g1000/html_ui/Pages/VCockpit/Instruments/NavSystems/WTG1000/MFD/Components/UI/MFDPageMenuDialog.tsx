import { VNode, FSComponent } from 'msfssdk';
import { ListMenuDialog } from '../../../Shared/UI/Dialogs/ListMenuDialog';
import { List } from '../../../Shared/UI/List';
import { FmsHEvent } from '../../../Shared/UI/FmsHEvent';
import { GroupBox } from './GroupBox';

import './MFDPageMenuDialog.css';

/**
 * Dialog used for displaying MFD FPL page menus.
 */
export class MFDPageMenuDialog extends ListMenuDialog {

  /** @inheritdoc */
  public onInteractionEvent(event: FmsHEvent): boolean {
    if (event === FmsHEvent.UPPER_PUSH || event === FmsHEvent.MENU || event === FmsHEvent.CLR) {
      this.close();
      return true;
    }
    return false;
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    let className = 'popout-dialog mfd-pagemenu';
    if (this.props.class !== undefined) {
      className += ` ${this.props.class}`;
    }

    return (
      <div class={className} ref={this.viewContainerRef}>
        <h1>{this.props.title}</h1>
        <GroupBox title="Options" class='mfd-pagemenu-options'>
          <div class="mfd-pagemenu-listcontainer" ref={this.listContainerRef}>
            <List class='mfd-pagemenu-list' ref={this.listRef} onRegister={this.register} data={this.menuItemsSubject} renderItem={this.renderItem} scrollContainer={this.listContainerRef} />
          </div>
        </GroupBox>
        <div class='mfd-pagemenu-backmessage'>
          Press the FMS CRSR knob to return to base page
        </div>
      </div>
    );
  }
}