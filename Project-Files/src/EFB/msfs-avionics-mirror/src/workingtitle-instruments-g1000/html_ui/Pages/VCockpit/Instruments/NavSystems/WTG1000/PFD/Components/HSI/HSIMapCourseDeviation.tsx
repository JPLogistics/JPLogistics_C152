import { ComponentProps, DisplayComponent, FSComponent, NavMath, Subject, VNode } from 'msfssdk';
import { NavSourceType, VorToFrom } from 'msfssdk/instruments';

import { NavIndicatorController, NavSensitivity, ObsSuspModes } from 'garminsdk/navigation';

import './HSIMapCourseDeviation.css';

/**
 * The props on the CourseNeedles component.
 */
interface HSIMapCourseDeviationProps extends ComponentProps {

  /** An instance of the hsi controller. */
  controller: NavIndicatorController;
}

/**
 * The course needles component on the HSI.
 */
export class HSIMapCourseDeviation extends DisplayComponent<HSIMapCourseDeviationProps> {

  private readonly el = FSComponent.createRef<HTMLElement>();
  private readonly diamondIndicatorDiv = FSComponent.createRef<HTMLDivElement>();
  private readonly triangleIndicatorDiv = FSComponent.createRef<HTMLDivElement>();
  private readonly diamondIndicatorPath = FSComponent.createRef<SVGPathElement>();
  private readonly triangleIndicatorPath = FSComponent.createRef<SVGPathElement>();
  private readonly hsiMapDeviation = FSComponent.createRef<HTMLDivElement>();
  private readonly hideableObjects = FSComponent.createRef<HTMLDivElement>();
  private readonly noSignalDiv = FSComponent.createRef<HTMLDivElement>();
  private readonly suspDiv = FSComponent.createRef<HTMLDivElement>();

  private currentDeviation = 0;
  private noSignalStr = Subject.create('SIGNAL');
  private xtkStr = Subject.create('0');
  private xtkUnit = Subject.create('NM');
  private sensitivityStr = Subject.create('ENR');
  private sensitivityRef = FSComponent.createRef<HTMLDivElement>();
  private sourceStr = Subject.create('GPS');
  private sourceRef = FSComponent.createRef<HTMLDivElement>();

  /**
   * A callback called after rendering is complete.
   */
  public onAfterRender(): void {
    this.setVisible(this.triangleIndicatorDiv, false);
    this.setVisible(this.diamondIndicatorDiv, false);
    this.setVisible(this.noSignalDiv, false);
  }

  /**
   * A method called from Hsi Controller that commands an update on a change in any relevant value
   */
  public updateData(): void {
    const xtk = this.props.controller.navStates[this.props.controller.activeSourceIndex].deviation;
    if (xtk !== null) {
      this.setDeviation(xtk);
    }
    this.setFromTo(this.props.controller.navStates[this.props.controller.activeSourceIndex].toFrom);
  }

  /**
   * Sets the deviation indicator when there is no DTK.
   * @param value is a bool of whether to set 'no dtk' or remove 'no dtk'
   */
  private setNoSignal(value: boolean): void {
    if (value) {
      this.setVisible(this.triangleIndicatorDiv, false);
      this.setVisible(this.diamondIndicatorDiv, false);
      this.setVisible(this.hideableObjects, false);
      this.setVisible(this.noSignalDiv, true);
      switch (this.sourceStr.get()) {
        case 'GPS':
          this.noSignalStr.set('NO DTK');
          break;
        case 'LOC1':
        case 'LOC2':
          this.noSignalStr.set('NO LOC');
          break;
        case 'VOR1':
        case 'VOR2':
          this.noSignalStr.set('NO VOR');
          break;
      }
    } else {
      this.setVisible(this.hideableObjects, true);
      this.setVisible(this.noSignalDiv, false);
      this.noSignalStr.set('SIGNAL');
      this.updateSourceSensitivity();
      this.updateData();
    }
  }

  /**
   * Sets the to/from orientation of the triangle.
   * @param toFrom is the to/from object to be processed
   */
  private setFromTo(toFrom: VorToFrom): void {
    if (this.noSignalStr.get() != 'SIGNAL' && toFrom !== VorToFrom.OFF) {
      this.setNoSignal(false);
      return;
    } else if (this.noSignalStr.get() != 'SIGNAL') {
      switch (this.sourceStr.get()) {
        case 'GPS':
          this.noSignalStr.set('NO DTK');
          break;
        case 'LOC1':
        case 'LOC2':
          this.noSignalStr.set('NO LOC');
          break;
        case 'VOR1':
        case 'VOR2':
          this.noSignalStr.set('NO VOR');
          break;
      }
    }
    if (toFrom === VorToFrom.FROM) {
      this.triangleIndicatorDiv.instance.style.transform = 'rotate3d(0, 0, 1, 180deg)';
    } else {
      this.triangleIndicatorDiv.instance.style.transform = 'rotate3d(0, 0, 1, 0deg)';
      if (toFrom === VorToFrom.OFF) {
        this.setNoSignal(true);
      }
    }
  }

  /**
   * Sets the deviation of the course needle.
   * @param deviation The deviation of the course needle.
   */
  public setDeviation(deviation: number): void {
    this.currentDeviation = deviation;

    const deviationPercent = this.currentDeviation;
    const deviationPixels = NavMath.clamp(deviationPercent, -1, 1) * 90.5;
    if (this.currentDeviation >= -1) {
      this.hsiMapDeviation.instance.style.display = '';
      this.hsiMapDeviation.instance.style.transform = `translate3d(${deviationPixels}px, 0px, 0px)`;
    } else {
      this.hsiMapDeviation.instance.style.display = 'none';
    }
  }

