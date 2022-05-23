import { ComponentProps, Subject, Subscribable } from 'msfssdk';
import { FmsHEvent } from './FmsHEvent';
import { UiView, UiViewProps } from './UiView';
import type { ViewService } from './ViewService';

/**
 * Component props for UiPage.
 */
export interface UiPageProps extends ComponentProps {
  /** The view service to which this page belongs. */
  viewService: ViewService;
}

/** A UiPage component. */
export abstract class UiPage<T extends UiPageProps = UiPageProps> extends UiView<T & UiViewProps> {
  protected readonly _title: Subject<string>;
  // eslint-disable-next-line jsdoc/require-returns
  /** The title of this page. */
  public get title(): Subscribable<string> {
    return this._title;
  }

  protected isPaused: boolean;

  /** @inheritdoc */
  constructor(props: T) {
    (props as any).title = '';
    (props as any).showTitle = false;
    super(props as T & UiViewProps);

    this._title = Subject.create('');
    this.isPaused = false;
  }

  /**
   * Opens the page.
   */
  public open(): void {
    super.open(false);
  }

  /**
   * This method has no effect.
   */
  public setZIndex(): void {
    // noop
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected processScrollEvent(evt: FmsHEvent): boolean {
    // Do not handle scroll inputs while paused.
    if (this.isPaused) {
      return false;
    }

    return super.processScrollEvent(evt);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onViewResumed(): void {
    this.isPaused = false;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onViewPaused(): void {
    this.isPaused = true;

    // commenting this out for now because it seems to break some stuff with components expecting lists to keep track
    // of selections even when the list is not in the active view.
    //this.blur();
  }
}