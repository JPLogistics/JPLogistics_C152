import { FSComponent, VNode, ComputedSubject } from 'msfssdk';
import { Fms } from '../../FlightPlan/Fms';
import { UiControl, UiControlProps } from '../UiControl';
import { UiView } from '../UiView';

/**
 * The MenuItemDefinition interface.
 */
export interface MenuItemDefinition {
  /** menu item ID */
  id: string;

  /**
   * Renders the content of the menu item.
   * @returns the rendered content of the menu item as a VNode.
   */
  renderContent(): VNode;

  /** menu item enabled/disabled bool */
  isEnabled?: boolean;

  /** if the dialog should be closed after this menu item is selected (default:true) */
  closeAfterAction?: boolean;

  /** The action to execute when this item is selected. */
  action?(): void;
}

/**
 * The properties for the PopoutMenuItem component.
 */
interface PopoutMenuItemProps extends UiControlProps {
  /** The view to which this menu item belongs. */
  parent: UiView;

  /** menu item definition */
  def: MenuItemDefinition;
}

/**
 * The PopoutMenuItem component.
 */
export class PopoutMenuItem extends UiControl<PopoutMenuItemProps> {

  private isEnabled = ComputedSubject.create(true, (v): string => {
    return v ? 'popout-menu-item' : 'popout-menu-item text-disabled';
  });

  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    super.onAfterRender();

    this.isEnabled.sub(this.onIsEnabledChanged);
    this.isEnabled.set(this.props.def.isEnabled ?? true);
  }

  /** @inheritdoc */
  public onEnter(): boolean {
    if (this.props.def.action) {
      this.props.def.action();
      if ((this.props.def.closeAfterAction === undefined || this.props.def.closeAfterAction) && Fms.viewService.getOpenViews().includes(this.props.parent)) {
        this.props.parent.close();
      }
      return true;
    } else if (this.props.onEnter) {
      return this.props.onEnter(this);
    }
    return false;
  }

  private onIsEnabledChanged = (v: string, rv: boolean): void => {
    this.setIsEnabled(rv);
  }

  /** @inheritdoc */
  public getHighlightElement(): Element | null {
    return this.containerRef.instance.firstElementChild?.firstElementChild ?? null;
  }

  /** @inheritdoc */
  public renderControl(): VNode {
    return (
      <div class={this.isEnabled}>{this.props.def.renderContent()}</div>
    );
  }
}