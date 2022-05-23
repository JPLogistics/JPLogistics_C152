import { FSComponent, NodeReference, VNode } from 'msfssdk';

import { Fms } from 'garminsdk/flightplan';
import { ScrollUtils } from 'msfssdk/graphics/layout';
import { UiControl } from '../UiControl';
import { G1000UiControl, G1000UiControlProps } from '../G1000UiControl';
import { FacilityInfo } from './FPLTypesAndProps';
import { FlightPlanSegment } from 'msfssdk/flightplan';

/** The properties for the FPLHeader component. */
export interface FPLHeaderProps extends G1000UiControlProps {
  /** The fms. */
  fms: Fms;
  /** Info about origin and destination facilities */
  facilities: FacilityInfo;
  /** The flight plan segment associated with this header. */
  segment: FlightPlanSegment;
  /** The scroll container to scroll to when this item is focused. */
  scrollContainer?: NodeReference<HTMLElement>;
}

/**
 * A header for an FPL section.
 */
export abstract class FPLHeader<P extends FPLHeaderProps = FPLHeaderProps> extends G1000UiControl<P> {
  protected readonly rootRef = FSComponent.createRef<HTMLDivElement>();

  private estimatedNameWidth = 0;

  protected _isCollapsed = false;
  // eslint-disable-next-line jsdoc/require-returns
  /** Whether this header is collapsed. */
  public get isCollapsed(): boolean {
    return this._isCollapsed;
  }

  protected isInit = false;

  /** @inheritdoc */
  public onAfterRender(node: VNode): void {
    this.isInit = true;
    super.onAfterRender(node);
    this.update();
  }

  /**
   * Method to collapse this section and display the header correctly.
   * @param setCollapsed boolean to set collapsed
   */
  public abstract setCollapsed(setCollapsed: boolean): void;

  /** Updates this header */
  public update(): void {
    if (!this.isInit) {
      return;
    }

    this.updateName();
  }

  /**
   * Updates this header's name text.
   */
  protected abstract updateName(): void;

  /**
   * Sets the estimated width of this header's name text.
   * @param width The new estimated width, in pixels.
   */
  protected setEstimatedNameWidth(width: number): void {
    if (width === this.estimatedNameWidth) {
      return;
    }

    this.estimatedNameWidth = width;
    this.updateNameFontSize();
  }

  /**
   * Updates the font size for this header's name text to ensure the text fits within this header's width.
   */
  protected updateNameFontSize(): void {
    if (this.rootRef.getOrDefault() !== null) {
      // fit size
      const clampedWidth = Utils.Clamp(this.estimatedNameWidth, this.rootRef.instance.offsetWidth, 500);
      const clientWidth = this.rootRef.instance.clientWidth;
      if (clientWidth !== 0) {
        this.rootRef.instance.style.fontSize = `${(this.rootRef.instance.clientWidth / clampedWidth) * 100}%`;
      }
    }
  }

  /**
   * Sets if the header should be visible.
   * @param isVisible Whether or not the header is visible.
   */
  protected setIsVisible(isVisible: boolean): void {
    if (isVisible) {
      this.rootRef.instance.classList.remove(UiControl.HIDE_CLASS);
    } else {
      this.rootRef.instance.classList.add(UiControl.HIDE_CLASS);
    }

    this.setDisabled(!isVisible);
  }

  /** @inheritdoc */
  protected onFocused(source: G1000UiControl): void {
    this.rootRef.instance.classList.add(UiControl.FOCUS_CLASS);
    if (this.props.scrollContainer !== undefined) {
      ScrollUtils.ensureInView(this.rootRef.instance, this.props.scrollContainer.instance);
    }

    this.props.onFocused && this.props.onFocused(source);
  }

  /** @inheritdoc */
  protected onBlurred(): void {
    this.rootRef.instance.classList.remove(UiControl.FOCUS_CLASS);
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div ref={this.rootRef} class='header-name'>
        {this.renderName()}
      </div>
    );
  }

  /**
   * Renders this header's name text.
   * @returns This header's name text, as a VNode.
   */
  protected abstract renderName(): VNode;
}