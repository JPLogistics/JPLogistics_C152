import { ComponentProps, ComputedSubject, DisplayComponent, FSComponent, NodeReference, VNode, MathUtils } from 'msfssdk';
import { XMLCylinderGaugeProps, XMLCylinderGaugeStyle, XMLHostedLogicGauge } from 'msfssdk/components/XMLGauges';
import { CompositeLogicXMLHost, EventBus } from 'msfssdk/data';
import { G1000ControlEvents } from '../../../Shared/G1000Events';
import { BaseGauge } from './BaseGauge';
import './Gauge.css';

/** Container for the state of a single column. */
type CylinderColumn = {
  /** A noderef to the column's div element. */
  ref: NodeReference<HTMLDivElement>;
  /** An array of references to the cells in the column. */
  cells: Array<NodeReference<HTMLDivElement>>;
  /** A noderef to the column's mask element. */
  mask: NodeReference<HTMLDivElement>;
  /** A noderef to the column's peak element. */
  peak: NodeReference<HTMLDivElement>;
  /** A noderef to the colum's cylinder number. */
  num: NodeReference<HTMLSpanElement>;
  /** The cylinder object tracking this column's temperature. */
  cylinder: Cylinder;
}

/**
 * Logic for a single engine cylinder with temp randomization.
 *
 * Ideally, this would also have some fancy code in it to handle trending, so
 * that our simulated random temperatures didn't all rise and fall at the same
 * time, but it's hard to do that in this model since we only get the value
 * updates when they actually change; properly implementing delays would need
 * to have a more real-time view with hooks into the update loop and us
 * actually publishing new events when temps change.
 *
 * For now, the apparent "pulsing" caused by the blocks in the temp gauge bars
 * being "broken" at different times gives a pretty good visual effect, so
 * it doesn't feel necessary atm.  Would be cool in the future, though.
 * At that point, we could also have one class that controls both CGT and EGT.
 */
class Cylinder {
  private _factor: number;
  private _lastReading = 0;

  /**
   * Create a cylinder.
   * @param min The minimum temp adjustment multiplier.
   * @param max The maximum temp adjustment multiplier.
   */
  constructor(min: number, max: number) {
    this._factor = Math.random() * (max - min) + min;
  }

  /**
   * Set a new target reading and get the adjusted one.
   * @param target The target temperature.
   * @returns An adjusted temperature.
   */
  public setTarget(target: number): number {
    this._lastReading = Math.round(target * this.factor);
    return this._lastReading;
  }

  /**
   * Get the base adjustment factor.
   * @returns The adjustment factor as a float.
   */
  public get factor(): number {
    return this._factor;
  }

  /**
   * Get the last adjusted reading.
   * @returns Guess.
   */
  public get lastReading(): number {
    return this._lastReading;
  }
}

/**
 * Props for a set of cylinder columns representing one engine.
 */
interface CylinderSetProps extends ComponentProps {
  /** The number of columns in this set. */
  numColumns: CompositeLogicXMLElement;
  /** THe number of blocks in each column. */
  numRows: CompositeLogicXMLElement;
  /** The minimum value. */
  minimum: CompositeLogicXMLElement;
  /** The maximum value. */
  maximum: CompositeLogicXMLElement;
  /** The value component. */
  value: CompositeLogicXMLElement;
  /** The event bus. */
  bus: EventBus;
  /** A logic host. */
  logicHost: CompositeLogicXMLHost;
  /** A subject for the peak temperature. */
  peakTempSubject: ComputedSubject<number, string>;
  /** A subject for the delta from peak. */
  peakDeltaSubject: ComputedSubject<number, string>
  /** The cylinders ordered by temperature. */
  tempOrder: Array<number>;
  /** Styling details. */
  style: Partial<XMLCylinderGaugeStyle>;
}

/**
 * The Cylinder Temp Gauge component.
 *
 * Refactor suggestion:  I would like to see this component broken up so that each
 * cylinder has its own component, and the gauge itself just holds and manages
 * those.  Unfortunately, due to the iterative way in which the layout was created
 * and animated, the mask and peak elements are not in the same container as the
 * actual temperature bars, which means they can't be cleanly broken out
 * individually.  It's not worth the time now to fix that, but an ambitious soul
 * looking for something to optimize might want to think about it.
 */
