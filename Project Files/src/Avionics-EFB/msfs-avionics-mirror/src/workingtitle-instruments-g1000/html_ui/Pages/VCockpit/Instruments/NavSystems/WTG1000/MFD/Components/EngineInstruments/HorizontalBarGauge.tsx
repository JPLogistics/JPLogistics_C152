import { FSComponent, DisplayComponent, VNode, NodeReference, Fragment, Subject, ComputedSubject, Subscribable } from 'msfssdk';
import {
  XMLGaugeColorZone, XMLHorizontalGaugeProps,
  XMLDoubleHorizontalGaugeProps, XMLHostedLogicGauge,
  XMLDoubleHorizontalGaugeValuePos, XMLHorizontalGaugeValuePos,
} from 'msfssdk/components/XMLGauges';
import { BaseGauge } from './BaseGauge';

import './Gauge.css';

/** The basic layout info needed for drawing horizontal gauge parts. */
type GaugeGeometry = {
  /** The starting X location of the bar. */
  startX: number,
  /** The starting Y location of the bar. */
  startY: number,
  /** The horizontal width of the bar in pixels. */
  width: number,
  /** A subject for the minimum bar value. */
  minValue: Subscribable<number>,
  /** A subject for the maximum bar value. */
  maxValue: Subscribable<number>
}

/** Properties defining a single colored segment on the bar. */
interface ColorZoneProps {
  /** The geometry layout of the gauge. */
  geometry: GaugeGeometry,
  /** The height of the zone, in pixels. */
  height: number,
  /** The starting Y position, in pixels. */
  yPos: number,
  /** The min, max, and color of this zone. */
  values: XMLGaugeColorZone,
  /** The gauge's minimum value logic. */
  gaugeMin: CompositeLogicXMLElement | undefined,
  /** The gauge's maximum value logic. */
  gaugeMax: CompositeLogicXMLElement | undefined
}

/** The (potentially) dynamic colored segments on the gauge bar. */
class ColorZone extends DisplayComponent<ColorZoneProps & XMLHostedLogicGauge> {
  private theRect = FSComponent.createRef<SVGRectElement>();
  private gaugeMin = 0;
  private gaugeMax = 0;
  private zoneMin = 0;
  private zoneMax = 0;

  /** Configure and start update logic. */
  public onAfterRender(): void {
    this.zoneMin = this.props.logicHost?.addLogicAsNumber(this.props.values.begin, (min: number) => {
      this.zoneMin = min; this.redraw();
    }, 0, this.props.values.smoothFactor);

    this.zoneMax = this.props.logicHost?.addLogicAsNumber(this.props.values.end, (max: number) => {
      this.zoneMax = max; this.redraw();
    }, 0, this.props.values.smoothFactor);

    if (this.props.gaugeMin) {
      this.gaugeMin = this.props.logicHost?.addLogicAsNumber(this.props.gaugeMin, (min: number) => {
        this.gaugeMin = min; this.redraw();
      }, 0);
    }

    if (this.props.gaugeMax) {
      this.gaugeMax = this.props.logicHost?.addLogicAsNumber(this.props.gaugeMax, (max: number) => {
        this.gaugeMax = max; this.redraw();
      }, 0);
    }

    this.theRect.instance.setAttribute('fill', this.props.values.color ? this.props.values.color : 'white');
  }

  /**
   * Redraw ourselves when something changes.  Since a lot of our values are
   * relative, we'll recompute our dimensions whenever one of them changes.
   */
  private redraw(): void {
    // we shorten the maximum length of the bar by a couple pixels so colors don't cover the end ticks
    const startX = 12 + (((this.zoneMin - this.gaugeMin) / (this.gaugeMax - this.gaugeMin)) * this.props.geometry.width);
    const width = ((this.zoneMax - this.zoneMin) / (this.gaugeMax - this.gaugeMin)) * this.props.geometry.width;
    this.theRect.instance.setAttribute('x', `${startX}`);
    this.theRect.instance.setAttribute('width', `${width}`);
  }

  /**
   * Render a color zone.
   * @returns A VNode of the zone.
   */
  public render(): VNode {
    return <rect ref={this.theRect} x={0} y={this.props.yPos} height={this.props.height} width={0} fill="white" />;
  }
}

/** The dimensions for the bar's baseline and ticks. */
interface GraduatedBarProps {
  /** The X width of the bar. */
  width: number,
  /** How high above the bar ticks go. */
  tickRise: number,
  /** How far below the bar the ticks go. */
  tickFall: number
}

