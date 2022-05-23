import { FSComponent, Subject, VNode } from 'msfssdk';
import { FlightPlan, LegDefinition } from 'msfssdk/flightplan';
import { ArrivalProcedure, DepartureProcedure } from 'msfssdk/navigation';
import { FlightPlanFocus } from '../../../../../Shared/UI/FPL/FPLTypesAndProps';
import { List } from '../../../../../Shared/UI/List';
import { SelectDepArr, SelectDepArrProps } from '../../../../../Shared/UI/Procedure/DepArr/SelectDepArr';
import { ScrollBar } from '../../../../../Shared/UI/ScrollBar';
import { UiControl } from '../../../../../Shared/UI/UiControl';
import { ActionButton } from '../../../../../Shared/UI/UIControls/ActionButton';
import { UnitsUserSettings } from '../../../../../Shared/Units/UnitsUserSettings';
import { GroupBox } from '../../GroupBox';
import { MFDSelectProcedure } from '../MFDSelectProcedurePage';
import { ProcSequenceItem } from '../ProcSequenceItem';
import { MFDSelectDepArrController } from './MFDSelectDepArrController';

import './MFDSelectDepArr.css';

/**
 * Component props for MFDSelectApproach.
 */
export interface MFDSelectDepArrProps extends SelectDepArrProps {
  /** A subject to provide the procedure preview flight plan. */
  procedurePlan: Subject<FlightPlan | null>;

  /** A subject to provide the procedure transition preview flight plan. */
  transitionPlan: Subject<FlightPlan | null>;

  /** A subject to provide the flight plan focus for the selected procedure. */
  focus: Subject<FlightPlanFocus>;
}

/**
 * An MFD view for selecting departures/arrivals.
 */
export abstract class MFDSelectDepArr<T extends DepartureProcedure | ArrivalProcedure, P extends MFDSelectDepArrProps> extends SelectDepArr<T, P> implements MFDSelectProcedure {
  protected readonly rootRef = FSComponent.createRef<HTMLDivElement>();

  protected readonly unitsSettingManager = UnitsUserSettings.getManager(this.props.bus);

  /** @inheritdoc */
  public activate(): void {
    this.rootRef.instance.style.display = '';
    this.scrollController.gotoFirst();
    (this.controller as MFDSelectDepArrController<T, any>).refreshPreviewPlans();
    this.initializeIcaoInput();
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
  protected onLoadSelected(): void {
    this.controller.onLoadSelected();
    this.props.viewService.open('FPLPage');
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    const sequenceContainerRef = FSComponent.createRef<HTMLDivElement>();

    return (
      <div ref={this.rootRef} class='mfd-dark-background'>
        <GroupBox title="Airport">
          {this.renderWaypointInput()}
        </GroupBox>
        <GroupBox title={this.getProcLabel()}>
          {this.renderProcedureSelectControl(this.rootRef)}
        </GroupBox>
        <GroupBox title="Runway">
          {this.renderRunwaySelectControl(this.rootRef)}
        </GroupBox>
        <GroupBox title="Transition">
          {this.renderEnrouteSelectControl(this.rootRef)}
        </GroupBox>
        <GroupBox title="Sequence">
          <div ref={sequenceContainerRef} class='mfd-select-proc-sequence'>
            <List onRegister={this.register} data={this.store.sequence} renderItem={this.buildLegItem} scrollContainer={sequenceContainerRef} />
          </div>
          <ScrollBar />
        </GroupBox>
        <div class="mfd-selectproc-load-button">
          <ActionButton onRegister={this.register} onExecute={this.onLoadSelected.bind(this)} isVisible={this.controller.canLoad} text="Load?" />
        </div>
      </div>
    );
  }
}