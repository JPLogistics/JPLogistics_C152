import { FSComponent, VNode } from 'msfssdk';
import { ArrivalProcedure, DepartureProcedure } from 'msfssdk/navigation';
import { ContextMenuPosition } from '../../../../../Shared/UI/Dialogs/ContextMenuDialog';
import { SelectDepArr, SelectDepArrProps } from '../../../../../Shared/UI/Procedure/DepArr/SelectDepArr';
import { ActionButton } from '../../../../../Shared/UI/UIControls/ActionButton';

import './PFDSelectDepArr.css';

/**
 * A PFD component for selecting departures/arrivals.
 */
export abstract class PFDSelectDepArr<T extends DepartureProcedure | ArrivalProcedure, P extends SelectDepArrProps = SelectDepArrProps> extends SelectDepArr<T, P> {
  /**
   * A callback which is called when the Load action is executed.
   */
  protected onLoadSelected(): void {
    this.controller.onLoadSelected();
    this.props.viewService.open('FPL');
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    const containerRef = FSComponent.createRef<HTMLDivElement>();

    return (
      <div ref={containerRef}>
        {this.renderWaypointInput()}
        <hr />
        <div class="slctproc-container">
          <div class="slctproc-proc-label">{this.getProcLabel()}</div>{this.renderProcedureSelectControl(containerRef, ContextMenuPosition.LEFT)}
          <div class="slctproc-rwy-label">Runway</div>{this.renderRunwaySelectControl(containerRef, ContextMenuPosition.LEFT)}
          <div class="slctproc-trans-label">Transition</div>{this.renderEnrouteSelectControl(containerRef, ContextMenuPosition.LEFT)}
        </div>
        <hr />
        <ActionButton onRegister={this.register} class="slctproc-load" onExecute={this.onLoadSelected.bind(this)} isVisible={this.controller.canLoad} text="Load?" />
      </div>
    );
  }
}