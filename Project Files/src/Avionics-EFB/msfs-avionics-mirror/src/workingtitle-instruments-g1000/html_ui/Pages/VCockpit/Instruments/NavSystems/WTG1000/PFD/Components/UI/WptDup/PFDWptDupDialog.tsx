import { FSComponent, VNode } from 'msfssdk';

import { UiViewProps } from '../../../../Shared/UI/UiView';
import { WptDupDialog } from '../../../../Shared/UI/WptDup/WptDupDialog';
import { List } from '../../../../Shared/UI/List';
import { ScrollBar } from '../../../../Shared/UI/ScrollBar';

import './PFDWptDupDialog.css';

/**
 * A dialog for selecting from a list of duplicate waypoints.
 */
export class PFDWptDupDialog extends WptDupDialog<UiViewProps> {
  /**
   * Renders this component.
   * @returns the component VNode.
   */
  public render(): VNode {
    const listContainerRef = FSComponent.createRef<HTMLDivElement>();
    return (
      <div class='popout-dialog pfd-wpt-dup' ref={this.viewContainerRef}>
        <h1>{this.props.title}</h1>
        <div class='pfd-wpt-dup-ident'>
          <div class='pfd-wpt-dup-ident-title'>WPT</div>
          <div>{this.ident}</div>
        </div>
        <hr />
        <div class='pfd-wpt-dup-list-container' ref={listContainerRef}>
          <List ref={this.listRef} onRegister={this.register}
            data={this.waypoints} renderItem={this.renderListItem.bind(this, 'pfd-wpt-dup-listitem')} scrollContainer={listContainerRef}
            class='pfd-wpt-dup-list' />
        </div>
        <ScrollBar />
      </div>
    );
  }
}