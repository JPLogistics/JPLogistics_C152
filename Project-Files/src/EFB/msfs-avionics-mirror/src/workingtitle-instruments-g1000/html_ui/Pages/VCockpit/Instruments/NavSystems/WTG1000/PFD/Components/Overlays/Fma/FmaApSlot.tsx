import { FSComponent, DisplayComponent, VNode, Subject } from 'msfssdk';
import './FmaApSlot.css';

/** Props for the FMA AP Slot Component */
export interface FmaApSlotProps {
  /** The current armed mode */
  apActive: Subject<boolean>;
  /** The current YD state. */
  ydActive: Subject<boolean>;
}

/** A FMA Mode AP Slot */
export class FmaApSlot extends DisplayComponent<FmaApSlotProps> {
  private apTimeout?: number;
  private ydTimeout?: number;
  private divEl = FSComponent.createRef<HTMLDivElement>();
  private apEl = FSComponent.createRef<HTMLSpanElement>();
  private ydEl = FSComponent.createRef<HTMLSpanElement>();

  /** @inheritdoc */
  public onAfterRender(): void {
    this.props.apActive.sub(this.onApChanged.bind(this));
    this.props.ydActive.sub(this.onYdChanged.bind(this));
  }

  /**
   * Called when the autopilot is activated or deactivated.
   * @param active Whether or not the autopilot is active.
   */
  private onApChanged(active: boolean): void {
    clearTimeout(this.apTimeout);
    if (!active) {
      this.apEl.instance.classList.add('fma-ap-yd-alert');
      this.apTimeout = setTimeout(() => {
        this.apEl.instance.classList.remove('fma-ap-yd-alert');
        this.divEl.instance.classList.remove('fma-ap-displayed');
      }, 5000) as unknown as number;
    } else {
      this.apEl.instance.classList.remove('fma-ap-yd-alert');
      this.divEl.instance.classList.add('fma-ap-displayed');
    }
  }

  /**
   * Called when the yaw damper is activated or deactivated.
   * @param active Whether or not the yaw damper is active.
   */
  private onYdChanged(active: boolean): void {
    clearTimeout(this.ydTimeout);
    if (!active) {
      this.ydEl.instance.classList.add('fma-ap-yd-alert');
      this.ydTimeout = setTimeout(() => {
        this.ydEl.instance.classList.remove('fma-ap-yd-alert');
        this.divEl.instance.classList.remove('fma-yd-displayed');
      }, 5000) as unknown as number;
    } else {
      this.ydEl.instance.classList.remove('fma-ap-yd-alert');
      this.divEl.instance.classList.add('fma-yd-displayed');
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div id='CenterBarBottomMiddle' ref={this.divEl}>
        <span class='fma-ap-label' ref={this.apEl}>AP</span>
        <span class='fma-yd-label' ref={this.ydEl}>YD</span>
      </div>
    );
  }
}