export class CylinderSet extends DisplayComponent<Partial<CylinderSetProps>>{
  private container = FSComponent.createRef<HTMLDivElement>();
  private maskContainer = FSComponent.createRef<HTMLDivElement>();
  private peakContainer = FSComponent.createRef<HTMLDivElement>();
  private columnMap = new Array<CylinderColumn>();
  private minimum = 0;
  private maximum = 0;
  private numColumns = 0;
  private numRows = 0;
  private redLine = FSComponent.createRef<HTMLElement>();
  private leanAssist = false;
  private selectedCyl = 0;
  private tempOrder = new Array<number>();

  private leaningPeak = 0;
  private leaningPriorTemp = 0;

  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    if (!(this.props.numColumns && this.props.numRows && this.props.logicHost)) {
      return;
    } else {
      this.numRows = this.props.numRows.getValueAsNumber();
      this.numColumns = this.props.numColumns.getValueAsNumber();
    }

    if (this.props.value) {
      this.props.logicHost?.addLogicAsNumber(this.props.value, (val: number) => { this.updateValue(val); }, 0);
    }

    if (this.props.minimum) {
      this.minimum = this.props.logicHost.addLogicAsNumber(this.props.minimum, (val: number) => { this.minimum = val; }, 0);
    }

    if (this.props.maximum) {
      this.maximum = this.props.logicHost.addLogicAsNumber(this.props.maximum, (val: number) => { this.maximum = val; }, 0);
    }


    this.tempOrder = this.getSafeTempOrder();

    const cylinders = new Array<Cylinder>();
    const adjFactor = ((this.maximum - this.minimum) * 0.075) / this.maximum;
    for (let i = 0; i < this.numColumns; i++) {
      cylinders.push(new Cylinder(1 - adjFactor, 1 + adjFactor));
    }
    cylinders.sort((a, b): number => b.factor - a.factor);

    for (let i = 0; i < this.numColumns; i++) {
      const cells = new Array<NodeReference<HTMLDivElement>>();
      const colRef = FSComponent.createRef<HTMLDivElement>();
      const maskRef = FSComponent.createRef<HTMLDivElement>();
      const peakRef = FSComponent.createRef<HTMLDivElement>();
      const numRef = FSComponent.createRef<HTMLSpanElement>();
      FSComponent.render(<div class="cyl-column" ref={colRef}> </div>, this.container.instance);
      for (let j = 0; j <= this.numRows; j++) {
        const rowRef = FSComponent.createRef<HTMLDivElement>();
        cells[j] = rowRef;
        if (j == 0) {
          FSComponent.render(<div ref={rowRef}><span ref={numRef} class='cyl-number'>{(i + 1).toString()}</span></div>, colRef.instance);
        } else {
          FSComponent.render(<div class="temp-unit" ref={rowRef}> </div>, colRef.instance); // Space is needed to render without div wrapper so flex-grow works.
        }
      }
      FSComponent.render(<div class="temp-unit-mask-container" ref={maskRef}> <div class="temp-unit-mask"></div> </div>, this.maskContainer.instance);
      FSComponent.render(<div class="temp-unit-mask-container"><div class="temp-unit-peak" ref={peakRef}></div> </div>, this.peakContainer.instance);
      this.columnMap[i] = { ref: colRef, cells: cells, mask: maskRef, peak: peakRef, num: numRef, cylinder: cylinders[this.tempOrder.indexOf(i + 1)] };
    }

    if (!this.props.style?.redline) {
      this.redLine.instance.style.display = 'none';
    } else {
      this.redLine.instance.style.display = '';
      for (const column of this.columnMap) {
        column.peak.instance.style.display = 'none';
      }
    }

    for (const column of this.columnMap) {
      column.peak.instance.style.display = 'none';
    }