/** A graduated horizontal baseline with optional tickmarks and labels. */
// The type spec on this one is really ugly and could probably be improved with better
// use of generics.  I'm too tired to work on that now.
class GraduatedBar extends DisplayComponent<(Partial<XMLHorizontalGaugeProps> | Partial<XMLDoubleHorizontalGaugeProps>)
  & XMLHostedLogicGauge & GraduatedBarProps> {
  private tickRef = FSComponent.createRef<SVGGElement>();
  private labelRef = FSComponent.createRef<SVGGElement>();
  private gaugeMin = 0;
  private gaugeMax = 0;

  private tickRise = 35 - this.props.tickRise;
  private tickFall = 35 + this.props.tickFall

  /** Initialize our dynamic elements and update logic. */
  public onAfterRender(): void {
    if (this.props.minimum) {
      this.gaugeMin = this.props.logicHost?.addLogicAsNumber(
        this.props.minimum, (min: number) => { this.gaugeMin = min; }, 0);
    }
    if (this.props.maximum) {
      this.gaugeMax = this.props.logicHost?.addLogicAsNumber(
        this.props.maximum, (max: number) => { this.gaugeMax = max; }, 0);
    }

    // Currently, the graduations are created as a static element, even though
    // the min and max could techincally change since they are logic elements.
    // This matches the default, stock functionality, but it would be cool to
    // enhance this so that you could fully redraw the entire gauge on demand.
    if (this.props.graduationLength !== undefined) {
      const graduations = Math.trunc((this.gaugeMax - this.gaugeMin) / this.props.graduationLength) + 1;
      const tickSpacing = this.props.width / (graduations - 1);
      for (let i = 0; i < graduations; i++) {
        const xPos = 11 + tickSpacing * i;

        // Only draw a tick if we're not at the start or end.
        if (i > 0 && i < graduations - 1) {
          // TODO Add minor-tick support for our enhanced stuff.
          FSComponent.render(
            <g>
              <line x1={xPos} y1={this.tickRise} x2={xPos} y2={this.tickFall} stroke="white" stroke-width="1px" shape-rendering="crispEdges" />
            </g>, this.tickRef.instance);
        }

        let gradLabel: string | undefined = undefined;

        // TODO Streamline this logic a little.
        if (this.props.graduationHasText) {
          gradLabel = `${this.props.graduationLength * i}`;
        }

        if (i == 0) {
          if (this.props.beginText !== undefined) {
            gradLabel = this.props.beginText;
          } else {
            gradLabel = `${this.gaugeMin}`;
          }
        } else if (i == graduations - 1) {
          if (this.props.endText !== undefined) {
            gradLabel = this.props.endText;
          } else {
            gradLabel = `${this.gaugeMax}`;
          }
        }

        if (gradLabel !== undefined) {
          FSComponent.render(
            <g>
              <text x={xPos} y={55} fill="white" text-anchor="middle" font-size='12'>{gradLabel}</text>
            </g>, this.labelRef.instance);
        }
      }
    }
  }

  /**
   * Render the bar.
   * @returns A VNode.
   */
  public render(): VNode {
    return <g class="graduatedBar">
      <g class="staticLineElements">

        <line x1={11} y1={this.tickRise - 5} x2={11} y2={this.tickFall} stroke="white" stroke-width="1.2px" />
        <line x1={11 + this.props.width} y1={this.tickRise - 5} x2={11 + this.props.width} y2={this.tickFall} stroke="white" stroke-width="1.2px" />
      </g>
      <g class="tickmarks" ref={this.tickRef} />
      <g class="ticklabels" ref={this.labelRef} />
    </g>;
  }
}

/** Properties for a pointer for a single-value gauge. */
interface SinglePointerProps {
  /** The width of the bar */
  width: number
  /** A subject for the value. */
  valueSubject: Subscribable<number>
}

/** A single-value pointer. */
class SinglePointer extends DisplayComponent<Partial<XMLHorizontalGaugeProps> & XMLHostedLogicGauge & SinglePointerProps> {
  private ptrDiv = FSComponent.createRef<HTMLDivElement>();
  private ptrPath = FSComponent.createRef<SVGPathElement>();
  private ptrLabel = FSComponent.createRef<SVGTextElement>();

  private minimum = 0;
  private maximum = 0;

