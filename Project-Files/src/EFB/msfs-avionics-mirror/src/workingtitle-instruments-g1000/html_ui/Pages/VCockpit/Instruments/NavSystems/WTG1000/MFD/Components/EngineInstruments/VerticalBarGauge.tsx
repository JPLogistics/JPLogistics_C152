import { FSComponent, DisplayComponent, VNode, NodeReference, Fragment, Subject } from 'msfssdk';
import { XMLGaugeColorZone, XMLDoubleVerticalGaugeProps, XMLHostedLogicGauge, XMLVerticalGaugeProps } from 'msfssdk/components/XMLGauges';
import { BaseGauge } from './BaseGauge';

import './Gauge.css';

//
// Color zones:  Individual colored segments on a bar.
//

/** The props for a single color zone. */
interface ColorZoneProps {
  /** The origin of the gauge. */
  origin: Cartesian,
  /** The height of the zone, in pixels. */
  width: number,
  /** The min, max, and color of this zone. */
  values: XMLGaugeColorZone,
  /** The gauge's minimum value. */
  gaugeMin: CompositeLogicXMLElement | undefined,
  /** The gauge's maximum value. */
  gaugeMax: CompositeLogicXMLElement | undefined
  /** The gaugh's height in pixels. */
  gaugeHeight: number
}

/** The dynamic color bands for a gauge. */
class VerticalColorZone extends DisplayComponent<ColorZoneProps & XMLHostedLogicGauge> {
  private theRect = FSComponent.createRef<SVGRectElement>();
  private gaugeMin = 0;
  private gaugeMax = 0;
  private zoneMin = 0;
  private zoneMax = 0;

  private gaugeRange = this.gaugeMax - this.gaugeMin;
  // For gauges with smaller range we want to increase the precision of the logic to avoid
  // having rounding errors make things look off.  We'll use single precision if the
  // pixel height of a single unit of range is 4px or greater.
  private logicPrecision = this.props.gaugeHeight / this.gaugeRange >= 4 ? 1 : 0;

  /** Do things after rendering. */
  public onAfterRender(): void {
    this.zoneMin = this.props.logicHost?.addLogicAsNumber(this.props.values.begin, (min: number) => {
      this.zoneMin = min; this.redraw();
    }, this.logicPrecision, this.props.values.smoothFactor);

    this.zoneMax = this.props.logicHost?.addLogicAsNumber(this.props.values.end, (max: number) => {
      this.zoneMax = max; this.redraw();
    }, this.logicPrecision, this.props.values.smoothFactor);

    if (this.props.gaugeMin) {
      this.gaugeMin = this.props.logicHost?.addLogicAsNumber(this.props.gaugeMin, (min: number) => {
        this.gaugeMin = min; this.redraw();
      }, this.logicPrecision);
    }

    if (this.props.gaugeMax) {
      this.gaugeMax = this.props.logicHost?.addLogicAsNumber(this.props.gaugeMax, (max: number) => {
        this.gaugeMax = max; this.redraw();
      }, this.logicPrecision);
    }

    this.theRect.instance.setAttribute('fill', this.props.values.color ? this.props.values.color : 'white');
  }

  /**
   * Redraw ourselves when something changes.  Since a lot of our values are
   * relative, we'll recompute our dimensions whenever one of them changes.
   */
  private redraw(): void {
    const baseY = this.props.origin.y + this.props.gaugeHeight;
    const height = ((this.zoneMax - this.zoneMin) / (this.gaugeMax - this.gaugeMin)) * this.props.gaugeHeight;
    const startY = baseY - height - (((this.zoneMin - this.gaugeMin) / (this.gaugeMax - this.gaugeMin)) * this.props.gaugeHeight);
    this.theRect.instance.setAttribute('y', `${startY}`);
    this.theRect.instance.setAttribute('height', `${height}`);
  }

  /**
   * Render a color zone.
   * @returns A VNode of the zone.
   */
  public render(): VNode {
    return <rect ref={this.theRect} x={this.props.origin.x} y={0} height={0} width={this.props.width} fill="white" />;
  }
}

