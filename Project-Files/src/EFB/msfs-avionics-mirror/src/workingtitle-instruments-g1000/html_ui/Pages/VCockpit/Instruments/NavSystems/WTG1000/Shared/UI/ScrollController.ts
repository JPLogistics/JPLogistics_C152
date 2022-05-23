import { ScrollUtils } from 'msfssdk/graphics/layout';
import { UiControl } from './UiControl';
import { ScrollableControl } from './UiView';

/** The ScrollController for UI Elements. */
export class ScrollController {
  private readonly controls: ScrollableControl[] = [];
  private scrollContainer: HTMLElement | undefined;
  private isEnabled = true;
  private lastFocusedIndex = 0;

  /**
   * Method to register a control.
   * @param ctrl The control to register.
   */
  public registerCtrl(ctrl: ScrollableControl): void {
    this.controls.push(ctrl);
  }

  /**
   * Registers a scroll container with this controller.
   * @param scrollContainer The html block element to assign.
   */
  public registerScrollContainer(scrollContainer: HTMLElement): void {
    this.scrollContainer = scrollContainer;
  }

  // TODO how to handle DOM modifications (add/remove)
  // this solution is not ideal. in theory we need to observe DOM changes and react accordingly
  // but a uicontrol must not be a DOM element directly, its just a component at first. so it all becomes a bit messy. ideas?

  /**
   * Method to unregister a control.
   * @param ctrl The control to unregister.
   */
  public unregisterCtrl(ctrl: ScrollableControl): void {
    this.controls.splice(this.controls.indexOf(ctrl), 1);
  }

  /** Method to reset this control. */
  public resetCtrls(): void {
    this.controls.length = 0;
  }

  /**
   * Toggles the scroll enabled state.
   */
  public toggleScrollEnabled(): void {
    this.isEnabled = !this.isEnabled;

    if (this.isEnabled) {
      if (this.lastFocusedIndex > -1) {
        this.gotoIndex(this.lastFocusedIndex);
      }
    }

    for (let i = 0; i < this.controls.length; i++) {
      const ctrl = this.controls[i] as any;
      if (ctrl.setScrollEnabled) {
        ctrl.setScrollEnabled(this.isEnabled);
      }
    }

    if (!this.isEnabled) {
      const focusCtrl = this.getFocusedUiControl();
      this.lastFocusedIndex = focusCtrl ? this.getFocusedUiControlIndex() : -1;
      focusCtrl?.blur();
    }
  }

  /**
   * Gets a value indicating if scrolling is enabled
   * @returns true if is scroll enabled
   */
  public getIsScrollEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Method to get the UiControl highlighted by the control.
   * @returns the selected UiControl or undefine
   */
  public getFocusedUiControl(): ScrollableControl | undefined {
    return this.controls.find((v) => { return v.getIsFocused(); });
  }

  /**
   * Method to get the UiControl highlighted by the control.
   * @returns the selected UiControl or undefine
   */
  public getActivatedUiControl(): ScrollableControl | undefined {
    return this.controls.find((v) => { return (v instanceof UiControl) && v.getIsActivated(); });
  }

  /**
   * Scrolls to the first suitable control.
   * @returns Whether the operation was successful.
   */
  public gotoFirst(): boolean {
    return this.scrollTo('next', -1);
  }

  /**
   * Highlight the last suitable control.
   * @returns Whether the operation was successful.
   */
  public gotoLast(): boolean {
    return this.scrollTo('prev', this.controls.length);
  }

  /**
   * Highlight the selected control on the page.
   * @param index is the index to highlight.
   * @returns Whether the operation was successful.
   */
  public gotoIndex(index: number): boolean {
    if (index < 0) {
      return this.scrollTo('next', -1);
    } else if (index < this.controls.length) {
      return this.scrollTo('next', index - 1);
    } else {
      return this.scrollTo('prev', this.controls.length);
    }
  }

  /**
   * Scroll forward.
   * @returns true if it was able to scroll into the given direction.
   */
  public gotoNext = (): boolean => {
    return this.scrollTo('next');
  };

  /**
   * Scroll backwards.
   * @returns true if it was able to scroll into the given direction.
   */
  public gotoPrev = (): boolean => {
    return this.scrollTo('prev');
  };

  /**
   * Gets controls count
   * @returns controls count
   */
  public getControlsCount(): number {
    return this.controls.length;
  }

  /** Unfocus the focused control. */
  public blur(): void {
    for (let i = 0; i < this.controls.length; i++) {
      this.controls[i].blur();
    }
  }

  /**
   * Callback to override when a scroll event happens.
   * @param ctrl The control now in focus.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onScroll = (ctrl: ScrollableControl): void => {
    const el = ctrl.getHighlightElement();
    if (el !== null && this.scrollContainer) {
      ScrollUtils.ensureInView(el as HTMLElement, this.scrollContainer);
    }
  };

  /**
   * Highlights the next focusable control in the direction.
   * @param direction The direction to scroll to.
   * @param activeIdx The index to start the scroll from.
   * @returns true if it was able to scroll into the given direction.
   */
  public scrollTo(direction: 'next' | 'prev', activeIdx = this.getFocusedUiControlIndex()): boolean {
    if (!this.isEnabled) {
      return false;
    }

    if (this.controls.length > 0) {
      const isAtBounds = ((activeIdx === 0 && direction === 'prev')
        || (activeIdx === this.controls.length - 1 && direction === 'next'));

      const nextCtrl = this.findControlToFocus(activeIdx, direction);
      if (nextCtrl !== undefined) {
        this.getFocusedUiControl()?.blur();
        // typecheck for UiControlGroup to avoid circular dependency
        if ((nextCtrl as any).processHEvent) {
          nextCtrl.focus((direction === 'next') ? 'top' : 'bottom');
        } else {
          nextCtrl.focus();
        }
        this.onScroll(nextCtrl);
        return !isAtBounds;
      } else {
        const focusedCtrl = this.getFocusedUiControl();
        if (focusedCtrl !== undefined) {
          this.onScroll(focusedCtrl);
        }
        return false;
      }
    }
    return false;
  }

  /**
   * Founds the next/prev control that is able to be focused.
   * Returns undefined when no suitable control is found.
   * @private
   * @param activeIdx The index to start the search from.
   * @param direction The direction to look into.
   * @returns A focusable UiControl or undefined.
   */
  private findControlToFocus(activeIdx: number, direction: string): ScrollableControl | undefined {
    const nextIdx = (direction === 'next') ? activeIdx + 1 : activeIdx - 1;
    // const ctrl = this.controls[MathUtils.clamp(nextIdx, 0, this.controls.length - 1)];
    const ctrl = this.controls[nextIdx];
    if (ctrl === undefined || ctrl.getIsFocusable()) {
      return ctrl;
    } else {
      return this.findControlToFocus(nextIdx, direction);
    }
  }

  /**
   * Gets the index of the focused control.
   * @private
   * @returns The index.
   */
  private getFocusedUiControlIndex(): number {
    return this.controls.findIndex((v) => { return v.getIsFocused(); });
  }
}