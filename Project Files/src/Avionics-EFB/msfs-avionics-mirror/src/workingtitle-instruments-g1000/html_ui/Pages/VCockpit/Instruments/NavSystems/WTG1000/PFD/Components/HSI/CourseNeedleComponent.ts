import { ComponentProps, DisplayComponent, NavMath, NodeReference } from 'msfssdk';
import { NeedleAnimator } from './NeedleAnimator';

/**
 * The props on the Nav1Needle component.
 */
interface CourseNeedleProps extends ComponentProps {

  /** A prop to define whether this is for the map or rose. */
  hsiMap: boolean;
}

/**
 * An interface that describes a course needle component.
 */
export abstract class CourseNeedleComponent extends DisplayComponent<CourseNeedleProps> {

  protected readonly needleRef = new NodeReference<HTMLDivElement>();

  protected readonly deviationRef = new NodeReference<HTMLDivElement>();

  protected readonly toFromRef = new NodeReference<HTMLDivElement>();

  protected animator?: NeedleAnimator;

  protected currentDeviation = 0;

  /**
   * A callback called after rendering completes.
   */
  public onAfterRender(): void {
    this.animator = new NeedleAnimator(this.needleRef);
  }

  /**
   * Sets the rotation of the course needle.
   * @param rotation The rotation of the course needle.
   */
  public setRotation(rotation: number): void {
    this.animator && this.animator.rotateTo(rotation);
  }

  /**
   * Sets the deviation of the course needle.
   * @param deviation The deviation of the course needle.
   */
  public setDeviation(deviation: number): void {
    this.currentDeviation = deviation;
    const deviationPercent = this.currentDeviation;
    const deviationPixels = NavMath.clamp(deviationPercent, -1, 1) * 80;
    this.deviationRef.instance.style.transform = `translate3d(${deviationPixels}px, 0px, 0px)`;
  }

  /**
   * Sets whether or not the course needle is visible.
   * @param isVisible The visibility of the course needle.
   */
  public setVisible(isVisible: boolean): void {
    this.needleRef.instance.style.display = isVisible ? '' : 'none';
  }

  /**
   * Sets whether or not the course deviation indicator is visible.
   * @param isVisible The visibility of the course deviation indicator.
   */
  public setDeviationVisible(isVisible: boolean): void {
    this.deviationRef.instance.style.display = isVisible ? '' : 'none';
    this.toFromRef.instance.style.display = isVisible ? '' : 'none';
  }

  /**
   * Sets whether the to/from flag should indicate to or from.
   * @param from a bool set to true when the flag should be set to FROM.
   */
  public setFromFlag(from: boolean): void {
    this.toFromRef.instance.style.transform = from ? 'rotate3d(0, 0, 1, 180deg)' : 'rotate3d(0, 0, 1, 0deg)';
  }
}