/** A two-sided pointer. */
class DoublePointer extends DisplayComponent<Partial<XMLDoubleVerticalGaugeProps> & XMLHostedLogicGauge> {
  private ptr1Div = FSComponent.createRef<HTMLDivElement>();
  private ptr2Div = FSComponent.createRef<HTMLDivElement>();
  private ptr1Path = FSComponent.createRef<SVGPathElement>();
  private ptr2Path = FSComponent.createRef<SVGPathElement>();
  private ptr1Label = FSComponent.createRef<SVGTextElement>();
  private ptr2Label = FSComponent.createRef<SVGTextElement>();

  private ptr1Value = Subject.create(0);
  private ptr2Value = Subject.create(0);

  private minimum = 0;
  private maximum = 0;

  /** Do stuff after rendering. */
  public onAfterRender(): void {
    this.ptr1Path.instance.setAttribute('d', 'M 0 0 l 22 0 l -12 10 l 0 86 l -10 0 z');
    this.ptr2Path.instance.setAttribute('d', 'M 0 0 l 22 0 l 0 96 l -10 0 l 0 -86 z');
    this.ptr1Label.instance.textContent = this.props.cursorText1 !== undefined ? this.props.cursorText1 : '';
    this.ptr2Label.instance.textContent = this.props.cursorText2 !== undefined ? this.props.cursorText2 : '';

    if (this.props.minimum !== undefined) {
      this.minimum = this.props.logicHost?.addLogicAsNumber(this.props.minimum, (min: number) => {
        this.minimum = min;
      }, 0);
    }

    if (this.props.maximum !== undefined) {
      this.maximum = this.props.logicHost?.addLogicAsNumber(this.props.maximum, (max: number) => {
        this.maximum = max;
      }, 0);
    }

    if (this.props.value1 !== undefined) {
      this.ptr1Value.set(this.props.logicHost?.addLogicAsNumber(this.props.value1, (val: number) => {
        this.ptr1Value.set(val);
      }, 2));
    }

    if (this.props.value2 !== undefined) {
      this.ptr2Value.set(this.props.logicHost?.addLogicAsNumber(this.props.value2, (val: number) => {
        this.ptr2Value.set(val);
      }, 2));
    }

    this.ptr1Value.sub((val: number) => {
      this.updatePtr(this.ptr1Div, val);
    }, true);

    this.ptr2Value.sub((val: number) => {
      this.updatePtr(this.ptr2Div, val);
    }, true);
  }

  /**
   * Update a needle value.
   * @param ptrRef A NodeReference to the needle div.
   * @param value The new value to set.
   */
  private updatePtr(ptrRef: NodeReference<HTMLDivElement>, value: number): void {
    value = Utils.Clamp(value, this.minimum, this.maximum);
    const translation = 80 - ((value - this.minimum) / (this.maximum - this.minimum)) * 80;
    ptrRef.instance.style.transform = `translate3d(0px,${(translation)}px, 0px)`;
  }

  /**
   * Render the pointers.
   * @returns A VNode
   */
  public render(): VNode {
    return (
      <div class="gauge_pointers">
        <div class="gauge_pointer_left" ref={this.ptr1Div}>
          <svg>
            <defs>
              <linearGradient id="pointerGradientLeft" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:rgb(80,80,80);stop-opacity:1" />
                <stop offset="30%" style="stop-color:rgb(255,255,255);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgb(80,80,80);stop-opacity:1" />
              </linearGradient>
            </defs>
            <path d="" fill="url(#pointerGradientLeft)" ref={this.ptr1Path} />
            <text x="12" y="30" class="gauge_pointer_text" ref={this.ptr1Label} />
          </svg>
        </div >
        <div class="gauge_pointer_right" ref={this.ptr2Div}>
          <svg>
            <defs>
              <linearGradient id="pointerGradientRight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:rgb(80,80,80);stop-opacity:1" />
                <stop offset="70%" style="stop-color:rgb(255,255,255);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgb(80,80,80);stop-opacity:1" />
              </linearGradient>
            </defs>
            <path d="" fill="url(#pointerGradientRight)" ref={this.ptr2Path} />
            <text x="12" y="48" class="gauge_pointer_text" ref={this.ptr2Label} />
          </svg>
        </div>
      </div>);
  }
}

