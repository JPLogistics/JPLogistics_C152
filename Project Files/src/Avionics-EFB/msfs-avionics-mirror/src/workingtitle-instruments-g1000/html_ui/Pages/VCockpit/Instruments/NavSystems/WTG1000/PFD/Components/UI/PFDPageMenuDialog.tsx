import { ListMenuDialog } from '../../../Shared/UI/Dialogs/ListMenuDialog';
import { FSComponent, VNode } from 'msfssdk';
import { List } from '../../../Shared/UI/List';
import { ScrollBar } from '../../../Shared/UI/ScrollBar';
import { GroupBox } from '../../../MFD/Components/UI/GroupBox';

import './PFDPageMenuDialog.css';

/**
 * Dialog used for displaying PFD page menus.
 */
export class PFDPageMenuDialog extends ListMenuDialog {
  /** @inheritdoc */
  public render(): VNode {
    let className = 'popout-dialog';
    if (this.props.class !== undefined) {
      className += ` ${this.props.class}`;
    }

    return (
      <div class={className} ref={this.viewContainerRef}>
        <div class="pfd-pagemenu-background">
          <h1>{this.props.title}</h1>
          <GroupBox title="Options">
            <div class="pfd-pagemenu-listcontainer" ref={this.listContainerRef}>
              <List ref={this.listRef} onRegister={this.register} data={this.menuItemsSubject} renderItem={this.renderItem} scrollContainer={this.listContainerRef} />
            </div>
            <ScrollBar />
          </GroupBox>
        </div>
      </div>
    );
  }
}