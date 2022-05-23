import { FSComponent, DisplayComponent, VNode, NodeReference, Subject, Fragment } from 'msfssdk';
import { XMLCircularGaugeCursor, XMLCircularGaugeProps, XMLCircularGaugeValuePos, XMLGaugeColorLine, XMLGaugeColorZone, XMLHostedLogicGauge, XMLGaugeReferenceBug } from 'msfssdk/components/XMLGauges';
import { BaseGauge } from './BaseGauge';


import './Gauge.css';

/**
 * The minimum and maximum values of an arc.  This is the same as the XMLGaugeColorZone
 * interface, except with the logic elements coalesced into numbers so that the paths
 * can be redrawn using the data in them.
 */
type PathValues = {
  /** The mininum value. */
  min: number,
  /** The maximum value. */
  max: number,
  /** The color of the path. */
  color: string
}

/** A cartesian coordinate pair. */
type Cartesian = {
  /** X, indexed from top left. */
  x: number,
  /** Y, indexed from top left. */
  y: number
}

/** The geometry specification for a dial gauge's arc */
type ArcGeometry = {
  /** The origin point for the arcs. */
  origin: Cartesian,
  /** The radius of the color band arcs. */
  radius: number,
  /** The beginning angle. */
  beginAngle: number,
  /** The ending angle */
  endAngle: number
  /** The minimum value */
  minValue: Subject<number>,
  /** The maximum value */
  maxValue: Subject<number>
}

/** Extended guage properties. */
interface ColorZoneProps {
  /** The geometry of the gauge. */
  geometry: ArcGeometry,
  /** The stroke width in pixels */
  stroke: number,
  /** The color zone configuration. */
  colorZones?: Array<XMLGaugeColorZone>
}

/**
 * A class that manages the logic for drawing the colored arcs on a dial gauge.
 * TODO Futher componentize this as has been done for the ColorLines.
 */
class ColorZones extends DisplayComponent<ColorZoneProps & XMLHostedLogicGauge> {
  private pathRefs = new Array<NodeReference<SVGPathElement>>();
  private groupRef = FSComponent.createRef<SVGGElement>();
  private pathValues = new Array<PathValues>();

  private arcDegrees = this.props.geometry.endAngle - this.props.geometry.beginAngle;

  private minValue = 0;
  private maxValue = 0;

  /** Set initial values then define and draw our color zones. */
  public onAfterRender(): void {
    this.props.geometry.minValue.sub(n => this.updateMinValue(n), true);
    this.props.geometry.maxValue.sub(n => this.updateMaxValue(n), true);

    if (this.props.colorZones) {
      for (let i = 0; i < this.props.colorZones.length; i++) {
        const zone = this.props.colorZones[i];
        const path = FSComponent.createRef<SVGPathElement>();
        FSComponent.render(<Fragment><path ref={path} /></Fragment>, this.groupRef.instance);
        this.pathRefs[i] = path;
        this.pathValues[i] = { min: 0, max: 0, color: zone.color !== undefined ? zone.color : 'white' };

        if (zone.begin !== undefined) {
          this.pathValues[i].min = this.props.logicHost?.addLogicAsNumber(zone.begin, (begin: number) => {
            this.pathValues[i].min = begin;
            this.redrawArcs();
          }, 1, zone.smoothFactor);
        }
        if (zone.end !== undefined) {
          this.pathValues[i].max = this.props.logicHost?.addLogicAsNumber(zone.end, (end: number) => {
            this.pathValues[i].max = end;
            this.redrawArcs();
          }, 1, zone.smoothFactor);
        }
      }
      this.redrawArcs();
    }
  }

  /** Draw all the arc in our color zones. */
  private redrawArcs(): void {
    for (let i = 0; i < this.pathRefs.length; i++) {
      this.pathRefs[i].instance.setAttribute('stroke', this.pathValues[i].color);
      this.pathRefs[i].instance.setAttribute('stroke-width', `${this.props.stroke}px`);
      const startAngle = this.props.geometry.beginAngle +
        (((this.pathValues[i].min - this.minValue) / (this.maxValue - this.minValue)) * this.arcDegrees);
      const endAngle = this.props.geometry.beginAngle +
        (((this.pathValues[i].max - this.minValue) / (this.maxValue - this.minValue)) * this.arcDegrees);
      this.pathRefs[i].instance.setAttribute('d',
        XMLCircleGauge.describeArc(this.props.geometry.origin, this.props.geometry.radius - this.props.stroke, startAngle, endAngle));
    }
  }

