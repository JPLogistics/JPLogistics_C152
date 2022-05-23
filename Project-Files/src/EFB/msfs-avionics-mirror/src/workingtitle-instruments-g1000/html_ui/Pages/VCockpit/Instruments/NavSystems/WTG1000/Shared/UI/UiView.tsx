import { FSComponent, SubEvent, Subject } from 'msfssdk';
import { FmsHEvent } from './FmsHEvent';
import { UiControl } from './UiControl';
import { UiControlGroup, UiControlGroupProps } from './UiControlGroup';
import type { ViewService } from './ViewService';

import './UiView.css';

/** They type for elements that can be scrolled. */
export type ScrollableControl = UiControl | UiControlGroup;

/** Properties on the UiView component. */
export interface UiViewProps extends UiControlGroupProps {
  /** The view service to which this page belongs. */
  viewService: ViewService;

  /** The title of the component. */
  title: string;

  /** Whether to show the title or not (is this a main menu or a child for example the page menu). */
  showTitle: boolean;

  /** If this UIView is in the MFD */
  isMfd?: boolean;
}

/** A UiView component. */
export abstract class UiView<T extends UiViewProps = UiViewProps, RV = any, IV = any> extends UiControlGroup<T> {

  protected readonly viewContainerRef = FSComponent.createRef<HTMLDivElement>();

  public viewResult: RV | undefined;

  public inputData: Subject<IV | undefined> = Subject.create<IV | undefined>(undefined);

  public onOpen = new SubEvent<this, void>();
  public onClose = new SubEvent<this, void>();
  public onAccept = new SubEvent<this, RV | undefined>();

  /**
   * Shows the view.
   * @param isSubView Whether the view is being displayed as a subview.
   * @param zIndex The z-index to assign on the view container.
   */
  public open(isSubView: boolean, zIndex?: number): void {
    if (this.viewContainerRef.instance !== null) {
      if (zIndex) {
        this.viewContainerRef.instance.style.zIndex = `${zIndex}`;
      }
      this.viewContainerRef.instance.classList.remove('quickclosed');
      this.viewContainerRef.instance.classList.remove('closed');
      this.viewContainerRef.instance.classList.add('open');
      isSubView && this.viewContainerRef.instance.classList.add('subview');
      this.notifyViewOpened();
      this.notifyViewResumed();
    }
  }

  /**
   * Closes the view.
   * @param quickclose bool stating whether to quickclose the child.
   */
  public close(quickclose = false): void {
    if (this.viewContainerRef.instance !== null) {

      this.notifyViewPaused();

      this.viewContainerRef.instance.classList.remove('open');
      if (quickclose === true) {
        this.viewContainerRef.instance.classList.add('quickclosed');
      } else {
        this.viewContainerRef.instance.classList.add('closed');
      }

      this.notifyViewClosed();
      this.setInput(undefined);
      this.viewResult = undefined;
      this.onAccept.clear();
    }
  }

  /**
   * Sets this view's z-index.
   * @param zIndex The new z-indez. If not defined, the view's z-index will be reset.
   */
  public setZIndex(zIndex: number | undefined): void {
    this.viewContainerRef.instance.style.zIndex = `${zIndex ?? ''}`;
  }

  /**
   * Set data on this view.
   * @param input The input data.
   * @returns This view instance for chain commands.
   */
  public setInput(input: IV | undefined): this {
    this.inputData.set(input);
    this.onInputDataSet(input);
    return this;
  }

  /**
   * Confirms the view result and closes the view.
   * @param [result] Provide the view result if not already set.
   * @param closeView Indicates if the view should be closed after confirming the result.
   */
  public accept(result?: RV, closeView = true): void {
    if (result !== undefined) {
      this.viewResult = result;
    }
    this.notifyViewAccept();
    if (closeView) {
      this.close();
    }
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected processScrollEvent(evt: FmsHEvent): boolean {
    if (this.scrollController.getIsScrollEnabled()) {
      return super.processScrollEvent(evt);
    } else {
      return false;
    }
  }

  /**
   * Notifies subscribers that the view has been opened.
   * @protected
   */
  protected notifyViewOpened(): void {
    this.focus();
    this.onViewOpened();
    this.onOpen.notify(this);
  }

  /**
   * Notifies subscribers that the view has been resumed.
   */
  private notifyViewResumed(): void {
    this.onViewResumed();
  }

  /**
   * Notifies subscribers that the view has been paused.
   */
  private notifyViewPaused(): void {
    this.onViewPaused();
  }

  /**
   * Notifies subscribers that the view has been closed including the view result.
   */
  private notifyViewClosed(): void {
    this.onViewClosed();
    this.onClose.notify(this);
    this.blur();
  }

  /**
   * Notifies subscribers that the view the user confirmed the view and a result should be available.
   */
  private notifyViewAccept(): void {
    this.onAccept.notify(this, this.viewResult);

  }

  /** Method to be overridden by view inheriting UiView to do something when the view opens. */
  protected onViewOpened(): void {
    //noop
  }

  /** Method to be overridden by view inheriting UiView to do something when the dialog opens. */
  protected onViewResumed(): void {
    // noope
  }

  /** Method to be overridden by view inheriting UiView to do something when the dialog opens. */
  protected onViewPaused(): void {
    //noop
  }

  /** Method to be overridden by view inheriting UiView to do something when the dialog opens. */
  protected onViewClosed(): void {
    //noop
  }

  /**
   * Method to be overridden by view inheriting UiView to do something when the input data is set.
   * @protected
   * @param input The data that was set.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onInputDataSet(input: IV | undefined): void {
    //noop
  }

  /**
   * Pauses the view (usually only called by ViewService).
   */
  public pause(): void {
    this.notifyViewPaused();
  }

  /**
   * Resumes the view (usually only called by ViewService).
   */
  public resume(): void {
    this.notifyViewResumed();
  }
}