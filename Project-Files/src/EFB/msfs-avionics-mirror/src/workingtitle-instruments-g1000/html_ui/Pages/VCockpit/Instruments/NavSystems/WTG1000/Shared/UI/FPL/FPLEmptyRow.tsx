import { FSComponent, NodeReference, VNode } from 'msfssdk';
import { ScrollUtils } from 'msfssdk/graphics/layout';
import { UiControl } from '../UiControl';
import { G1000UiControl, G1000UiControlProps } from '../G1000UiControl';

/** Props on the FPLEmptyRow component. */
interface FPLEmptyRowProps extends G1000UiControlProps {
  /** The container to scroll when the item is focused. */
  scrollContainer?: NodeReference<HTMLElement>;
}

/** The FPLEmptyRow component. */
export class FPLEmptyRow extends G1000UiControl<FPLEmptyRowProps> {
  private rootEl = FSComponent.createRef<HTMLDivElement>();
  private nameContainerRef = FSComponent.createRef<HTMLElement>();

  /** @inheritdoc */
  public getElement(): HTMLDivElement {
    return this.rootEl.instance;
  }

  /**
   * Sets whether or not this row should be visible.
   * @param isVisible Whether or not the row is visible.
   */
  public setIsVisible(isVisible: boolean): void {
    if (isVisible) {
      this.rootEl.instance.classList.remove(UiControl.HIDE_CLASS);
    } else {
      this.rootEl.instance.classList.add(UiControl.HIDE_CLASS);
    }
  }

  /** @inheritdoc */
  protected onFocused(source: G1000UiControl): void {
    this.nameContainerRef.instance.classList.add(UiControl.FOCUS_CLASS);
    if (this.props.scrollContainer !== undefined) {
      ScrollUtils.ensureInView(this.rootEl.instance, this.props.scrollContainer.instance);
    }

    this.props.onFocused && this.props.onFocused(source);
  }

  /** @inheritdoc */
  protected onBlurred(): void {
    this.nameContainerRef.instance.classList.remove(UiControl.FOCUS_CLASS);
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class='fix-container' ref={this.rootEl}><div class='fix-name' ref={this.nameContainerRef}><span style='padding-right:5em'>______</span></div></div>
    );
  }
}