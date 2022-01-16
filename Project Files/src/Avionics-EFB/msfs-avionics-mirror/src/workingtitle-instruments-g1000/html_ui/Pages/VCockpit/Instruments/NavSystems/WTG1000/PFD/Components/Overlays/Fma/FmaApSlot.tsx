import { FSComponent, DisplayComponent, VNode, Subject } from 'msfssdk';
import './FmaApSlot.css';

/** Props for the FMA AP Slot Component */
export interface FmaApSlotProps {
  /** The current armed mode */
  isActive: Subject<boolean>;
}

/** A FMA Mode AP Slot */
export class FmaApSlot extends DisplayComponent<FmaApSlotProps> {
  private timeout?: number;
  private el = FSComponent.createRef<HTMLDivElement>();
  private readonly apLabel = Subject.create<string>('');

  /** @inheritdoc */
  public onAfterRender(): void {
    this.props.isActive.sub(this.onActiveChanged.bind(this));
  }

  /**
   * Called when the autopilot is activated or deactivated.
   * @param active Whether or not the autopilot is active.
   */
  private onActiveChanged(active: boolean): void {
    clearTimeout(this.timeout);
    if (!active) {
      this.el.instance.classList.add('fma-ap-alert');
      this.timeout = setTimeout(() => {
        this.el.instance.classList.remove('fma-ap-alert');
        this.apLabel.set('');
      }, 10000) as unknown as number;
    } else {
      this.apLabel.set('AP');
      this.el.instance.classList.remove('fma-ap-alert');
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div id='CenterBarBottomMiddle'><span ref={this.el}>{this.apLabel}</span></div>
    );
  }
}