import { ComputedSubject, DisplayComponent, FSComponent, MathUtils, Subject, VNode } from 'msfssdk';
import { VNavEvents } from 'msfssdk/autopilot';
import { EventBus } from 'msfssdk/data';
import { ADCEvents, APEvents, APLockType } from 'msfssdk/instruments';
import { GPDisplayMode, NavIndicatorController, VNavDisplayMode } from 'garminsdk/navigation';
import { ADCSystemEvents } from '../../../Shared/Systems/ADCAvionicsSystem';
import { AvionicsSystemState, AvionicsSystemStateEvent } from '../../../Shared/Systems/G1000AvionicsSystem';

import './VerticalSpeedIndicator.css';

/**
 * The properties for the VSI component.
 */
interface VerticalSpeedIndicatorProps {
  /** An instance of the event bus. */
  bus: EventBus;
  /** An instance of the NavIndicatorController. */
  navIndicatorController: NavIndicatorController;
}

/**
 * The PFD vertical speed indicator.
 */
export class VerticalSpeedIndicator extends DisplayComponent<VerticalSpeedIndicatorProps> {

  private containerRef = FSComponent.createRef<HTMLDivElement>();
  private verticalSpeedPointer = FSComponent.createRef<HTMLDivElement>();
  private desiredSpeedPointer = FSComponent.createRef<HTMLDivElement>();
  private selectedVerticalSpeed = FSComponent.createRef<HTMLDivElement>();
  private selectedVSBug = FSComponent.createRef<HTMLDivElement>();

  private previousVSNumber = 0;
  private verticalSpeedValue = Subject.create(0);
  private verticalSpeedVisible = Subject.create('');

  private selectedVsVisibility = Subject.create(false);
  private selectedVsValue = Subject.create(0);

  private vnavDisplayMode = VNavDisplayMode.NONE;
  private gpDisplayMode = GPDisplayMode.NONE;

  private selectedVsValueTransform = ComputedSubject.create<number, string>(0, (v) => {
    return `translate3d(0px, ${MathUtils.clamp(v, -2250, 2250) * -0.064}px, 0px)`;
  });

  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    this.selectedVSBug.instance.classList.add('hide-element');
    this.selectedVerticalSpeed.instance.classList.add('hide-element');

    const adc = this.props.bus.getSubscriber<ADCEvents>();
    const vnav = this.props.bus.getSubscriber<VNavEvents>();
    const ap = this.props.bus.getSubscriber<APEvents>();

    adc.on('vs')
      .withPrecision(-1)
      .handle(this.updateVerticalSpeed.bind(this));

    vnav.on('vnav_required_vs').whenChanged().handle(reqVs => this.updateDesiredSpeedPointer(reqVs));

    this.props.navIndicatorController.vnavDisplayMode.sub((mode) => {
      this.vnavDisplayMode = mode;
      this.updateDesiredSpeedPointerVisibility();
    });

    this.props.navIndicatorController.gpDisplayMode.sub((mode) => {
      this.gpDisplayMode = mode;
      this.updateDesiredSpeedPointerVisibility();
    });

    ap.on('ap_vs_selected').withPrecision(0).handle((value) => {
      this.selectedVsValue.set(value);
      this.selectedVsValueTransform.set(value);
      this.updateSelectedVSBug();
    });

    ap.on('ap_lock_release').whenChanged().handle((unlock) => {
      if (unlock === APLockType.Vs) {
        this.selectedVsVisibility.set(false);
        this.selectedVSBug.instance.classList.add('hide-element');
        this.selectedVerticalSpeed.instance.classList.add('hide-element');
      }
    });
    ap.on('ap_lock_set').whenChanged().handle((lock) => {
      if (lock === APLockType.Vs) {
        this.selectedVsVisibility.set(true);
        this.selectedVSBug.instance.classList.remove('hide-element');
        this.selectedVerticalSpeed.instance.classList.remove('hide-element');
      }
    });

