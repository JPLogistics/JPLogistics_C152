import { ComponentProps, DisplayComponent, FSComponent, VNode } from 'msfssdk';

import './GroupBox.css';
/**
 * The properties for the GroupBox component.
 */
interface GroupBoxProps extends ComponentProps {
  /** An instance of the event bus. */
  title: string;
  /** The class of the group box container */
  class?: string;
}

/**
 * The GroupBox component.
 */
export class GroupBox extends DisplayComponent<GroupBoxProps> {

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class={`groupbox ${this.props.class ?? ''}`}>
        <div class='groupbox-container'>
          {this.props.children}
        </div>
        <div class="groupbox-title">{this.props.title}</div>
      </div>
    );
  }
}