  /**
   * Updates the Source and Sensitivity Fields.
   */
  public updateSourceSensitivity(): void {
    switch (this.props.controller.navStates[this.props.controller.activeSourceIndex].source.type) {
      case NavSourceType.Nav:
        if (this.props.controller.navStates[this.props.controller.activeSourceIndex].isLocalizer) {
          this.sourceStr.set(`LOC${this.props.controller.navStates[this.props.controller.activeSourceIndex].source.index}`);
          this.setVisible(this.triangleIndicatorDiv, false);
          this.setVisible(this.diamondIndicatorDiv, true);
          this.diamondIndicatorPath.instance.setAttribute('fill', 'rgb(0,255,0)');
        } else {
          this.sourceStr.set(`VOR${this.props.controller.navStates[this.props.controller.activeSourceIndex].source.index}`);
          this.setVisible(this.triangleIndicatorDiv, true);
          this.setVisible(this.diamondIndicatorDiv, false);
          this.triangleIndicatorPath.instance.setAttribute('fill', 'rgb(0,255,0)');
        }
        this.sensitivityRef.instance.style.display = 'none';
        this.sensitivityStr.set('');
        this.sourceRef.instance.style.color = '#00ff00';
        this.suspDiv.instance.style.display = 'none';
        this.suspDiv.instance.textContent = '';
        break;
      case NavSourceType.Gps:
        this.sensitivityRef.instance.style.display = '';
        this.sensitivityStr.set(`${this.props.controller.activeSensitivity}`);
        this.sourceRef.instance.style.color = 'magenta';
        this.sourceStr.set('GPS');
        this.setVisible(this.noSignalDiv, false);
        this.setVisible(this.hideableObjects, true);
        switch (this.props.controller.activeSensitivity) {
          case NavSensitivity.LNAV:
          case NavSensitivity.LP:
          case NavSensitivity.LPV:
          case NavSensitivity.LVNAV:
          case NavSensitivity.VIS:
            this.diamondIndicatorPath.instance.setAttribute('fill', 'magenta');
            this.setVisible(this.triangleIndicatorDiv, false);
            this.setVisible(this.diamondIndicatorDiv, true);
            break;
          default:
            this.triangleIndicatorPath.instance.setAttribute('fill', 'magenta');
            this.setVisible(this.triangleIndicatorDiv, true);
            this.setVisible(this.diamondIndicatorDiv, false);
            break;
        }
        switch (this.props.controller.obsSuspMode) {
          case ObsSuspModes.SUSP:
            this.suspDiv.instance.textContent = 'SUSP';
            this.suspDiv.instance.style.display = '';
            break;
          case ObsSuspModes.OBS:
            this.suspDiv.instance.textContent = 'OBS';
            this.suspDiv.instance.style.display = '';
            break;
          default:
            this.suspDiv.instance.style.display = 'none';
            this.suspDiv.instance.textContent = '';
            break;
        }
        break;
    }
  }

  /**
   * Sets whether or not the course needle is visible.
   * @param ref is the node reference to adjust
   * @param isVisible The visibility of the course needle.
   */
  public setVisible(ref: any, isVisible: boolean): void {
    if (ref && ref.instance !== null) {
      ref.instance.style.display = isVisible ? '' : 'none';
    }
  }

  /**
   * Renders the course needles component.
   * @returns The rendered VNode.
   */
  public render(): VNode {
    return (
      <div ref={this.el}>
        <div class="hsi-map-nav-src" ref={this.sourceRef} >{this.sourceStr}</div>
        <div class='hsi-map-coursedev-objects hsi-map-coursedev-objects-boxstyle'>
          <svg>
            <circle cx="20" cy="10.5" r="3" stroke="white" stroke-width="1px" fill="none" />
            <circle cx="161" cy="10.5" r="3" stroke="white" stroke-width="1px" fill="none" />
          </svg>
        </div>
        <div class='hsi-map-coursedev-objects' ref={this.hideableObjects}>
          <svg>
            <line x1="90.5" y1="1" x2="90.5" y2="22" stroke="gray" stroke-width="1px" />
            <circle cx="55" cy="11.5" r="3" stroke="white" stroke-width="1px" fill="none" />
            <circle cx="126" cy="11.5" r="3" stroke="white" stroke-width="1px" fill="none" />
          </svg>
          <div class="hsi-map-deviation" ref={this.hsiMapDeviation}>
            <div class="hsi-map-triangle-deviation" ref={this.triangleIndicatorDiv}>
              <svg>
                <path ref={this.triangleIndicatorPath} d="M 9.5 0 L 0 18 L 18 18 z" fill="magenta" stroke="black" stroke-width="1px" />
              </svg>
            </div>
            <div class="hsi-map-diamond-deviation" ref={this.diamondIndicatorDiv}>
              <svg>
                <path ref={this.diamondIndicatorPath} d="M 9.5 1 l -8 8 l 8 8 l 8 -8 z" fill="rgb(0,255,0)" stroke="black" stroke-width="1px" />
              </svg>
            </div>
          </div>
        </div>
        <div class='hsi-map-coursedev-nosignal-text' ref={this.noSignalDiv} >{this.noSignalStr}</div>
        <div class="hsi-map-gps-xtrack">{this.xtkStr}<span class="size12">{this.xtkUnit}</span></div>
        <div class="hsi-map-nav-sensitivity" ref={this.sensitivityRef}>{this.sensitivityStr}</div>
        <div class="hsi-map-nav-susp" ref={this.suspDiv}>SUSP</div>
      </div>
    );
  }
}
