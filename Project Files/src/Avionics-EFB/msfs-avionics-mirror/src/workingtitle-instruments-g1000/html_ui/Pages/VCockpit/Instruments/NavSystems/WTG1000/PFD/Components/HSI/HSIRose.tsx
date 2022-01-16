import { FSComponent, DisplayComponent, VNode, ComponentProps } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { ADCEvents, APEvents, GNSSEvents, NavSourceType } from 'msfssdk/instruments';
import { CompassRose } from './CompassRose';
import { CourseNeedles } from './CourseNeedles';
import { TurnRateIndicator } from './TurnRateIndicator';
import { NavIndicatorController, ObsSuspModes } from '../../../Shared/Navigation/NavIndicatorController';
import './HSIRose.css';
import './HSIShared.css';
import { FailedBox } from '../../../Shared/UI/FailedBox';
import { AHRSSystemEvents } from '../../../Shared/Systems/AHRSSystem';
import { AvionicsSystemState, AvionicsSystemStateEvent } from '../../../Shared/Systems/G1000AvionicsSystem';


/**
 * Properties on the HSI component.
 */
interface HSIRoseProps extends ComponentProps {
  /** An instance of the event bus. */
  bus: EventBus;
  /** An instance of the HSI Controller. */
  controller: NavIndicatorController;
}

/**
 * The HSI component of the PFD.
 */
export class HSIRose extends DisplayComponent<HSIRoseProps> {

  private readonly el = FSComponent.createRef<HTMLDivElement>();
  private readonly compassRoseComponent = FSComponent.createRef<CompassRose>();
  private headingElement = FSComponent.createRef<HTMLElement>();
  private headingRotateElement = FSComponent.createRef<SVGElement>();
  private courseNeedlesElement = FSComponent.createRef<CourseNeedles>();
  private headingBugElement = FSComponent.createRef<SVGElement>();
  private turnRateIndicator = FSComponent.createRef<TurnRateIndicator>();
  private bearingPointer1Element = FSComponent.createRef<HTMLElement>();
  private bearingPointer2Element = FSComponent.createRef<HTMLElement>();
  private navSourceText = FSComponent.createRef<HTMLElement>();
  private navSensitivity = FSComponent.createRef<HTMLElement>();
  private susp = FSComponent.createRef<HTMLElement>();
  private trackBug = FSComponent.createRef<HTMLDivElement>();
  private failedBox = FSComponent.createRef<FailedBox>();

  private onGround = true;
  private isFailed = false;

  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    this.registerWithController();

    this.props.bus.getSubscriber<GNSSEvents>().on('track_deg_magnetic')
      .withPrecision(1)
      .handle((trk) => {
        if (!this.onGround) {
          this.updateTrackBug(trk);
        }
      });

    const adc = this.props.bus.getSubscriber<ADCEvents>();

    adc.on('hdg_deg')
      .withPrecision(1)
      .handle(this.updateHeadingRotation.bind(this));

    adc.on('delta_heading_rate')
      .withPrecision(1)
      .handle(rate => this.turnRateIndicator.instance.setTurnRate(rate));

    adc.on('on_ground').handle((v) => {
      this.onGround = v;
    });

    this.props.bus.getSubscriber<APEvents>().on('heading_select')
      .withPrecision(0)
      .handle(this.updateSelectedHeadingDisplay.bind(this));


    if (this.bearingPointer1Element.instance !== null) {
      this.bearingPointer1Element.instance.style.display = 'none';
    }

    if (this.bearingPointer2Element.instance !== null) {
      this.bearingPointer2Element.instance.style.display = 'none';
    }

    if (this.compassRoseComponent.getOrDefault() !== null) {
      this.compassRoseComponent.instance.setCircleVisible(false);
    }

