import { NavMath, NodeReference } from 'msfssdk';

/**
 * Animates course and bearing needle elements.
 */
export class NeedleAnimator {

  private currentValue = 0;

  private targetValue = 0;

  /**
   * Creates an instance of a NeedleAnimator.
   * @param el The reference to the element to animate.
   */
  constructor(private el: NodeReference<HTMLDivElement>) {
    el.instance.addEventListener('transitionend', this.onTransitionEnd);
  }

  /**
   * Rotates the element to the supplied value in degrees.
   * @param val The value to rotate to.
   */
  public rotateTo(val: number): void {
    this.targetValue = val;
    const diff = Math.abs(NavMath.diffAngle(this.currentValue, this.targetValue));

    if (diff >= 2) {
      const turnDirection = NavMath.getTurnDirection(this.currentValue, this.targetValue);

      this.el.instance.classList.add('needle-transition');
      this.el.instance.style.transform = `rotate3d(0, 0, 1, ${this.currentValue + (diff * (turnDirection === 'right' ? 1 : -1))}deg)`;
    } else {
      this.currentValue = this.targetValue;
      this.el.instance.style.transform = `rotate3d(0, 0, 1, ${this.targetValue}deg)`;
    }
  }

  /**
   * A callback called when the needle animation transtion ends.
   */
  private onTransitionEnd = (): void => {
    this.el.instance.classList.remove('needle-transition');
    this.currentValue = this.targetValue;

    this.el.instance.style.transform = `rotate3d(0, 0, 1, ${this.targetValue}deg)`;
  }
}