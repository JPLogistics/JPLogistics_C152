import { FSComponent, SubscribableArray, VNode } from 'msfssdk';
import { FmsHEvent } from '../../../../Shared/UI/FmsHEvent';
import { G1000UiControl, G1000UiControlProps, G1000ControlList } from '../../../../Shared/UI/G1000UiControl';
import { UiView, UiViewProps } from '../../../../Shared/UI/UiView';
import { AlertMessage } from './AlertsSubject';
import { UiControl } from '../../../../Shared/UI/UiControl';
import { FocusPosition } from 'msfssdk/components/controls';

import './Alerts.css';

/**
 * The properties on the Alert component..
 */
interface AlertsProps extends UiViewProps {
  /** The data to display on the alert component. */
  data: SubscribableArray<AlertMessage>;
}

/**
 * A component that displays alert messages.
 */
export class Alerts extends UiView<AlertsProps> {
  private readonly containerRef = FSComponent.createRef<HTMLDivElement>();
  private readonly listRef = FSComponent.createRef<G1000ControlList<AlertMessage>>();

  /** @inheritdoc */
  public onViewOpened(): void {
    this.listRef.instance.focus(FocusPosition.First);
  }

  /** @inheritdoc */
  public processHEvent(evt: FmsHEvent): boolean {
    if (evt === FmsHEvent.UPPER_PUSH && this.listRef.instance.isFocused) {
      this.listRef.instance.blur();
    }

    let handled = false;
    if (this.listRef.instance.isFocused) {
      handled = this.listRef.instance.onInteractionEvent(evt);
    }

    if (!handled) {
      return super.processHEvent(evt);
    }

    return handled;
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class='popout-dialog' ref={this.viewContainerRef}>
        <h1>{this.props.title}</h1>
        <div ref={this.containerRef} class="alerts-container">
          <G1000ControlList ref={this.listRef} data={this.props.data} renderItem={(data): VNode => <MessageItem title={data.title} message={data.message} />} />
        </div>
      </div>
    );
  }
}

/**
 * An individual alert in the alert messages pane.
 */
class MessageItem extends G1000UiControl<Partial<AlertMessage> & G1000UiControlProps> {
  private readonly titleEl = FSComponent.createRef<HTMLSpanElement>();

  /** @inheritdoc */
  protected onFocused(): void {
    this.titleEl.instance.classList.add(UiControl.FOCUS_CLASS);
  }

  /** @inheritdoc */
  protected onBlurred(): void {
    this.titleEl.instance.classList.remove(UiControl.FOCUS_CLASS);
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class='alerts-message'>
        <span ref={this.titleEl}>{this.props.title?.toUpperCase()}</span> - <span>{this.props.message}</span>
      </div>
    );
  }
}