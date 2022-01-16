import { FSComponent, DisplayComponent, VNode, ComputedSubject, Subject } from 'msfssdk';
import './FmaDisplaySlot.css';

/** Props for the FMA Display Slot Component */
export interface FmaDisplaySlotProps<T> {
  /** The CSS class for the FMA Dislay Slot */
  class: string;
  /** The current armed mode */
  armed: ComputedSubject<T, string> | Subject<string>;
  /** The current secondary armed mode */
  secondaryArmed?: ComputedSubject<T, string> | Subject<string>;
  /** The new active mode to display */
  active: ComputedSubject<T, string> | Subject<string>;
  /** If the mode has failed */
  isFailed: Subject<boolean>;
}

/** A FMA Mode Display Slot */
export class FmaDisplaySlot<T> extends DisplayComponent<FmaDisplaySlotProps<T>> {
  private currentArmedMode?: string;
  private currentSecondaryArmedMode?: string;
  private timeout?: number;
  private activeFailed = false;
  private active = Subject.create('');
  private el = FSComponent.createRef<HTMLDivElement>();

  /** @inheritdoc */
  public onAfterRender(): void {
    this.props.isFailed.sub((v) => {
      if (v) {
        this.activeFailed = true;
        this.onFailed(true);
      }
    });
    this.props.armed.sub(armed => this.currentArmedMode = armed);
    this.props.secondaryArmed?.sub(armed => this.currentSecondaryArmedMode = armed);
    this.props.active.sub(this.onActiveChanged.bind(this));
  }

  /**
   * Called when the active mode changes to set the flash class if required.
   * @param active is the active mode.
   */
  private onActiveChanged(active: string): void {
    if (!this.activeFailed) {
      this.active.set(this.props.active.get());
      if (this.currentArmedMode === active || this.currentSecondaryArmedMode === active || this.isDualVerticalTransition(active)) {
        this.el.instance.classList.add('fma-slot-alert');
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
          this.el.instance.classList.remove('fma-slot-alert');
        }, 10000) as unknown as number;
      } else {
        this.el.instance.classList.remove('fma-slot-alert');
      }
    }
  }

  /**
   * Called when the active mode fails to set the flash class if required.
   * @param failed is if the mode failed.
   */
  private onFailed(failed: boolean): void {
    if (failed) {
      this.el.instance.classList.remove('fma-slot-alert');
      this.el.instance.classList.add('fma-slot-failed');
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.el.instance.classList.remove('fma-slot-failed');
        this.activeFailed = false;
        this.onActiveChanged(this.props.active.get());
      }, 5000) as unknown as number;
    }
  }

  /**
   * Checks whether the active mode transition is coming from a combined dual vertical armed mode.
   * @param active is the active mode.
   * @returns True if coming from a dual mode, false otherwise;
   */
  private isDualVerticalTransition(active: string): boolean {
    return (this.currentSecondaryArmedMode === 'GP/V' && (active === 'GP' || active === 'VPTH'))
      || (this.currentSecondaryArmedMode === 'GS/V' && (active === 'GS' || active === 'VPTH'));
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class={this.props.class}><span ref={this.el}>{this.active}</span></div>
    );
  }
}