  /** Initialize our dynamic elements and update logic. */
  public onAfterRender(): void {
    if (this.props.style !== undefined) {
      switch (this.props.style.pointerStyle) {
        case 'arrow':
          // TODO Adapt this better from the double sided gauge.
          this.ptrPath.instance.setAttribute('d', 'M 0 0 m 15 35 l 12 -15 l -24 0 z');
          break;
        case 'standard':
        default:
          this.ptrPath.instance.setAttribute('d', 'M 0 0 m 15 35 l 5 -5 l 0 -10 l -10 0 l 0 10 l 5 5 z');
          break;
      }
    }

    this.ptrLabel.instance.textContent = this.props.cursorText1 !== undefined ? this.props.cursorText1 : '';

    if (this.props.minimum !== undefined) {
      this.minimum = this.props.logicHost?.addLogicAsNumber(this.props.minimum, (min: number) => {
        this.minimum = min;
        this.updatePtr(this.props.valueSubject.get());
      }, 0);
    }

    if (this.props.maximum !== undefined) {
      this.maximum = this.props.logicHost?.addLogicAsNumber(this.props.maximum, (max: number) => {
        this.maximum = max;
        this.updatePtr(this.props.valueSubject.get());
      }, 0);
    }

    if (this.props.redBlink) {
      this.props.logicHost?.addLogicAsNumber(this.props.redBlink, (value: number) => {
        this.setAlertState(value);
      }, 0);
    }

    this.props.valueSubject.sub((value: number) => {
      this.updatePtr(value);
    });
  }

  /**
   * Update the value of the pointer.
   * @param value The new value to set.
   */
  private updatePtr(value: number): void {
    value = Utils.Clamp(value, this.minimum, this.maximum);
    const translation = (value - this.minimum) / (this.maximum - this.minimum) * this.props.width;
    this.ptrDiv.instance.style.transform = `translate3d(${translation}px, 0px, 0px)`;
  }

  /**
   * Handle changes in the alert state.
   * @param alerting True if alerting.
   */
  private setAlertState(alerting: number): void {
    if (alerting !== 0) {
      this.ptrPath.instance.setAttribute('fill', 'red');
    } else {
      this.ptrPath.instance.setAttribute('fill', 'white');
    }
  }

  /**
   * Render the pointer.
   * @returns A VNode
   */
  public render(): VNode {
    return (
      <div class="gauge_pointer" ref={this.ptrDiv}>
        <svg>
          <path d="" fill="white" stroke="black" stroke-width=".5px" ref={this.ptrPath} />
          <text x="12" y="30" class="gauge_pointer_text" ref={this.ptrLabel} />
        </svg>
      </div>);
  }
}

/** Properties for pointers for a two-value gauge. */
interface DoublePointerProps {
  /** The width of the bar */
  width: number
  /** An array of two subjects, one for each value. */
  valueSubjects: Array<Subscribable<number>>
}

/** A two-value pointer. */
class DoublePointer extends DisplayComponent<Partial<XMLDoubleHorizontalGaugeProps> & XMLHostedLogicGauge & DoublePointerProps> {
  private ptr1Div = FSComponent.createRef<HTMLDivElement>();
  private ptr2Div = FSComponent.createRef<HTMLDivElement>();
  private ptr1Path = FSComponent.createRef<SVGPathElement>();
  private ptr2Path = FSComponent.createRef<SVGPathElement>();
  private ptr1Label = FSComponent.createRef<SVGTextElement>();
  private ptr2Label = FSComponent.createRef<SVGTextElement>();

  private minimum = 0;
  private maximum = 0;
  private value1 = 0;
  private value2 = 0;

  /** Initialize our dynamic elements and update logic. */
  public onAfterRender(): void {
    if (this.props.style !== undefined) {
      switch (this.props.style.pointerStyle) {
        case 'arrow':
          this.ptr1Path.instance.setAttribute('d', 'M 0 0 m 15 35 l 12 -15 l -24 0 z');
          this.ptr2Path.instance.setAttribute('d', 'M 0 0 m 15 35 l 12 15 l -24 0 z');
          break;
        case 'standard':
        default:
          this.ptr1Path.instance.setAttribute('d', 'M 0 0 m 15 35 l 5 -5 l 0 -10 l -10 0 l 0 10 l 5 5 z');
          this.ptr2Path.instance.setAttribute('d', 'M 0 0 m 15 35 l 5 5 l 0 10 l -10 0 l 0 -10 l 5 -5 z');
          break;
      }
    }

    this.ptr1Label.instance.textContent = this.props.cursorText1 !== undefined ? this.props.cursorText1 : '';
    this.ptr2Label.instance.textContent = this.props.cursorText2 !== undefined ? this.props.cursorText2 : '';

    if (this.props.minimum !== undefined) {
      this.minimum = this.props.logicHost?.addLogicAsNumber(this.props.minimum, (min: number) => {
        this.minimum = min;
        this.updatePtr(this.ptr1Div, this.value1);
        this.updatePtr(this.ptr2Div, this.value2);
      }, 0);
    }

    if (this.props.maximum !== undefined) {
      this.maximum = this.props.logicHost?.addLogicAsNumber(this.props.maximum, (max: number) => {
        this.maximum = max;
        this.updatePtr(this.ptr1Div, this.value1);
        this.updatePtr(this.ptr2Div, this.value2);
      }, 0);
    }

    if (this.props.value1 !== undefined) {
      this.value1 = this.props.logicHost?.addLogicAsNumber(this.props.value1, (val: number) => {
        this.value1 = val;
        this.updatePtr(this.ptr1Div, this.value1);
      }, 2);
    }

    if (this.props.value2 !== undefined) {
      this.value2 = this.props.logicHost?.addLogicAsNumber(this.props.value2, (val: number) => {
        this.value2 = val;
        this.updatePtr(this.ptr2Div, this.value2);
      }, 2);
    }
  }

