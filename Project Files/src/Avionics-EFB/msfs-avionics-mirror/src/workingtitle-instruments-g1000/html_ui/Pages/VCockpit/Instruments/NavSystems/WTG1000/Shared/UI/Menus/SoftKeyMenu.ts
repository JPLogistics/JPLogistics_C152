import { SubEvent, Subject } from 'msfssdk';
import { MenuSystem } from './MenuSystem';

/**
 * A softkey menu item.
 */
export interface MenuItem {

  /** The label for the menu item. */
  label: Subject<string>;

  /** The handler to invoke when the menu item is pressed. */
  handler?: (menu: SoftKeyMenu) => void;

  /** Whether or not this menu item is disabled. */
  disabled: Subject<boolean>;

  /** Whether or not this menu item is pressed. */
  pressed: SubEvent<undefined>;

  /** The value of the menu item, if any. */
  value: Subject<boolean | string | undefined>;

  /** Whether or not the menu item is highlighted. */
  highlighted: Subject<boolean>;
}

/**
 * A softkey menu instance.
 */
export class SoftKeyMenu {

  /** The menu items in this menu. */
  private readonly menuItems: MenuItem[] = [];

  /**
   * Creates an instance of a SoftKeyMenu.
   * @param menuSystem The menu system that will manage this menu.
   */
  constructor(protected menuSystem: MenuSystem) { }

  /**
   * Adds a menu item to the softkey menu.
   * @param index The softkey index to add the menu item to.
   * @param label The label of the menu item.
   * @param handler The handler to call when the menu item is selected.
   * @param value The value of the menu item, if any.
   * @param disabled Whether or not the menu item is disabled.
   */
  public addItem(index: number, label: string,
    handler?: (menu: SoftKeyMenu) => void,
    value?: boolean | string,
    disabled = false): void {
    this.menuItems[index] = {
      label: Subject.create(label),
      handler,
      value: Subject.create(value),
      pressed: new SubEvent(),
      disabled: Subject.create(handler === undefined || disabled),
      highlighted: Subject.create<boolean>(false)
    };
  }

  /**
   * Removes a menu item from the menu.
   * @param index The softkey index to remove the menu item from.
   */
  public removeItem(index: number): void {
    this.menuItems[index] = SoftKeyMenu.EmptyMenuItem;
  }

  /**
   * Gets a menu item.
   * @param index The index of the menu item.
   * @returns The requested menu item.
   */
  public getItem(index: number): MenuItem {
    return this.menuItems[index];
  }

  /**
   * Handles a back menu action.
   */
  public handleBack(): void {
    this.menuSystem.back();
  }

  /**
   * Iterates over the menu items.
   * @param each The function to run over each menu item.
   */
  public forEach(each: (menuItem: MenuItem, index: number) => void): void {
    for (let i = 0; i < 12; i++) {
      const item = this.menuItems[i];
      each(item ?? SoftKeyMenu.EmptyMenuItem, i);
    }
  }

  /**
   * Handles when a menu item is pressed.
   * @param index The index of the menu item that was pressed.
   */
  public handleItemPressed(index: number): void {
    const menuItem = this.menuItems[index];
    if (menuItem && menuItem.handler && !menuItem.disabled.get()) {
      menuItem.pressed.notify(this, undefined);
      menuItem.handler(this);
    }
  }

  /** An empty menu item. */
  public static EmptyMenuItem: MenuItem = {
    label: Subject.create(''),
    handler: undefined,
    disabled: Subject.create<boolean>(true),
    pressed: new SubEvent(),
    value: Subject.create<boolean | string | undefined>(undefined),
    highlighted: Subject.create<boolean>(false)
  }
}