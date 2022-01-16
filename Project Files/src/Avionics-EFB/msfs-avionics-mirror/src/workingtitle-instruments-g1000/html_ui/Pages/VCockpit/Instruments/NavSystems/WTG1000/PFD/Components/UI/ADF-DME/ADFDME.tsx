import { ComputedSubject, FSComponent, Subject, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { UiView, UiViewProps } from '../../../../Shared/UI/UiView';
import { ArrowToggle } from '../../../../Shared/UI/UIControls/ArrowToggle';
import { NavIndicatorController } from '../../../../Shared/Navigation/NavIndicatorController';
import { ADFFreqInput } from './ADFFreqInput';
import { RadioEvents } from 'msfssdk/instruments';

import './ADFDME.css';

/**
 * The properties for the ADFDME
 * component.
 */
interface ADFDMEProps extends UiViewProps {
  /** An instance of the event bus. */
  bus: EventBus;
  /** An instance of the NavIndicatorController. */
  navIndicatorController: NavIndicatorController;
}

/**
 * The ADFDME
 * component.
 */
export class ADFDME extends UiView<ADFDMEProps> {

  // private adfdmeToggleOptions = ['ADF', 'ANT', 'ADF/BFO', 'ANT/BFO'];
  private adfdmeToggleOptions = ['ADF'];

  private dmeToggleOptions = ['NAV1', 'NAV2'];

  private freqComponentRef = FSComponent.createRef<ADFFreqInput>();

  public adfInputSubject = Subject.create(0);

  private adfActiveFreq = ComputedSubject.create(0, (v): string => {
    if (isNaN(v) || v <= 0) {
      return '----.-';
    } else {
      return v.toFixed(1);
    }
  });

  public enterToTransferSubject = Subject.create('');


  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    const adf = this.props.bus.getSubscriber<RadioEvents>();
    adf.on('adf1ActiveFreq').whenChanged().handle((f) => {
      this.adfActiveFreq.set(f);
    });
    adf.on('adf1StandbyFreq').whenChanged().handle((f) => {
      this.adfInputSubject.set(Math.round(f * 10) / 10);
      this.freqComponentRef.instance.setFreq();
    });
  }

  // ---- TOGGLE ADF MODE CALLBACK
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onADFToggleSelected = (index: number): void => {
    // console.log('MODE TOGGLED:' + index);
  };

  private onDmeToggleSelected = (index: number): void => {
    this.props.navIndicatorController.dmeSourceIndex.set(index);
  };

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class='popout-dialog' ref={this.viewContainerRef}>
        <h1>{this.props.title}</h1>
        <div class="ADFDME-adf-row1">
          <div>ADF</div>
          <div class="ADFDME-active-adf">{this.adfActiveFreq}</div>
          <div>
            <svg width="25" height="16">
              <path d="M 12 8 m 0 0.75 l -5 0 l 1 3.25 l 0 1 l -4.5 -5 l 4.5 -5 l 0 1 l -1 3.25 l 10 0 l -1 -3.25 l 0 -1 l 4.5 5 l -4.5 5 l 0 -1 l 1 -3.25 l -5 0 z" fill="cyan" />
            </svg>
          </div>
          <ADFFreqInput ref={this.freqComponentRef} adfInputSubject={this.adfInputSubject} onRegister={this.register} enterToTransferSubject={this.enterToTransferSubject} />
        </div>
        <div class="ADFDME-adf-row2">
          <div>MODE</div>
          <ArrowToggle onRegister={this.register} onOptionSelected={this.onADFToggleSelected} options={this.adfdmeToggleOptions} />
          <div>VOL</div>
          <div class="cyan size16">100%</div>
        </div>
        <hr />
        <div class="ADFDME-dme-row1">
          <div>DME</div>
          <div>MODE</div>
          <div class="ADFDME-dme-select">
            <ArrowToggle onRegister={this.register} onOptionSelected={this.onDmeToggleSelected} options={this.dmeToggleOptions} />
          </div>
        </div>
        <hr />
        <div class="ADFDME-ent-transfer">{this.enterToTransferSubject}</div>
      </div>
    );
  }
}