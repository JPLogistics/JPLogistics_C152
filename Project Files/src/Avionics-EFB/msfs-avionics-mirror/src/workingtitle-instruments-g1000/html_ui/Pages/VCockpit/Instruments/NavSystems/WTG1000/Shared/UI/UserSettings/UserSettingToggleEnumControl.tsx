import { DisplayComponent, FSComponent, VNode } from 'msfssdk';
import { UserSettingType } from 'msfssdk/settings';
import { ArrowToggle } from '../UIControls/ArrowToggle';
import { UserSettingControlProps } from './UserSettingControl';
import { UserSettingToggleController } from './UserSettingToggleController';

/**
 * Component props for UserSettingToggleEnumControl.
 */
export interface UserSettingToggleEnumControlProps<T extends Record<any, UserSettingType>, K extends keyof T> extends UserSettingControlProps<T, K> {
  /** The possible values of the controlled setting. */
  values: T[K][];

  /**
   * The text representations of the possible setting values. Each value provided by the `values` prop will be mapped
   * to the text provided by this prop at the same index. If this prop is not defined, values will be rendered using
   * their `toString()` methods instead.
   */
  valueText?: string[];
}

/**
 * A component which controls the value of a setting using an ArrowToggle.
 */
export class UserSettingToggleEnumControl<
  T extends Record<any, UserSettingType>,
  K extends keyof T,
  P extends UserSettingToggleEnumControlProps<T, K> = UserSettingToggleEnumControlProps<T, K>> extends DisplayComponent<P> {

  protected readonly toggleController = new UserSettingToggleController(this.props.settingManager, this.props.settingName, this.props.values);

  /** @inheritdoc */
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.toggleController.init();
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <ArrowToggle
        onRegister={this.props.registerFunc}
        options={this.props.valueText ?? this.props.values.map(value => `${value}`)}
        onOptionSelected={this.toggleController.optionSelectedHandler}
        dataref={this.toggleController.selectedIndexSub}
        class={this.props.class}
      />
    );
  }
}