/** Cartesian coordinate pair */
type Cartesian = {
  /** x */
  x: number,
  /** y */
  y: number
}

/** The props for a single vertical bar. */
interface VerticalBarProps extends Partial<XMLDoubleVerticalGaugeProps> {
  /** The location of the base of the bar */
  origin: Cartesian,
  /** The height of the bar in px */
  height: number,
  /** Which side of the bar to tick on. */
  tickSide: 'left' | 'right' | 'both',
  /** How long the major ticks are. */
  majorTickLength: number,
  /** How long the minor ticks are. */
  minorTickLength: number,
}

/** A single vertical bar. */
class VerticalBar extends DisplayComponent<VerticalBarProps & XMLHostedLogicGauge> {
  private groupRef = FSComponent.createRef<SVGGElement>();
  private baseLineRef = FSComponent.createRef<SVGLineElement>();
  private tickGroupRef = FSComponent.createRef<SVGGElement>();
  private zoneGroupRef = FSComponent.createRef<SVGGElement>();
  private lineGroupRef = FSComponent.createRef<SVGGElement>();

  private x = this.props.origin.x;
  private y = this.props.origin.y;
  private height = this.props.height;

  private maxValue = Subject.create(0);
  private minValue = Subject.create(0);
  private geometry: BarGeometry;

  // Constants for tweaking layout.
  /** The length of the general minor ticks. */
  private readonly minTickLength = this.props.minorTickLength;
  /** The length of major ticks, like the baselines. */
  private readonly majTickLength = this.props.majorTickLength;
  /** The width of a color bar, in pixels. */
  private readonly zoneWidth = 6;

  private minTickStart: number;
  private minTickEnd: number;
  private majTickStart: number;
  private majTickEnd: number;

  private minTickOffest = this.minTickLength * (this.props.tickSide !== 'right' ? -1 : 1);
  private majTickOffest = this.majTickLength * (this.props.tickSide !== 'right' ? -1 : 1);


  /**
   * Create a horizontal gauge.
   * @param props The properties for the gauge.
   */
  constructor(props: VerticalBarProps & XMLHostedLogicGauge) {
    super(props);

    switch (this.props.tickSide) {
      case 'left':
        this.minTickStart = -this.minTickLength;
        this.majTickStart = -this.majTickLength;
        this.minTickEnd = this.majTickEnd = 0;
        break;
      case 'right':
        this.minTickStart = this.majTickStart = 0;
        this.minTickEnd = this.minTickLength;
        this.majTickEnd = this.majTickLength;
        break;
      case 'both':
        this.minTickStart = -this.minTickLength * 0.5;
        this.majTickStart = -this.majTickLength * 0.5;
        this.minTickEnd = -this.minTickStart;
        this.majTickEnd = -this.majTickStart;
        break;
    }

    this.geometry = {
      startX: this.x,
      startY: this.y,
      endY: this.y + this.height,
      minValue: this.minValue,
      maxValue: this.maxValue
    };
  }

  /** Draw our ticks. */
  private drawTicks(): void {
    if (this.props.graduationLength !== undefined) {
      const valRange = this.maxValue.get() - this.minValue.get();
      const graduations = Math.trunc(valRange / this.props.graduationLength);
      if (graduations > 1) {
        const spacing = this.props.height / graduations;
        for (let i = 1; i < graduations; i++) {
          const y = this.y + spacing * i;
          FSComponent.render(<g>
            <line x1={this.x + this.minTickStart} y1={y} x2={this.x + this.minTickEnd} y2={y} stroke="white" stroke-width="1px" />
          </g>, this.tickGroupRef.instance);
        }
      }
    }
  }

