import { FSComponent, VNode, ArraySubject, MathUtils } from 'msfssdk';
import { FmsHEvent } from '../FmsHEvent';
import { UiView, UiViewProps } from '../UiView';
import { ControlList } from '../ControlList';
import { FocusPosition, UiControl2 } from '../UiControl2';

import './ContextMenuDialog.css';

/** The context menu position. */
export enum ContextMenuPosition {
  // TOP = 0,
  BOTTOM = 1,
  LEFT = 2,
  // RIGHT = 3,
  CENTER = 4
}

/**
 * The MenuItemDefinition interface.
 */
export interface ContextMenuItemDefinition {
  /** An optional ID to assign to the menu item. */
  id?: string;

  /**
   * Renders the content of the menu item.
   * @returns the rendered content of the menu item as a VNode.
   */
  renderContent(): VNode;

  /** Whether the menu item is enabled. True by default. */
  isEnabled?: boolean;

  /** The action to execute when this item is selected. */
  onSelected?(): void;

  /** The action to execute when this item is focused. */
  onFocused?(): void;

  /** The action to execute when this item is blurred. */
  onBlurred?(): void;

  /** Whether the context menu dialog should be closed when the menu item is selected. True by default. */
  closeAfterAction?: boolean;

  /** The estimated width of the rendered menu item, in pixels. */
  estimatedWidth: number;
}

/** Context menu options */
export interface ContextMenuOptions {
  /** The menu item definitions */
  items: ContextMenuItemDefinition[];
  /** The position of the popout menu. */
  position: ContextMenuPosition;
  /** The reference html element */
  element: HTMLElement;
  /** The container html element this context menu belongs to */
  outerContainer: HTMLElement;
  /** The initial scroll position for the list, if provided */
  initialScrollPosition?: number;
}

/** Viewport information */
interface Viewport {
  /** The height of the viewport */
  height: number;
  /** The width of the viewport */
  width: number;
}

/** A dialog that displays a context menu. */
export class ContextMenuDialog extends UiView<UiViewProps, number, ContextMenuOptions> {
  public static readonly CHAR_WIDTH = 12;

  protected readonly listRef = FSComponent.createRef<ControlList<ContextMenuItemDefinition>>();
  private readonly listContainerRef = FSComponent.createRef<HTMLElement>();
  private readonly popoutContainerBgRef = FSComponent.createRef<HTMLElement>();
  private readonly menuItemsSubject = ArraySubject.create<ContextMenuItemDefinition>();

  private assumedWidth = 0;
  private assumedHeight = 0;
  private containerRect!: DOMRect;

  private viewport: Viewport = {
    height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
    width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
  };

  private readonly SAFETY_MARGIN = 28;
  private readonly CHAR_WIDTH = 12;
  private readonly ROW_HEIGHT = 26;
  private readonly MAX_WIDTH = 320;
  private readonly MAX_HEIGHT = 260;

  /**
   * Constructor
   * @param props The view props.
   */
  constructor(props: UiViewProps) {
    super(props);
    this.inputData.sub((v) => {
      this.menuItemsSubject.clear();
      if (v !== undefined) {
        if (v.items.length > 0) {
          this.menuItemsSubject.insertRange(0, v.items);
        }
        this.scrollController.gotoFirst();
      }
    });
  }

