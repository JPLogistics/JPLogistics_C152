import { FSComponent, VNode } from 'msfssdk';

import { ArrowToggle } from '../../../../../Shared/UI/UIControls/ArrowToggle';
import { ActionButton } from '../../../../../Shared/UI/UIControls/ActionButton';
import { ContextMenuPosition } from '../../../../../Shared/UI/Dialogs/ContextMenuDialog';
import { SelectApproach } from '../../../../../Shared/UI/Procedure/Approach/SelectApproach';
import { SelectApproachController } from '../../../../../Shared/UI/Procedure/Approach/SelectApproachController';
import { SelectApproachStore } from '../../../../../Shared/UI/Procedure/Approach/SelectApproachStore';

import './PFDSelectApproach.css';

/**
 * A PFD component for selecting approaches.
 */
export class PFDSelectApproach extends SelectApproach {
  /** @inheritdoc */
  protected createStore(): SelectApproachStore {
    return new SelectApproachStore();
  }

  /** @inheritdoc */
  protected createController(store: SelectApproachStore): SelectApproachController {
    return new SelectApproachController(store, this.gotoNextSelect.bind(this), this.props.fms, this.props.calculator, this.props.viewService, 'FPL', false);
  }

  /**
   * A callback which is called when the Load action is executed.
   */
  protected onLoadExecuted(): void {
    this.controller.onLoadExecuted();
  }

  /**
   * A callback which is called when the Activate action is executed.
   */
  protected onActivateExecuted(): void {
    this.controller.onActivateExecuted();
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
        <div class="slct-appr-container">
          <div class="slct-appr-label">APR</div>{this.renderApproachSelectControl(containerRef, ContextMenuPosition.CENTER)}
          <div class="slct-appr-trans-label">TRANS</div>{this.renderTransitionSelectControl(containerRef, ContextMenuPosition.CENTER)}
          <div class="slct-appr-rnav-id">ID _ _ _ _ _</div>
          <div class="slct-appr-mins-label">MINS</div>
          <ArrowToggle class="slct-appr-mins-toggle" onRegister={this.register} onOptionSelected={this.controller.onMinimumsOptionSelected}
            options={this.store.minsToggleOptions} dataref={this.store.minimumsMode} onEnter={this.onEnterPressedAdvance.bind(this)} />
          <div data-id="select-min" class="slct-appr-mins-value cyan size18"></div>
          <div class="slct-appr-mins-value">
            {this.renderMinimumsNumberInput('slct-appr-mins-input')}
            <span class="size12">FT</span>
          </div>
          <div class="slct-appr-freq-label">PRIM FREQ</div>
          <div data-id="select-freq" class="slct-appr-freq-value cyan size18">{this.store.frequencySubject}</div>
          <div class="slct-appr-freq-ident">IVII</div>
        </div>
        <hr />
        <ActionButton onRegister={this.register} class="slct-appr-load" isVisible={this.controller.canLoad} onExecute={this.onLoadExecuted.bind(this)} text="Load?" />
        <div class="slct-appr-or">{this.controller.canLoadOrText}</div>
        <ActionButton onRegister={this.register} class="slct-appr-activate" isVisible={this.controller.canActivate} onExecute={this.onActivateExecuted.bind(this)} text="Activate?" />
      </div>
    );
  }
}