  /** Do stuff after render */
  public onAfterRender(): void {
    if (this.props.minimum) {
      this.minValue.set(this.props.logicHost?.addLogicAsNumber(this.props.minimum, (min: number) => {
        this.minValue.set(min);
      }, 0));
    }

    if (this.props.maximum) {
      this.maxValue.set(this.props.logicHost?.addLogicAsNumber(this.props.maximum, (max: number) => {
        this.maxValue.set(max);
      }, 0));
    }

    if (this.props.colorZones) {
      const axisWidth = 0;

      let zoneX: number;
      switch (this.props.tickSide) {
        case 'left':
          zoneX = this.x - this.zoneWidth; break;
        case 'right':
          zoneX = this.x + axisWidth; break;
        case 'both':
          zoneX = this.x - this.zoneWidth * 0.5; break;
      }

      for (let i = 0; i < this.props.colorZones.length; i++) {
        FSComponent.render(
          <VerticalColorZone logicHost={this.props.logicHost} width={6} origin={{ x: zoneX, y: this.props.origin.y }}
            values={this.props.colorZones[i]} gaugeMin={this.props.minimum} gaugeMax={this.props.maximum} gaugeHeight={this.height} />,
          this.zoneGroupRef.instance);
      }
    }

    if (this.props.colorLines) {
      for (let i = 0; i < this.props.colorLines.length; i++) {
        FSComponent.render(
          <ColorLine logicHost={this.props.logicHost}
            geometry={this.geometry}
            color={this.props.colorLines[i].color}
            tickLeft={this.props.tickSide == 'left' || this.props.tickSide == 'both' ? 15 : -1}
            tickRight={this.props.tickSide == 'right' || this.props.tickSide == 'both' ? 15 : -1}
            height={3}
            position={this.props.colorLines[i].position}
            smoothFactor={this.props.colorLines[i].smoothFactor} />,
          this.lineGroupRef.instance);
      }
    }

    this.drawTicks();
  }

  /**
   * Render our bar
   * @returns A VNode
   */
  public render(): VNode {
    return <g ref={this.groupRef}>
      <line x1={this.x} y1={this.y} x2={this.x} y2={this.y + this.height}
        stroke-width="1px" stroke="white" ref={this.baseLineRef} class="baseline" />
      <g ref={this.zoneGroupRef} />
      <line x1={this.x + this.majTickStart} y1={this.y} x2={this.x + this.majTickEnd} y2={this.y}
        stroke-width="1px" stroke="white" class="topBar" />
      <line x1={this.x + this.majTickStart} y1={this.y + this.height} x2={this.x + this.majTickEnd} y2={this.y + this.height}
        stroke-width="1px" stroke="white" class="bottomBar" />
      <g ref={this.tickGroupRef} />
      <g ref={this.lineGroupRef} />
    </g>;
  }
}

/** It's a bar. */
type BarGeometry = {
  /** The starting X of the bar. */
  startX: number,
  /** The starting Y of the bar. */
  startY: number,
  /** The ending X of the bar */
  endY: number,
  /** The minimum value. */
  minValue: Subject<number>,
  /** The maximum value. */
  maxValue: Subject<number>
}

/** Properties for a ColorLine element */
interface ColorLineProps {
  /** The geometry of the vertical bars. */
  geometry: BarGeometry,
  /** The color of the line. */
  color: string,
  /** The width of the line to the left of the bar. */
  tickLeft: number,
  /** The width of the line to the right of the bar. */
  tickRight: number,
  /** The height of the line, in pixels. */
  height: number,
  /** The position of the line. */
  position: CompositeLogicXMLElement
  /** An optional smoothing factor for value changes. */
  smoothFactor?: number
}

/** A ColorLine component. */
class ColorLine extends DisplayComponent<ColorLineProps & XMLHostedLogicGauge> {
  private lineRef = FSComponent.createRef<SVGLineElement>();

