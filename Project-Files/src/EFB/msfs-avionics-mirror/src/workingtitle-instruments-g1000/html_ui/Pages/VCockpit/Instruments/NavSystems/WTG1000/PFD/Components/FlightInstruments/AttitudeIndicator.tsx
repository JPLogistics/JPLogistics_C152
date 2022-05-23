import { FSComponent, DisplayComponent, NodeReference, VNode, ComponentProps } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { ADCEvents } from 'msfssdk/instruments/ADC';
import { AHRSSystemEvents } from '../../../Shared/Systems/AHRSSystem';
import { AvionicsSystemState, AvionicsSystemStateEvent } from '../../../Shared/Systems/G1000AvionicsSystem';
import { SvtProjectionUtils } from '../../../Shared/UI/SvtProjectionUtils';
import { PFDUserSettings } from '../../PFDUserSettings';

import './AttitudeIndicator.css';
import { PlaneStateInfo } from './PrimaryHorizonDisplay';

/**
 * The properties on the Attitude component.
 */
interface AttitudeIndicatorProps extends ComponentProps {

  /** An instance of the event bus. */
  bus: EventBus;
}

/** Possible attitude indicator display states. */
type DisplayState = 'failed' | 'align' | 'ok';

/**
 * The PFD attitude indicator.
 */
export class AttitudeIndicator extends DisplayComponent<AttitudeIndicatorProps> {

  private static readonly vec2Cache = [new Float64Array(2)];

  private scroll_increment = 10;
  private pxPerDegY = SvtProjectionUtils.projectYawPitch(0, 0.1 * Avionics.Utils.DEG2RAD, 0, new Float64Array(2))[1] * 10;
  private pitchIncrements = 2.5;
  private numberIncrements = 2;
  private pitchIncrementsDistance = this.pxPerDegY * this.pitchIncrements;
  private currentPitch = 0;

  private cutoutElement = FSComponent.createRef<HTMLDivElement>();
  private pitchLinesContainer = FSComponent.createRef<SVGElement>();
  private pitchLinesGroup = FSComponent.createRef<SVGElement>();
  private bankElement = FSComponent.createRef<HTMLDivElement>();
  private innerBankElement = FSComponent.createRef<HTMLDivElement>();
  private zeroPitchLine = FSComponent.createRef<SVGElement>();
  private ahrsAlign = FSComponent.createRef<HTMLDivElement>();
  private containerRef = FSComponent.createRef<HTMLDivElement>();

  private pitchNumbersLeft: NodeReference<SVGTextElement>[] = [];
  private pitchNumbersRight: NodeReference<SVGTextElement>[] = [];

  private turnCoordinatorElement = FSComponent.createRef<SVGElement>();
  private lastPitchOffset = 0;

  private displayState: DisplayState = 'ok';

  /**
   * Builds pitch tick marks on the attitude indicator.
   */
  private buildPitchLines(): void {
    for (let i = -this.scroll_increment; i < (this.scroll_increment + 1); i++) {
      const length = i % 4 == 0 ? 108 : i % 2 == 0 ? 54 : 28;
      const startX = 153 + (length == 108 ? 0 : length == 54 ? 27 : 40);
      const posY = 0 - (i * this.pitchIncrementsDistance);
      const endX = startX + length;
      const lineEl = <line x1={startX} y1={posY} x2={endX} y2={posY} stroke="white" stroke-width=".5px" >.</line>;
      if (i === 0) {
        lineEl.instance.style.visibility = 'hidden';
        this.zeroPitchLine.instance = lineEl.instance;
      }
      FSComponent.render(lineEl, this.pitchLinesGroup.instance);
    }
  }