  /**
   * Update the value of a given pointer.
   * @param ptrRef A NodeReference to the pointer div.
   * @param value The new value to set.
   */
  private updatePtr(ptrRef: NodeReference<HTMLDivElement>, value: number): void {
    value = Utils.Clamp(value, this.minimum, this.maximum);
    const translation = (value - this.minimum) / (this.maximum - this.minimum) * this.props.width;
    ptrRef.instance.style.transform = `translate3d(${translation}px, 0px, 0px)`;
  }

  /**
   * Render the pointers.
   * @returns A VNode
   */
  public render(): VNode {
    return (
      <div class="gauge_pointers">
        <div class="gauge_pointer_top" ref={this.ptr1Div}>
          <svg>
            <path d="" fill="white" stroke="black" stroke-width=".5px" ref={this.ptr1Path} />
            <text x="12" y="30" class="gauge_pointer_text" ref={this.ptr1Label} />
          </svg>
        </div >
        <div class="gauge_pointer_bottom" ref={this.ptr2Div}>
          <svg>
            <path d="" fill="white" stroke="black" stroke-width=".5px" ref={this.ptr2Path} />
            <text x="12" y="48" class="gauge_pointer_text" ref={this.ptr2Label} />
          </svg>
        </div>
      </div>);
  }
}

/** Properties for a colored line element */
interface ColorLineProps {
  /** The geometry of the horizontal bar. */
  geometry: GaugeGeometry,
  /** The color of the line. */
  color: string,
  /** The length of the marker above the baseline, in pixels. */
  tickRise: number,
  /** The length of the marker below the baseline, in pixels. */
  tickFall: number,
  /** The width of the line, in pixels. */
  width: number,
  /** The logic controlling the position of the line. */
  position: CompositeLogicXMLElement,
  /** An optional smoothing factor for value changes. */
  smoothFactor?: number
}

/** A single, thick colored stroke at a specific value. */
class ColorLine extends DisplayComponent<ColorLineProps & XMLHostedLogicGauge> {
  private lineRef = FSComponent.createRef<SVGLineElement>();

  /** Set up position updates. */
  public onAfterRender(): void {
    if (this.props.position) {
      this.updatePosition(this.props.logicHost?.addLogicAsNumber(this.props.position, (pos: number) => {
        this.updatePosition(pos);
      }, 0, this.props.smoothFactor));
    }

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
    const translation = (((position - min) / (max - min)) * this.props.geometry.width);
    this.lineRef.instance.style.transform = `translate3d(${translation}px, 0px, 0px)`;
  }

  /**
   * Render the ColorLine.
   * @returns A VNode
   */
  public render(): VNode {
    return <line ref={this.lineRef}
      x1={this.props.geometry.startX} y1={this.props.geometry.startY + this.props.tickFall}
      x2={this.props.geometry.startX} y2={this.props.geometry.startY - this.props.tickRise}
      stroke={this.props.color} stroke-width={this.props.width} />;
  }
}

/** Properties for the gauge's title element. */
interface TitleProps {
  /** The width of the bar. */
  width: number,
  /** The subject to semaphore alerting. */
  alertSubject: Subscribable<boolean>
  /** Where to align the text, if present. */
  display: 'left' | 'center' | 'none'
}

/** The title of a gauge, with alerting functions. */
class TitleText extends DisplayComponent<(Partial<XMLHorizontalGaugeProps> | Partial<XMLDoubleHorizontalGaugeProps>) & TitleProps> {
  private titleRef = FSComponent.createRef<SVGTextElement>();
  private titleBgRef = FSComponent.createRef<SVGRectElement>();
  private display = true;

  /** Initialize the rendered text */
  public onAfterRender(): void {
    if (!this.display) {
      return;
    }

    if (this.props.title) {
      this.titleRef.instance.textContent = this.props.title;
    }

    if (this.props.unit) {
      this.titleRef.instance.textContent += ` ${this.props.unit}`;
    }

    this.props.alertSubject.sub(alerting => { this.setAlertState(alerting); });

    const bbox = this.titleRef.instance.getBBox();
    this.titleBgRef.instance.setAttribute('x', `${bbox.x - 1}`);
    this.titleBgRef.instance.setAttribute('y', `${bbox.y - 1}`);
    this.titleBgRef.instance.setAttribute('width', `${bbox.width + 2}`);
    this.titleBgRef.instance.setAttribute('height', `${bbox.height + 2}`);
  }

