import { FSComponent, DisplayComponent, VNode, Subject, ComponentProps } from 'msfssdk';
import { WindData, WindOverlayRenderOption } from '../../../../Shared/UI/Controllers/WindOptionController';

/**
 * The properties on the wind option display component.
 */
export interface WindOptionProps extends ComponentProps {
  /** The wind data subject. */
  windData: Subject<WindData>;
  /** The render option subject. */
  renderOption: Subject<WindOverlayRenderOption>;
  /** The aircraft heading subject. */
  aircraftHeading?: Subject<number>;
}

/**
 * The Wind Option Component
 */
export abstract class WindOption extends DisplayComponent<WindOptionProps> {
  protected readonly containerRef = FSComponent.createRef<HTMLDivElement>();


  /**
   * Do stuff after rendering.
   */
  public onAfterRender(): void {
    //noop
  }

  /**
   * Set as visible or not.
   * @param isVisible is whether to set this visible or not.
   */
  public setVisible(isVisible: boolean): void {
    if (isVisible) {
      this.containerRef.instance.classList.remove('disabled');
    } else {
      this.containerRef.instance.classList.add('disabled');
    }
  }

  /**
   * Renders the component - to be overridden.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div />
    );
  }
}
