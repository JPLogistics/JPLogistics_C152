import { DisplayComponent, FSComponent, NodeReference, SubscribableArray, VNode } from 'msfssdk';
import { UserSettingType } from 'msfssdk/settings';
import { ContextMenuDialog, ContextMenuItemDefinition } from '../Dialogs/ContextMenuDialog';
import { SelectControl } from '../UIControls/SelectControl';
import { UserSettingControlProps } from './UserSettingControl';
import { UserSettingSelectController } from './UserSettingSelectController';

/**
 * Component props for UserSettingSelectControl.
 */
export interface UserSettingSelectControlProps<T extends Record<any, UserSettingType>, K extends keyof T> extends UserSettingControlProps<T, K> {
  /** A subscribable array which provides the possible values of the controlled setting. */
  values: SubscribableArray<T[K]>;

  /**
   * A subscribable array which provides the text representation of the possible setting values. Each value provided by
   * the `values` prop will be mapped to the text provided by this prop at the same index. If text is not defined for a
   * value, it is rendered using its `toString()` method instead. Text provided by this prop is overridden by the
   * `buildMenuItem` prop, if it is defined.
   */
  valueText?: SubscribableArray<string>;

  /**
   * A function which builds a menu item definition for setting values. If not defined, value rendering is governed
   * by the `valueText` prop instead, if it exists. If `valueText` is not defined either, values are rendered as plain
   * text using their `toString()` method.
   * @param value A setting value.
   * @param index The index of the setting value in the list displayed by SelectControl.
   */
  buildMenuItem?: (value: T[K], index: number) => ContextMenuItemDefinition

  /** A reference to the HTML element that constrains the location of the SelectControl's selection pop-up.  */
  outerContainer: NodeReference<HTMLElement>;
}

/**
 * A component which controls the value of a setting using a SelectControl.
 */
export class UserSettingSelectControl<
  T extends Record<any, UserSettingType>,
  K extends keyof T,
  P extends UserSettingSelectControlProps<T, K> = UserSettingSelectControlProps<T, K>> extends DisplayComponent<P> {

  protected readonly selectControlRef = FSComponent.createRef<SelectControl<T[K]>>();

  protected readonly selectController = new UserSettingSelectController(this.props.settingManager, this.props.settingName, this.props.values, this.selectControlRef);

  /** @inheritdoc */
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.selectController.init();
  }

  /**
   * Builds a menu item definition for a setting value.
   * @param value A setting value.
   * @param index The index of the value in the menu.
   * @returns a menu item definition for the setting value.
   */
  private buildMenuItem(value: T[K], index: number): ContextMenuItemDefinition {
    if (this.props.buildMenuItem) {
      return this.props.buildMenuItem(value, index);
    }

    const text = this.props.valueText?.tryGet(index) ?? `${value}`;
    return {
      id: text,
      renderContent: (): VNode => <span>{text}</span>,
      estimatedWidth: text.length * ContextMenuDialog.CHAR_WIDTH
    };
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <SelectControl<T[K]>
        ref={this.selectControlRef}
        onRegister={this.props.registerFunc} outerContainer={this.props.outerContainer}
        data={this.selectController.values}
        buildMenuItem={this.buildMenuItem.bind(this)}
        onItemSelected={this.selectController.itemSelectedHandler}
        class={this.props.class ?? ''}
      />
    );
  }
}