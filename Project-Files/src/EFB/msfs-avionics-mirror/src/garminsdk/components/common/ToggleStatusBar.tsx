import { ComponentProps, DisplayComponent, FSComponent, SetSubject, Subscribable, SubscribableSet, Subscription, VNode } from 'msfssdk';

/**
 * Component props for ButtonStatusBar.
 */
export interface ToggleStatusBarProps extends ComponentProps {
  /** A subscribable which provides the state of the status bar (`false` = off, `true` = on). */
  state: Subscribable<boolean>;

  /** CSS class(es) to apply to the status bar's root element. */
  class?: string | SubscribableSet<string>;
}

/**
 * A status bar which depicts an on/off state.
 *
 * The root element of the status bar contains the `toggle-status-bar` CSS class by default. The root element also
 * conditionally contains the `toggle-status-bar-on` class when the status bar's bound state is on.
 */
export class ToggleStatusBar extends DisplayComponent<ToggleStatusBarProps> {
  private readonly cssClassSet = SetSubject.create(['toggle-status-bar']);

  private stateSub?: Subscription;
  private cssClassSub?: Subscription;

  /** @inheritdoc */
  public onAfterRender(): void {
    this.stateSub = this.props.state.sub(state => {
      if (state) {
        this.cssClassSet.add('toggle-status-bar-on');
      } else {
        this.cssClassSet.delete('toggle-status-bar-on');
      }
    }, true);
  }

  /** @inheritdoc */
  public render(): VNode {
    const reservedClasses = ['toggle-status-bar', 'toggle-status-bar-on'];

    if (typeof this.props.class === 'object') {
      this.cssClassSub = FSComponent.bindCssClassSet(this.cssClassSet, this.props.class, reservedClasses);
    } else {
      for (const cssClassToAdd of FSComponent.parseCssClassesFromString(this.props.class ?? '').filter(cssClass => !reservedClasses.includes(cssClass))) {
        this.cssClassSet.add(cssClassToAdd);
      }
    }

    return (
      <div class={this.cssClassSet}></div>
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();

    this.stateSub?.destroy();
    this.cssClassSub?.destroy();
  }
}