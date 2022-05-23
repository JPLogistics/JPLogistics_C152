import { FSComponent, VNode, NodeReference, SubscribableArray, SubscribableArrayEventType } from 'msfssdk';
import { ScrollUtils } from 'msfssdk/graphics/layout';
import { UiControl } from './UiControl';
import { UiControlGroup, UiControlGroupProps } from './UiControlGroup';
import { ScrollableControl } from './UiView';

/** The properties for the List component. */
interface ListProps extends UiControlGroupProps {
  /**
   * The data for this list.
   * @type {any[]}
   */
  data: SubscribableArray<any>

  /** A function defining how to render each list item. */
  renderItem: { (data: any, registerFn: (ctrl: UiControl) => void, index: number): VNode };

  /** A callback function to be called when a new item is selected. */
  onItemSelected?: (data: any, element: ScrollableControl | null, index: number) => void;

  /** The container used for scrolling. */
  scrollContainer?: NodeReference<HTMLElement>;

  /** CSS class(es) to add to the root of the list component. */
  class?: string;
}

/** The List component. */
export class List extends UiControlGroup<ListProps> {
  private readonly _listContainer = FSComponent.createRef<HTMLElement>();
  private readonly _itemInstanceRefs: ScrollableControl[] = [];

  private previousSelectedIndex = -1;
  private previousSelectedItem: any = undefined;

  /** @inheritdoc */
  public onAfterRender(): void {
    this.renderList();
    if (this.props.scrollContainer) {
      this.scrollController.registerScrollContainer(this.props.scrollContainer.instance);
    }
    this.props.data.sub(this.onDataChanged.bind(this));
    this.scrollController.onScroll = this.onScroll.bind(this);
  }

  /**
   * A callback fired when the array subject data changes.
   * @param index The index of the change.
   * @param type The type of change.
   * @param item The item that was changed.
   */
  private onDataChanged(index: number, type: SubscribableArrayEventType, item: any | any[]): void {
    switch (type) {
      case SubscribableArrayEventType.Added: {
        const el = this._listContainer.instance.children.item(index);
        if (Array.isArray(item)) {
          for (let i = 0; i < item.length; i++) {
            this.addDomNode(item[i], index + i, el);
          }
        } else {
          this.addDomNode(item, index, el);
        }
        this.refreshRegistrations();
      }
        break;
      case SubscribableArrayEventType.Removed: {
        if (Array.isArray(item)) {
          for (let i = 0; i < item.length; i++) {
            this.removeDomNode(index);
          }
        } else {
          this.removeDomNode(index);
        }
        this.refreshRegistrations();
      }
        break;
      case SubscribableArrayEventType.Cleared:
        this._itemInstanceRefs.length = 0;
        this._listContainer.instance.innerHTML = '';
        this.scrollController.resetCtrls();
        if (this.props.onItemSelected) {
          this.props.onItemSelected(null, null, -1);
        }
        break;
    }
  }

