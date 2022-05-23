import { FSComponent, DisplayComponent, VNode, Subject, ComponentProps } from 'msfssdk';
import { WindData } from '../../../../Shared/UI/Controllers/WindOptionController';

/**
 * The properties on the wind option display component.
 */
export interface WindOptionProps extends ComponentProps {
  /** The wind data subject. */
  windData: Subject<WindData>;
  /** The aircraft heading subject. */
  aircraftHeading?: Subject<number>;
}

/**
 * The Wind Option Component
 */
export abstract class WindOption extends DisplayComponent<WindOptionProps> {
  protected readonly containerRef = FSComponent.createRef<HTMLDivElement>();
  private updateHandler = this.update.bind(this);

  /**
   * Update the component data.
   */
  protected abstract update(): void;

  /**
   * Resume this component.
   */
  private resume(): void {
    this.props.windData.sub(this.updateHandler, true);
    this.props.aircraftHeading?.sub(this.updateHandler);
  }

  /**
   * Pause this component.
   */
  private pause(): void {
    this.props.windData.unsub(this.updateHandler);
    this.props.aircraftHeading?.unsub(this.updateHandler);
  }

  /**
   * Set as visible or not.
   * @param isVisible is whether to set this visible or not.
   */
  public setVisible(isVisible: boolean): void {
    this.containerRef.instance.classList.toggle('hide-element', !isVisible);
    isVisible ? this.resume() : this.pause();
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
