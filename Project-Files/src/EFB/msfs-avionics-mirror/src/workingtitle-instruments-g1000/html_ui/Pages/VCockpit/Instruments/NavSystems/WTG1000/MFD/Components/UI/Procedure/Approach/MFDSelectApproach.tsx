import { FSComponent, Subject, VNode } from 'msfssdk';
import { FlightPlan, LegDefinition } from 'msfssdk/flightplan';

import { ArrowToggle } from '../../../../../Shared/UI/UIControls/ArrowToggle';
import { ActionButton } from '../../../../../Shared/UI/UIControls/ActionButton';
import { GroupBox } from '../../GroupBox';
import { List } from '../../../../../Shared/UI/List';
import { ProcSequenceItem } from '../ProcSequenceItem';
import { UiControl } from '../../../../../Shared/UI/UiControl';
import { ScrollBar } from '../../../../../Shared/UI/ScrollBar';
import { SelectApproach, SelectApproachProps } from '../../../../../Shared/UI/Procedure/Approach/SelectApproach';
import { SelectApproachController } from '../../../../../Shared/UI/Procedure/Approach/SelectApproachController';
import { FlightPlanFocus } from '../../../../../Shared/UI/FPL/FPLTypesAndProps';
import { MFDSelectApproachController } from './MFDSelectApproachController';
import { MFDSelectProcedure } from '../MFDSelectProcedurePage';
import { MFDSelectApproachStore } from './MFDSelectApproachStore';
import { UnitsUserSettings } from '../../../../../Shared/Units/UnitsUserSettings';

import './MFDSelectApproach.css';

/**
 * Component props for MFDSelectApproach.
 */
export interface MFDSelectApproachProps extends SelectApproachProps {
  /** A subject to provide the procedure preview flight plan. */
  procedurePlan: Subject<FlightPlan | null>;

  /** A subject to provide the procedure transition preview flight plan. */
  transitionPlan: Subject<FlightPlan | null>;

  /** A subject to provide the flight plan focus for the selected approach. */
  focus: Subject<FlightPlanFocus>;
}

/**
 * An MFD component for selecting approaches.
 */
export class MFDSelectApproach extends SelectApproach<MFDSelectApproachProps> implements MFDSelectProcedure {
  private readonly rootRef = FSComponent.createRef<HTMLDivElement>();

  private readonly unitsSettingManager = UnitsUserSettings.getManager(this.props.bus);

  /** @inheritdoc */
  protected createStore(): MFDSelectApproachStore {
    return new MFDSelectApproachStore();
  }

  /** @inheritdoc */
  protected createController(store: MFDSelectApproachStore): SelectApproachController {
    return new MFDSelectApproachController(
      store,
      this.gotoNextSelect.bind(this),
      this.props.fms,
      this.props.calculator,
      this.props.viewService,
      'FPLPage',
      this.props.procedurePlan,
      this.props.transitionPlan,
      this.props.focus
    );
  }

  /** @inheritdoc */
  public activate(): void {
    this.rootRef.instance.style.display = '';
    this.scrollController.gotoFirst();
    (this.controller as MFDSelectApproachController).refreshPreviewPlans();
  }

  /** @inheritdoc */
  public deactivate(): void {
    this.rootRef.instance.style.display = 'none';
  }

  private buildLegItem = (data: Subject<LegDefinition>, registerFn: (ctrl: UiControl) => void): VNode => {
    return <ProcSequenceItem onRegister={registerFn} data={data} unitsSettingManager={this.unitsSettingManager} />;
  };

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
    const sequenceContainerRef = FSComponent.createRef<HTMLDivElement>();

    return (
      <div ref={this.rootRef} class='mfd-dark-background mfd-select-approach'>
        <GroupBox title="Airport">
          {this.renderWaypointInput()}
        </GroupBox>
        <GroupBox title="Approach Channel">
          <div>Channel _ _ _ _ _ ID _ _ _ _ _</div>
        </GroupBox>
        <GroupBox title="Approach">
          {this.renderApproachSelectControl(this.rootRef)}
        </GroupBox>
        <GroupBox title="Transition">
          {this.renderTransitionSelectControl(this.rootRef)}
        </GroupBox>
        <GroupBox title="Minimums">
          <div class='mfd-select-approach-mins'>
            <ArrowToggle onRegister={this.register} onOptionSelected={this.controller.onMinimumsOptionSelected} options={this.store.minsToggleOptions}
              dataref={this.store.minimumsMode} onEnter={this.onEnterPressedAdvance.bind(this)} />
            <div>
              {this.renderMinimumsNumberInput('mfd-select-approach-mins-number')}
              <span class="size12">{this.store.minimumsUnit}</span>
            </div>
          </div>
        </GroupBox>
        <GroupBox title="Primary frequency">
          <div data-id="select-freq" class="size18">{this.store.frequencySubject}</div>
        </GroupBox>
        <GroupBox title="Sequence">
          <div class='mfd-select-approach-sequence' ref={sequenceContainerRef}>
            <List onRegister={this.register} data={this.store.sequence} renderItem={this.buildLegItem} scrollContainer={sequenceContainerRef} />
          </div>
          <ScrollBar />
        </GroupBox>
        <div class="mfd-action-buttons mfd-select-approach-action-buttons">
          <ActionButton onRegister={this.register} isVisible={this.controller.canLoad} onExecute={this.onLoadExecuted.bind(this)} text="Load?" />
          <div>{this.controller.canLoadOrText}</div>
          <ActionButton onRegister={this.register} isVisible={this.controller.canActivate} onExecute={this.onActivateExecuted.bind(this)} text="Activate?" />
        </div>
      </div>
    );
  }
}