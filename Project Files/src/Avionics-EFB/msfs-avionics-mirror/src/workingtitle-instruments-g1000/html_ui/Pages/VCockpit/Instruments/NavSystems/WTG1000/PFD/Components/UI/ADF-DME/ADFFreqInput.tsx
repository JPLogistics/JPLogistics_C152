import { FSComponent, VNode, Subject, MathUtils } from 'msfssdk';
import { UiControlProps, UiControl } from '../../../../Shared/UI/UiControl';
import { NumberInput } from '../../../../Shared/UI/UIControls/NumberInput';

// import './TimerInput.css';

/**
 * The properties on the timer input component.
 */
interface ADFFreqInputProps extends UiControlProps {
  /** An instance of the timer. */
  adfInputSubject: Subject<number>;
  /** The enterToTransfer Message Subject. */
  enterToTransferSubject: Subject<string>;
}

/**
 * The TimerInput Component.
 */
export class ADFFreqInput extends UiControl<ADFFreqInputProps> {
  private readonly inputCtrls: NumberInput[] = [];
  private activeInput!: NumberInput;
  private highlightIndex = 0;

  /** @inheritdoc */
  public onAfterRender(): void {
    super.onAfterRender();

    this.focusSubject.sub((v) => {
      if (v) {
        this.props.enterToTransferSubject.set('ENT TO TRANSFER');
      } else {
        this.props.enterToTransferSubject.set('');
      }
    });
  }

  private freqSubjects = [
    Subject.create(0),
    Subject.create(0),
    Subject.create(0),
    Subject.create(0),
    Subject.create(0)
  ]

  /**
   * Sets and formats the freq.
   */
  public setFreq(): void {
    if (!this.getIsActivated()) {
      const freq = this.props.adfInputSubject.get();
      const thousands = Math.floor(freq / 1000);
      const hundreds = Math.floor((freq - (thousands * 1000)) / 100);
      const tens = Math.floor((freq - (thousands * 1000) - (hundreds * 100)) / 10);
      const ones = Math.floor(freq - (thousands * 1000) - (hundreds * 100) - (tens * 10));
      const decimal = Math.round(10 * (freq - Math.floor(freq)));
      this.freqSubjects[0].set(thousands);
      this.freqSubjects[1].set(hundreds);
      this.freqSubjects[2].set(tens);
      this.freqSubjects[3].set(ones);
      this.freqSubjects[4].set(decimal);
    }
  }


  /** @inheritdoc */
  public onUpperKnobInc(): void {
    if (!this.isActivated) {
      this.activate();
    } else {
      this.activeInput.onUpperKnobInc();
    }
  }

  /** @inheritdoc */
  public onUpperKnobDec(): void {
    if (!this.isActivated) {
      this.activate();
    } else {
      this.activeInput.onUpperKnobDec();
    }
  }

  /** @inheritdoc */
  public onLowerKnobInc(): void {
    this.highlightIndex++;
    this.highlightInput(this.highlightIndex);
  }

  /** @inheritdoc */
  public onLowerKnobDec(): void {
    this.highlightIndex--;
    this.highlightInput(this.highlightIndex);
  }

  /** @inheritdoc */
  public onEnter(): boolean {
    if (this.isActivated) {
      const value = this.freqSubjects[0].get() * 1000
        + this.freqSubjects[1].get() * 100
        + this.freqSubjects[2].get() * 10
        + this.freqSubjects[3].get()
        + this.freqSubjects[4].get() / 10;

      this.props.adfInputSubject.set(value);
      SimVar.SetSimVarValue('K:ADF_COMPLETE_SET', 'Frequency ADF BCD32', Avionics.Utils.make_adf_bcd32(value * 1000));
      this.deactivate();
      return true;
    } else {
      SimVar.SetSimVarValue('K:ADF1_RADIO_SWAP', 'number', 0);
      return true;
    }
  }

  /** @inheritdoc */
  public onClr(): boolean {
    this.deactivate();
    return true;
  }


  /**
   * Highlights the specified input control.
   * @param index The index of the input to highlight.
   */
  private highlightInput(index: number): void {
    if (this.activeInput) {
      this.activeInput.blur();
    }
    this.highlightIndex = MathUtils.clamp(index, 0, this.inputCtrls.length - 1);
    this.activeInput = this.inputCtrls[this.highlightIndex];
    this.activeInput.focus();
  }

  /**
   * Registers the inputs with this control
   * @param ctrl The number input to register.
   */
  private register = (ctrl: NumberInput): void => {
    this.inputCtrls.push(ctrl);
  }

  /** @inheritdoc */
  public onActivated(): void {
    this.highlightIndex = 0;
    this.getHighlightElement()?.classList.remove(UiControl.FOCUS_CLASS);
    this.highlightInput(this.highlightIndex);
  }

  /** @inheritdoc */
  public onDeactivated(): void {
    this.activeInput.blur();
    if (this.getIsFocused()) {
      this.getHighlightElement()?.classList.add(UiControl.FOCUS_CLASS);
    }
  }

  /** @inheritdoc */
  renderControl(): VNode {
    return (
      <div class="ADFDME-standby-adf">
        <NumberInput onRegister={this.register} dataSubject={this.freqSubjects[0]} minValue={0} maxValue={1} increment={1} wrap={true} class='timerref-timer-number' />
        <NumberInput onRegister={this.register} dataSubject={this.freqSubjects[1]} minValue={0} maxValue={9} increment={1} wrap={true} class='timerref-timer-number' />
        <NumberInput onRegister={this.register} dataSubject={this.freqSubjects[2]} minValue={0} maxValue={9} increment={1} wrap={true} class='timerref-timer-number' />
        <NumberInput onRegister={this.register} dataSubject={this.freqSubjects[3]} minValue={0} maxValue={9} increment={1} wrap={true} class='timerref-timer-number' />.
        <NumberInput onRegister={this.register} dataSubject={this.freqSubjects[4]} minValue={0} maxValue={9} increment={1} wrap={true} class='timerref-timer-number' />
      </div>
    );
  }
}