    const sub = this.props.bus?.getSubscriber<G1000ControlEvents>();
    if (sub) {
      sub.on('eis_lean_assist').handle(state => {
        this.leanAssist = state;
        if (state) {
          this.setSelectedCylinder(this.getHottestCylinder());
        } else {
          this.leaningPeak = 0;
          this.leaningPriorTemp = 0;
          this.props.peakDeltaSubject?.set(0);
          for (const column of this.columnMap) {
            column.peak.instance.style.display = 'none';
          }
        }
      });

      sub.on('eis_cyl_slct').handle(this.changeCylSlct);
    }
  }

  /**
   * Turn our temp order prop into a safe list to use.
   * @returns An array of cylinder numbers matching our cylinder count.
   */
  private getSafeTempOrder(): Array<number> {
    const tempOrder = new Array<number>();
    if (this.props.tempOrder) {
      for (const num of this.props.tempOrder) {
        if (num > 0 && num <= this.numColumns && tempOrder.indexOf(num) == -1) {
          tempOrder.push(num);
        }
      }
    }

    // Any columns not specified tack on the end.
    for (let i = 1; i <= this.numColumns; i++) {
      if (tempOrder.indexOf(i) == -1) {
        tempOrder.push(i);
      }
    }
    return tempOrder;
  }

  /**
   * Get the hottest cylinder.
   * @returns The hottest cylinder's index.
   */
  private getHottestCylinder(): number {
    // If we start changing which cylinder may be hottest, this can get fancier.
    // Right now, we just pick the first cylinder in the temp order, and this
    // function exists for easy future enhancement.
    return this.tempOrder[0] - 1;
  }

  /**
   * Set the selected cylinder.
   * @param num The index of the cylinder to select.
   */
  private setSelectedCylinder(num: number): void {
    this.columnMap[this.selectedCyl].num.instance.className = 'cyl-number';
    this.columnMap[num].num.instance.className = 'cyl-number-highlight';
    this.selectedCyl = num;
    this.props.peakTempSubject?.set(this.columnMap[num].cylinder.lastReading);
  }

  /**
   * Cycling through the cylinders
   * @param state Cylinder select state
   */
  private changeCylSlct = (state: boolean): void => {
    if (state && !this.leanAssist) {
      this.setSelectedCylinder((this.selectedCyl + 1) % this.numColumns);
    }
  };

  /**
   * Update the value of the gauge.
   * @param value The new value.
   */
  private updateValue(value: number): void {
    if (this.leanAssist && this.props.style?.peakTemps) {
      if (this.leaningPeak == 0) {
        if (this.leaningPriorTemp > value) {
          this.leaningPeak = this.leaningPriorTemp;
        } else {
          this.leaningPriorTemp = value;
        }
      } else {
        this.props.peakDeltaSubject?.set(value - this.leaningPeak);
      }
    }

    for (let i = 0; i < this.numColumns; i++) {
      const column = this.columnMap[i];
      const newTemp = MathUtils.clamp(column.cylinder.setTarget(value), this.minimum, this.maximum);
      const translation = (this.maximum - newTemp) * (66 / (this.maximum - this.minimum));
      column.mask.instance.style.transform = `translate3d(0px, ${translation}px, 0px)`;
      if (this.leaningPeak && column.peak.instance.style.display !== '') {
        column.peak.instance.style.display = '';
      } else if (newTemp >= this.leaningPeak) {
        column.peak.instance.style.transform = `translate3d(0px, ${translation}px, 0px)`;
      }
      if (i == this.selectedCyl) {
        column.num.instance.className = 'cyl-number-highlight';
        this.props.peakTempSubject?.set(column.cylinder.lastReading);
      } else {
        column.num.instance.className = 'cyl-number';
      }
    }
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class="cylinderset">
        <div class="temp-array" ref={this.container}>
          <hr class="cht-red-temp-line" ref={this.redLine} />
        </div>
        <div class="mask-container">
          <div class="temp-array" ref={this.maskContainer}></div>
        </div>
        <div class="mask-container">
          <div class="temp-array" ref={this.peakContainer}></div>
        </div>
      </div>
    );
  }
}


/**
 * A temp gauge.
 */
export class CylinderTempGauge extends BaseGauge<Partial<XMLCylinderGaugeProps> & XMLHostedLogicGauge & ComponentProps> {
  private peakRef = FSComponent.createRef<HTMLDivElement>();
  private quantum = this.props.style?.textIncrement !== undefined ? this.props.style.textIncrement : 1;
  private leanAssist = false;

  private peakTemp = ComputedSubject.create(0, (v): string => {
    return '' + Math.round(v / this.quantum) * this.quantum;
  });

  private peakDelta = ComputedSubject.create(0, (v): string => {
    if (v == 0 && !this.leanAssist) {
      return `_ _ _ _ _ ${this.props.unit}`;
    } else {
      return `${v.toFixed(0)} ${this.props.unit}`;
    }
  });

  /**
   * Initialize the rendered gauge.
   */
  protected initGauge(): void {
    this.peakRef.instance.style.display = 'none';

    const sub = this.props.bus?.getSubscriber<G1000ControlEvents>();
    if (sub) {
      sub.on('eis_lean_assist').handle(state => {
        state && this.props.style?.peakTemps ? this.peakRef.instance.style.display = '' : this.peakRef.instance.style.display = 'none';
        this.leanAssist = state;
      });
    }
  }

