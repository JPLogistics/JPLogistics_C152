import { ComponentProps, DisplayComponent, FSComponent, VNode } from 'msfssdk';

import './FailedBox.css';

/**
 * Props on the FailedBox component.
 */
interface FailedBoxProps extends ComponentProps {
  /** The color of the box. */
  color?: 'red' | 'blue';
}

/**
 * A component that displays a failed instrument box.
 */
export class FailedBox extends DisplayComponent<FailedBoxProps> {
  private readonly el = FSComponent.createRef<SVGImageElement>();

  private parentSize = { width: 0, height: 0 };
  private hasChangedSize = false;
  private sizeValidatedFrames = 0;

  /**
   * Sets whether the failed instrument box should be displayed.
   * @param isFailed True if the instrument is failed, false otherwise.
   */
  public setFailed(isFailed: boolean): void {
    if (isFailed) {
      this.el.instance.classList.remove('hidden');
    } else {
      this.el.instance.classList.add('hidden');
    }
  }

  /** @inheritdoc */
  public onAfterRender(): void {
    this.resetSize();
  }

  /**
   * Resets the size of the failed box.
   */
  public resetSize(): void {
    const parentEl = this.el.instance.parentElement;
    if (parentEl !== null) {
      window.requestAnimationFrame(this.validateSize);
    }
  }

  /**
   * Validates and processes any init size changes for the parent div.
   */
  private validateSize = (): void => {
    const parentEl = this.el.instance.parentElement;
    if (parentEl !== null) {
      const width = parentEl.offsetWidth;
      const height = parentEl.offsetHeight;

      if (this.parentSize.width !== width || this.parentSize.height !== height) {
        this.hasChangedSize = true;

        this.parentSize.width = width;
        this.parentSize.height = height;
        this.sizeValidatedFrames = 0;
      }

      if (this.hasChangedSize) {
        this.sizeValidatedFrames++;

        this.el.instance.setAttribute('viewBox', `0 0 ${width} ${height}`);
        this.el.instance.setAttribute('width', width.toFixed(8));
        this.el.instance.setAttribute('height', height.toFixed(8));

        this.el.instance.classList.add(this.props.color !== undefined ? this.props.color : 'red');

        while (this.el.instance.hasChildNodes()) {
          this.el.instance.removeChild(this.el.instance.childNodes[0]);
        }

        FSComponent.render(<><line x1='0' y1='0' x2={width} y2={height} /></>, this.el.instance);
        FSComponent.render(<><line x1='0' y1={height} x2={width} y2='0' /></>, this.el.instance);
      }

      if (this.sizeValidatedFrames < 16) {
        window.requestAnimationFrame(this.validateSize);
      }
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <svg ref={this.el} class='failed-box' />
    );
  }
}