  /**
   * Builds the pitch value numbers for the attitude indicator.
   */
  private buildPitchNumbers(): void {
    this.pitchNumbersLeft = [];
    this.pitchNumbersRight = [];
    for (let i = -this.scroll_increment; i < (this.scroll_increment + 1); i++) {
      const length = i % 4 == 0 ? 108 : i % 2 == 0 ? 54 : 28;
      const leftNumberX = 136 + (length == 108 ? 0 : length == 54 ? 27 : 40);
      const rightNumberX = 168 + (length == 108 ? 0 : length == 54 ? 27 : 40) + length;
      const startY = 6 - (i * this.pitchIncrementsDistance);
      if (i % this.numberIncrements == 0) {
        const number = Math.abs(i * this.pitchIncrements);
        const numberText = number !== 0 ? number.toFixed(0) : '';
        const textElementLeft = FSComponent.createRef<SVGTextElement>();
        const textElementRight = FSComponent.createRef<SVGTextElement>();
        const leftEl = <text x={leftNumberX} y={startY} fill="white" font-family="Roboto-Bold" text-anchor="middle" font-size="20px" stroke="black" stroke-width="1px" ref={textElementLeft}>{numberText}</text>;
        const rightEl = <text x={rightNumberX} y={startY} fill="white" font-family="Roboto-Bold" text-anchor="middle" font-size="20px" stroke="black" stroke-width="1px" ref={textElementRight}>{numberText}</text>;
        this.pitchNumbersLeft.push(textElementLeft);
        this.pitchNumbersRight.push(textElementRight);
        FSComponent.render(leftEl, this.pitchLinesGroup.instance);
        FSComponent.render(rightEl, this.pitchLinesGroup.instance);
      }
    }
  }