  /**
   * Update the maximum value.
   * @param max The new max value.
   */
  public updateMaxValue(max: number): void {
    this.maxValue = max;
    this.redrawArcs();
  }

  /**
   * Update the minimum value.
   * @param min The new min value.
   */
  public updateMinValue(min: number): void {
    this.minValue = min;
    this.redrawArcs();
  }

  /**
   * Render the gauge.
   * @returns A VNode
   */
  public render(): VNode {
    return (<g class='color-zones' ref={this.groupRef} />);
  }
}

/** Properties for a color line component.  */
interface ColorLineProps extends Partial<XMLCircularGaugeProps> {
  /** The geometry of the gauge. */
  geometry: ArcGeometry,
  /** The color of the line. */
  color: string,
  /** Length of the line, in pixels. */
  length: number,
  /** Width of the line, in pixels. */
  width: number
  /** The position of the line. */
  position: CompositeLogicXMLElement
  /** An optional smoothing factor. */
  smoothFactor?: number
}

/** A single color line. */
class ColorLine extends DisplayComponent<ColorLineProps & XMLHostedLogicGauge> {
  private lineRef = FSComponent.createRef<SVGLineElement>();
  private arcDegrees = this.props.geometry.endAngle - this.props.geometry.beginAngle;

  /** Set up position updates. */
  public onAfterRender(): void {
    if (this.props.position) {
      this.props.logicHost?.addLogicAsNumber(this.props.position, (position: number) => {
        this.updatePosition(position);
      }, 0, this.props.smoothFactor);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.props.geometry.maxValue.sub(n => this.updatePosition(this.props.position.getValueAsNumber()), true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.props.geometry.maxValue.sub(n => this.updatePosition(this.props.position.getValueAsNumber()), true);
  }

  /**
   * Update the position of the line.
   * @param position The new position.
   */
  private updatePosition(position: number): void {
    const rotation = this.props.geometry.beginAngle + ((position / (this.props.geometry.maxValue.get() - this.props.geometry.minValue.get())) * this.arcDegrees);
    this.lineRef.instance.style.transform = `rotate3d(0, 0, 1, ${rotation}deg)`;
  }

  /**
   * Render a color line.
   * @returns A VNode
   */
  public render(): VNode {
    return (<Fragment><line ref={this.lineRef}
      x1={this.props.geometry.origin.x} y1={this.props.geometry.origin.y - this.props.geometry.radius}
      x2={this.props.geometry.origin.x} y2={this.props.geometry.origin.y - this.props.geometry.radius + this.props.length}
      stroke={this.props.color} stroke-width={this.props.width}
      style={`transform-origin: ${this.props.geometry.origin.x}px ${this.props.geometry.origin.y}px`} /></Fragment>);
  }
}

/** props for the color line set */
interface ColorLineSetProps extends Partial<XMLCircularGaugeProps> {
  /** The geometry of the gauge. */
  geometry: ArcGeometry,
  /** The color lines. */
  colorLines?: Array<XMLGaugeColorLine>
}

/** Color lines on a cicular gauge. */
class ColorLines extends DisplayComponent<ColorLineSetProps & XMLHostedLogicGauge> {
  private groupRef = FSComponent.createRef<SVGGElement>();

  /** Initialize our lines after rendering. */
  public onAfterRender(): void {
    if (this.props.colorLines) {
      for (let i = 0; i < this.props.colorLines.length; i++) {
        FSComponent.render(
          <ColorLine logicHost={this.props.logicHost}
            geometry={this.props.geometry}
            color={this.props.colorLines[i].color}
            position={this.props.colorLines[i].position}
            smoothFactor={this.props.colorLines[i].smoothFactor}
            length={15} width={2} />, this.groupRef.instance);
      }
    }
  }

  /**
   * Render the color line(s).
   * @returns A VNode
   */
  public render(): VNode {
    return (<g class='color-lines' ref={this.groupRef} />);
  }
}

/** Properties for a set of reference bugs. */
interface ReferenceBugSetProps {
  /** The geometry of the gauge. */
  geometry: ArcGeometry,
  /** The reference bugs to draw. */
  referenceBugs?: Array<XMLGaugeReferenceBug>
}

/** A component for managing reference bugs. */
class ReferenceBugs extends DisplayComponent<ReferenceBugSetProps & XMLHostedLogicGauge> {
  private groupRef = FSComponent.createRef<SVGGElement>();

  /** Draw and start the bugs after the initial render. */
  public onAfterRender(): void {
    if (this.props.referenceBugs) {
      for (let i = 0; i < this.props.referenceBugs.length; i++) {
        FSComponent.render(
          <ReferenceBug logicHost={this.props.logicHost} geometry={this.props.geometry}
            config={this.props.referenceBugs[i]} />, this.groupRef.instance);
      }
    }
  }

  /**
   * Render the reference bugs.
   * @returns A VNode
   */
  public render(): VNode {
    return (<div class='reference-bugs' ref={this.groupRef} />);
  }
}


/** Props defining a single reference bug. */
interface ReferenceBugProps {
  /** The geometry of the gauge. */
  geometry: ArcGeometry,
  /** The reference bugs to draw. */
  config: XMLGaugeReferenceBug
}

/** A reference bug itself. */
class ReferenceBug extends DisplayComponent<ReferenceBugProps & XMLHostedLogicGauge> {
  private theDiv = FSComponent.createRef<HTMLDivElement>();

  /** Set up the bug's position and display handlers. */
  public onAfterRender(): void {
    if (this.props.config.position) {
      this.updatePosition(
        this.props.logicHost?.addLogicAsNumber(this.props.config.position, (position: number) => {
          this.updatePosition(position);
        }, 0, this.props.config.smoothFactor)
      );
    }

    if (this.props.config.displayLogic) {
      this.updateDisplay(
        this.props.logicHost?.addLogicAsNumber(this.props.config.displayLogic, (display: number) => {
          this.updateDisplay(display);
        }, 0)
      );
    } else {
      this.updateDisplay(1);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.props.geometry.minValue.sub(n => this.updatePosition(this.props.config.position.getValueAsNumber()), true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.props.geometry.maxValue.sub(n => this.updatePosition(this.props.config.position.getValueAsNumber()), true);
  }

  /**
   * Update the position of the bug when the value changes.
   * @param position The numeric value of the position to set.
   */
  private updatePosition(position: number): void {
    const rotation = this.props.geometry.beginAngle + (
      (position / (this.props.geometry.maxValue.get() - this.props.geometry.minValue.get())) *
      (this.props.geometry.endAngle - this.props.geometry.beginAngle));
    this.theDiv.instance.style.transform = `rotate3d(0, 0, 1, ${rotation}deg)`;
  }

  /**
   * Update the display of the bug when the display logic changes.
   * @param display 0 to hide, >0 to show.
   */
  private updateDisplay(display: number): void {
    if (display > 0) {
      this.theDiv.instance.style.display = 'block';
    } else {
      this.theDiv.instance.style.display = 'none';
    }
  }

  /**
   * Render the bug.
   * @returns A VNode
   */
  public render(): VNode {
    let fillColor = 'white';
    if (this.props.config.style?.color !== undefined) {
      fillColor = this.props.config.style.color;
    }
    return (
      <div class='reference-bug' ref={this.theDiv}>
        <svg>
          <path d='M 70 28 m 11 -16 l -22 0 l 0 7 l 6 0 l 5 -4 l 5 4 l 6 0 z' fill={fillColor} />
        </svg>
      </div>
    );
  }
}



/** A new circular gauge */
export class XMLCircleGauge extends BaseGauge<Partial<XMLCircularGaugeProps> & XMLHostedLogicGauge> {
  private readonly origin: Cartesian = { x: 70, y: 70 };
  private readonly arcRadius = 65.5;
  private readonly bandRadius = 60.5;

  private geometry: ArcGeometry;

  private titleRef = FSComponent.createRef<HTMLDivElement>();
  private unitsRef = FSComponent.createRef<HTMLDivElement>();
  private valueRef = FSComponent.createRef<HTMLDivElement>();
  private startRef = FSComponent.createRef<HTMLDivElement>();
  private endRef = FSComponent.createRef<HTMLDivElement>();
  private arcRef = FSComponent.createRef<SVGPathElement>();
  private ticksRef = FSComponent.createRef<SVGGElement>();
  private svgRef = FSComponent.createRef<SVGElement>();
  private needleRef = FSComponent.createRef<SVGElement>();
  private containerDiv = FSComponent.createRef<HTMLDivElement>();

  private maxValue = Subject.create(0);
  private minValue = Subject.create(0);

  private beginAngle = this.props.style?.beginAngle !== undefined ? this.props.style.beginAngle - 90 : -105;
  private endAngle = this.props.style?.endAngle !== undefined ? this.props.style.endAngle - 90 : 105;
  private arcDegrees = this.endAngle - this.beginAngle;
  private quantum = this.props.style?.textIncrement !== undefined ? this.props.style?.textIncrement : 1;
  private precision = this.quantum < 1 ? this.quantum.toString().split('.')[1].length : 0;

  /**
   * Create an XMLCircleGaugue.
   * @param props The properties for the gauge.
   */
  constructor(props: Partial<XMLCircularGaugeProps> & XMLHostedLogicGauge) {
    super(props);
    this.geometry = {
      origin: this.origin,
      radius: this.arcRadius,
      beginAngle: this.beginAngle,
      endAngle: this.endAngle,
      minValue: this.minValue,
      maxValue: this.maxValue
    };
  }

  /** Draw our ticks. */
  private drawTicks(): void {
    const ticks = new Array<number>();
    ticks.push(this.beginAngle);
    if (this.props.graduationLength !== undefined) {
      const graduations = Math.trunc((this.maxValue.get() - this.minValue.get()) / this.props.graduationLength);
      if (graduations > 1) {
        const spacing = this.arcDegrees / graduations;
        for (let i = 1; i < graduations; i++) {
          ticks.push(this.beginAngle + spacing * i);
        }
      }
    }
    ticks.push(this.endAngle);

    for (let i = 0; i < ticks.length; i++) {
      const pointA = XMLCircleGauge.polarToCartesian(this.origin, this.arcRadius - 11, ticks[i]);
      const pointB = XMLCircleGauge.polarToCartesian(this.origin, this.arcRadius, ticks[i]);
      FSComponent.render(<Fragment>
        <line x1={pointA.x} y1={pointA.y} x2={pointB.x} y2={pointB.y} stroke="white" stroke-width="1px" shape-rendering="crispEdges" />
      </Fragment>
        , this.ticksRef.instance);
    }
  }

  /**
   * Initialize the rendered gauge.
   */
  protected initGauge(): void {
    if (this.props.value1) {
      this.updateValue(this.props.logicHost?.addLogicAsNumber(
        this.props.value1, (value: number) => { this.updateValue(value); }, 2));
      if (this.props.maximum) {
        this.updateMaxValue(this.props.logicHost?.addLogicAsNumber(
          this.props.maximum, (max: number) => { this.updateMaxValue(max); }, 0));
      }
      if (this.props.minimum) {
        this.updateMinValue(this.props.logicHost?.addLogicAsNumber(
          this.props.minimum, (min: number) => { this.updateMinValue(min); }, 0));
      }
      if (this.props.redBlink) {
        this.props.logicHost?.addLogicAsNumber(this.props.redBlink, (value: number) => {
          this.setAlertState(value);
        }, 0);
      }
    }

    if (this.props.beginText !== undefined) {
      this.startRef.instance.textContent = this.props.beginText;
    }

    if (this.props.endText !== undefined) {
      this.endRef.instance.textContent = this.props.endText;
    }

    // TODO RCJ make the rest of this function less ugly
    if (this.props.style?.valuePos == XMLCircularGaugeValuePos.End) {
      this.valueRef.instance.classList.add('ValPosEnd');

      // TODO Improve the logic for positioning the value laterally when it's at the end position.
      const endanchor = XMLCircleGauge.polarToCartesian(this.origin, this.arcRadius + 10, this.endAngle + 10);
      this.valueRef.instance.style.right = `${148 - endanchor.x}px`;

      const endPxBelowLine = XMLCircleGauge.distanceFromYOrigin(this.origin, this.arcRadius, this.endAngle);
      this.valueRef.instance.style.top = `${65 - endPxBelowLine + 10}px`;
    } else {
      this.valueRef.instance.style.top = '0px';
    }

    if (this.props.style?.forceTextColor) {
      this.valueRef.instance.style.color = this.props.style.forceTextColor;
    }

    const textBottom = parseFloat(this.valueRef.instance.style.top) + this.valueRef.instance.offsetHeight;
    this.arcRef.instance.setAttribute('d', XMLCircleGauge.describeArc(this.origin, this.arcRadius, this.beginAngle, this.endAngle));
    const pxBelowLine = Math.max(0, -1 * XMLCircleGauge.heightOfArc(this.origin, this.arcRadius, this.beginAngle, this.endAngle));
    if (this.props.style?.valuePos == XMLCircularGaugeValuePos.End) {
      // Add a little more to account for stroke width and not cut off the bottom.
      this.svgRef.instance.setAttribute('viewBox', `0 0 148 ${Math.max(this.arcRadius + pxBelowLine + 5, textBottom)}`);
    } else {
      this.svgRef.instance.setAttribute('viewBox', `0 0 148 ${this.arcRadius + pxBelowLine}`);

    }

    this.drawTicks();
  }

  /**
   * Update the value.
   * @param value The new value to set.
   */
  public updateValue(value: number): void {
    let textValue: string;
    Utils.Clamp(value, this.minValue.get(), this.maxValue.get());
    const rotation = this.beginAngle + ((value / this.maxValue.get()) * this.arcDegrees);
    if (this.needleRef.getOrDefault() && this.valueRef.getOrDefault()) {
      this.needleRef.instance.style.transform = `rotate3d(0, 0, 1, ${rotation}deg)`;

      value = Math.round(value / this.quantum) * this.quantum;
      if (this.precision) {
        textValue = value.toFixed(this.precision);
      } else {
        // don't spend time on toFixed if a precision isn't required.
        // Unless there's a decimal quantum set, the number will be whole, anyway.
        textValue = value + '';
      }
      if (this.valueRef.instance.textContent !== `${textValue}`) {
        this.valueRef.instance.textContent = `${textValue}`;
      }
    }

    if (!this.props.style?.forceTextColor && this.props.colorZones) {
      let colorSet = false;
      for (const range of this.props.colorZones) {
        if (value >= range.begin.getValueAsNumber() && value <= range.end.getValueAsNumber()) {
          this.valueRef.instance.style.color = range.color;
          colorSet = true;
          break;
        }
      }
      if (!colorSet) {
        this.valueRef.instance.style.color = 'white';
      }
    }
  }

  /**
   * Update the maximum value.
   * @param max The new max value.
   */
  public updateMaxValue(max: number): void {
    this.maxValue.set(max);
    if (this.props.endText == undefined) {
      this.endRef.instance.textContent = `${max}`;
    }
  }

  /**
   * Update the minimum value.
   * @param min The new min value.
   */
  public updateMinValue(min: number): void {
    if (this.props.beginText == undefined) {
      this.startRef.instance.textContent = `${min}`;
    }
    this.minValue.set(min);
  }

  /**
   * Handle changes in the alert state.
   * @param alerting True if alerting.
   */
  private setAlertState(alerting: number): void {
    if (alerting !== 0) {
      this.titleRef.instance.style.animation = 'AlertBlink 1s infinite';
      this.unitsRef.instance.style.animation = 'AlertBlink 1s infinite';
      this.valueRef.instance.style.animation = 'AlertBlink 1s infinite';
    } else {
      this.titleRef.instance.style.animation = '';
      this.unitsRef.instance.style.animation = '';
      this.valueRef.instance.style.animation = '';
    }
  }

  /**
   * Given a cartesian origin and a set of polar coordinates, find the cartesian
   * point that represents the polar location in the cartesian grid.
   * @param center The cartesian center.
   * @param radius The radiun in pixels.
   * @param azimuth The angle coordinate in degrees.
   * @returns The cartesian point represented by the polar one.
   */
  // TODO See if there's common math for this.
  public static polarToCartesian(center: Cartesian, radius: number, azimuth: number): Cartesian {
    const azimuthRad = (azimuth - 90) * Math.PI / 180.0;
    return {
      x: center.x + (radius * Math.cos(azimuthRad)),
      y: center.y + (radius * Math.sin(azimuthRad))
    };
  }


  /**
   * Construct an SVG path string for a given arc based on its coordinates and radius.
     @param center The cartesian center of the arc.
   * @param radius The radius in pixels.
   * @param startAngle The starting azimuth of the arc in degrees.
   * @param endAngle The final azimuth of the arc in degrees.
   * @returns A string describing an SVG path.
   */
  public static describeArc(center: Cartesian, radius: number, startAngle: number, endAngle: number): string {
    const start = XMLCircleGauge.polarToCartesian(center, radius, startAngle);
    const end = XMLCircleGauge.polarToCartesian(center, radius, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    const d = [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y
    ].join(' ');

    return d;
  }

  /**
   * Determine the height "below the line" of the arc in pixels.
     @param center The cartesian center of the arc.
   * @param radius The radius in pixels.
   * @param startAngle The starting azimuth of the arc in degrees.
   * @param endAngle The final azimuth of the arc in degrees
   * @returns An integer with the pixels.
   */
  public static heightOfArc(center: Cartesian, radius: number, startAngle: number, endAngle: number): number {
    return XMLCircleGauge.distanceFromYOrigin(center, radius, Math.max(Math.abs(startAngle), Math.abs(endAngle)));
  }

  /**
   * Determine how far from the Y origin a cartesian point is.
   * @param center The cartesian center.
   * @param radius The radius in pixels.
   * @param angle The angle in degrees.
   * @returns The distance from the origin in pixels.
   */
  public static distanceFromYOrigin(center: Cartesian, radius: number, angle: number): number {
    const theta = Math.abs(angle);
    const cos = Math.cos(theta * Avionics.Utils.DEG2RAD);
    const dist = radius * cos;
    return dist;
  }

  /**
   * Render a circle gauge
   * @returns A VNode
   */
  protected renderGauge(): VNode {
    return (
      <div class='dial_gauge_container' ref={this.containerDiv}>
        <ReferenceBugs logicHost={this.props.logicHost} geometry={this.geometry} referenceBugs={this.props.referenceBugs} />
        <svg viewBox="0 0 148 0" ref={this.svgRef}>
          <ColorZones logicHost={this.props.logicHost} geometry={this.geometry} colorZones={this.props.colorZones} stroke={5} />
          <path ref={this.arcRef} fill="none" stroke="white" stroke-width="1px" />
          <path class="inner_circle" d="M 70 70 m -7 0 a 7 7 78 0 1 14 0" fill="rgb(30,30,30)" />
          <g class='tick-marks' ref={this.ticksRef} />
          <ColorLines logicHost={this.props.logicHost} geometry={this.geometry} colorLines={this.props.colorLines} />
        </svg>

        <div class="gauge_pointer" ref={this.needleRef}>
          <svg>
            <path d={
              this.props.style?.cursorType === XMLCircularGaugeCursor.Triangle ?
                'M 70 31 m 0 -11 l -9 0 l 9 -11 l 9 11 z' :
                'M 70 70 m 0 -6 l -1 0 l 0 -38 l -4 -6 l 5 -11 l 5 11 l -4 6 l 0 38 l -1 0 z'
            } fill="white" stroke="black" stroke-width=".4px" />

          </svg>
        </div>
        <div class="gauge_title"><div class="gauge_text_block" ref={this.titleRef}>{this.props.title}</div></div>
        <div class="gauge_units"><div class="gauge_text_block" ref={this.unitsRef}>{this.props.unit}</div></div>
        <div class="gauge_minimum" ref={this.startRef} />
        <div class="gauge_value" ref={this.valueRef} />
        <div class="gauge_maximum" ref={this.endRef} />
      </div>);
  }
}