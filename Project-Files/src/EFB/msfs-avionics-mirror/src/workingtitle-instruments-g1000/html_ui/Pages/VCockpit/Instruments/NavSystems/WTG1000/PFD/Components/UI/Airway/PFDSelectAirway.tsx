import { FSComponent, VNode } from 'msfssdk';

import { ContextMenuPosition } from '../../../../Shared/UI/Dialogs/ContextMenuDialog';
import { SelectAirway } from '../../../../Shared/UI/Airway/SelectAirway';

import './PFDSelectAirway.css';

/**
 * A view which allows the user to select an airway on the PFD.
 */
export class PFDSelectAirway extends SelectAirway {
  // eslint-disable-next-line jsdoc/require-jsdoc
  public render(): VNode {
    return (
      <div class='popout-dialog' ref={this.viewContainerRef}>
        <h1>{this.props.title}</h1>
        <div class="set-airway-container">
          <div class="set-airway-entry">Entry</div>
          <div class="set-airway-entry-value">{this.controller.entrySubject}</div>
          <div class="set-airway-airway">Airway</div>
          {this.renderAirwaySelectControl(ContextMenuPosition.BOTTOM)}
          <div class="set-airway-exit">Exit</div>
          {this.renderExitSelectControl(ContextMenuPosition.BOTTOM)}
          <div class="set-airway-press-ent">
            {this.renderLoadButton()}
          </div>
        </div>
      </div>
    );
  }
}