  /** Set up position updates. */
  public onAfterRender(): void {
    if (this.props.position) {
      this.updatePosition(this.props.logicHost?.addLogicAsNumber(this.props.position, (pos: number) => {
        this.updatePosition(pos);
      }, 0, this.props.smoothFactor));
    }

    // Recompute if our max or min values change.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.props.geometry.maxValue.sub(n => this.updatePosition(this.props.position.getValueAsNumber()));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.props.geometry.minValue.sub(n => this.updatePosition(this.props.position.getValueAsNumber()));

  }

  /**
   * Update the position of the line.
   * @param position The new position.
   */
  private updatePosition(position: number): void {
    const min = this.props.geometry.minValue.get();
    const max = this.props.geometry.maxValue.get();
    const translation = (((position - min) / (max - min)) * (this.props.geometry.endY - this.props.geometry.startY));
    this.lineRef.instance.style.transform = `translate3d(0px, ${translation}px, 0px)`;
  }
  /**
   * Render the ColorLine.
   * @returns A VNode
   */
  public render(): VNode {
    return (
      <Fragment>
        <line ref={this.lineRef}
          x1={this.props.geometry.startX - this.props.tickLeft} y1={this.props.geometry.startY}
          x2={this.props.geometry.startX + this.props.tickRight} y2={this.props.geometry.startY}
          stroke={this.props.color} stroke-width={this.props.height} shape-rendering="crispEdges" />
      </Fragment>
    );
  }
}

/** A vertical bar gauge with two sets of values. */
export class XMLDoubleVerticalGauge extends BaseGauge<Partial<XMLDoubleVerticalGaugeProps> & XMLHostedLogicGauge> {
  private svgRef = FSComponent.createRef<SVGElement>();
  private titleRef = FSComponent.createRef<HTMLSpanElement>();
  private value1Ref = FSComponent.createRef<HTMLSpanElement>();
  private value2Ref = FSComponent.createRef<HTMLSpanElement>();

  private labelRef = FSComponent.createRef<SVGGElement>();
  private lineGroupRef = FSComponent.createRef<SVGGElement>();

  // TODO  Refactor to make more pervasive use of subjects.
  // Now that we have these conveninent subjects, we can avoid some redundant
  // calculations and simplify interfaces by just using them instead of
  // passing the full set of props around to everything.
  private maxValue = Subject.create(0);
  private minValue = Subject.create(0);
  private geometry: BarGeometry;

  // Constants for tweaking layoout.  Maybe these should be passed in as props?
  // Or maybe that's too much work for the benefit.

  /** The X location of the left column. */
  private readonly column1X = 39;
  /** The X location of the right column. */
  private readonly column2X = 109;
  /** The X location of the labels. */
  private readonly labelX = 74;
  /** The Y location of the base of the columns. */
  private readonly baseY = 5;
  /** The height of the columns, in pixels. */
  private readonly height = 80;
  /** The Y offset for the labels, for centering on the tickmarks */
  private readonly labelOffset = 4;

  /**
   * Create a vertical gauge.
   * @param props The properties for the gauge.
   */
  constructor(props: Partial<XMLDoubleVerticalGaugeProps> & XMLHostedLogicGauge) {
    super(props);
    this.geometry = {
      startX: this.column1X,
      startY: this.baseY,
      endY: this.baseY + this.height,
      minValue: this.minValue,
      maxValue: this.maxValue
    };
  }

  /**
   * Initialize the rendered gauge.
   */
  protected initGauge(): void {
    if (this.props.title || this.props.unit) {
      this.titleRef.instance.textContent = `${this.props.title} ${this.props.unit}`;
      if (this.props.beginText !== undefined) {
        this.titleRef.instance.textContent += ` ${this.props.beginText}`;
      }
    }
    if (this.props.minimum) {
      this.minValue.set(this.props.logicHost?.addLogicAsNumber(this.props.minimum, (min: number) => {
        this.minValue.set(min);
      }, 0));
    }

    if (this.props.maximum) {
      this.maxValue.set(this.props.logicHost?.addLogicAsNumber(this.props.maximum, (max: number) => {
        this.maxValue.set(max);
      }, 0));
    }

    if (this.props.value1 !== undefined) {
      this.props.logicHost?.addLogicAsNumber(this.props.value1, (val: number) => {
        this.value1Ref.instance.textContent = `${val}`;
      }, 0);
    }

    if (this.props.value2 !== undefined) {
      this.props.logicHost?.addLogicAsNumber(this.props.value2, (val: number) => {
        this.value2Ref.instance.textContent = `${val}`;
      }, 0);
    }


    this.drawLabels();
  }


