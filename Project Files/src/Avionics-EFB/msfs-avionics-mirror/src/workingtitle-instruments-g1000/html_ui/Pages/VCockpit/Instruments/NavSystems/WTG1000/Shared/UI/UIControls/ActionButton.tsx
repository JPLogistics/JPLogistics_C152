import { FSComponent, Subject, VNode } from 'msfssdk';
import { UiControl, UiControlProps } from '../UiControl';

import './ActionButton.css';

/**
 * The properties for the ActionButton component.
 */
interface ActionButtonProps extends UiControlProps {
  /** The text to be displayed on the button. */
  text: string | Subject<string>;
  onExecute(): void;
}

/**
 * The ActionButton component.
 */
export class ActionButton extends UiControl<ActionButtonProps> {
  /** @inheritdoc */
  public onEnter(): boolean {
    this.props.onExecute();
    return true;
  }

  /** @inheritdoc */
  renderControl(): VNode {
    return (
      <div class="action-button">{this.props.text}</div>
    );
  }

}