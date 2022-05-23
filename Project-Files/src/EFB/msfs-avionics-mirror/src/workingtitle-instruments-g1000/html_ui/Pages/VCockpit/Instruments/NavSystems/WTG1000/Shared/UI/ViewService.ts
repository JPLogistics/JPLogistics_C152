import { FSComponent, NodeReference, Subject, Subscribable, VNode } from 'msfssdk';
import { EventBus, HEvent } from 'msfssdk/data';
import { UiView } from './UiView';
import { UiPage } from './UiPage';
import { FmsHEvent } from './FmsHEvent';

/** A view entry. */
type ViewEntry<T extends UiView = UiView> = {
  /** The key of the view. */
  key: string;

  /** A reference to the view. */
  ref: NodeReference<T>;
}

/**
 * A service to manage views.
 */
export abstract class ViewService {

  private readonly registeredViews: Map<string, () => VNode> = new Map();
  private readonly refsMap: Map<string, ViewEntry> = new Map();

  private openViews: ViewEntry[] = [];

  private readonly openPageEntrySub = Subject.create<ViewEntry<UiPage> | null>(null);
  /** The key of the currently open page. */
  public readonly openPageKey = this.openPageEntrySub.map(entry => entry?.key ?? '') as Subscribable<string>;
  /** The currently open page. */
  public readonly openPage = this.openPageEntrySub.map(entry => entry?.ref.instance) as Subscribable<UiPage | null>;

  private readonly activeViewEntrySub = Subject.create<ViewEntry | null>(null);
  /** The key of the currently active view. */
  public readonly activeViewKey = this.activeViewEntrySub.map(entry => entry?.key ?? '') as Subscribable<string>;
  /** The currently active view. */
  public readonly activeView = this.activeViewEntrySub.map(entry => entry?.ref.instance) as Subscribable<UiView | null>;

  protected readonly pageHistory: ViewEntry[] = [];
  protected ignorePageHistory = false;

  /** override in child class */
  protected readonly fmsEventMap: Map<string, FmsHEvent> = new Map([]);

  private viewClosedHandler: (closedView: UiView) => void;

  /**
   * Constructs the view service.
   * @param bus The event bus.
   */
  constructor(protected readonly bus: EventBus) {
    const hEvtPub = this.bus.getSubscriber<HEvent>();
    hEvtPub.on('hEvent').handle(hEvent => {
      this.onInteractionEvent(hEvent);
    });

    this.viewClosedHandler = this.handleViewClosed.bind(this);
  }

  /**
   * Routes the HEvents to the views.
   * @param hEvent The event identifier.
   */
  protected onInteractionEvent(hEvent: string): void {
    // console.log(hEvent);

    const evt = this.fmsEventMap.get(hEvent);
    if (evt !== undefined) {
      this.routeInteractionEventToViews(evt);
    }
  }

  /**
   * Routes an interaction to the active view, and if it is not handled, re-routes the interaction to the currently
   * open page if it exists and is not the active view.
   * @param evt An interaction event.
   * @returns Whether the event was handled.
   */
  protected routeInteractionEventToViews(evt: FmsHEvent): boolean {
    const activeView = this.activeView.get();
    if (activeView) {
      return activeView.processHEvent(evt);
    }

    return false;
  }

  /**
   * Gets an array of all currently open views.
   * @returns an array of all currently open views.
   */
  public getOpenViews(): readonly UiView[] {
    return this.openViews.map(entry => entry.ref.instance);
  }

  /**
   * Registers a view with the service.
   * @param [type] The type of the view.
   * @param vnodeFn A function creating the VNode.
   */
  public registerView(type: string, vnodeFn: () => VNode): void {
    // console.log('registering ' + type);
    this.registeredViews.set(type, vnodeFn);
  }