  /**
   * Rebuilds the attitude ladder.
   */
  private rebuildAttitudeLadder(): void {
    this.pitchLinesGroup.instance.innerHTML = '';
    this.buildPitchLines();
    this.buildPitchNumbers();
    this.onUpdatePitch(this.currentPitch, true);
  }

  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    const adc = this.props.bus.getSubscriber<ADCEvents>();
    adc.on('turn_coordinator_ball')
      .withPrecision(2)
      .handle(this.onUpdateTurnCoordinator);
    PFDUserSettings.getManager(this.props.bus).whenSettingChanged('svtToggle').handle(this.updateSVTDisplay.bind(this));
    this.onUpdatePitch(this.currentPitch, true);

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
      this.setDisplayState('ok');
    } else {
      switch (state.current) {
        case AvionicsSystemState.Off:
        case AvionicsSystemState.Failed:
          this.setDisplayState('failed');
          break;
        case AvionicsSystemState.Initailizing:
          this.setDisplayState('align');
          break;
        case AvionicsSystemState.On:
          this.setDisplayState('ok');
          break;
      }
    }
  }

  /**
   * Sets the display state of the attitude display.
   * @param state The state to set the display to.
   */
  private setDisplayState(state: DisplayState): void {
    switch (state) {
      case 'failed':
        this.containerRef.instance.classList.add('failed-instr');
        this.containerRef.instance.classList.remove('ahrs-align-state');
        this.ahrsAlign.instance.classList.add('hidden');

        this.onUpdatePitch(0, false);
        this.onUpdateRoll(0);
        break;
      case 'align':
        this.containerRef.instance.classList.add('ahrs-align-state');
        this.containerRef.instance.classList.remove('failed-instr');
        this.ahrsAlign.instance.classList.remove('hidden');

        this.onUpdatePitch(0, false);
        this.onUpdateRoll(0);
        break;
      case 'ok':
        this.containerRef.instance.classList.remove('failed-instr');
        this.containerRef.instance.classList.remove('ahrs-align-state');
        this.ahrsAlign.instance.classList.add('hidden');
        break;
    }

    this.displayState = state;
  }

  /**
   * Updates attitude indicator.
   * @param planeState The plane state information.
   */
  public update(planeState: PlaneStateInfo): void {
    if (this.displayState === 'ok') {
      this.onUpdatePitch(planeState.pitch, false);
      this.onUpdateRoll(planeState.roll);
    } else {
      this.onUpdatePitch(0, false);
      this.onUpdateRoll(0);
    }
  }

  /**
   * A callback called when the pitch updates from the event bus.
   * @param pitch The current pitch value.
   * @param forceRedraw An override for the redraw.
   */
  private onUpdatePitch = (pitch: number, forceRedraw = false): void => {
    this.currentPitch = pitch;
    if (this.pitchLinesContainer.instance !== null) {
      const pitchOffset = Math.trunc((pitch / this.scroll_increment));
      if (pitchOffset !== this.lastPitchOffset || forceRedraw) {
        this.lastPitchOffset = pitchOffset;
        if (this.zeroPitchLine.instance !== null) {
          this.zeroPitchLine.instance.style.visibility = pitchOffset === 0 ? 'hidden' : 'visible';
        }
        this.updatePitchNumbers(pitch, pitchOffset);
      }
      this.updateLinesPos(pitch);
    }
  };

  /**
   * A callback called when the ADC updates from the event bus.
   * @param roll The current ADC roll value.
   */
  private onUpdateRoll = (roll: number): void => {
    if (this.bankElement.instance !== null) {
      this.bankElement.instance.style.transform = `rotate(${roll}deg)`;
      this.cutoutElement.instance.style.transform = `rotate(${-roll}deg)`;
      this.innerBankElement.instance.style.transform = `rotate(${roll}deg)`;
    }
  };

  /**
   * Updates pitch lines position.
   * @param pitch The current pitch value.
   */
  private updateLinesPos(pitch: number): void {
    pitch = pitch % this.scroll_increment;
    this.pitchLinesContainer.instance.style.transform = `translate3d(0px, ${pitch * (this.pxPerDegY)}px, 0px)`;
  }

  /**
   * Updates pitch number positions.
   * @param pitch The current pitch value.
   * @param offset The current scroll increment offset.
   */
  private updatePitchNumbers(pitch: number, offset: number): void {
    const initNumber = (this.scroll_increment * this.pitchIncrements) - (offset * this.scroll_increment);
    for (let i = 0; i < this.pitchNumbersLeft.length; i++) {
      const number = Math.abs(initNumber - (i * (this.pitchIncrements * this.numberIncrements)));
      const numberText = number !== 0 ? number.toFixed(0) : '';

      this.pitchNumbersLeft[i].instance.textContent = numberText;
      this.pitchNumbersRight[i].instance.textContent = numberText;
    }
  }


  /**
   * A callback called when the ADC updates from the event bus.
   * @param turnCoordinator The current ADC turn_coordinator_ball value.
   */
  private onUpdateTurnCoordinator = (turnCoordinator: number): void => {
    if (this.turnCoordinatorElement.instance !== null) {
      const translation = turnCoordinator * 54;
      this.turnCoordinatorElement.instance.style.transform = `translate3d(${translation}px, 0px, 0px)`;
    }
  };

  /**
   * Sets whether SVT scales are active or not.
   * @param svt The toggle for SVT.
   */
  private updateSVTDisplay = (svt: boolean): void => {
    if (svt) {
      this.numberIncrements = 2; // every n-th increment there is number
      this.scroll_increment = 10; // how big is one area to scroll
      this.pxPerDegY = SvtProjectionUtils.projectYawPitch(0, 0.1 * Avionics.Utils.DEG2RAD, 0, AttitudeIndicator.vec2Cache[0])[1] * 10;
    } else {
      this.numberIncrements = 4; // every n-th increment there is number
      this.scroll_increment = 20; // how big is one area to scroll
      this.pxPerDegY = SvtProjectionUtils.projectYawPitch(0, 0.1 * Avionics.Utils.DEG2RAD, 0, AttitudeIndicator.vec2Cache[0])[1] * 5; // pitch ratio is half of svt
    }
    this.pitchIncrementsDistance = (this.pxPerDegY * this.pitchIncrements);
    this.rebuildAttitudeLadder();
  };

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (

      <div class="attitude-container" ref={this.containerRef}>
        <div class="failed-box" />
        <div class="turn-coordinator" ref={this.turnCoordinatorElement}>
          <svg>
            <path d="M 15 15 l 15 0 l -3 -6 l -24 0 l -3 6 l 15 0" fill="#fff" stroke="black" stroke-width=".5" />
          </svg>
        </div>
        <div class="attitude-bank" ref={this.bankElement} style="transform: rotate(0deg)">
          <svg width="414" height="315">
            <path d="M 207 214 m 0 -193 l -10 -20 l 20 0 l -10 20 a 193 193 0 0 1 32.53 2.76 l 2.43 -13.79 l 1.97 0.35 l -2.43 13.79 a 193 193 0 0 1 29.63 7.86 l 4.79 -13.16 l 1.88 0.68 l -4.79 13.16 a 193 193 0 0 1 28.76 13.22 l 14 -24.25 l 1.73 1 l -14 24.25 a 193 193 0 0 1 38.56 29.26 l 9.9 -9.9 l 1.41 1.41 l -9.9 9.9 a 193 193 0 0 1 29.67 38.24 l 24.24 -14 l 1 1.73 l -25.98 15 a 191 191 0 0 0 -330.8 0 l -25.98 -15 l 1 -1.73 l 24.25 14 a 193 193 0 0 1 29.67 -38.24 l -9.9 -9.9 l 1.41 -1.41 l 9.9 9.9 a 193 193 0 0 1 38.56 -29.26 l -14 -24.25 l 1.73 -1 l 14 24.25 a 193 193 0 0 1 28.76 -13.22 l -4.79 -13.16 l 1.88 -0.68 l 4.79 13.16 a 193 193 0 0 1 29.63 -7.86 l -2.43 -13.79 l 1.97 -0.35 l 2.43 13.79 a 193 193 0 0 1 32.53 -2.76" fill="#fff" stroke="black" stroke-width=".5" />
          </svg>
          <div class="attitude-cutout" ref={this.cutoutElement} style="transform: rotate(0deg)">
            <div class="attitude-inner-bank" ref={this.innerBankElement} style="transform: rotate(0deg)">
              <div class="attitude-pitchlines" style="transform: translate3d(0px, 0px, 0px)" ref={this.pitchLinesContainer}>
                <svg width="414px" style="overflow:visible">
                  <g class="pitchLines" ref={this.pitchLinesGroup}>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <svg width="414" height="315">
          <path d="M 47 204 l -3 -4 l -43 0 l 0 4 " fill="rgb(255,255,0)" stroke="black" stroke-width="1px" />
          <path d="M 47 204 l -3 4 l -43 0 l 0 -4 " fill="rgb(152,140,0)" stroke="black" stroke-width="1px" />
          <path d="M 365 204 l 3 -4 l 43 0 l 0 4 " fill="rgb(255,255,0)" stroke="black" stroke-width="1px" />
          <path d="M 365 204 l 3 4 l 43 0 l 0 -4 " fill="rgb(152,140,0)" stroke="black" stroke-width="1px" />
          <path d="M 207 204 l 0 -1 l -120 31 l 35 0 " fill="rgb(255,255,0)" stroke="black" stroke-width=".5px" />
          <path d="M 207 204 l -66 30 l -19 0 " fill="rgb(152,140,0)" stroke="black" stroke-width=".5px" />
          <path d="M 207 204 l 0 -1 l 120 31 l -35 0 " fill="rgb(255,255,0)" stroke="black" stroke-width=".5px" />
          <path d="M 207 204 l 66 30 l 19 0 " fill="rgb(152,140,0)" stroke="black" stroke-width=".5px" />
          <path d="M 207 214 m 0 -192 l -10 20 l 20 0 l -10 -20 " fill="#fff" stroke="black" stroke-width=".5" />
        </svg>
        <div class='ahrs-align-msg' ref={this.ahrsAlign}>AHRS ALIGN: Keep Wings Level</div>
      </div>
    );
  }
}
