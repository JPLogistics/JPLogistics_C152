import { VNode, FSComponent, Subject, DisplayComponent } from 'msfssdk';

import { UiView, UiViewProps } from '../UiView';
import { ActionButton } from '../UIControls/ActionButton';
import { FmsHEvent } from '../FmsHEvent';

import './MessageDialog.css';

/**
 * The Message Dialog interface.
 */
export interface MessageDialogDefinition {

  /** The message string, if any */
  inputString?: string;

  /**
   * Renders the message content of the dialog.
   * @returns the message content for the dialog as a VNode.
   */
  renderContent?(): VNode;

  /** Whether to close this dialog after accept action */
  closeOnAccept?: boolean;

  /** The text for the confirm button */
  confirmButtonText?: string;

  /** Whether this dialog has a reject button */
  hasRejectButton?: boolean;

  /** The text for button 2, if any */
  rejectButtonText?: string;
}

/**
 * Confirmation dialog for generic messages.
 */
export class MessageDialog extends UiView<UiViewProps, boolean, MessageDialogDefinition> {
  private closeOnAccept = true;
  private readonly contentRef = FSComponent.createRef<HTMLDivElement>();
  private readonly confirmButtonText = Subject.create('');
  private readonly rejectButtonText = Subject.create('');
  private readonly orDivRef = FSComponent.createRef<HTMLDivElement>();
  private readonly rejectButtonRef = FSComponent.createRef<ActionButton>();

  private renderedContent: VNode | null = null;

  /** @inheritdoc */
  protected onInputDataSet(input: MessageDialogDefinition): void {
    if (input) {
      this.rejectButtonRef.instance.setIsVisible(input.hasRejectButton ? true : false);
      this.orDivRef.instance.style.display = input.hasRejectButton ? '' : 'none';
      this.closeOnAccept = input.closeOnAccept !== undefined ? input.closeOnAccept : true;
      this.onAccept.clear();
      this.renderContent(input);
    }
  }

  /** @inheritdoc */
  public onInteractionEvent(evt: FmsHEvent): boolean {
    // noop
    switch (evt) {
      case FmsHEvent.CLR:
        this.close();
        return true;
    }
    return false;
  }

  /** Callback for when the first button is pressed. */
  private readonly onButton1Pressed = (): void => {
    //this.close();
    this.accept(true, this.closeOnAccept);
  };

  /** Callback for when the second button is pressed. */
  private readonly onButton2Pressed = (): void => {
    this.accept(false, this.closeOnAccept);
  };

  /**
   * Renders the dialog content.
   * @param input The input data
   **/
  private renderContent(input: MessageDialogDefinition): void {
    this.cleanUpRenderedContent();

    if (input) {
      this.confirmButtonText.set(input.confirmButtonText ?? 'OK');
      this.rejectButtonText.set(input.rejectButtonText ?? 'CANCEL');
    }
    if (input.inputString !== undefined) {
      // we use innerHTML rather than textContent so we can provide pre-formatted strings.
      this.contentRef.instance.innerHTML = input.inputString;
    } else {
      // render items
      if (input.renderContent) {
        this.renderedContent = input.renderContent();
        FSComponent.render(this.renderedContent, this.contentRef.instance);
      }
    }
  }

  /**
   * Cleans up any rendered content.
   */
  private cleanUpRenderedContent(): void {
    this.contentRef.instance.innerHTML = '';

    if (this.renderedContent?.instance instanceof DisplayComponent) {
      this.renderedContent.instance.destroy();
    }

    this.renderedContent = null;
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class='popout-dialog msgdialog' ref={this.viewContainerRef}>
        <div class='msgdialog-popout-background'>
          <div class='msgdialog-container'>
            <div class='msgdialog-content msgdialog-center' ref={this.contentRef}></div>
            <hr class='msgdialog-hr'></hr>
            <div class="msgdialog-action-buttons">
              <ActionButton onRegister={this.register} onExecute={this.onButton1Pressed} text={this.confirmButtonText} />
              <div ref={this.orDivRef}>or</div>
              <ActionButton ref={this.rejectButtonRef} onRegister={this.register} onExecute={this.onButton2Pressed} text={this.rejectButtonText} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}