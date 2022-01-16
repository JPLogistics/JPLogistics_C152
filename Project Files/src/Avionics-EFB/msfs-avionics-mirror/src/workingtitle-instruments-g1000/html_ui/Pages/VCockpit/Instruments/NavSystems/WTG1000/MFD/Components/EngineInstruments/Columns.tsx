import { FSComponent, DisplayComponent, VNode, NodeReference } from 'msfssdk';
import { GaugeColumnGroupProps, XMLGaugeSpec, XMLGaugeType, XMLHorizontalGaugeProps, XMLHostedLogicGauge } from 'msfssdk/components/XMLGauges';
import { CompositeLogicXMLHost, EventBus } from 'msfssdk/data';
import { XMLCircleGauge } from './DialGauge';
import { XMLHorizontalGauge, XMLDoubleHorizontalGauge } from './HorizontalBarGauge';
import { XMLDoubleVerticalGauge } from './VerticalBarGauge';
import { XMLTextGauge } from './TextGauge';
import { CylinderTempGauge, CylinderTempGaugeTwin } from './CylinderTempGauge';

/**
 * The XMLColumnGroup is the fundamental container for an EIS.  It will always be present to at least
 * contain all the gauges defined in panel.xml.  There may be additional groups present if there were
 * more column groups explicitly defined in the XML configuration.
 */
export class XMLColumnGroup extends DisplayComponent<GaugeColumnGroupProps & XMLHostedLogicGauge> {
  private theDiv = FSComponent.createRef<HTMLTableElement>();
  private theRow = FSComponent.createRef<HTMLTableRowElement>();

  /** Do things after rendering. */
  public onAfterRender(): void {
    let columnsWithoutWidth = 0;
    let widthPercentUsed = 0;
    const columns = new Array<NodeReference<HTMLTableCellElement>>();

    if (this.props.id !== undefined) {
      this.theDiv.instance.classList.add(this.props.id);
    }

    for (const column of this.props.columns) {
      const ref = FSComponent.createRef<HTMLTableCellElement>();
      FSComponent.render(
        <XMLGaugeColumn bus={this.props.bus} ref={ref} logicHandler={this.props.logicHost} gaugeConfig={column.gauges} />,
        this.theRow.instance
      );
      columns.push(ref);
      if (column.width !== undefined && column.width > 0) {
        widthPercentUsed += column.width;
      } else {
        columnsWithoutWidth++;
      }
    }

    for (let i = 0; i < columns.length; i++) {
      const width = this.props.columns[i].width;
      if (width !== undefined && width > 0) {
        columns[i].instance.style.width = `${width}%`;
      } else {
        columns[i].instance.style.width = `${(100 - widthPercentUsed) / columnsWithoutWidth}%`;
      }

      columns[i].instance.classList.add(`Column${this.props.columns[i].id !== undefined ? this.props.columns[i].id : ''}`);
    }
  }

  /**
   * Render a column group.
   * @returns A VNode of the group.
   */
  public render(): VNode {
    return <table class='gauge_column_table' ref={this.theDiv}>
      <tr class='gauge_column_row' ref={this.theRow} />
    </table>;
  }
}

/** Props for a single column of gauges. */
export interface XMLGaugeColumnProps {
  /** The event bus, to give to any gauges that need it. */
  bus: EventBus;
  /** A reference to this column element. */
  ref: NodeReference<HTMLTableCellElement>
  /** The logic handler. */
  logicHandler: CompositeLogicXMLHost,
  /** An array of gauges to show. */
  gaugeConfig: Array<XMLGaugeSpec>
}

/** A single column of gauges. */
export class XMLGaugeColumn extends DisplayComponent<XMLGaugeColumnProps> {

  /** Draw all our gauges after rendering. */
  public onAfterRender(): void {
    for (const gauge of this.props.gaugeConfig) {
      switch (gauge.gaugeType) {
        case XMLGaugeType.Circular:
          FSComponent.render(
            <XMLCircleGauge logicHost={this.props.logicHandler} {...gauge.configuration} />,
            this.props.ref.instance
          );
          break;
        case XMLGaugeType.Horizontal:
          FSComponent.render(
            <XMLHorizontalGauge logicHost={this.props.logicHandler} {...gauge.configuration as XMLHorizontalGaugeProps} />,
            this.props.ref.instance
          );
          break;
        case XMLGaugeType.DoubleHorizontal:
          FSComponent.render(
            <XMLDoubleHorizontalGauge logicHost={this.props.logicHandler} {...gauge.configuration} />,
            this.props.ref.instance
          );
          break;
        case XMLGaugeType.DoubleVertical:
          FSComponent.render(
            <XMLDoubleVerticalGauge logicHost={this.props.logicHandler} {...gauge.configuration} />,
            this.props.ref.instance
          );
          break;
        case XMLGaugeType.Cylinder:
          FSComponent.render(
            <CylinderTempGauge bus={this.props.bus} logicHost={this.props.logicHandler} {...gauge.configuration} />,
            this.props.ref.instance
          );
          break;
        case XMLGaugeType.TwinCylinder:
          FSComponent.render(
            <CylinderTempGaugeTwin bus={this.props.bus} logicHost={this.props.logicHandler} {...gauge.configuration} />,
            this.props.ref.instance
          );
          break;
        case XMLGaugeType.Text:
          FSComponent.render(
            <XMLTextGauge logicHost={this.props.logicHandler} {...gauge.configuration} />,
            this.props.ref.instance
          );
          break;
        case XMLGaugeType.ColumnGroup:
          FSComponent.render(
            <XMLColumnGroup logicHost={this.props.logicHandler} {...gauge.configuration as GaugeColumnGroupProps} />,
            this.props.ref.instance
          );
          break;
      }
    }
  }
  /**
   * Render the column.
   * @returns a VSNode
   */
  public render(): VNode {
    return <td ref={this.props.ref} />;
  }
}
