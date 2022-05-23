import { Subject } from 'msfssdk';
import { UserSettingManager, UserSettingValueFilter } from 'msfssdk/settings';
import { UserSettingController } from './UserSettingController';

/**
 * A controller which binds a user setting with numeric values to a numeric input component.
 */
export class UserSettingNumberController<T extends Record<any, boolean | number | string>, K extends keyof UserSettingValueFilter<T, number>> extends UserSettingController<T, K> {
  /**
   * A subject which is bound to this controller's user setting.
   */
  public readonly dataSub = Subject.create(0);

  /**
   * Constructor.
   * @param settingManager This controller's settings manager.
   * @param settingName The name of the setting associated with this controller.
   */
  constructor(
    public readonly settingManager: UserSettingManager<T>,
    public readonly settingName: K
  ) {
    super(settingManager, settingName);

    if (typeof this.setting.value !== 'number') {
      throw new Error(`UserSettingNumberController: Setting '${this.setting.definition.name}' does not use numeric values`);
    }
  }

  /** @inheritdoc */
  public init(): void {
    super.init();

    this.dataSub.sub(this.onInputChanged.bind(this));
  }

  /** @inheritdoc */
  protected onSettingChanged(value: T[K]): void {
    this.dataSub.set(value as number);
  }

  /**
   * A callback which is called when the number input changes.
   * @param value The new value of the input.
   */
  private onInputChanged(value: number): void {
    this.setting.value = value as T[K];
  }
}