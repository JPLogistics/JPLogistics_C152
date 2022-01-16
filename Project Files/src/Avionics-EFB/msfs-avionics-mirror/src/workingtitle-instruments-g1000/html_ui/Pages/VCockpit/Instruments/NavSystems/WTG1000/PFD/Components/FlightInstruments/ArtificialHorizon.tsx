import { FSComponent, DisplayComponent, VNode, ComponentProps, Subscribable } from 'msfssdk';
import { SvtProjectionUtils } from '../../../Shared/UI/SvtProjectionUtils';
import { PlaneStateInfo } from './PrimaryHorizonDisplay';

import './ArtificialHorizon.css';

/**
 * Component props for ArtificialHorizon.
 */
export interface ArtificalHorizonProps extends ComponentProps {
  /** A subscribable which provides whether the artifical horizon is active. */
  isActive: Subscribable<boolean>;
}

/**
 * Artificial horizon
 */
export class ArtificialHorizon extends DisplayComponent<ArtificalHorizonProps> {
  private readonly containerRef = FSComponent.createRef<HTMLElement>();
  private readonly innerRef = FSComponent.createRef<HTMLElement>();

  private pxPerDegY = SvtProjectionUtils.projectYawPitch(0, 0.1 * Avionics.Utils.DEG2RAD, 0, new Float64Array(2))[1] * 5; // artificial horizon pitch ratio is half of svt

  /** @inheritdoc */
  onAfterRender(): void {
    this.props.isActive.sub(this.onIsActiveChanged.bind(this), true);
  }

  /**
   * Responds to changes in whether the artifical horizon is active.
   * @param active Whether the artifical horizon is active.
   */
  private onIsActiveChanged(active: boolean): void {
    this.containerRef.instance.style.display = active ? '' : 'none';
  }

  /**
   * Update method.
   * @param planeState The plane state info
   */
  public update(planeState: PlaneStateInfo): void {
    if (this.props.isActive.get()) {
      this.innerRef.instance.style.transform = `rotate(${planeState.roll}deg) translate3d(0px, ${planeState.pitch * this.pxPerDegY}px, 0px)`;
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class="artificial-horizon" ref={this.containerRef}>
        <div class="artificial-horizon-inner" ref={this.innerRef}>
          <div class="sky"></div>
          <div class="horizon"></div>
          <div class="ground"></div>
        </div>
      </div>
    );
  }
}