import { DisplayComponent, VNode, FSComponent, Subject, UnitType } from 'msfssdk';
import { NumberFormatter } from 'msfssdk/graphics/text';
import { NumberUnitDisplay } from '../../../../Shared/UI/Common/NumberUnitDisplay';
import { ArrowToggle } from '../../../../Shared/UI/UIControls/ArrowToggle';
import { GroupBox } from '../GroupBox';
import { MFDSystemSetupGroupProps } from './MFDSystemSetupGroup';
import { MFDSystemSetupGenericRow } from './MFDSystemSetupRow';

/**
 * The MFD System Setup page Airspace Alerts group.
 */
export class MFDSystemSetupAirspaceAlertsGroup extends DisplayComponent<MFDSystemSetupGroupProps> {
  /** @inheritdoc */
  public render(): VNode {
    return (
      <GroupBox title='Airspace Alerts' class='mfd-system-setup-group'>
        <MFDSystemSetupGenericRow
          title='Altitude Buffer'
          right={
            <NumberUnitDisplay
              value={Subject.create(UnitType.FOOT.createNumber(200))}
              displayUnit={Subject.create(null)}
              formatter={NumberFormatter.create({ precision: 1 })}
            />
          }
        />
        <MFDSystemSetupGenericRow
          title='CL B/TMA/AWY'
          right={
            <ArrowToggle
              options={['Off', 'On']}
              class='force-white-color'
            />
          }
        />
        <MFDSystemSetupGenericRow
          title='CL C/CTA'
          right={
            <ArrowToggle
              options={['Off', 'On']}
              class='force-white-color'
            />
          }
        />
        <MFDSystemSetupGenericRow
          title='CL A/D'
          right={
            <ArrowToggle
              options={['Off', 'On']}
              class='force-white-color'
            />
          }
        />
        <MFDSystemSetupGenericRow
          title='Restricted'
          right={
            <ArrowToggle
              options={['Off', 'On']}
              class='force-white-color'
            />
          }
        />
        <MFDSystemSetupGenericRow
          title='MOA (Military)'
          right={
            <ArrowToggle
              options={['Off', 'On']}
              class='force-white-color'
            />
          }
        />
        <MFDSystemSetupGenericRow
          title='Other'
          right={
            <ArrowToggle
              options={['Off', 'On']}
              class='force-white-color'
            />
          }
        />
      </GroupBox>
    );
  }
}