  /**
   * Render the gauge.
   * @returns a VNode
   */
  protected renderGauge(): VNode {
    return (
      <div class="chtegt-container">
        <CylinderSet
          numRows={this.props.numRows}
          numColumns={this.props.numColumns}
          minimum={this.props.minimum}
          maximum={this.props.maximum}
          value={this.props.value1}
          bus={this.props.bus}
          logicHost={this.props.logicHost}
          peakTempSubject={this.peakTemp}
          peakDeltaSubject={this.peakDelta}
          tempOrder={this.props.tempOrder}
          style={this.props.style}
        />
        <div class="temp-value">
          <div>{this.props.title} {this.props.unit}</div>
          <div class="size20">{this.peakTemp}</div>
        </div>
        <div class="peak-egt" ref={this.peakRef}>
          <div class="peak-label">ΔPEAK</div>
          <div class="peak-temp">{this.peakDelta}</div>
        </div>
      </div>
    );
  }
}


/**
 * A temp gauge.
 */
export class CylinderTempGaugeTwin extends BaseGauge<Partial<XMLCylinderGaugeProps> & XMLHostedLogicGauge & ComponentProps> {
  private peakRef = FSComponent.createRef<HTMLDivElement>();
  private quantum = this.props.style?.textIncrement !== undefined ? this.props.style.textIncrement : 1;
  private leanAssist = false;

  private peakTemp1 = ComputedSubject.create(0, (v): string => {
    return '' + Math.round(v / this.quantum) * this.quantum;
  });

  private peakDelta1 = ComputedSubject.create(0, (v): string => {
    if (v == 0 && !this.leanAssist) {
      return '_ _ _';
    } else {
      return `${v.toFixed(0)}`;
    }
  });

  private peakTemp2 = ComputedSubject.create(0, (v): string => {
    return '' + Math.round(v / this.quantum) * this.quantum;
  });

  private peakDelta2 = ComputedSubject.create(0, (v): string => {
    if (v == 0 && !this.leanAssist) {
      return '_ _ _';
    } else {
      return `${v.toFixed(0)}`;
    }
  });

  /**
   * Initialize the rendered gauge.
   */
  protected initGauge(): void {
    this.peakRef.instance.style.visibility = 'hidden';

    const sub = this.props.bus?.getSubscriber<G1000ControlEvents>();
    if (sub) {
      sub.on('eis_lean_assist').handle(state => {
        state && this.props.style?.peakTemps ? this.peakRef.instance.style.visibility = 'visible' : this.peakRef.instance.style.visibility = 'hidden';
        this.leanAssist = state;
      });
    }
  }

  /**
   * Render the gauge.
   * @returns a VNode
   */
  protected renderGauge(): VNode {
    return (
      <div class="chtegt-container">
        <div ref={this.peakRef}>
          <div class="twin-temp-title">ΔPEAK {this.props.unit}</div>
          <div class="twin-temp-values">
            <div>{this.peakDelta1}</div>
            <div>{this.peakDelta2}</div>
          </div>
        </div>
        <div class="column-group">
          <CylinderSet
            numRows={this.props.numRows}
            numColumns={this.props.numColumns}
            minimum={this.props.minimum}
            maximum={this.props.maximum}
            value={this.props.value1}
            bus={this.props.bus}
            logicHost={this.props.logicHost}
            peakTempSubject={this.peakTemp1}
            peakDeltaSubject={this.peakDelta1}
            tempOrder={this.props.tempOrder}
            style={this.props.style}
          />
          <CylinderSet
            numRows={this.props.numRows}
            numColumns={this.props.numColumns}
            minimum={this.props.minimum}
            maximum={this.props.maximum}
            value={this.props.value2}
            bus={this.props.bus}
            logicHost={this.props.logicHost}
            peakTempSubject={this.peakTemp2}
            peakDeltaSubject={this.peakDelta2}
            tempOrder={this.props.tempOrder}
            style={this.props.style}
          />
        </div>
        <div class="twin-temp-title" >{this.props.title} {this.props.unit}</div>
        <div class="twin-temp-values">
          <div>{this.peakTemp1}</div>
          <div>{this.peakTemp2}</div>
        </div>
      </div>
    );
  }
}