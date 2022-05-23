import { EventBus, HEvent } from 'msfssdk/data';
import { EventSubscriber } from 'msfssdk/data/EventSubscriber';
import { SoftKeyBar } from '../SoftKeyBar';
import { SoftKeyMenu } from './SoftKeyMenu';


/**
 * A system that manages the Garmin softkey menus.
 */
export class MenuSystem {

  /** The current menu stack. */
  private menuStack: SoftKeyMenu[] = [new SoftKeyMenu(this)];

  /**The currently registered menus. */
  private registeredMenus: { [index: string]: SoftKeyMenu } = {};

  /** An instance of H Event publisher. */
  private subscriber: EventSubscriber<HEvent>;

  /** An instance of the softkeys display component. */
  private softKeys?: SoftKeyBar;

  /** The prefix of the H Event for softkey events. */
  private hEventPrefix: string;

  /**
   * The current menu on the stack.
   * @returns The current menu.
   */
  private get currentMenu(): SoftKeyMenu {
    return this.menuStack[this.menuStack.length - 1];
  }

  /**
   * Creates an instance of the MenuSystem.
   * @param bus The event bus to use with this instance.
   * @param hEventPrefix The event prefix to use for the softkey H Events.
   */
  constructor(public bus: EventBus, hEventPrefix: string) {
    this.subscriber = bus.getSubscriber<HEvent>();

    this.subscriber.on('hEvent').handle(hEvent => {
      if (hEvent.startsWith(hEventPrefix)) {
        this.handleSoftKey(hEvent);
      }
    });

    this.hEventPrefix = hEventPrefix;
  }

  /**
   * Gets the softkey menu registered with a given name.
   * @param menuName Name of the menu.
   * @returns The requested soft keymenu.
   */
  public getMenu(menuName: string): SoftKeyMenu {
    return this.registeredMenus[menuName]; 
  }

  /**
   * Adds a menu to the menu system.
   * @param name The route to the menu to add this menu entry to.
   * @param entry The menu entry to add.
   */
  public addMenu(name: string, entry: SoftKeyMenu): void {
    this.registeredMenus[name] = entry;
  }

  /**
   * Pushes a menu onto the menu system stack.
   * @param name The name of the menu to push.
   */
  public pushMenu(name: string): void {
    this.menuStack.push(this.registeredMenus[name]);
    this.renderToSoftKeys();
  }

  /**
   * Replaces one menu with another on top of the stack.
   * @param name The name of the menu to activate.
   */
  public replaceMenu(name: string): void {
    if (this.menuStack.length > 1) {
      this.menuStack.pop();
    }
    this.menuStack.push(this.registeredMenus[name]);
    this.renderToSoftKeys();
  }

  /**
   * Pops a menu off the stack and returns to the previous menu.
   */
  public back(): void {
    if (this.menuStack.length === 1) {
      // do not pop the base empty menu.
      return;
    }

    this.menuStack.pop();
    this.renderToSoftKeys();
  }

  /**
   * Clears the menu stack.
   */
  public clear(): void {
    this.menuStack.length = 1;
    this.renderToSoftKeys();
  }

  /**
   * Attaches the softkeys display component to the menu system.
   * @param softKeys The softkeys display component instance.
   */
  public attachSoftKeys(softKeys: SoftKeyBar): void {
    this.softKeys = softKeys;
    this.renderToSoftKeys();
  }

  /**
   * Renders the current menu to the softkeys.
   */
  private renderToSoftKeys(): void {
    this.currentMenu.forEach((item, index) => {
       this.softKeys?.setMenuItem(index, item);
    });
  }

  /**
   * Handles a softkey HEvent and delgates to the handler.
   * @param hEvent The HEvent to handle.
   */
  private handleSoftKey(hEvent: string): void {
    const softKeyIndex = parseInt(hEvent.replace(this.hEventPrefix, '')) - 1;
    this.currentMenu.handleItemPressed(softKeyIndex);
  }
}