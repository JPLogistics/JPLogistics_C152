import { DisplayComponent, FSComponent, NodeReference, Subscribable, SubscribableArray, Subject, VNode } from 'msfssdk';
import { ContextMenuDialog, ContextMenuItemDefinition, ContextMenuOptions, ContextMenuPosition } from '../Dialogs/ContextMenuDialog';
import { UiControl, UiControlProps } from '../UiControl';
import { ViewService } from '../ViewService';

/**
 * The properties for the SelectControl component.
 */
interface SelectControlProps<T> extends UiControlProps {

  /** The dialog/page view service to use. */
  viewService: ViewService;

  /**
   * A function to be called when an item is selected.
   * @param index The index of the selected item.
   * @param item The item which was selected.
   * @param isRefresh Whether the item was selected as part of a refresh.
   */
  onItemSelected(index: number, item: T | undefined, isRefresh: boolean): void;

  /**
   * A function which provides menu item definitions for items.
   * @param item An item.
   * @param index The index of the item.
   * @returns a menu item definition for the item.
   */
  buildMenuItem(item: T, index: number): ContextMenuItemDefinition;

  /**
   * A function which renders items for display in the selected item area. If not defined, the item's menu item
   * definition will be used to render the item instead.
   * @param item An item.
   * @param index The index of the item.
   * @returns the rendered item, as a VNode.
   */
  renderSelectedItem?(item: T, index: number): VNode;

  /** The underlying data for this selection */
  data: SubscribableArray<T>;

  /** The outer dialog container this control is in */
  outerContainer: NodeReference<HTMLElement>;

  /** Defines the position where the context menu will appear. (Default: 'center') */
  dialogPosition?: ContextMenuPosition;

  /**
   * A subscribable which provides text to display in the selected value area when there is no selected value. If not
   * defined, `NONE` will be displayed.
   */
  nullSelectionText?: Subscribable<string>;

  /**
   * A subscribable which provides the index of the item to which to scroll when the selection dialog is opened. If not
   * defined, the index of the currently selected item is used instead, or 0 if there is no selected item.
   */
  dialogScrollStartIndex?: Subscribable<number>;
}

/**
 * A control which allows the user to select one of multiple items through a pop-up dialog and which also displays the
 * currently selected value.
 */
export class SelectControl<T> extends UiControl<SelectControlProps<T>> {
  private readonly valueRef = FSComponent.createRef<HTMLElement>();
  private renderedValueNode: VNode | null = null;

  public MenuItems: ContextMenuItemDefinition[] = [];

  public SelectedValue = Subject.create(-1);

  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    super.onAfterRender();
    this.SelectedValue.sub(this.renderSelectedItem.bind(this));
    this.props.data.sub(() => {
      this.MenuItems = this.buildMenuItems();
      this.SelectedValue.set((this.MenuItems.length > 0) ? 0 : -1);
      this.setIsEnabled(this.MenuItems.length > 0);

      const selectedIndex = this.SelectedValue.get();
      this.renderSelectedItem(selectedIndex);
      this.props.onItemSelected(selectedIndex, this.props.data.tryGet(selectedIndex), true);
    }, true);
    this.isEnabledSubject.sub((v) => {
      if (v) {
        this.valueRef.instance.classList.add('cyan');
      } else {
        this.valueRef.instance.classList.remove('cyan');
      }
    }, true);
  }

  /** @inheritdoc */
  public onUpperKnob(): void {
    // open dialog
    if (this.MenuItems.length > 0) {
      const selectCb = (sender: any, index: number): void => {
        this.SelectedValue.set(index);
        this.props.onItemSelected(index, this.props.data.tryGet(index), false);
      };
      this.activate();
      const dialogOptions: ContextMenuOptions = {
        items: this.MenuItems,
        element: this.valueRef.instance,
        position: this.props.dialogPosition ?? ContextMenuPosition.BOTTOM,
        outerContainer: this.props.outerContainer.instance,
        initialScrollPosition: this.props.dialogScrollStartIndex?.get() ?? this.SelectedValue.get()
      };
      const dialog = this.props.viewService.open(ContextMenuDialog.name, true).setInput(dialogOptions);
      dialog.onAccept.on(selectCb);
      dialog.onClose.on(() => {
        this.deactivate();
      });
    }
  }

  /**
   * Builds the menu item definitions.
   * @returns An array of menu item definitions.
   */
  private buildMenuItems(): ContextMenuItemDefinition[] {
    const defs: ContextMenuItemDefinition[] = [];
    const dataLen = this.props.data.length;
    for (let i = 0; i < dataLen; i++) {
      defs.push(this.props.buildMenuItem(this.props.data.get(i), i));
    }
    return defs;
  }

  /**
   * Renders the selected item.
   * @param index The index of the selected item.
   */
  private renderSelectedItem(index: number): void {
    while (this.valueRef.instance.firstChild) {
      this.valueRef.instance.removeChild(this.valueRef.instance.firstChild);
    }
    if (this.renderedValueNode) {
      if (this.renderedValueNode.instance instanceof DisplayComponent) {
        this.renderedValueNode.instance.destroy();
      }
      this.renderedValueNode = null;
    }

    const item = this.props.data.tryGet(index);
    const node = item === undefined
      ? <span>{this.props.nullSelectionText?.get() ?? 'NONE'}</span>
      : this.props.renderSelectedItem
        ? this.props.renderSelectedItem(item, index)
        : this.MenuItems[index].renderContent();
    FSComponent.render(node, this.valueRef.instance);
    this.renderedValueNode = node;
  }

  /** @inheritdoc */
  public renderControl(): VNode {
    return (
      <div ref={this.valueRef}></div>
    );
  }

}