  /**
   * Handle changes in the alert state.
   * @param alerting True if alerting.
   */
  private setAlertState(alerting: boolean): void {
    // Short-circuit if we're not displaying.
    if (!this.display) {
      return;
    }

    if (alerting) {
      if (this.titleBgRef.instance.getBBox().x <= 0) {
        // Doing this again avoids potential timing issues with the initial render.
        const bbox = this.titleRef.instance.getBBox();
        this.titleBgRef.instance.setAttribute('x', `${bbox.x - 1}`);
        this.titleBgRef.instance.setAttribute('y', `${bbox.y - 1}`);
        this.titleBgRef.instance.setAttribute('width', `${bbox.width + 2}`);
        this.titleBgRef.instance.setAttribute('height', `${bbox.height + 2}`);
      }
      this.titleBgRef.instance.setAttribute('fill-opacity', '100');
      this.titleBgRef.instance.style.animation = 'AlertBlinkBackground 1s infinite';
      this.titleRef.instance.style.animation = 'AlertBlink 1s infinite';
    } else {
      this.titleBgRef.instance.setAttribute('fill-opacity', '0');
      this.titleBgRef.instance.style.animation = 'none';
      this.titleRef.instance.style.animation = 'none';
    }
  }

  /**
   * Render the text.
   * @returns A VNode
   */
  public render(): VNode {
    if (this.props.display == 'none') {
      this.display = false;
      return <Fragment />;
    }
    return <Fragment>
      <rect x={this.props.display == 'center' ? 74 : 11} y={15} width={0} height={0} fill-opacity={0} ref={this.titleBgRef} />
      <text x={this.props.display == 'center' ? 74 : 11} y={15} fill="white" text-anchor={this.props.display == 'center' ? 'middle' : 'start'} font-size="15" ref={this.titleRef} />
    </Fragment>;
  }
}


/** Properties controlling the text display of a single value. */
interface ValueTextProps {
  /** A semaphore for alert state. */
  alertSubject: Subscribable<boolean>;
  /** The current value. */
  valueSubject: Subscribable<number>;
  /** The color of the text to draw. */
  valueColorSubject: Subscribable<string>;
  /** The amount to increment the text by on each update. */
  textIncrement?: number;
  /** Dhe decimal precision of the value. */
  valuePrecision?: number;
  /** The alignment of the text, or undefined if no text needed. */
  alignment?: XMLHorizontalGaugeValuePos | XMLDoubleHorizontalGaugeValuePos
  /** For a double gauge, are we the upper or lower value? */
  doubleValue?: 'upper' | 'lower';
}

/** The logic for the textual display of a single value with control for increment, precision, and alerting. */
class ValueText extends DisplayComponent<ValueTextProps> {
  // These will never change, precalculate the value so we don't have to do it each time through.
  private quantum = this.props.textIncrement !== undefined ? this.props.textIncrement : 1;
  private precision = this.props.valuePrecision !== undefined ? this.props.valuePrecision : 0;

  private valueTextSubject = ComputedSubject.create(0, (v) => {
    return this.quantum !== 1 ? (Math.round(v / this.quantum) * this.quantum).toFixed(this.precision) : v.toFixed(this.precision);
  });
  private valueRef = FSComponent.createRef<SVGTextElement>();
  private valueBgRef = FSComponent.createRef<SVGRectElement>();
  private displayed = false;

  /** Set up updates. */
  public onAfterRender(): void {
    if (!this.displayed) {
      return;
    }

    this.props.valueSubject.sub((v) => this.updateValue(v));
    this.props.alertSubject.sub(alerting => { this.setAlertState(alerting); });

    const bbox = this.valueRef.instance.getBBox();
    this.valueBgRef.instance.setAttribute('x', `${bbox.x - 1}`);
    this.valueBgRef.instance.setAttribute('y', `${bbox.y - 1}`);
    this.valueBgRef.instance.setAttribute('width', `${bbox.width + 2}`);
    this.valueBgRef.instance.setAttribute('height', `${bbox.height + 2}`);
  }

  /**
   * Handle changes in the alert state.
   * @param alerting True if alerting.
   */
  private setAlertState(alerting: boolean): void {
    if (alerting) {
      if (this.valueBgRef.instance.getBBox().x <= 0) {
        const bbox = this.valueRef.instance.getBBox();
        this.valueBgRef.instance.setAttribute('x', `${bbox.x - 1}`);
        this.valueBgRef.instance.setAttribute('y', `${bbox.y - 1}`);
        this.valueBgRef.instance.setAttribute('width', `${bbox.width + 2}`);
        this.valueBgRef.instance.setAttribute('height', `${bbox.height + 2}`);
      }
      this.valueBgRef.instance.setAttribute('fill-opacity', '100');
      this.valueBgRef.instance.style.animation = 'AlertBlinkBackground 1s infinite';
      this.valueRef.instance.style.animation = 'AlertBlink 1s infinite';
    } else {
      this.valueBgRef.instance.setAttribute('fill-opacity', '0');
      this.valueBgRef.instance.style.animation = 'none';
      this.valueRef.instance.style.animation = 'none';
    }
  }

