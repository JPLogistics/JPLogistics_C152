import { VNode, FSComponent } from 'msfssdk';
import { OneWayRunway } from 'msfssdk/navigation';

import { ContextMenuPosition } from '../../../../Shared/UI/Dialogs/ContextMenuDialog';
import { SetRunway } from '../../../../Shared/UI/SetRunway/SetRunway';
import { SelectControl } from '../../../../Shared/UI/UIControls/SelectControl';

import './PFDSetRunway.css';

/**
 * A dialog for setting runways.
 */
export class PFDSetRunway extends SetRunway {
  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class='popout-dialog pfd-setrunway' ref={this.viewContainerRef}>
        <h1>{this.props.title}</h1>
        <div class="pfd-setrunway-container">
          <div class="pfd-setrunway-airport">Airport</div>
          <div class="pfd-setrunway-airport-value">{this.store.airportIdent}</div>
          <div class="pfd-setrunway-runway">Runway</div>
          <SelectControl<OneWayRunway> onRegister={this.register}
            dialogPosition={ContextMenuPosition.BOTTOM} outerContainer={this.viewContainerRef}
            data={this.store.oneWayRunways} buildMenuItem={this.buildRunwayMenuItem.bind(this)} onItemSelected={this.onRunwaySelected.bind(this)}
            class="pfd-setrunway-runway-value"
          />
          <div class="pfd-setrunway-press-ent">Press "ENT" to accept</div>
        </div>
      </div>
    );
  }
}