  /** Draw our labels */
  public drawLabels(): void {
    const centeredY = this.baseY + this.labelOffset; // 2 px for centering
    // Draw the top label.
    FSComponent.render(
      <g>
        <text x={this.labelX} y={centeredY} fill="white" text-anchor="middle" font-size="12">
          {this.props.endText !== undefined ? this.props.endText : this.maxValue}
        </text>
      </g>, this.labelRef.instance);

    // Draw any graduation labels.
    if (this.props.graduationLength !== undefined) {
      const valRange = this.maxValue.get() - this.minValue.get();
      const graduations = Math.trunc(valRange / this.props.graduationLength);
      const spacing = this.height / graduations;
      if (this.props.graduationHasText) {
        for (let i = 1; i < graduations; i++) {
          const y = centeredY + spacing * i;
          FSComponent.render(
            <g>
              <text x={this.labelX} y={y} fill="white" text-anchor="middle" font-size="12">
                {`${this.maxValue.get() - (i * this.props.graduationLength)}`}
              </text>
            </g>, this.labelRef.instance);
        }
      }
    }
  }

  /**
   * Render a horizontal bar gauge
   * @returns A VNode
   */
  protected renderGauge(): VNode {
    return (
      <div class="double_vert_container">
        <svg viewBox="0 0 148 148" ref={this.svgRef}>
          <g ref={this.labelRef} />
          <VerticalBar origin={{ x: this.column1X, y: this.baseY }} height={this.height} tickSide="left" majorTickLength={9} minorTickLength={9} {...this.props} />
          <VerticalBar origin={{ x: this.column2X, y: this.baseY }} height={this.height} tickSide="right" majorTickLength={9} minorTickLength={9} {...this.props} />
          <g class='colorLines' ref={this.lineGroupRef} />
        </svg>
        <DoublePointer {...this.props} />
        <div class="gauge_values">
          <span class="gauge_value_left" ref={this.value1Ref} />
          <span class="gauge_title" ref={this.titleRef} />
          <span class="gauge_value_right" ref={this.value2Ref} />
        </div>
      </div>
    );
  }
}

/** Pointer displaying a single vertical value. */
class SinglePointer extends DisplayComponent<Partial<XMLVerticalGaugeProps> & XMLHostedLogicGauge> {
  private ptrDiv = FSComponent.createRef<HTMLDivElement>();
  private ptrLabel = FSComponent.createRef<SVGTextElement>();

  private minimum = 0;
  private maximum = 0;
  private value = 0;


  /** Initialize and configure updates. */
  public onAfterRender(): void {
    this.ptrLabel.instance.textContent = this.props.cursorText1 !== undefined ? this.props.cursorText1 : '';
    if (this.props.minimum !== undefined) {
      this.minimum = this.props.logicHost?.addLogicAsNumber(this.props.minimum, (min: number) => {
        this.minimum = min;
        this.updatePtr(this.ptrDiv, this.value);
      }, 0);
    }

    if (this.props.maximum !== undefined) {
      this.maximum = this.props.logicHost?.addLogicAsNumber(this.props.maximum, (max: number) => {
        this.maximum = max;
        this.updatePtr(this.ptrDiv, this.value);
      }, 0);
    }

    if (this.props.value1 !== undefined) {
      this.value = this.props.logicHost?.addLogicAsNumber(this.props.value1, (val: number) => {
        this.value = val;
        this.updatePtr(this.ptrDiv, this.value);
      }, 2);
    }
  }

