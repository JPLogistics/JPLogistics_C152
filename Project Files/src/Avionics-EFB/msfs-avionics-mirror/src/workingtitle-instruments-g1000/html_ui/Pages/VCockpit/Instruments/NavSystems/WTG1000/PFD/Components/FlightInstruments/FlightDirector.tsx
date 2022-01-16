import { FSComponent, DisplayComponent, VNode, MathUtils, SimpleMovingAverage, LinearServo } from 'msfssdk';
import { Consumer, EventBus } from 'msfssdk/data';
import { APEvents, ADCEvents, ClockEvents } from 'msfssdk/instruments';

import { G1000ControlEvents } from '../../../Shared/G1000Events';
import { PFDUserSettings } from '../../PFDUserSettings';

import './FlightDirector.css';


/**
 * The properties for the flight director component.
 */
interface FlightDirectorProps {
  /** An instance of the event bus. */
  bus: EventBus;
}

/**
 * The PFD Flight Director.
 */
export class FlightDirector extends DisplayComponent<FlightDirectorProps> {
  private fltDirectorRef = FSComponent.createRef<HTMLElement>();
  private currentBank = 0;
  private fdRawBank = 0;
  private fdServoBank = 0
  private currentPitch = 0;
  private pitchIncrementDistance = 1;
  private fdRawPitch = 0;
  private bankServo = new LinearServo(5);
  private pitchAverage = new SimpleMovingAverage(20);
  private needUpdate = false;

  private readonly fdPitchHandler = (fdPitch: number): void => {
    this.fdRawPitch = fdPitch;
    this.needUpdate = true;
  };
  private readonly fdBankHandler = (fdBank: number): void => {
    this.fdRawBank = fdBank;
    this.needUpdate = true;
  };
  private readonly pitchHandler = (pitch: number): void => {
    this.currentPitch = pitch;
    this.needUpdate = true;
  };
  private readonly bankHandler = (bank: number): void => {
    this.currentBank = bank;
    this.needUpdate = true;
  };
  private readonly fdStateConsumer: Consumer<boolean>;
  private readonly fdPitchConsumer: Consumer<number>;
  private readonly fdBankConsumer: Consumer<number>;
  private readonly pitchConsumer: Consumer<number>;
  private readonly bankConsumer: Consumer<number>;

  /** @inheritdoc */
  constructor(props: FlightDirectorProps) {
    super(props);
    const subscriber = this.props.bus.getSubscriber<APEvents & ADCEvents>();

    this.fdStateConsumer = subscriber.on('flight_director_state').whenChanged();
    this.fdPitchConsumer = subscriber.on('flight_director_pitch').withPrecision(2);
    this.fdBankConsumer = subscriber.on('flight_director_bank').withPrecision(2);
    this.pitchConsumer = subscriber.on('pitch_deg').withPrecision(2);
    this.bankConsumer = subscriber.on('roll_deg').withPrecision(2);
  }

  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    this.props.bus.getSubscriber<ClockEvents>().on('realTime').handle(this.updateFD.bind(this));

    this.fdStateConsumer.handle(this.toggleFltDir);

    this.props.bus.getSubscriber<G1000ControlEvents>().on('fd_not_installed').handle(v => {
      if (v) {
        this.fdStateConsumer.off(this.toggleFltDir);
        this.toggleFltDir(false);
      }
    });

    PFDUserSettings.getManager(this.props.bus).whenSettingChanged('svtToggle').handle((svt) => {
      svt ? this.pitchIncrementDistance = 1 : this.pitchIncrementDistance = .5;
      this.updateFD();
    });
  }

  /**
   * A callback called when the Flight Director is turned on or off.
   * @param state The bool state of the flight director status.
   */
  private toggleFltDir = (state: boolean): void => {
    if (state) {
      this.fdPitchConsumer.handle(this.fdPitchHandler);
      this.fdBankConsumer.handle(this.fdBankHandler);
      this.pitchConsumer.handle(this.pitchHandler);
      this.bankConsumer.handle(this.bankHandler);
      this.fltDirectorRef.instance.style.display = '';
    } else {
      this.fdPitchConsumer.off(this.fdPitchHandler);
      this.fdBankConsumer.off(this.fdBankHandler);
      this.pitchConsumer.off(this.pitchHandler);
      this.bankConsumer.off(this.bankHandler);
      this.fltDirectorRef.instance.style.display = 'none';
    }
  }

  /**
   * Updates the flight director.
   */
  private updateFD(): void {
    if (!this.needUpdate) {
      return;
    }
    this.fdServoBank = this.bankServo.drive(this.fdServoBank, this.fdRawBank);
    const correctedBank = this.fdServoBank - this.currentBank;
    const averagedPitch = this.pitchAverage.getAverage(this.fdRawPitch);
    const correctedPitch = MathUtils.clamp(averagedPitch - this.currentPitch, -10, 10);
    const translation = correctedPitch * this.pitchIncrementDistance * 13.5;
    this.fltDirectorRef.instance.style.transform = `translate3d(0px, ${translation}px, 0px) rotate3d(0, 0, 1, ${-correctedBank}deg)`;
    this.needUpdate = false;
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class="flight-director-container" ref={this.fltDirectorRef} >
        <svg width="414" height="315">
          <path d="M 207 204 l -120 30 l -14 -9 l 134 -22 z" fill="magenta" stroke="black" stroke-width=".5px" />
          <path d="M 73 225 l 0 9 l 14 0 z" fill="magenta" stroke="black" stroke-width=".5px" />
          <path d="M 207 204 l 120 30 l 14 -9 l -134 -22 z" fill="magenta" stroke="black" stroke-width=".5px" />
          <path d="M 341 225 l 0 9 l -14 0 z" fill="magenta" stroke="black" stroke-width=".5px" />
        </svg>
      </div>
    );
  }
}
