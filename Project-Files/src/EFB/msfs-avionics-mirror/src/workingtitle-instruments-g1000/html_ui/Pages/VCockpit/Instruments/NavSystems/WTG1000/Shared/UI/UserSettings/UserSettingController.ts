import { UserSettingManager } from 'msfssdk/settings';

/**
 * A controller which binds a user setting to a control component.
 */
export abstract class UserSettingController<T extends Record<any, boolean | number | string>, K extends keyof T> {
  /** The setting associated with this controller. */
  public readonly setting = this.settingManager.getSetting(this.settingName);

  /**
   * Constructor.
   * @param settingManager This controller's settings manager.
   * @param settingName The name of the setting associated with this controller.
   */
  constructor(public readonly settingManager: UserSettingManager<T>, public readonly settingName: K) {
  }

  /**
   * Initializes this controller. This will immediately change the state of this controller's control component to
   * reflect the current value of this controller's setting. Furthermore, any future changes to the setting's value
   * will be synced to the control component.
   */
  public init(): void {
    this.settingManager.whenSettingChanged(this.settingName).handle(this.onSettingChanged.bind(this));
  }

  /**
   * A callback which is called when value of this control's setting is changed.
   * @param value The new value of the setting.
   */
  protected abstract onSettingChanged(value: T[K]): void;
}