  /**
   * Update the value.
   * @param value The new value.
   */
  private updateValue(value: number): void {
    this.valueTextSubject.set(value);

    // Update the bounding box of the background to fit the text as its dimensions change.
    const bbox = this.valueRef.instance.getBBox();
    this.valueBgRef.instance.setAttribute('x', `${bbox.x - 1}`);
    this.valueBgRef.instance.setAttribute('width', `${bbox.width + 2}`);
  }

  /**
   * Render the gauge.
   * @returns a vnode
   */
  public render(): VNode {
    // If we don't have an alignment value, we don't need to display at all.
    if (!this.props.alignment) {
      return <Fragment />;
    }

    let yPos: number;
    if (this.props.doubleValue !== undefined) {
      yPos = this.props.doubleValue == 'upper' ? 30 : 48;
    } else {
      yPos = this.props.alignment == XMLHorizontalGaugeValuePos.End ? 15 : 33;
    }

    this.displayed = true;
    return <Fragment>
      <rect x={134} y={yPos} width={0} height={0} fill-opacity={0} ref={this.valueBgRef} />
      <text x={134} y={yPos} fill={this.props.valueColorSubject} text-anchor="end" font-size="15" ref={this.valueRef}>{this.valueTextSubject}</text>
    </Fragment>;
  }
}

/** Properties for the display of the value text for a single-value gauge. */
interface SingleValueProps {
  /** The width of the bar. */
  width: number,
  /** The subject to semaphore alerting. */
  alertSubject: Subscribable<boolean>
  /** The current value. */
  valueSubject: Subscribable<number>
  /** The alignment. */
  alignment?: XMLHorizontalGaugeValuePos | XMLDoubleHorizontalGaugeValuePos
}

/** Controller for the display of the text value for a single-value gauge. */
class SingleValueText extends DisplayComponent<(Partial<XMLHorizontalGaugeProps> | Partial<XMLDoubleHorizontalGaugeProps>) & SingleValueProps> {
  private valueTextSubject = ComputedSubject.create(0, (v) => v.toFixed(0));
  private valueColorSubject = Subject.create('white');

  /** Set up updates */
  public onAfterRender(): void {
    this.props.valueSubject.sub((v) => {
      this.valueTextSubject.set(v);
      // TODO Additional support for ForceTextColor like the dial gauge has?
      if (this.props.colorZones) {
        let colorSet = false;
        for (const range of this.props.colorZones) {
          if (v >= range.begin.getValueAsNumber() && v <= range.end.getValueAsNumber()) {
            this.valueColorSubject.set(range.color);
            colorSet = true;
            break;
          }
        }
        if (!colorSet) {
          this.valueColorSubject.set('white');
        }
      }
    });
  }

  /**
   * Render the text.
   * @returns A VNode
   */
  public render(): VNode {
    return <ValueText alertSubject={this.props.alertSubject}
      valueSubject={this.props.valueSubject}
      valueColorSubject={this.valueColorSubject}
      alignment={this.props.alignment}
      textIncrement={this.props.style?.textIncrement}
      valuePrecision={this.props.style?.valuePrecision} />;
  }
}

/** Properties for the display of the value text for a two-value gauge. */
interface DoubleValueProps {
  /** The width of the bar. */
  width: number,
  /** The subject to semaphore alerting. */
  alertSubject: Subscribable<boolean>
  /** An array of two subjects, one for each value. */
  valueSubjects: Array<Subscribable<number>>
  /** The alignment of the text, undefined if we do not want text display. */
  alignment?: XMLHorizontalGaugeValuePos | XMLDoubleHorizontalGaugeValuePos
}

/** Controller for the display of the text values for a two-value gauge. */
class DoubleValueText extends DisplayComponent<(Partial<XMLHorizontalGaugeProps> | Partial<XMLDoubleHorizontalGaugeProps>) & DoubleValueProps> {
  private valueColorSubjects = [Subject.create('white'), Subject.create('white')];

  /** Set up updates. */
  public onAfterRender(): void {
    this.props.valueSubjects[0].sub((v) => this.updateValue(v, 0));
    this.props.valueSubjects[1].sub((v) => this.updateValue(v, 1));
  }

