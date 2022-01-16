import { ArraySubject, DisplayComponent, FSComponent, VNode } from 'msfssdk';
import { ComSpacing } from 'msfssdk/instruments';
import { ContextMenuItemDefinition } from '../../../../Shared/UI/Dialogs/ContextMenuDialog';
import { GroupBox } from '../GroupBox';
import { MFDSystemSetupGroupProps } from './MFDSystemSetupGroup';
import { MFDSystemSetupSelectRow } from './MFDSystemSetupRow';
import { NavComUserSettings, NavComUserSettingTypes } from '../../../../Shared/NavCom/NavComUserSettings';
import { ControlEvents } from 'msfssdk/data';

/**
 * The MFD System Setup page COM Configuration group.
 */
export class MFDSystemSetupComSpacingGroup extends DisplayComponent<MFDSystemSetupGroupProps> {
  private readonly settingManager = NavComUserSettings.getManager(this.props.bus);

  /** @inheritdoc */
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.settingManager.whenSettingChanged('comSpacing').handle(spacing => {
      const pub = this.props.bus.getPublisher<ControlEvents>();
      pub.pub('com_spacing_set', { index: 1, spacing: spacing }, true, false);
      pub.pub('com_spacing_set', { index: 2, spacing: spacing }, true, false);
    });
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <GroupBox title='COM Configuration' class='mfd-system-setup-group'>
        <MFDSystemSetupSelectRow<NavComUserSettingTypes, 'comSpacing'>
          title='Channel Spacing'
          selectControlProps={{
            registerFunc: this.props.registerFunc,
            settingManager: this.settingManager,
            settingName: 'comSpacing',
            values: ArraySubject.create([ComSpacing.Spacing25Khz, ComSpacing.Spacing833Khz]),
            buildMenuItem: (value: ComSpacing): ContextMenuItemDefinition => {
              return {
                id: value.toString(),
                renderContent: value === ComSpacing.Spacing25Khz
                  ? (): VNode => <div>25.0 kHz</div>
                  : (): VNode => <div>8.33 kHz</div>,
                estimatedWidth: 11
              };
            },
            outerContainer: this.props.pageContainerRef
          }}
        />
      </GroupBox>
    );
  }
}