  /**
   * Opens a view. The opened view can be a page, regular view, or subview. Opening a page will close all other views,
   * including the currently open page. Opening a regular view will close all other views except the currently open
   * page. Opening a subview does not close any other views. The opened view will immediately become the active view,
   * and the previously active view (if one exists) will be paused.
   * @param type The type of the view to open.
   * @param isSubView A boolean indicating if the view to be opened is a subview.
   * @returns The view that was opened.
   * @throws Error if the view type is not registered with this service.
   */
  public open<T extends UiView = UiView>(type: string, isSubView = false): T {
    let viewEntry = this.refsMap.get(type);
    if (viewEntry === undefined) {
      // when we hve no ref, create the view
      viewEntry = {
        key: type,
        ref: this.createView(type)
      };
      this.refsMap.set(type, viewEntry);
    }

    const view = viewEntry.ref.instance;
    const isPage = view instanceof UiPage;

    if (isPage) {
      this.clearStack(true);
    } else if (!isSubView) {
      this.clearStack(false);
    }

    this.activeView.get()?.pause();

    view.open(isSubView, 900 + this.openViews.length);
    view.onClose.clear();
    view.onClose.on(this.viewClosedHandler);

    const index = this.openViews.indexOf(viewEntry);
    if (index >= 0) {
      this.openViews.splice(index, 1);
    }
    this.openViews.push(viewEntry);
    this.activeViewEntrySub.set(viewEntry);

    if (isPage) {
      this.openPageEntrySub.set(viewEntry as ViewEntry<UiPage>);
    }

    return view as T;
  }

  /**
   * Creates a view.
   * @param type The type string of the view to create.
   * @returns A NodeReference to the created view.
   * @throws When type of view is not registered.
   */
  private createView(type: string): NodeReference<UiView> {
    const vnodeFn = this.registeredViews.get(type);
    if (vnodeFn === undefined) {
      console.error(`Could not find a registered view of type ${type.toString()}!`);
      throw new Error(`Could not find a registered view of type ${type.toString()}!`);
    }

    const node = vnodeFn();
    FSComponent.render(node, document.getElementById('InstrumentsContainer'));
    const viewRef = FSComponent.createRef<UiView>();
    viewRef.instance = node.instance as UiView;
    return viewRef;
  }

  /**
   * Handles views that got closed, removing them from the stack.
   * @param closedView The view that was closed.
   */
  private handleViewClosed(closedView: UiView): void {
    const viewIndex = this.openViews.findIndex(entry => entry.ref.instance === closedView);
    closedView.onClose.off(this.viewClosedHandler);

    if (viewIndex > -1) {
      this.openViews.splice(viewIndex, 1);
      // need to reset z-indices.
      const len = this.openViews.length;
      for (let i = viewIndex; i < len; i++) {
        this.openViews[i].ref.instance.setZIndex(900 + i);
      }

      const activeViewEntry = this.openViews[this.openViews.length - 1];
      if (activeViewEntry) {
        activeViewEntry.ref.instance.resume();
        this.activeViewEntrySub.set(activeViewEntry);
      } else {
        this.activeViewEntrySub.set(null);
      }
    }

    const openPageEntry = this.openPageEntrySub.get();
    if (openPageEntry && closedView === openPageEntry.ref.instance) {
      if (!this.ignorePageHistory) {
        this.pageHistory.push(openPageEntry);
      }
      this.openPageEntrySub.set(null);

      this.ignorePageHistory = false;
    }
  }

  /**
   * Opens the page that was most recently closed.
   * @returns The page that was opened.
   */
  public openLastPage(): UiPage | null {
    if (this.pageHistory.length === 0) {
      return null;
    }

    this.ignorePageHistory = true;
    const page = this.open((this.pageHistory.pop() as ViewEntry).key) as UiPage;

    return page;
  }

  /**
   * Clears this view service's page history.
   */
  public clearPageHistory(): void {
    this.pageHistory.length = 0;
  }

  /**
   * Closes the currently active view.
   */
  public closeActiveView(): void {
    this.activeView.get()?.close();
  }

  /**
   * Closes all open views except for the currently open page, if one exists.
   */
  public closeAllViews(): void {
    this.clearStack(false);
  }

  /**
   * Closes all open views and clears the stack.
   * @param closePage Whether to close the currently open page, if one exists.
   */
  protected clearStack(closePage: boolean): void {
    if (this.openViews.length === 0) {
      return;
    }

    const viewEntries = [...this.openViews];
    const len = viewEntries.length;
    for (let i = len - 1; i > 0; i--) {
      viewEntries[i].ref.instance.close(true);
    }
    this.openViews.length = 1;

    if (closePage || !(viewEntries[0].ref.instance instanceof UiPage)) {
      viewEntries[0].ref.instance.close(true);
      this.openViews.length = 0;
    }
  }
}