  /**
   * Update the text when a given value changes.
   * @param value The new value.
   * @param index The index of the value updating.
   */
  private updateValue(value: number, index: number): void {
    // TODO Additional support for ForceTextColor like the dial gauge has?
    if (this.props.colorZones) {
      let colorSet = false;
      for (const range of this.props.colorZones) {
        if (value >= range.begin.getValueAsNumber() && value <= range.end.getValueAsNumber()) {
          this.valueColorSubjects[index].set(range.color);
          colorSet = true;
          break;
        }
      }
      if (!colorSet) {
        this.valueColorSubjects[index].set('white');
      }
    }
  }

  /**
   * Render the text.
   * @returns A VNode
   */
  public render(): VNode {
    return <Fragment>
      <ValueText alertSubject={this.props.alertSubject}
        valueSubject={this.props.valueSubjects[0]}
        valueColorSubject={this.valueColorSubjects[0]}
        alignment={this.props.alignment}
        doubleValue='upper' />
      <ValueText alertSubject={this.props.alertSubject}
        valueSubject={this.props.valueSubjects[1]}
        valueColorSubject={this.valueColorSubjects[1]}
        alignment={this.props.alignment}
        doubleValue='lower' />
    </Fragment>;
  }
}

/** A horizontal bar gauge for displaying a single value. */
export class XMLHorizontalGauge extends BaseGauge<Partial<XMLHorizontalGaugeProps> & XMLHostedLogicGauge> {
  private svgRef = FSComponent.createRef<SVGElement>();

  private zoneGroupRef = FSComponent.createRef<SVGGElement>();
  private lineGroupRef = FSComponent.createRef<SVGGElement>();

  private minValue = Subject.create(0);
  private maxValue = Subject.create(0);
  private geometry: GaugeGeometry;

  private alertSubject = Subject.create(false);
  private valueSubject = Subject.create(0);

  /**
   * Create a horizontal gauge.
   * @param props The properties for the gauge.
   */
  constructor(props: Partial<XMLHorizontalGaugeProps> & XMLHostedLogicGauge) {
    super(props);
    this.geometry = {
      startX: 11,
      startY: 35,
      width: this.props.style?.valuePos == XMLHorizontalGaugeValuePos.Right ? 90 : 123,
      minValue: this.minValue,
      maxValue: this.maxValue
    };
  }

  /**
   * Initialize the rendered gauge.
   */
  protected initGauge(): void {
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
      this.valueSubject.set(this.props.logicHost?.addLogicAsNumber(this.props.value1, (val: number) => {
        this.valueSubject.set(val);
      }, 2));
    }

    if (this.props.colorZones) {
      for (let i = 0; i < this.props.colorZones.length; i++) {
        FSComponent.render(
          <ColorZone logicHost={this.props.logicHost} height={6} yPos={27}
            values={this.props.colorZones[i]} gaugeMin={this.props.minimum} gaugeMax={this.props.maximum} geometry={this.geometry} />,
          this.zoneGroupRef.instance);
      }
    }

    if (this.props.colorLines) {
      for (let i = 0; i < this.props.colorLines.length; i++) {
        FSComponent.render(
          <ColorLine logicHost={this.props.logicHost}
            geometry={this.geometry}
            color={this.props.colorLines[i].color}
            tickRise={15} tickFall={0} width={2}
            position={this.props.colorLines[i].position}
            smoothFactor={this.props.colorLines[i].smoothFactor} />,
          this.lineGroupRef.instance);
      }
    }

    if (this.props.redBlink) {
      this.props.logicHost?.addLogicAsNumber(this.props.redBlink, (value: number) => {
        this.alertSubject.set(value ? true : false);
      }, 0);
    }
  }

  /**
   * Render a horizontal bar gauge
   * @returns A VNode
   */
  protected renderGauge(): VNode {
    let display: 'left' | 'none' | 'center';
    switch (this.props.style?.valuePos) {
      case XMLHorizontalGaugeValuePos.End:
        display = 'left'; break;
      case XMLHorizontalGaugeValuePos.Right:
        display = 'none'; break;
      default:
        display = 'center';
    }

    return (
      <div class="single_horiz_container">
        <svg viewBox="0 0 142 40" ref={this.svgRef}>
          <TitleText {... this.props} width={this.geometry.width} alertSubject={this.alertSubject} display={display} />
          <SingleValueText {... this.props} width={this.geometry.width} alertSubject={this.alertSubject} valueSubject={this.valueSubject} alignment={this.props.style?.valuePos} />
          <g class="gaugeAxis">
            <line x1={11} y1={35} x2={11 + this.geometry.width} y2={35} stroke="white" stroke-width="1.2px" />
            <line x1={11} y1={34} x2={11 + this.geometry.width} y2={34} stroke="darkgrey" stroke-width=".5px" />
          </g>
          <g class="colorZones" ref={this.zoneGroupRef} />
          <g class="colorLines" ref={this.lineGroupRef} />
          <GraduatedBar {...this.props} tickRise={11} tickFall={0} width={this.geometry.width} />

        </svg>
        <SinglePointer {...this.props} valueSubject={this.valueSubject} width={this.geometry.width} />
      </div>
    );
  }
}


