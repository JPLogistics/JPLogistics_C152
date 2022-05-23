import { FSComponent, Subject, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { LegDefinition } from 'msfssdk/flightplan';

import { GroupBox } from '../GroupBox';
import { List } from '../../../../Shared/UI/List';
import { ScrollBar } from '../../../../Shared/UI/ScrollBar';
import { UiControl } from '../../../../Shared/UI/UiControl';
import { ProcSequenceItem } from '../Procedure/ProcSequenceItem';
import { SelectAirway, SelectAirwayProps } from '../../../../Shared/UI/Airway/SelectAirway';
import { UnitsUserSettings } from '../../../../Shared/Units/UnitsUserSettings';

import './MFDSelectAirway.css';

/**
 * Component props for MFDSelectAirway.
 */
export interface MFDSelectAirwayProps extends SelectAirwayProps {
  /** The event bus. */
  bus: EventBus;
}

/**
 * A view which allows the user to select an airway on the MFD.
 */
export class MFDSelectAirway extends SelectAirway<MFDSelectAirwayProps> {
  private sequenceListContainerRef = FSComponent.createRef<HTMLDivElement>();

  private readonly unitsSettingManager = UnitsUserSettings.getManager(this.props.bus);

  private buildLegItem = (data: Subject<LegDefinition>, registerFn: (ctrl: UiControl) => void): VNode => {
    return <ProcSequenceItem onRegister={registerFn} data={data} unitsSettingManager={this.unitsSettingManager} />;
  };

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class='mfd-slctawy mfd-dark-background' ref={this.viewContainerRef}>
        <GroupBox title="Entry">
          {this.controller.entrySubject}
        </GroupBox>
        <GroupBox title="Airway">
          {this.renderAirwaySelectControl()}
        </GroupBox>
        <GroupBox title="Exit">
          {this.renderExitSelectControl()}
        </GroupBox>
        <GroupBox title="Sequence">
          <div ref={this.sequenceListContainerRef} class='mfd-slctawy-sequence'>
            <List onRegister={this.register} data={this.store.sequence} renderItem={this.buildLegItem} scrollContainer={this.sequenceListContainerRef} />
          </div>
          <ScrollBar />
        </GroupBox>
        {this.renderLoadButton()}
      </div>
    );
  }
}