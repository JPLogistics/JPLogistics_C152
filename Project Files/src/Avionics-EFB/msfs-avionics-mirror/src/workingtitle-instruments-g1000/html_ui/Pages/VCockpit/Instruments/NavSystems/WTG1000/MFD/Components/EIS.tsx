// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FSComponent, DisplayComponent, VNode, ComponentProps, NodeReference } from 'msfssdk';
import { EventBus, CompositeLogicXMLHost } from 'msfssdk/data';
import { XMLExtendedGaugeConfig } from 'msfssdk/components/XMLGauges';
import { XMLColumnGroup } from './EngineInstruments/Columns';

import './EIS.css';
import { G1000ControlEvents } from '../../Shared/G1000Events';

export enum EISPageTypes {
  Engine,
  Lean,
  System
}

/** The props for an EIS display. */
export interface EISProps extends ComponentProps {
  /** the event bus */
  bus: EventBus;
  /** the logic handler */
  logicHandler: CompositeLogicXMLHost,
  /** our gauges */
  gaugeConfig: XMLExtendedGaugeConfig
}

/**
 * This EIS is a shorcut for creating the base EIS display on the plane.  All the actual rendering and
 * management is hadled within an XMLGaugeColumn, but that's a litter more tedious to create.  This
 * component instantiates the EIS as a simple XMLColumnGroup with a single column that consists in
 * its entiretly of all the top-level gauges in the EIS.   Further nesting is handed by the internal
 * columns logic.
 */
export class EIS extends DisplayComponent<EISProps> {
  private enginePage = FSComponent.createRef<HTMLDivElement>();
  private leanPage = FSComponent.createRef<HTMLDivElement>();
  private systemPage = FSComponent.createRef<HTMLDivElement>();

  /**
   * Initial config after rendering.
   */
  public onAfterRender(): void {
    this.enginePage.instance.style.display = '';
    this.setDisplay(this.leanPage, 'none');
    this.setDisplay(this.systemPage, 'none');

    for (const func of this.props.gaugeConfig.functions.values()) {
      this.props.logicHandler.addFunction(func);
    }

    const sub = this.props.bus.getSubscriber<G1000ControlEvents>();
    sub.on('eis_page_select').handle(page => {
      switch (page) {
        case EISPageTypes.Engine:
          this.enginePage.instance.style.display = '';
          this.setDisplay(this.leanPage, 'none');
          this.setDisplay(this.systemPage, 'none');
          break;
        case EISPageTypes.Lean:
          if (this.leanPage.getOrDefault()) {
            this.enginePage.instance.style.display = 'none';
            this.leanPage.instance.style.display = '';
            this.setDisplay(this.systemPage, 'none');
          }
          break;
        case EISPageTypes.System:
          if (this.systemPage.getOrDefault()) {
            this.enginePage.instance.style.display = 'none';
            this.setDisplay(this.leanPage, 'none');
            this.systemPage.instance.style.display = '';
          }
          break;
      }
    });
  }

  /**
   * Shortcut for changing the display of an EIS data page, if it exists.
   * @param page The reference to the div containing the page.
   * @param display A string to set as the display style parameter.
   */
  private setDisplay(page: NodeReference<HTMLDivElement>, display: string): void {
    if (page.getOrDefault() !== null) { page.instance.style.display = display; }
  }

  /**
   * Render an EIS as a single XMLColumnGroup.
   * @returns a VNode
   */
  public render(): VNode {
    return (
      <div>
        <div ref={this.enginePage}>
          <XMLColumnGroup bus={this.props.bus} logicHost={this.props.logicHandler} columns={[{ gauges: this.props.gaugeConfig.enginePage }]} />
        </div>
        {this.props.gaugeConfig.leanPage &&
          <div ref={this.leanPage}>
            <XMLColumnGroup bus={this.props.bus} logicHost={this.props.logicHandler} columns={[{ gauges: this.props.gaugeConfig.leanPage }]} />
          </div>}
        {this.props.gaugeConfig.systemPage &&
          <div ref={this.systemPage}>
            <XMLColumnGroup bus={this.props.bus} logicHost={this.props.logicHandler} columns={[{ gauges: this.props.gaugeConfig.systemPage }]} />
          </div>}
      </div>
    );
  }
}