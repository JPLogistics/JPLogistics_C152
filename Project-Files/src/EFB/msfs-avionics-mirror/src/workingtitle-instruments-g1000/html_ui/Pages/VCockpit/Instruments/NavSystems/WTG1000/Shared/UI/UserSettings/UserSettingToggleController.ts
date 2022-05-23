import { Subject } from 'msfssdk';
import { UserSettingManager } from 'msfssdk/settings';
import { UserSettingController } from './UserSettingController';

/**
 * A controller which binds a setting that can take one of several enumerated values to an ArrowToggle component.
 */
export class UserSettingToggleController<T extends Record<any, boolean | number | string>, K extends keyof T> extends UserSettingController<T, K> {
  /**
   * A subject which provides a selected index for the ArrowToggle component which this controller controls. This
   * subject should be passed to the ArrowToggle component via its `dataref` prop.
   */
  public readonly selectedIndexSub = Subject.create(0);

  /**
   * A function which handles value selected events from the ArrowToggle component which this controller controls.
   * This handler should be passed to the ArrowToggle component via its `onOptionSelected` prop.
   */
  public optionSelectedHandler = this.onOptionSelected.bind(this);

  /**
   * Constructor.
   * @param settingManager This controller's settings manager.
   * @param settingName The name of the setting associated with this controller.
   * @param values An array of values this controller can assign to its setting.
   */
  constructor(
    public readonly settingManager: UserSettingManager<T>,
    public readonly settingName: K,
    public readonly values: T[K][]
  ) {
    super(settingManager, settingName);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onSettingChanged(value: T[K]): void {
    this.selectedIndexSub.set(this.values.indexOf(value));
  }

  /**
   * A callback which is called when an option is selected using the ArrowToggle component.
   * @param index The index of the selected option.
   */
  private onOptionSelected(index: number): void {
    this.setting.value = this.values[index];
  }
}