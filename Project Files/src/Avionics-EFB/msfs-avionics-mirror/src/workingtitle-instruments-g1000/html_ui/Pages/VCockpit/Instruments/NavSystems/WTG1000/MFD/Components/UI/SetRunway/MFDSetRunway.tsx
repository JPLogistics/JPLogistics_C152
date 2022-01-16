import { VNode, FSComponent } from 'msfssdk';
import { OneWayRunway } from 'msfssdk/navigation';
import { ContextMenuPosition } from '../../../../Shared/UI/Dialogs/ContextMenuDialog';
import { SetRunway } from '../../../../Shared/UI/SetRunway/SetRunway';
import { SelectControl } from '../../../../Shared/UI/UIControls/SelectControl';
import { GroupBox } from '../GroupBox';

import './MFDSetRunway.css';

/**
 * A dialog for setting runways.
 */
export class MFDSetRunway extends SetRunway {
  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class='popout-dialog mfd-setrunway' ref={this.viewContainerRef}>
        <h1>{this.props.title}</h1>
        <GroupBox title="Runway">
          <div class="mfd-setrunway-container">
            <div class="mfd-setrunway-left mfd-setrunway-airport">Airport</div>
            <div class="mfd-setrunway-right mfd-setrunway-airport-value">{this.store.airportIdent}</div>
            <div class="mfd-setrunway-left mfd-setrunway-runway">Runway</div>
            <SelectControl<OneWayRunway> onRegister={this.register}
              outerContainer={this.viewContainerRef} dialogPosition={ContextMenuPosition.CENTER}
              data={this.store.oneWayRunways} buildMenuItem={this.buildRunwayMenuItem.bind(this)} onItemSelected={this.onRunwaySelected.bind(this)}
              class="mfd-setrunway-right mfd-setrunway-runway-value"
            />
          </div>
        </GroupBox>
        <div class="mfd-setrunway-press-ent">Press "ENT" to accept</div>
      </div>
    );
  }
}




