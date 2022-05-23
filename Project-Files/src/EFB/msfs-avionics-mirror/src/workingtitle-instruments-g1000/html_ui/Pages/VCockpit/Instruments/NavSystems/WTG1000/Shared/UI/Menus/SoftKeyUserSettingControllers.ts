import { Consumer } from 'msfssdk/data';
import { UserSetting, UserSettingManager, UserSettingValueFilter } from 'msfssdk/settings';
import { SoftKeyMenu } from './SoftKeyMenu';

/**
 * A controller which binds a status bar softkey to a user setting that takes a boolean value. Once bound, each press
 * of the softkey will toggle the value of the setting.
 */
export class SoftKeyBooleanUserSettingController<T extends Record<any, boolean | number | string>, K extends keyof UserSettingValueFilter<T, boolean>> {
  private readonly setting = this.settingManager.getSetting(this.settingName) as UserSetting<K, boolean>;

  private settingConsumer: Consumer<boolean> | null = null;

  private readonly settingHandler = (value: boolean): void => {
    this.softkeyMenu.getItem(this.softkeyIndex).value.set(value);
  };

  private isInit = false;

  /**
   * Constructor.
   * @param softkeyMenu The softkey menu to which this controller's bound softkey belongs.
   * @param softkeyIndex The index in the softkey menu at which this controller's bound softkey is located.
   * @param softkeyLabel The text label of this controller's bound softkey.
   * @param settingManager This controller's setting manager.
   * @param settingName The name of this controller's setting.
   */
  constructor(
    private readonly softkeyMenu: SoftKeyMenu,
    private readonly softkeyIndex: number,
    private readonly softkeyLabel: string,
    private readonly settingManager: UserSettingManager<T>,
    private readonly settingName: K
  ) {
  }

  /**
   * Initializes this controller. This will create a softkey menu item and bind it to this controller's setting.
   */
  public init(): void {
    if (this.isInit) {
      return;
    }

    this.softkeyMenu.addItem(this.softkeyIndex, this.softkeyLabel, () => { this.setting.value = !this.setting.value; });
    this.settingConsumer = this.settingManager.whenSettingChanged(this.settingName) as Consumer<boolean>;
    this.settingConsumer.handle(this.settingHandler);

    this.isInit = true;
  }

  /**
   * Destroys this controller. This will remove the softkey menu item bound to this controller's setting.
   */
  public destroy(): void {
    if (!this.isInit) {
      return;
    }

    this.softkeyMenu.removeItem(this.softkeyIndex);
    this.settingConsumer?.off(this.settingHandler);
    this.settingConsumer = null;

    this.isInit = false;
  }
}

/**
 * A controller which binds a value indicator softkey to a user setting. Once bound, each press of the softkey will
 * cycle through possible user setting values.
 */
export class SoftKeyEnumUserSettingController<T extends Record<any, boolean | number | string>, K extends keyof T> {
  private readonly setting = this.settingManager.getSetting(this.settingName);

  private settingConsumer: Consumer<T[K]> | null = null;

  private readonly settingHandler = (value: T[K]): void => {
    this.softkeyMenu.getItem(this.softkeyIndex).value.set(this.textMap(value));
  };

  private isInit = false;

  /**
   * Constructor.
   * @param softkeyMenu The softkey menu to which this controller's bound softkey belongs.
   * @param softkeyIndex The index in the softkey menu at which this controller's bound softkey is located.
   * @param softkeyLabel The text label of this controller's bound softkey.
   * @param settingManager This controller's setting manager.
   * @param settingName The name of this controller's setting.
   * @param textMap A function which maps setting values to their text representations.
   * @param nextFunc A function which gets the next setting value given the current setting value.
   */
  constructor(
    private readonly softkeyMenu: SoftKeyMenu,
    private readonly softkeyIndex: number,
    private readonly softkeyLabel: string,
    private readonly settingManager: UserSettingManager<T>,
    private readonly settingName: K,
    private readonly textMap: (value: T[K]) => string,
    private readonly nextFunc: (currentValue: T[K]) => T[K]
  ) {
  }

  /**
   * Initializes this controller. This will create a softkey menu item and bind it to this controller's setting.
   */
  public init(): void {
    if (this.isInit) {
      return;
    }

    this.softkeyMenu.addItem(this.softkeyIndex, this.softkeyLabel, () => { this.setting.value = this.nextFunc(this.setting.value); });
    this.settingConsumer = this.settingManager.whenSettingChanged(this.settingName);
    this.settingConsumer.handle(this.settingHandler);

    this.isInit = true;
  }

  /**
   * Destroys this controller. This will remove the softkey menu item bound to this controller's setting.
   */
  public destroy(): void {
    if (!this.isInit) {
      return;
    }

    this.softkeyMenu.removeItem(this.softkeyIndex);
    this.settingConsumer?.off(this.settingHandler);
    this.settingConsumer = null;

    this.isInit = false;
  }
}

/**
 * A definition for a status bar softkey bound to a user setting used by MultipleSoftKeyUserSettingController.
 */
export type MultipleSoftkeyUserSettingDef<V> = {
  /** The index of the softkey. */
  index: number,

  /** The label of the softkey. */
  label: string,

  /** The setting value bound to the softkey. */
  value: V
}

/**
 * A controller which binds one or more status bar softkeys to a user setting. Each softkey is bound to a specific
 * setting value. Once bound, each press of the softkey will set the setting to its bound value.
 */
export class MultipleSoftKeyUserSettingController<T extends Record<any, boolean | number | string>, K extends keyof T> {
  private readonly setting = this.settingManager.getSetting(this.settingName);

  private settingConsumer: Consumer<T[K]> | null = null;

  private readonly settingHandler = (value: T[K]): void => {
    for (let i = 0; i < this.softkeyDefs.length; i++) {
      const def = this.softkeyDefs[i];
      this.softkeyMenu.getItem(def.index).value.set(def.value === value);
    }
  };

  private isInit = false;

  /**
   * Constructor.
   * @param softkeyMenu The softkey menu to which this controller's bound softkeys belong.
   * @param settingManager This controller's setting manager.
   * @param settingName The name of this controller's setting.
   * @param softkeyDefs The definitions for the softkeys bound to this controller's setting.
   */
  constructor(
    private readonly softkeyMenu: SoftKeyMenu,
    private readonly settingManager: UserSettingManager<T>,
    private readonly settingName: K,
    private readonly softkeyDefs: MultipleSoftkeyUserSettingDef<T[K]>[]
  ) {
  }

  /**
   * Initializes this controller. This will create softkey menu items and bind them to this controller's setting.
   */
  public init(): void {
    if (this.isInit) {
      return;
    }

    for (let i = 0; i < this.softkeyDefs.length; i++) {
      const def = this.softkeyDefs[i];
      this.softkeyMenu.addItem(def.index, def.label, () => { this.setting.value = def.value; });
    }

    this.settingConsumer = this.settingManager.whenSettingChanged(this.settingName);
    this.settingConsumer.handle(this.settingHandler);

    this.isInit = true;
  }

  /**
   * Destroys this controller. This will remove the softkey menu items bound to this controller's setting.
   */
  public destroy(): void {
    if (!this.isInit) {
      return;
    }

    for (let i = 0; i < this.softkeyDefs.length; i++) {
      const def = this.softkeyDefs[i];
      this.softkeyMenu.removeItem(def.index);
    }

    this.settingConsumer?.off(this.settingHandler);
    this.settingConsumer = null;

    this.isInit = false;
  }
}