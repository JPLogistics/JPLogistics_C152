import { FSComponent, VNode } from 'msfssdk';
import { FocusPosition } from 'msfssdk/components/controls';
import { FmsHEvent } from '../FmsHEvent';
import { G1000UiControl } from '../G1000UiControl';
import { EntryDirection, UiControlGroup } from '../UiControlGroup';

/**
 * Wraps a G1000UiControl component to allow it to function in an original UiControl tree. If the wrapper has multiple
 * G1000UiControl descendants, all will be rendered, but only the last one (in tree order) will be functional.
 */
export class G1000UiControlWrapper extends UiControlGroup {
  private control?: G1000UiControl;

  /** @inheritdoc */
  public onAfterRender(thisNode: VNode): void {
    FSComponent.visitNodes(thisNode, (node) => {
      if (node.instance instanceof G1000UiControl) {
        this.control = node.instance;
        return true;
      }

      return false;
    });
  }

  /** @inheritdoc */
  public getIsFocusable(): boolean {
    return !!this.control && !this.control.isDisabled;
  }

  /** @inheritdoc */
  public focus(dir: EntryDirection = 'top'): void {
    super.focus(dir);

    this.control?.focus(dir === 'top' ? FocusPosition.First : FocusPosition.Last);
  }

  /** @inheritdoc */
  protected onBlurred(): void {
    this.control?.blur();
  }

  /** @inheritdoc */
  public processHEvent(evt: FmsHEvent): boolean {
    if (this.control && this.control.isFocused && this.control.onInteractionEvent(evt)) {
      return true;
    }

    return super.processHEvent(evt);
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <>
        {this.props.children}
      </>
    );
  }
}