    this.props.bus.getSubscriber<ADCSystemEvents>()
      .on('adc_state')
      .handle(this.onAdcStateChanged.bind(this));
  }

  /**
   * A callaback called when the system screen state changes.
   * @param state The state change event to handle.
   */
  private onAdcStateChanged(state: AvionicsSystemStateEvent): void {
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
      this.containerRef.instance.classList.add('failed-instr');
    } else {
      this.containerRef.instance.classList.remove('failed-instr');
    }
  }

  /**
   * Updates the vertical speed indicator when the vertical speed changes.
   * @param vs The new vertical speed.
   */
  private updateVerticalSpeed(vs: number): void {
    const quantizedVS = Math.ceil(vs / 50) * 50;
    this.updateVerticalSpeedPointer(vs);

    if (quantizedVS !== this.previousVSNumber) {
      this.previousVSNumber = quantizedVS;
      this.verticalSpeedVisible.set((vs > 50 || vs < -100) ? 'visible' : 'hidden');
      this.verticalSpeedValue.set(quantizedVS);
    }
  }

  /**
   * Updates the transform of the vertical speed pointer
   * @param vs The vertical speed
   */
  private updateVerticalSpeedPointer(vs: number): void {
    if (this.verticalSpeedPointer.instance !== null) {
      const clampedVs = MathUtils.clamp(vs, -2250, 2250);
      this.verticalSpeedPointer.instance.style.transform = `translate3d(0px, ${clampedVs * -0.064}px, 0px)`;
    }
  }

  /**
   * Updates the transform of the selected vertical speed bug
   */
  private updateSelectedVSBug(): void {
    if (this.selectedVSBug.instance !== null) {
      this.selectedVSBug.instance.style.transform = `${this.selectedVsValueTransform.get()}`;
    }
  }

  /**
   * Updates the transform of the desired speed pointer
   * @param requiredVs The required Vertical Speed from VNAV.
   */
  private updateDesiredSpeedPointer(requiredVs: number): void {
    if (this.vnavDisplayMode !== VNavDisplayMode.NONE || this.gpDisplayMode !== GPDisplayMode.NONE) {
      const clampedVs = MathUtils.clamp(requiredVs, -2200, 0);
      this.desiredSpeedPointer.instance.style.transform = `translate3d(0px, ${clampedVs * -0.064}px, 0px)`;
    }
  }

  /**
   * Updates the visibility of the desired speed pointer.
   */
  private updateDesiredSpeedPointerVisibility(): void {
    if (this.vnavDisplayMode === VNavDisplayMode.NONE && this.gpDisplayMode === GPDisplayMode.NONE) {
      this.desiredSpeedPointer.instance.style.display = 'none';
    } else {
      this.desiredSpeedPointer.instance.style.display = '';
    }
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class="vsi-container" ref={this.containerRef}>
        <div class="failed-box" />
        <svg height="305px" width="75">
          <defs>
            <linearGradient id="vsiGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:rgb(80,80,80)" />
              <stop offset="100%" style="stop-color:rgb(0,0,0)" />
            </linearGradient>
          </defs>
          <g class="vsi-tape-numbers">
            <text x="25" y="27" style="fill:whitesmoke;font-size:20px">2</text>
            <text x="25" y="91" style="fill:whitesmoke;font-size:20px">1</text>
            <text x="25" y="219" style="fill:whitesmoke;font-size:20px">1</text>
            <text x="25" y="283" style="fill:whitesmoke;font-size:20px">2</text>
          </g>
          <path d="M 0 0 l 38 0 c 5 0 10 5 10 10 l 0 105 l -48 33 l 48 33 l 0 105 c 0 5 -5 10 -10 10 l -38 0" fill="none" stroke="url(#vsiGradient)" stroke-width="1px" />
          <path d="M 15 137.691 l -15 10.309 l 15 10.312" fill="none" stroke="whitesmoke" stroke-width="2px" />
          <line x1="2" y1="20" x2="16" y2="20" style="stroke:rgb(150,150,150);stroke-width:2px"></line>
          <line x1="2" y1="52" x2="10" y2="52" style="stroke:rgb(150,150,150);stroke-width:2px"></line>
          <line x1="2" y1="84" x2="16" y2="84" style="stroke:rgb(150,150,150);stroke-width:2px"></line>
          <line x1="2" y1="116" x2="10" y2="116" style="stroke:rgb(150,150,150);stroke-width:2px"></line>
          <line x1="2" y1="180" x2="10" y2="180" style="stroke:rgb(150,150,150);stroke-width:2px"></line>
          <line x1="2" y1="212" x2="16" y2="212" style="stroke:rgb(150,150,150);stroke-width:2px"></line>
          <line x1="2" y1="244" x2="10" y2="244" style="stroke:rgb(150,150,150);stroke-width:2px"></line>
          <line x1="2" y1="276" x2="16" y2="276" style="stroke:rgb(150,150,150);stroke-width:2px"></line>
        </svg>
        <div ref={this.desiredSpeedPointer} class="vsi-pointer" style='display: none'>
          <svg height="25px" width="25px">
            <path d="m 2 9 l 14 -9 l 0 4 l -13 8 l 13 8 l 0 4 l -14 -9 z" fill="magenta" stroke="1px black" />
          </svg>
        </div>
        <div ref={this.verticalSpeedPointer} class="vsi-pointer">
          <svg height="25px" width="68px">
            <path d="M 2 10 l 16 -10 l 47 0 c 2 0 3 1 3 3 l 0 16 c 0 2 -1 3 -3 3 l -47 0 l -16 -10 z " fill="black" />
            <text x="63" y="18" font-size="20" text-anchor="end" fill="white" visibility={this.verticalSpeedVisible}>{this.verticalSpeedValue}</text>
          </svg>
        </div>
        <div ref={this.selectedVSBug} class="vsi-selected-vs-bug" >
          <svg>
            <path d='M 0 0 l 8 0 l 0 4.25 l -6 3.75 l 0 2 l 6 3.75 l 0 4.25 l -8 0 z' fill="cyan" stroke="black" stroke-width="1px" />
          </svg>
        </div>
        <div ref={this.selectedVerticalSpeed} class="vsi-selected-vs">{this.selectedVsValue}</div>
      </div>
    );
  }
}