  /**
   * Update a needle value.
   * @param ptrRef A NodeReference to the needle div.
   * @param value The new value to set.
   */
  private updatePtr(ptrRef: NodeReference<HTMLDivElement>, value: number): void {
    value = Utils.Clamp(value, this.minimum, this.maximum);
    const translation = 80 - ((value - this.minimum) / (this.maximum - this.minimum)) * 80;
    ptrRef.instance.style.transform = `translate3d(0px,${(translation)}px, 0px)`;
  }

  /**
   * Render the pointer.
   * @returns A VNode
   */
  public render(): VNode {
    return (
      <div class="gauge_pointers">
        <div class="gauge_pointer" ref={this.ptrDiv}>
          <svg>
            <defs>
              <linearGradient id="pointerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:rgb(80,80,80);stop-opacity:1" />
                <stop offset="30%" style="stop-color:rgb(255,255,255);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgb(80,80,80);stop-opacity:1" />
              </linearGradient>
            </defs>
            <path d="M 0 0 l 10 0 l 0 96 l -10 0 z" fill="url(#pointerGradient)" />
            <text x="12" y="30" class="gauge_pointer_text" ref={this.ptrLabel} />
          </svg>
        </div>
      </div>
    );
  }
}

/** A single vertical bar gauge. */
export class XMLVerticalGauge extends BaseGauge<Partial<XMLVerticalGaugeProps> & XMLHostedLogicGauge> {
  private svgRef = FSComponent.createRef<SVGElement>();
  private titleRef = FSComponent.createRef<HTMLDivElement>();
  private unitRef = FSComponent.createRef<HTMLDivElement>();

  private valueRef = FSComponent.createRef<HTMLSpanElement>();
  private labelRef = FSComponent.createRef<SVGGElement>();
  private lineGroupRef = FSComponent.createRef<SVGGElement>();

  private maxValue = Subject.create(0);
  private minValue = Subject.create(0);
  private geometry: BarGeometry;

  /** The X location of the left column. */
  private readonly columnX = 39;
  /** The Y location of the base of the columns. */
  private readonly baseY = 5;
  /** The height of the columns, in pixels. */
  private readonly height = 80;

  /**
   * Create a vertical gauge.
   * @param props The properties for the gauge.
   */
  constructor(props: Partial<XMLDoubleVerticalGaugeProps> & XMLHostedLogicGauge) {
    super(props);
    this.geometry = {
      startX: this.columnX,
      startY: this.baseY,
      endY: this.baseY + this.height,
      minValue: this.minValue,
      maxValue: this.maxValue
    };
  }

  /** Initialize the rendered gauge */
  protected initGauge(): void {
    if (this.props.title || this.props.unit) {
      this.titleRef.instance.textContent = `${this.props.title} ${this.props.unit}`;
      if (this.props.beginText !== undefined) {
        this.titleRef.instance.textContent += ` ${this.props.beginText}`;
      }
    }
    if (this.props.minimum) {
      this.minValue.set(this.props.logicHost?.addLogicAsNumber(this.props.minimum, (min: number) => {
        this.minValue.set(min);
      }, 0));
    }

    if (this.props.maximum) {
      this.maxValue.set(this.props.logicHost?.addLogicAsNumber(this.props.maximum, (max: number) => {
        this.maxValue.set(max);
      }, 0));
    }

    if (this.props.value1 !== undefined) {
      this.props.logicHost?.addLogicAsNumber(this.props.value1, (val: number) => {
        this.valueRef.instance.textContent = `${val}`;
      }, 0);
    }
  }

  /**
   * Render a single vertical gauge.
   * @returns a VNode
   */
  protected renderGauge(): VNode {
    return (
      <div class="single_vert_container">
        <div class="gauge_title" ref={this.titleRef} />
        <div class="gauge_body">
          <svg ref={this.svgRef}>
            <VerticalBar origin={{ x: this.columnX, y: this.baseY }} height={this.height} tickSide="both" majorTickLength={15} minorTickLength={15} {...this.props} />
            <g class='colorLines' ref={this.lineGroupRef} />
          </svg>
          <SinglePointer {...this.props} />
        </div>
        <div class="gauge_values">
          <span class="gauge_value" ref={this.valueRef} />
        </div>
      </div>
    );
  }
}