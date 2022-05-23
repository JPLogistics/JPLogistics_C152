import { FSComponent, Subject, VNode } from 'msfssdk';
import { FPLHeader, FPLHeaderProps } from './FPLHeader';

/**
 * An FPL section header which displays simple strings.
 */
export abstract class FPLStringHeader<P extends FPLHeaderProps = FPLHeaderProps> extends FPLHeader<P> {
  private static readonly ESTIMATED_CHAR_WIDTH = 13.2;

  protected readonly textSub = Subject.create('');

  private readonly textLengthSub = this.textSub.map(text => text.length);

  /** @inheritdoc */
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.textLengthSub.sub(length => this.setEstimatedNameWidth(length * FPLStringHeader.ESTIMATED_CHAR_WIDTH), true);
  }

  /** @inheritdoc */
  protected renderName(): VNode {
    return (
      <span>{this.textSub}</span>
    );
  }
}