  /**
   * Removes a dom node from the collection at the specified index.
   * @param index The index to remove.
   */
  private removeDomNode(index: number): void {
    const child = this._listContainer.instance.childNodes.item(index);
    this._listContainer.instance.removeChild(child);
    const removed = this._itemInstanceRefs.splice(index, 1)[0];
    removed.destroy();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private registerListItem = (ctrl: UiControl): void => {
    // noop here, we will refresh all registrations on our own
  };

  /**
   * Adds a list rendered dom node to the collection.
   * @param item Item to render and add.
   * @param index The index to add at.
   * @param el The element to add to.
   */
  private addDomNode(item: any, index: number, el: Element | null): void {
    const node = this.renderListItem(item, index);
    if (el !== null) {
      node && el && FSComponent.renderBefore(node, el as any);
    } else {
      el = this._listContainer.instance;
      node && el && FSComponent.render(node, el as any);
    }

    if (node !== undefined && node.instance !== null) {
      this._itemInstanceRefs.splice(index, 0, node.instance as ScrollableControl);
    }
  }

  /**
   * Refreshs control registrations of all list elements.
   */
  private refreshRegistrations(): void {
    this.scrollController.resetCtrls();
    for (let i = 0; i < this._itemInstanceRefs.length; i++) {
      const instance = this._itemInstanceRefs[i];
      if (instance instanceof UiControlGroup) {
        this.register(instance);
      } else if (instance instanceof UiControl) {
        instance.props.onRegister = this.register;
        instance.onRegister();
        // this.register(instance);
      }
    }

    if (this.getIsFocused()) {
      if (
        this.previousSelectedIndex < 0
          ? this.scrollController.gotoFirst()
          : this.previousSelectedIndex >= this.props.data.length
            ? this.scrollController.gotoLast()
            : this.scrollController.scrollTo('prev', this.previousSelectedIndex + 1)
      ) {
        return;
      } else {
        this.previousSelectedIndex = -1;
      }
    }

    if (this.previousSelectedIndex < 0 || this.previousSelectedIndex >= this.props.data.length) {
      this.previousSelectedIndex = -1;
    }

    const item = this.props.data.tryGet(this.previousSelectedIndex) ?? null;
    if (item !== this.previousSelectedItem) {
      this.props.onItemSelected && this.props.onItemSelected(item, this.getListItemInstance(this.previousSelectedIndex), this.previousSelectedIndex);
    }

    this.previousSelectedItem = item;
  }

  /**
   * Scrolls to an item.
   * @param index is the index of the list item to scroll to.
   */
  public scrollToIndex(index: number): void {
    this.scrollController.gotoIndex(index);
  }

  /**
   * Ensures an indexed list item is in view.
   * @param index The index of the list item.
   */
  public ensureIndexInView(index: number): void {
    const el = this._listContainer.instance.children[index] as HTMLElement | undefined;
    if (el && this.props.scrollContainer) {
      ScrollUtils.ensureInView(el, this.props.scrollContainer.instance);
    }
  }

  /**
   * Gets the data object related to the selected DOM element.
   * @returns The selected item, if found.
   */
  public getSelectedItem(): any | null {
    const selectedIndex = this.getSelectedIndex();
    if (selectedIndex > -1) {
      return this.props.data.get(selectedIndex);
    }
    return null;
  }

  /**
   * Get the selected HTMLElement.
   * @returns The selected element, if found.
   */
  public getSelectedElement(): HTMLElement | null {
    return this._listContainer.instance.children[this.getSelectedIndex()] as HTMLElement ?? null;
  }

  /**
   * Gets the index of the currently selected element.
   * @returns Selected element index. Returns -1 if nothing found.
   */
  public getSelectedIndex(): number {
    const focusedControl = this.scrollController.getFocusedUiControl();
    return focusedControl ? this._itemInstanceRefs.indexOf(focusedControl) : -1;
  }

  /**
   * Gets the instance of the node at the specified index.
   * @param index The index to get the instance for.
   * @returns The node instance of specified type.
   */
  public getListItemInstance<T>(index: number): T | null {
    return this._itemInstanceRefs[index] as unknown as T ?? null;
  }

  /**
   * Gets index of a item in the list by its node instance.
   * @param nodeInstance The node instance to look for.
   * @returns list item index
   */
  public getListItemIndex(nodeInstance: ScrollableControl): number {
    return this._itemInstanceRefs.indexOf(nodeInstance);
  }

  /** @inheritdoc */
  protected onBlurred(): void {
    if (this.previousSelectedItem && this.props.onItemSelected) {
      this.props.onItemSelected(null, null, -1);
    }

    this.previousSelectedItem = null;
    this.previousSelectedIndex = -1;
  }

  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onScroll(ctrl: ScrollableControl): void {
    const el = this.getSelectedElement();
    if (el !== null && this.props.scrollContainer) {
      ScrollUtils.ensureInView(el, this.props.scrollContainer.instance);
    }

    const index = this.getSelectedIndex();
    const item = this.props.data.tryGet(index) ?? null;

    if (this.props.onItemSelected) {
      item !== this.previousSelectedItem && this.props.onItemSelected(item, this.getListItemInstance(index), index);
    }

    this.previousSelectedItem = item;
    this.previousSelectedIndex = index;
  }

  /**
   * Renders a list item
   * @param dataItem The data item to render.
   * @param index The index to render at.
   * @returns list item vnode
   * @throws error when the resulting vnode is not a scrollable control
   */
  private renderListItem(dataItem: any, index: number): VNode {
    const renderedNode = this.props.renderItem(dataItem, this.registerListItem, index);
    if ((renderedNode.instance instanceof UiControl || renderedNode.instance instanceof UiControlGroup)) {
      return renderedNode;
    } else {
      throw new Error('A ListItem must be of type UiControl or UiControlGroup!');
    }
  }
  /** Renders the list of data items. */
  private renderList(): void {
    // clear all items
    this._listContainer.instance.textContent = '';

    // render items
    const dataLen = this.props.data.length;
    for (let i = 0; i < dataLen; i++) {
      const vnode = this.renderListItem(this.props.data.get(i), i);
      if (vnode !== undefined) {
        FSComponent.render(vnode, this._listContainer.instance);
        this._itemInstanceRefs.push(vnode.instance as ScrollableControl);
      }
    }
    this.refreshRegistrations();
  }

  /** @inheritdoc */
  render(): VNode {
    return (
      <div class={this.props.class ?? ''} ref={this._listContainer}></div>
    );
  }
}