  /** @inheritdoc */
  protected onInputDataSet(data: ContextMenuOptions | undefined): void {
    if (data) {
      if (data.element) {
        this.containerRect = data.outerContainer.getBoundingClientRect();

        this.assumedWidth = MathUtils.clamp(
          data.items.reduce((maxWidth, item) => item.estimatedWidth > maxWidth ? item.estimatedWidth : maxWidth, 0) + this.SAFETY_MARGIN,
          0, this.containerRect.width
        );
        this.assumedHeight = MathUtils.clamp(this.menuItemsSubject.length * this.ROW_HEIGHT + this.SAFETY_MARGIN, 0, Math.min(this.containerRect.height, this.MAX_HEIGHT));

        // just center it there for now
        const selectElRect = data.element.getBoundingClientRect();
        switch (data.position) {
          case ContextMenuPosition.LEFT:
            // position dialog left of element
            this.viewContainerRef.instance.style.top = `${((this.containerRect.height / 2) - (this.assumedHeight / 2)) + this.containerRect.top + 12}px`;
            this.setContainerLeftPos(selectElRect.left - this.assumedWidth - 8, data);
            break;
          case ContextMenuPosition.CENTER:
            this.viewContainerRef.instance.style.top = `${((this.containerRect.height / 2) - (this.assumedHeight / 2)) + this.containerRect.top + 12}px`;
            this.setContainerLeftPos(this.containerRect.left + (this.containerRect.width / 2) - (this.assumedWidth / 2), data);
            break;
          case ContextMenuPosition.BOTTOM:
          default:
            // position dialog below the element
            this.viewContainerRef.instance.style.top = `${selectElRect.bottom + 10}px`;
            this.setContainerLeftPos(selectElRect.left + 8, data);
            break;
        }

        const viewContainerRect = this.viewContainerRef.instance.getBoundingClientRect();
        const remHeight = this.containerRect.bottom - viewContainerRect.top;
        this.viewContainerRef.instance.style.setProperty('--context-menu-max-height', `${MathUtils.clamp(remHeight - this.SAFETY_MARGIN, this.ROW_HEIGHT + this.SAFETY_MARGIN, this.MAX_HEIGHT)}px`);
      }

      this.listRef.instance.focus(FocusPosition.First);

      if (data.initialScrollPosition) {
        this.listRef.instance.scrollToIndex(data.initialScrollPosition);
      }
    }
  }

  /**
   * Sets and clamps the left position of the container.
   * @param left The desired left position.
   * @param data The context menu options data.
   */
  private setContainerLeftPos(left: number, data: ContextMenuOptions): void {
    const minLeft = data.outerContainer ? data.outerContainer.getBoundingClientRect().left + 10 : 0;
    this.viewContainerRef.instance.style.left = `${MathUtils.clamp(left, minLeft, this.viewport.width - this.assumedWidth)}px`;
  }

  /** @inheritdoc */
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.UPPER_PUSH:
      case FmsHEvent.CLR:
        this.close();
        return true;
    }

    return this.listRef.instance.onInteractionEvent(evt);
  }

  /**
   * Responds to when an item is selected.
   * @param def The definition of the selected item.
   */
  private onItemSelected(def: ContextMenuItemDefinition): void {
    if (def.onSelected) {
      def.onSelected();
    }

    this.accept(this.menuItemsSubject.getArray().indexOf(def), def.closeAfterAction ?? true);
  }

  /**
   * A callback called to render the menu items.
   * @param def is the menu item
   * @returns a vnode for display in the menu
   */
  private renderItem(def: ContextMenuItemDefinition): VNode {
    const rootRef = FSComponent.createRef<HTMLDivElement>();
    const isEnabled = def.isEnabled ?? true;

    return (
      <UiControl2
        onRegistered={(control): void => { control.setDisabled(!isEnabled); }}
        onEnter={(): boolean => {
          this.onItemSelected(def);
          return true;
        }}
        onFocused={(): void => {
          rootRef.instance.classList.add('highlight-select');
          def.onFocused && def.onFocused();
        }}
        onBlurred={(): void => {
          rootRef.instance.classList.remove('highlight-select');
          def.onBlurred && def.onBlurred();
        }}
      >
        <div ref={rootRef} class={`contextmenu-item ${isEnabled ? '' : 'text-disabled'}`}>
          {def.renderContent()}
        </div>
      </UiControl2>
    );
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class='contextmenu-dialog' ref={this.viewContainerRef}>
        <div class='contextmenu-background' ref={this.popoutContainerBgRef}>
          <ControlList
            ref={this.listRef}
            data={this.menuItemsSubject}
            renderItem={this.renderItem.bind(this)}
            innerKnobScroll={this.props.upperKnobCanScroll}
          />
        </div>
      </div>
    );
  }
}
