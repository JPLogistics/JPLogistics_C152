import { ComponentProps, ComputedSubject, ArraySubject, DisplayComponent, FSComponent, Subject, VNode, SubscribableArrayEventType } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { UiControl, UiControlProps } from '../UiControl';

import './ArrowToggle.css';

/**
 * The properties for the ArrowToggle component.
 */
interface ArrowToggleComponentProps extends UiControlProps {
  /** The settable options for this toggle. */
  options: string[];

  /** A callback method to output the updated text to. */
  onOptionSelected?(optionIndex: number): void;

  /** Data binding for the selected option */
  dataref?: Subject<number>;
}

/**
 * A class to define an arrow toggle/select UI element
 */
export class ArrowToggle extends UiControl<ArrowToggleComponentProps>{
  private readonly valueContainerRef = FSComponent.createRef<HTMLElement>();

  private readonly selectedOption = ComputedSubject.create(this.props.dataref?.get() ?? 0, (v) => {
    return this.props.options[v];
  });
  private readonly leftArrEnabled = ComputedSubject.create(false, (v): string => {
    return v ? 'rgb(0,255,0)' : 'rgb(50,50,50)';
  });
  private readonly rightArrEnabled = ComputedSubject.create(true, (v) => {
    return v ? 'rgb(0,255,0)' : 'rgb(50,50,50)';
  });

  /**
   * Ctor
   * @param props The props.
   */
  constructor(props: ArrowToggleComponentProps) {
    super(props);
    this.setArrows();

    if (this.props.options instanceof ArraySubject) {
      this.props.options.sub((index, type) => {
        if (type === SubscribableArrayEventType.Cleared) {
          return;
        }

        this.selectedOption.set(this.props.dataref?.get() ?? 0);
        this.setArrows();
      });
    }
    this.selectedOption.sub(() => {
      this.setArrows();
    });

    if (this.props.dataref) {
      this.props.dataref.sub((v) => {
        this.selectedOption.set(v);
      });
    }
  }

  /** @inheritdoc */
  public onUpperKnobInc(): void {
    this.scrollOption('next');
  }

  /** @inheritdoc */
  public onUpperKnobDec(): void {
    this.scrollOption('prev');
  }

  /**
   * Sets the next option in the direction.
   * @param direction is the direction to scroll
   */
  private scrollOption(direction: 'next' | 'prev'): void {
    let idx = this.selectedOption.getRaw();
    idx = Math.max(0, Math.min(this.props.options.length - 1, ((direction === 'next') ? idx + 1 : idx - 1)));
    this.selectedOption.set(idx);
    this.props.dataref?.set(idx);
    if (this.props.onOptionSelected !== undefined) {
      this.props.onOptionSelected(idx);
    }
  }

  /** Enables/Disables the arrows. */
  private setArrows(): void {
    this.leftArrEnabled.set(this.selectedOption.getRaw() > 0);
    this.rightArrEnabled.set(this.selectedOption.getRaw() < this.props.options.length - 1);
  }

  /** @inheritdoc */
  public getHighlightElement(): Element | null {
    return this.valueContainerRef.instance;
  }

  /** @inheritdoc */
  renderControl(): VNode {
    return (
      <div class="arrow-toggle-container">
        <svg viewBox='0 0 5 10'>
          <path d='M 0 0 l 0 10 l 5 -5 z' fill={this.rightArrEnabled} />
        </svg>
        <div ref={this.valueContainerRef} class="arrow-toggle-value">{this.selectedOption}</div>
        <svg viewBox='0 0 5 10'>
          <path d='M 5 0 l 0 10 l -5 -5 z' fill={this.leftArrEnabled} />
        </svg>
      </div>
    );
  }
}


// ------------ THE OLD ONE. REMOVE SOOOOON

/**
 * @interface InputComponentProps
 * @augments {ComponentProps}
 */
interface ArrowToggleComponentProps_OLD extends ComponentProps {
  /** An instance of the event bus. */
  bus: EventBus;

  /** The settable options for this toggle. */
  options: string[];

  /** A callback method to output the updated text to. */
  onOptionSelected?(optionIndex: number): void;

  /** The initial option to be selected on init */
  initialSelection?: number;
}

/**
 * A class to define an arrow toggle/select UI element
 * @class ArrowToggle
 * @augments {DisplayComponent<ArrowToggleComponentProps_OLD>}
 */
export class ArrowToggle_OLD extends DisplayComponent<ArrowToggleComponentProps_OLD> {

  private leftArrowRef = FSComponent.createRef<SVGPathElement>();
  private rightArrowRef = FSComponent.createRef<SVGPathElement>();
  public selectedOptionIndex = 0;
  public isActive = false;
  private selectedOptionStr = Subject.create('OFF');

  /**
   * Method to set the selected option.
   * @param optionIndex is a string containing the start text value
   */
  public selectOption(optionIndex: number): void {
    this.selectedOptionIndex = optionIndex > this.props.options.length - 1 ? 0 : optionIndex < 0 ? this.props.options.length - 1 : optionIndex;
    this.selectedOptionStr.set(this.props.options[optionIndex]);
    this.setArrows();
  }

  /**
   * Method to increment to the next selected option.
   */
  public incOption(): void {
    if (this.selectedOptionIndex != this.props.options.length - 1) {
      this.selectOption(this.selectedOptionIndex + 1);
    }
  }

  /**
   * Method to decrement to the next selected option.
   */
  public decOption(): void {
    if (this.selectedOptionIndex != 0) {
      this.selectOption(this.selectedOptionIndex - 1);
    }
  }

  /**
   * Method to set this toggle component active or inactive.
   * @param active is whether to set this component active or not.
   */
  public setActive(active: boolean): void {
    this.isActive = active;
  }

  /**
   * Method to set the arrow display.
   */
  private setArrows(): void {
    if (this.selectedOptionIndex < this.props.options.length - 1) {
      this.rightArrowRef.instance?.setAttribute('fill', 'rgb(0,255,0)');
    } else {
      this.rightArrowRef.instance?.setAttribute('fill', 'rgb(50,50,50)');
    }
    if (this.selectedOptionIndex > 0) {
      this.leftArrowRef.instance?.setAttribute('fill', 'rgb(0,255,0)');
    } else {
      this.leftArrowRef.instance?.setAttribute('fill', 'rgb(50,50,50)');
    }
  }


  /**
   * Do stuff after rendering.
   */
  onAfterRender(): void {
    if (this.props.initialSelection !== undefined && this.props.initialSelection >= 0) {
      this.selectOption(this.props.initialSelection);
    } else {
      this.selectOption(0);
    }
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  render(): VNode | null {
    return (
      <div class="arrow-toggle-container">
        <svg width="5" height="10">
          <path ref={this.rightArrowRef} d='M 0 0 l 0 10 l 5 -5 z' fill="rgb(0,255,0)" />
        </svg>
        <div class="toggle-value">{this.selectedOptionStr}</div>
        <svg class="toggle-arrows" width="5" height="10">
          <path ref={this.leftArrowRef} d='M 0 0 m 5 0 l 0 10 l -5 -5 z' fill="rgb(0,255,0)" />
        </svg>
      </div>
    );
  }

}

