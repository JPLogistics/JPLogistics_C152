import { FSComponent, VNode } from 'msfssdk';
import { ActionButton } from '../../../../Shared/UI/UIControls/ActionButton';
import { DirectTo } from '../../../../Shared/UI/DirectTo/DirectTo';

import './PFDDirectTo.css';

/**
 * The PFD direct-to popout.
 */
export class PFDDirectTo extends DirectTo {
  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class='popout-dialog pfd-dto' ref={this.viewContainerRef}>
        <h1>{this.props.title}</h1>
        {this.renderWaypointInput()}
        <hr />
        <div class="pfd-dto-alt-offset">
          <div class="offset-grey size14">ALT <span class="cyan">_ _ _ _ _FT</span></div>
          <div class="offset-grey size14">Offset <span class="cyan">+0<span class="size12 cyan">NM</span></span></div>
        </div>
        <hr />
        <div class='pfd-dto-wpt-data'>
          <div class='pfd-dto-wpt-data-field pfd-dto-bearing'>
            <div class='pfd-dto-wpt-data-field-title'>BRG</div>
            {this.renderBearing()}
          </div>
          <div class='pfd-dto-wpt-data-field pfd-dto-distance'>
            <div class='pfd-dto-wpt-data-field-title'>DIS</div>
            {this.renderDistance()}
          </div>
          <div class='pfd-dto-wpt-data-field pfd-dto-course'>
            <div class='pfd-dto-wpt-data-field-title'>CRS</div>
            {this.renderCourseInput()}
          </div>
        </div>
        <ActionButton onRegister={this.register} class="activate" isVisible={this.controller.canActivate} onExecute={this.onLoadExecuted} text="Activate?" />
        <ActionButton onRegister={this.register} class="hold" isVisible={this.controller.canActivate} onExecute={this.onHoldButtonPressed} text="Hold?" />
      </div>
    );
  }
}
