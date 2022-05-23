import { FSComponent, VNode, ArraySubject } from 'msfssdk';
import { ScrollBar } from '../ScrollBar';
import { MenuItemDefinition, PopoutMenuItem } from '../../../Shared/UI/Dialogs/PopoutMenuItem';
import { List } from '../../../Shared/UI/List';
import { Fms } from 'garminsdk/flightplan';
import { UiControl } from '../UiControl';
import { FmsHEvent } from '../FmsHEvent';
import { UiView, UiViewProps } from '../UiView';

import './ListMenuDialog.css';

/** The properties on list menu popout component. */
export interface ListMenuDialogProps extends UiViewProps {
  /** A css class to apply to the dialog. */
  class?: string;
  /** An instance of the fms. */
  fms?: Fms;
}

/** The list menu popout. */
export abstract class ListMenuDialog<T extends ListMenuDialogProps = ListMenuDialogProps> extends UiView<T> {
  protected listRef = FSComponent.createRef<List>();
  protected listContainerRef = FSComponent.createRef<HTMLElement>();
  private menuItems: MenuItemDefinition[] = this.buildMenuItems();

  protected menuItemsSubject = ArraySubject.create(this.menuItems);

  /** @inheritdoc */
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.CLR:
        this.close();
        return true;
    }
    return false;
  }

  /**
   * Gets the menu item definitions for the list.
   * @returns menu item definitions.
   */
  protected buildMenuItems(): MenuItemDefinition[] {
    return [];
  }

  /**
   * A callback called to render the menu items.
   * @param d is the menu item
   * @param registerFn The register function.
   * @returns a vnode for display in the menu
   */
  protected renderItem = (d: MenuItemDefinition, registerFn: (ctrl: UiControl) => void): VNode => {
    return <PopoutMenuItem onRegister={registerFn} parent={this} def={d} />;
  };

  /**
   * Sets the menu items for the list menu dialog.
   * @param items The items to set into the menu.
   */
  public setMenuItems(items: MenuItemDefinition[]): void {
    this.menuItems = items;

    this.menuItemsSubject.clear();
    this.menuItemsSubject.set(items);
    this.scrollController.gotoFirst();
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    let className = 'popout-dialog';
    if (this.props.isMfd) {
      className = 'MFD-' + className;
    }
    if (this.props.class !== undefined) {
      className += ` ${this.props.class}`;
    }

    return (
      <div class={className} ref={this.viewContainerRef}>
        <h1>{this.props.title}</h1>
        <div class="popout-menu-container" ref={this.listContainerRef}>
          <List ref={this.listRef} onRegister={this.register} data={this.menuItemsSubject} renderItem={this.renderItem} scrollContainer={this.listContainerRef} />
        </div>
        <ScrollBar />
      </div>
    );
  }
}
