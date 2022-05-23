import { DisplayComponent, FSComponent, NodeReference, Subscribable, SubscribableArray, Subject, VNode } from 'msfssdk';
import { ContextMenuItemDefinition, ContextMenuOptions, ContextMenuPosition } from '../Dialogs/ContextMenuDialog';
import { G1000UiControl, G1000UiControlProps } from '../G1000UiControl';
import { ViewService } from '../ViewService';

/**
 * The properties for the SelectControl component.
 */
export interface SelectControlProps<T> extends G1000UiControlProps {
  /** The view service to use to open the selection dialog. */
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

  /**
   * A function to be called when the selection dialog is opened.
   * @param source The SelectControl controlling the dialog that was opened.
   */
  onSelectionDialogOpened?: (source: SelectControl<T>) => void;

  /**
   * A function to be called when the selection dialog is closed.
   * @param source The SelectControl controlling the dialog that was closed.
   * @param selectionMade Whether a selection was made.
   */
  onSelectionDialogClosed?: (source: SelectControl<T>, selectionMade: boolean) => void;

  /** CSS class(es) to apply to the root of the control. */
  class?: string;
}

/**
 * A control which allows the user to select one of multiple items through a pop-up dialog and which also displays the
 * currently selected value.
 */
export class SelectControl<T> extends G1000UiControl<SelectControlProps<T>> {
  private readonly valueRef = FSComponent.createRef<HTMLElement>();
  private renderedValueNode: VNode | null = null;

  private _menuItems: ContextMenuItemDefinition[] = [];
  // eslint-disable-next-line jsdoc/require-returns
  /** This control's current menu item definitions. */
  public get menuItems(): readonly ContextMenuItemDefinition[] {
    return this._menuItems;
  }

  /** A subject to bind this control's selected index. */
  public readonly selectedIndex = Subject.create(-1);

  /** @inheritdoc */
  public onAfterRender(thisNode: VNode): void {
    super.onAfterRender(thisNode);

    this.selectedIndex.sub(this.renderSelectedItem.bind(this));
    this.props.data.sub(() => {
      this._menuItems = this.buildMenuItems();
      this.selectedIndex.set((this._menuItems.length > 0) ? 0 : -1);
      this.setDisabled(this._menuItems.length === 0);

      const selectedIndex = this.selectedIndex.get();
      this.renderSelectedItem(selectedIndex);
      this.props.onItemSelected(selectedIndex, this.props.data.tryGet(selectedIndex), true);
    }, true);
  }

  /** @inheritdoc */
  protected onEnabled(source: G1000UiControl): void {
    super.onEnabled(source);

    this.valueRef.instance.classList.add('cyan');
  }

  /** @inheritdoc */
  protected onDisabled(source: G1000UiControl): void {
    super.onEnabled(source);

    this.valueRef.instance.classList.remove('cyan');
  }

  /** @inheritdoc */
  public onUpperKnobInc(): boolean {
    this.openContextMenu();
    return true;
  }

  /** @inheritdoc */
  public onUpperKnobDec(): boolean {
    this.openContextMenu();
    return true;
  }

  /**
   * Opens the context menu dialog to allow item selection. The dialog is only opened if this control has at least one
   * item.
   */
  private openContextMenu(): void {
    if (this._menuItems.length > 0) {
      this.valueRef.instance.classList.remove('highlight-select');
      this.valueRef.instance.classList.add('highlight-active');

      let selectionMade = false;

      const dialogOptions: ContextMenuOptions = {
        items: this._menuItems,
        element: this.valueRef.instance,
        position: this.props.dialogPosition ?? ContextMenuPosition.BOTTOM,
        outerContainer: this.props.outerContainer.instance,
        initialScrollPosition: this.props.dialogScrollStartIndex?.get() ?? this.selectedIndex.get()
      };
      const dialog = this.props.viewService.open('ContextMenuDialog', true).setInput(dialogOptions);
      dialog.onAccept.on((sender: any, index: number) => {
        this.selectedIndex.set(index);
        this.props.onItemSelected(index, this.props.data.tryGet(index), false);
        selectionMade = true;
      });
      dialog.onClose.on(() => {
        this.valueRef.instance.classList.remove('highlight-active');
        if (this.isFocused) {
          this.valueRef.instance.classList.add('highlight-select');
        }
        this.props.onSelectionDialogClosed && this.props.onSelectionDialogClosed(this, selectionMade);
      });

      this.props.onSelectionDialogOpened && this.props.onSelectionDialogOpened(this);
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
        : this._menuItems[index].renderContent();
    FSComponent.render(node, this.valueRef.instance);
    this.renderedValueNode = node;
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div ref={this.valueRef} class={this.props.class ?? ''}></div>
    );
  }
}