/** A horizontal bar gauge for displaying two distinct values. */
export class XMLDoubleHorizontalGauge extends BaseGauge<Partial<XMLDoubleHorizontalGaugeProps> & XMLHostedLogicGauge> {
  private svgRef = FSComponent.createRef<SVGElement>();
  private zoneGroupRef = FSComponent.createRef<SVGGElement>();
  private lineGroupRef = FSComponent.createRef<SVGGElement>();
  private minValue = Subject.create(0);
  private maxValue = Subject.create(0);
  private geometry: GaugeGeometry;

  // Currently, alerting isn't supported for double gauges, just as in stock.   Supporting it
  // correctly will require adding support for not just RedBlinkd, but also a new RedBlink2.
  // At that point, we'll probably want to have an array of alert subjects, too.  For now,
  // we'll just pass in one that is statically false to satisfy the interface.
  private alertSubject = Subject.create(false);
  private valueSubjects = [Subject.create(0), Subject.create(0)];

  /**
   * Create a horizontal gauge.
   * @param props The properties for the gauge.
   */
  constructor(props: Partial<XMLDoubleHorizontalGaugeProps> & XMLHostedLogicGauge) {
    super(props);
    this.geometry = {
      startX: 11,
      startY: 35,
      width: this.props.style?.valuePos == XMLDoubleHorizontalGaugeValuePos.Right ? 90 : 123,
      minValue: this.minValue,
      maxValue: this.maxValue
    };
  }

  /**
   * Initialize the rendered gauge.
   */
  protected initGauge(): void {
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
      this.valueSubjects[0].set(this.props.logicHost?.addLogicAsNumber(this.props.value1, (val: number) => {
        this.valueSubjects[0].set(val);
      }, 2));
    }

    if (this.props.value2 !== undefined) {
      this.valueSubjects[1].set(this.props.logicHost?.addLogicAsNumber(this.props.value2, (val: number) => {
        this.valueSubjects[1].set(val);
      }, 2));
    }

    if (this.props.colorZones) {
      for (let i = 0; i < this.props.colorZones.length; i++) {
        FSComponent.render(
          <ColorZone logicHost={this.props.logicHost} height={6} yPos={32}
            values={this.props.colorZones[i]} gaugeMin={this.props.minimum} gaugeMax={this.props.maximum} geometry={this.geometry} />,
          this.zoneGroupRef.instance);
      }
    }

    if (this.props.colorLines) {
      for (let i = 0; i < this.props.colorLines.length; i++) {
        FSComponent.render(
          <ColorLine logicHost={this.props.logicHost}
            geometry={this.geometry}
            color={this.props.colorLines[i].color}
            tickRise={10} tickFall={10} width={2}
            position={this.props.colorLines[i].position}
            smoothFactor={this.props.colorLines[i].smoothFactor} />,
          this.lineGroupRef.instance);
      }
    }
  }

  /**
   * Render a horizontal bar gauge
   * @returns A VNode
   */
  protected renderGauge(): VNode {
    let display: 'none' | 'center';
    switch (this.props.style?.valuePos) {
      case XMLDoubleHorizontalGaugeValuePos.Right:
        display = 'none'; break;
      default:
        display = 'center';
    }
    return (
      <div class="double_horiz_container">
        <svg viewBox="0 0 142 55" ref={this.svgRef}>
          <TitleText {... this.props} width={this.geometry.width} alertSubject={this.alertSubject} display={display} />
          <DoubleValueText {... this.props} width={this.geometry.width} alertSubject={this.alertSubject}
            valueSubjects={this.valueSubjects} alignment={this.props.style?.valuePos} />
          <g class="gaugeAxis">
            <line x1={11} y1={35} x2={11 + this.geometry.width} y2={35} stroke="white" stroke-width="1.2px" />
            <line x1={11} y1={34} x2={11 + this.geometry.width} y2={34} stroke="darkgrey" stroke-width=".5px" />
          </g>
          <g class="colorZones" ref={this.zoneGroupRef} />
          <g class="colorLines" ref={this.lineGroupRef} />
          <GraduatedBar {...this.props} tickRise={6.5} tickFall={6.5} width={this.geometry.width} />

        </svg>
        <DoublePointer {...this.props} valueSubjects={this.valueSubjects} width={this.geometry.width} />
      </div>
    );
  }
}