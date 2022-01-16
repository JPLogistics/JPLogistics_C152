import { ComponentProps, DisplayComponent, FSComponent, VNode } from 'msfssdk';
import { UserSettingType, UserSettingValueFilter } from 'msfssdk/settings';
import { UserSettingSelectControl, UserSettingSelectControlProps } from '../../../../Shared/UI/UserSettings/UserSettingSelectControl';
import { UserSettingToggleControl, UserSettingToggleControlProps } from '../../../../Shared/UI/UserSettings/UserSettingToggleControl';

import './MFDSystemSetupRow.css';

/**
 * Component props for MFDSystemSetupRow.
 */
export interface MFDSystemSetupRowProps extends ComponentProps {
  /** The title of the row. */
  title: string;

  /** CSS class(es) to apply to the root of the row. */
  class?: string;
}

/**
 * A row in the MFD System Setup page. Consists of a title and two optional components displayed one each to left and
 * right of the title.
 */
export abstract class MFDSystemSetupRow<P extends MFDSystemSetupRowProps = MFDSystemSetupRowProps> extends DisplayComponent<P> {
  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class={`mfd-system-setup-row ${this.props.class ?? ''}`}>
        <div class='mfd-system-setup-row-left'>
          {this.renderLeft()}
        </div>
        <div class='mfd-system-setup-row-title-right'>
          <div class='mfd-system-setup-row-title'>{this.props.title}</div>
          {this.renderRight()}
        </div>
      </div>
    );
  }

  /**
   * Renders the component to the left of the title.
   * @returns The component to the left of the title, as a VNode, or null if there is no such component.
   */
  protected renderLeft(): VNode | null {
    return null;
  }

  /**
   * Renders the component to the right of the title.
   * @returns The component to the right of the title, as a VNode, or null if there is no such component.
   */
  protected renderRight(): VNode | null {
    return null;
  }
}

/**
 * Component props for MFDSystemSetupGenericRow.
 */
export interface MFDSystemSetupGenericRowProps extends MFDSystemSetupRowProps {
  /** The component to display to the left of the title, if any. */
  left?: VNode;

  /** The component to display to the right of the title, if any. */
  right?: VNode;
}

/**
 * A generic row which displays arbitrary left and right components specified by props.
 */
export class MFDSystemSetupGenericRow<P extends MFDSystemSetupGenericRowProps = MFDSystemSetupGenericRowProps> extends MFDSystemSetupRow<P> {
  /** @inheritdoc */
  protected renderLeft(): VNode | null {
    return this.props.left ?? null;
  }

  /** @inheritdoc */
  protected renderRight(): VNode | null {
    return this.props.right ?? null;
  }
}

/**
 * Component props for MFDSystemSetupSelectRow.
 */
export interface MFDSystemSetupSelectRowProps<T extends Record<any, UserSettingType>, K extends keyof T> extends MFDSystemSetupRowProps {
  /** Props required for the select control. */
  selectControlProps: UserSettingSelectControlProps<T, K>;
}

/**
 * A row which displays to the right of the title a select control component which controls the value of a user setting.
 */
export class MFDSystemSetupSelectRow<T extends Record<any, UserSettingType>, K extends keyof T, P extends MFDSystemSetupSelectRowProps<T, K> = MFDSystemSetupSelectRowProps<T, K>>
  extends MFDSystemSetupRow<P> {

  /** @inheritdoc */
  protected renderRight(): VNode | null {
    return (
      <UserSettingSelectControl<T, K>
        registerFunc={this.props.selectControlProps.registerFunc} outerContainer={this.props.selectControlProps.outerContainer}
        settingManager={this.props.selectControlProps.settingManager}
        settingName={this.props.selectControlProps.settingName}
        values={this.props.selectControlProps.values}
        buildMenuItem={this.props.selectControlProps.buildMenuItem}
        class='mfd-system-setup-row-right'
      />
    );
  }
}

/**
 * Component props for MFDSystemSetupToggleRow.
 */
export interface MFDSystemSetupToggleRowProps<T extends Record<any, UserSettingType>, K extends keyof UserSettingValueFilter<T, boolean>> extends MFDSystemSetupRowProps {
  /** Props required for the toggle control.  */
  toggleControlProps: Omit<UserSettingToggleControlProps<T, K>, 'falseText' | 'trueText'>;
}

/**
 * A row which displays to the right of the title an arrow toggle component which controls the value of a boolean user setting.
 */
export class MFDSystemSetupToggleRow<
  T extends Record<any, UserSettingType>,
  K extends keyof UserSettingValueFilter<T, boolean>,
  P extends MFDSystemSetupToggleRowProps<T, K> = MFDSystemSetupToggleRowProps<T, K>> extends MFDSystemSetupRow<P> {

  /** @inheritdoc */
  protected renderRight(): VNode | null {
    return (
      <UserSettingToggleControl<T, K>
        registerFunc={this.props.toggleControlProps.registerFunc}
        settingManager={this.props.toggleControlProps.settingManager}
        settingName={this.props.toggleControlProps.settingName}
        falseText='Off'
        trueText='On'
        class='mfd-system-setup-row-right'
      />
    );
  }
}