    this.failedBox.instance.setFailed(true);
    this.props.bus.getSubscriber<AHRSSystemEvents>()
      .on('ahrs_state')
      .handle(this.onAhrsStateChanged.bind(this));
  }

  /**
   * A callaback called when the system screen state changes.
   * @param state The state change event to handle.
   */
  private onAhrsStateChanged(state: AvionicsSystemStateEvent): void {
    if (state.previous === undefined && state.current !== AvionicsSystemState.Off) {
      this.setFailed(false);
    } else {
      if (state.current === AvionicsSystemState.On) {
        this.setFailed(false);
      } else {
        this.setFailed(true);
      }
    }
  }

  /**
   * Sets if the display should be failed or not.
   * @param isFailed True if failed, false otherwise.
   */
  private setFailed(isFailed: boolean): void {
    if (isFailed) {
      this.isFailed = true;
      this.failedBox.instance.setFailed(true);

      this.trackBug.instance.classList.add('hidden-element');
      this.headingBugElement.instance.classList.add('hidden-element');
      this.headingElement.instance.classList.add('hidden-element');

      this.bearingPointer1Element.instance.classList.add('hidden-element');
      this.bearingPointer2Element.instance.classList.add('hidden-element');

      this.compassRoseComponent.instance.setFailed(true);
    } else {
      this.isFailed = false;
      this.failedBox.instance.setFailed(false);

      this.trackBug.instance.classList.remove('hidden-element');
      this.headingBugElement.instance.classList.remove('hidden-element');
      this.headingElement.instance.classList.remove('hidden-element');

      this.bearingPointer1Element.instance.classList.remove('hidden-element');
      this.bearingPointer2Element.instance.classList.remove('hidden-element');

      this.compassRoseComponent.instance.setFailed(false);
    }
  }

  /**
   * Sets whether or not the standard HSI is visible.
   * @param isVisible Whether or not the HSI is visible.
   */
  public setVisible(isVisible: boolean): void {
    this.el.instance.style.display = isVisible ? '' : 'none';
  }

  /**
   * Updates the HSI indicator rotation when the heading changes.
   * @param hdgDeg deg The new heading value.
   */
  private updateHeadingRotation(hdgDeg: number): void {
    if (this.isFailed) {
      hdgDeg = 0;
    }

    if (this.headingRotateElement.instance !== null) {
      this.headingRotateElement.instance.style.transform = `rotate3d(0, 0, 1, ${-hdgDeg}deg)`;
    }
    if (this.headingElement.instance !== null) {
      const hdg = Math.round(hdgDeg) == 0 ? 360 : Math.round(hdgDeg);
      this.headingElement.instance.textContent = `${hdg}°`.padStart(4, '0');
    }
    if (this.onGround) {
      this.updateTrackBug(hdgDeg);
    }
  }

  /**
   * Updates the heading indicator when the heading changes.
   * @param selHdg deg The new heading value.
   */
  private updateSelectedHeadingDisplay(selHdg: number): void {
    if (this.headingBugElement.instance !== null) {
      this.headingBugElement.instance.style.transform = `rotate3d(0, 0, 1, ${selHdg}deg)`;
    }
  }

  /**
   * Updates the ground track bug.
   * @param trkDeg The ground track in degrees magnetic.
   */
  private updateTrackBug(trkDeg: number): void {
    this.trackBug.instance.style.transform = `rotate3d(0, 0, 1, ${trkDeg}deg)`;
  }

  /**
   * Builds the 4 tick marks on the outside of the compass rose.
   * @param radius The radius of the circle to build around.
   * @returns A collection of tick mark line elements.
   */
  public buildRoseOuterTicks(radius = 149): SVGLineElement[] {
    const lines: SVGLineElement[] = [];

    for (let i = 0; i < 360; i += 45) {
      if ((i == 0 || i >= 180) && i != 270) {
        const length = 16;

        const startX = 184 + (radius) * Math.cos(i * Math.PI / 180);
        const startY = 185 + (radius) * Math.sin(i * Math.PI / 180);

        const endX = startX + (length * Math.cos(i * Math.PI / 180));
        const endY = startY + (length * Math.sin(i * Math.PI / 180));

        lines.push(<line x1={startX} y1={startY} x2={endX} y2={endY} stroke="white" stroke-width="3px" />);
      }
    }

    return lines;
  }

  /**
   * Updates the Source and Sensitivity Fields.
   */
  public updateSourceSensitivity(): void {
    switch (this.props.controller.navStates[this.props.controller.activeSourceIndex].source.type) {
      case NavSourceType.Nav:
        if (this.props.controller.navStates[this.props.controller.activeSourceIndex].isLocalizer) {
          this.navSourceText.instance.textContent = `LOC${this.props.controller.navStates[this.props.controller.activeSourceIndex].source.index}`;
        } else {
          this.navSourceText.instance.textContent = `VOR${this.props.controller.navStates[this.props.controller.activeSourceIndex].source.index}`;
        }
        this.navSourceText.instance.style.color = '#00ff00';
        this.navSensitivity.instance.textContent = '';
        break;
      case NavSourceType.Gps:
        this.navSourceText.instance.textContent = 'GPS';
        this.navSourceText.instance.style.color = 'magenta';
        this.navSensitivity.instance.textContent = `${this.props.controller.activeSensitivity}`;
        switch (this.props.controller.obsSuspMode) {
          case ObsSuspModes.SUSP:
            this.susp.instance.textContent = 'SUSP';
            break;
          case ObsSuspModes.OBS:
            this.susp.instance.textContent = 'OBS';
            break;
          default:
            this.susp.instance.textContent = '';
            break;
        }
        break;
    }
  }

  /**
   * Registers the course needles instance with the HSI Controller.
   */
  private registerWithController(): void {
    this.props.controller.courseNeedleRefs.hsiRose = this.courseNeedlesElement;
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class="hsi-rose-container" ref={this.el}>
        <div class="hsi-rose-hdg-box">
          <FailedBox ref={this.failedBox} />
          <span ref={this.headingElement}>360</span>
        </div>
        <div ref={this.headingRotateElement} class="hsi-rose-rotating">
          <div class="hsi-track-bug" ref={this.trackBug}>
            <svg>
              <path d="M 170 50 l 4 -9 l 0 -2 l -4 -9 l -4 9 l 0 2 z" fill="magenta" stroke="black" stroke-width="1px" />
            </svg>
          </div>
          <CompassRose ref={this.compassRoseComponent} size={386} margin={40} />
          <div class="hsi-rose-brg-ptr" ref={this.bearingPointer1Element}>
            <svg viewBox="0 0 386 340">
              <path d="M 183 70 l 0 7 l -16 16 M 183 77 l 16 16 M 183 77 l 0 30 z M 183 264 l 0 44" fill="none" stroke="cyan" stroke-width="2px" />
            </svg>
          </div>
          <div class="hsi-rose-brg-ptr" ref={this.bearingPointer2Element}>
            <svg viewBox="0 0 386 340">
              <path d="M 183 70 l 0 7 l -16 16 M 183 77 l 16 16 M 178 82 l 0 25 M 188 82 l 0 25 M 178 264 l 0 36 l 10 0 l 0 -36 M 183 300 l 0 8" fill="none" stroke="cyan" stroke-width="2px" />
            </svg>
          </div>
          <div class="hsi-rose-hdg-bug" ref={this.headingBugElement}>
            <svg>
              <path d="M 183 185 m 0 -133 l 4 -9 l 7 0 l 0 12 l -22 0 l 0 -12 l 7 0 l 4 9 z" fill="cyan" stroke="black" stroke-width="1px" />
            </svg>
          </div>
          <CourseNeedles hsiMap={false} ref={this.courseNeedlesElement} controller={this.props.controller} />
        </div>
        <div class="hsi-rose-static">
          <div class="hsi-outer-ticks">
            <svg viewBox="0 0 386 340">
              <path d="m 184 185 m -20 1 l 0 -4 l 16 -7 l 0 -10 l 4 -3 l 4 3 l 0 10 l 16 7 l 0 4 l -16 0 l 0 12 l 5 5 l 0 2 l -18 0 l 0 -2 l 5 -5 l 0 -12 l -16 0 z" fill="white" />
              {this.buildRoseOuterTicks()}
            </svg>
          </div>
          <div class="hsi-index-pointer">
            <svg>
              <path d="M 8 20 l 8 -20 l -16 0 l 8 20 z" fill="white" stroke="grey" stroke-width=".5px" />
            </svg>
          </div>
          <TurnRateIndicator hsiMap={false} ref={this.turnRateIndicator} />
          <div class="hsi-nav-source" ref={this.navSourceText}>VOR1</div>
          <div class="hsi-nav-sensitivity" ref={this.navSensitivity}>ENR</div>
          <div class="hsi-nav-susp" ref={this.susp}></div>
          <div class="hsi-gps-xtrack"></div>
        </div>
      </div >
    );
  }
}
