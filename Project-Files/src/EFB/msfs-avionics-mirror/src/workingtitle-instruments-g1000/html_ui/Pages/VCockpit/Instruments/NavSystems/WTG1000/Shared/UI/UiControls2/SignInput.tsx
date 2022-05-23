import { FSComponent, Subject, VNode } from 'msfssdk';
import { DebounceTimer } from 'msfssdk/utils/time';
import { G1000UiControl, G1000UiControlProps } from '../G1000UiControl';

import './SignInput.css';

/**
 * Component props for SignInput.
 */
export interface SignInputProps extends G1000UiControlProps {
  /** A subject which is bound to the input sign value. */
  sign: Subject<1 | -1>;

  /**
   * The duration, in milliseconds, of the applied solid highlight when this input is focused or edited. Defaults to
   * 1000.
   */
  solidHighlightDuration?: number;

  /** CSS class(es) to apply to the root of the component. */
  class?: string;
}

/**
 * An input control which allows the user to select a numeric sign (+ or −).
 */
export class SignInput extends G1000UiControl<SignInputProps> {
  private static readonly DEFAULT_SOLID_HIGHLIGHT_DURATION = 1000; // milliseconds

  private readonly rootRef = FSComponent.createRef<HTMLDivElement>();

  private readonly signText = this.props.sign.map(sign => sign > 0 ? '+' : '−');

  protected readonly solidHighlightTimer = new DebounceTimer();

  /** @inheritdoc */
  protected onFocused(source: G1000UiControl): void {
    super.onFocused(source);

    this.applySolidHighlight(this.props.solidHighlightDuration ?? SignInput.DEFAULT_SOLID_HIGHLIGHT_DURATION);
  }

  /** @inheritdoc */
  protected onBlurred(source: G1000UiControl): void {
    super.onBlurred(source);

    this.rootRef.instance.classList.remove('highlight-active');
    this.rootRef.instance.classList.remove('highlight-select');
    this.solidHighlightTimer.clear();
  }

  /** @inheritdoc */
  protected onEnabled(source: G1000UiControl): void {
    super.onEnabled(source);

    this.rootRef.instance.classList.remove('input-disabled');
  }

  /** @inheritdoc */
  protected onDisabled(source: G1000UiControl): void {
    super.onDisabled(source);

    this.rootRef.instance.classList.add('input-disabled');
  }

  /**
   * Applies a solid highlight to this input.
   * @param duration The duration, in milliseconds, of the highlight.
   */
  protected applySolidHighlight(duration: number): void {
    this.rootRef.instance.classList.remove('highlight-select');
    this.rootRef.instance.classList.add('highlight-active');

    this.solidHighlightTimer.schedule(() => {
      this.rootRef.instance.classList.remove('highlight-active');
      if (this.isFocused) {
        this.rootRef.instance.classList.add('highlight-select');
      }
    }, duration);
  }

  /** @inheritdoc */
  public onUpperKnobInc(): boolean {
    this.changeSign();
    return true;
  }

  /** @inheritdoc */
  public onUpperKnobDec(): boolean {
    this.changeSign();
    return true;
  }

  /**
   * Changes this input's sign value.
   */
  private changeSign(): void {
    this.props.sign.set(this.props.sign.get() * -1 as 1 | -1);
    this.applySolidHighlight(this.props.solidHighlightDuration ?? SignInput.DEFAULT_SOLID_HIGHLIGHT_DURATION);
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <span ref={this.rootRef} class={`sign-input ${this.props.class ?? ''}`}>{this.signText}</span>
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    this.solidHighlightTimer.clear();
    this.signText.destroy();
  }
}