import { NodeReference, SubscribableArray } from 'msfssdk';
import { UserSettingManager } from 'msfssdk/settings';
import { SelectControl } from '../UIControls/SelectControl';
import { UserSettingController } from './UserSettingController';

/**
 * A controller which binds a user setting that can take one of several enumerated values to a SelectControl
 * component.
 */
export class UserSettingSelectController<T extends Record<any, boolean | number | string>, K extends keyof T> extends UserSettingController<T, K> {
  /**
   * A function which handles item selected events from the SelectControl component which this controller controls.
   * This handler should be passed to the SelectControl component via its `onItemSelected` prop.
   */
  public itemSelectedHandler = this.onItemSelected.bind(this);

  /**
   * Constructor.
   * @param settingManager This controller's settings manager.
   * @param settingName The name of the setting associated with this controller.
   * @param values A subscribable array which provides the values this controller can assign to its setting.
   * @param selectControlRef A node reference to the SelectControl which this controller controls.
   */
  constructor(
    public readonly settingManager: UserSettingManager<T>,
    public readonly settingName: K,
    public readonly values: SubscribableArray<T[K]>,
    private readonly selectControlRef: NodeReference<SelectControl<T[K]>>
  ) {
    super(settingManager, settingName);
  }

  /** @inheritdoc */
  public init(): void {
    super.init();
  }

  /** @inheritdoc */
  protected onSettingChanged(value: T[K]): void {
    this.selectControlRef.getOrDefault()?.SelectedValue.set(this.values.getArray().indexOf(value));
  }

  /**
   * A callback which is called when an item is selected using the SelectControl component.
   * @param index The index of the selected item.
   * @param item The selected item.
   * @param isRefresh Whether the selection was made due to a refresh.
   */
  private onItemSelected(index: number, item: T[K] | undefined, isRefresh: boolean): void {
    if (item === undefined) {
      return;
    }

    if (isRefresh) {
      // If it is a refresh, then we need to re-sync the selected value with the setting.
      this.selectControlRef.instance.SelectedValue.set(this.values.getArray().indexOf(this.setting.value));
    } else {
      this.setting.value = item;
    }
  }
}

/**
 * A controller which binds a user setting that can take one of several enumerated values to a SelectControl
 * component which displays transformed versions of the setting values.
 */
export class UserSettingTransformedSelectController<T extends Record<any, boolean | number | string>, K extends keyof T, V> extends UserSettingController<T, K> {
  /**
   * A function which handles item selected events from the SelectControl component which this controller controls.
   * This handler should be passed to the SelectControl component via its `onItemSelected` prop.
   */
  public itemSelectedHandler = this.onItemSelected.bind(this);

  /**
   * Constructor.
   * @param settingManager This controller's settings manager.
   * @param settingName The name of the setting associated with this controller.
   * @param values A subscribable array which provides the values this controller can assign to its setting.
   * @param transformedValues A subscribable array which provides the transformed values displayed by the SelectControl
   * component controlled by this controller.
   * @param selectControlRef A node reference to the SelectControl which this controller controls.
   */
  constructor(
    public readonly settingManager: UserSettingManager<T>,
    public readonly settingName: K,
    public readonly values: SubscribableArray<T[K]>,
    public readonly transformedValues: SubscribableArray<V>,
    private readonly selectControlRef: NodeReference<SelectControl<V>>
  ) {
    super(settingManager, settingName);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onSettingChanged(value: T[K]): void {
    this.selectControlRef.getOrDefault()?.SelectedValue.set(this.values.getArray().indexOf(value));
  }

  /**
   * A callback which is called when an item is selected using the SelectControl component.
   * @param index The index of the selected item.
   * @param item The selected item.
   * @param isRefresh Whether the selection was made due to a refresh.
   */
  private onItemSelected(index: number, item: V | undefined, isRefresh: boolean): void {
    if (item === undefined) {
      return;
    }

    if (isRefresh) {
      // If it is a refresh, then we need to re-sync the selected value with the setting.
      this.selectControlRef.instance.SelectedValue.set(this.values.getArray().indexOf(this.setting.value));
    } else {
      this.setting.value = this.values.get(index);
    }
  }
}