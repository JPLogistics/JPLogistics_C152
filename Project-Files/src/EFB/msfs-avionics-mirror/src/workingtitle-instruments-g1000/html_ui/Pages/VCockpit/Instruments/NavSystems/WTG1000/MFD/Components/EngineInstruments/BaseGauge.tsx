import { FSComponent, DisplayComponent, VNode } from 'msfssdk';
import { XMLGaugeProps } from 'msfssdk/components/XMLGauges';

/**
 * An abstract base gauge component containing the universal logic for scaling
 * and margin calculations so these don't need to be implemented in every
 * gauge type.
 */
export abstract class BaseGauge<T extends Partial<XMLGaugeProps>> extends DisplayComponent<T> {
  private theDiv = FSComponent.createRef<HTMLDivElement>();

  /** The method to call to render the gauge into ourselves. */
  protected abstract renderGauge(): VNode;

  /** The method to call to perform gauge initialization. */
  protected abstract initGauge(): void;

  /**
   * Perform scaling and margin adjustment then render and initialize the gauge.
   */
  public onAfterRender(): void {
    if (this.props.style?.sizePercent && this.props.style.sizePercent !== 100) {
      const factor = this.props.style.sizePercent / 100;
      this.theDiv.instance.style.transform = `scale3d(${factor}, ${factor}, ${factor})`;
      this.theDiv.instance.style.transformOrigin = 'center';
      this.theDiv.instance.style.marginTop = `-${(1 - factor) * 50}%`;
      this.theDiv.instance.style.marginBottom = `-${(1 - factor) * 50}%`;
    }

    if (this.props.style?.marginLeft) {
      this.theDiv.instance.style.marginLeft = `${this.props.style.marginLeft}px`;
    }

    if (this.props.style?.marginTop) {
      this.theDiv.instance.style.marginTop = `${this.props.style.marginTop}px`;
    }

    if (this.props.style?.marginRight) {
      this.theDiv.instance.style.marginRight = `${this.props.style.marginRight}px`;
    }

    if (this.props.style?.marginBottom) {
      this.theDiv.instance.style.marginBottom = `${this.props.style.marginBottom}px`;
    }

    FSComponent.render(this.renderGauge(), this.theDiv.instance);
    this.initGauge();
  }

  /**
   * Render the gauge.
   * @returns A VNode
   */
  public render(): VNode {
    return (
      <div class="abstract_gauge_container" ref={this.theDiv} />
    );
  }
}