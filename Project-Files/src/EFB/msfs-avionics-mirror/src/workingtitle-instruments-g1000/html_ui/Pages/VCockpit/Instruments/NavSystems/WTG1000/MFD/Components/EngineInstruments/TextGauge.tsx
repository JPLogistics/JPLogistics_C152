import { XMLHostedLogicGauge, XMLTextElementProps, XMLTextColumnProps } from 'msfssdk/components/XMLGauges';
import { FSComponent, DisplayComponent, VNode, Subject } from 'msfssdk';
import { BaseGauge } from './BaseGauge';

/** The props for a text column. */
interface ColumnProps extends Partial<XMLTextColumnProps> {
  /** Which column this text is located in. */
  location: 'left' | 'center' | 'right'
}

/** Draw a single column of text. */
class XMLTextColumn extends DisplayComponent<ColumnProps & XMLHostedLogicGauge> {
  private contentRef = FSComponent.createRef<HTMLDivElement>();
  private textValue = Subject.create('');

  /** Do stuff after rendering. */
  public onAfterRender(): void {
    if (this.props.content !== undefined) {
      this.textValue.set(this.props.logicHost.addLogicAsString(
        this.props.content, (content: string) => { this.textValue.set(content); }
      ));
    } else {
      // If a column has no content, we remove its flex weight to make room for the others.
      this.contentRef.instance.style.flex = '0';
    }

    if (this.props.color !== undefined) {
      this.contentRef.instance.style.color = this.props.logicHost.addLogicAsString(
        this.props.color, (content: string) => { this.contentRef.instance.style.color = content; }
      );
    }

    if (this.props.fontSize !== undefined) {
      // The original code uses 10px for main text.  We're using 16.
      // In order to keep thigns proportional, font sizes that are
      // explicity set will be scaled up by the same factor.

      // TODO Sub-pixel rendering supported?
      this.contentRef.instance.style.fontSize = `${parseFloat(this.props.fontSize) * 1.6}px`;
    }

    if (this.props.class !== undefined) {
      this.contentRef.instance.classList.add(this.props.class);
    }
  }

  /**
   * Render the gauge.
   * @returns A VNode
   */
  public render(): VNode {
    return <div ref={this.contentRef} class={'text_column_' + this.props.location}>{this.textValue}</div>;
  }
}

/** A text gauge display element. */
export class XMLTextGauge extends BaseGauge<XMLTextElementProps & XMLHostedLogicGauge> {

  /**
   * Initialize the rendered gauge.
   */
  protected initGauge(): void {
    // Just satisfying the base class.
    return;
  }

  /**
   * Render a text gauge
   * @returns A VNode
   */
  protected renderGauge(): VNode {
    return (
      <div class="text_gauge_container">
        <XMLTextColumn location={'left'} logicHost={this.props.logicHost} {...this.props.left} />
        <XMLTextColumn location={'center'} logicHost={this.props.logicHost} {...this.props.center} />
        <XMLTextColumn location={'right'} logicHost={this.props.logicHost} {...this.props.right} />
      </div>
    );
  }
}