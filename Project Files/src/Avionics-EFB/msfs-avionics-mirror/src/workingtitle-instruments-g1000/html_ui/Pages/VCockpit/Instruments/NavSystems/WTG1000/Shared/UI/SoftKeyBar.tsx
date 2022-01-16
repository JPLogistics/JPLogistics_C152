import { FSComponent, DisplayComponent, NodeReference, VNode } from 'msfssdk';
import { MenuSystem } from './Menus/MenuSystem';
import { SoftKey } from './Menus/SoftKey';
import { MenuItem, SoftKeyMenu } from './Menus/SoftKeyMenu';

import './SoftKeyBar.css';

/**
 * Properties on the soft keys menu component.
 */
interface SoftKeysProps {
  /** An instance of the softkeys menu system. */
  menuSystem: MenuSystem;
}

/**
 * The Garmin softkeys tab display for the PFD and MFD.
 */
export class SoftKeyBar extends DisplayComponent<SoftKeysProps> {

  /** References to the softkey div nodes. */
  private readonly refs: NodeReference<SoftKey>[] = [];

  /** The core menu system instance. */
  private readonly menuSystem: MenuSystem;

  /**
   * Creates an instance of SoftKeys.
   * @param props The properties to use.
   */
  constructor(props: SoftKeysProps) {
    super(props);

    this.menuSystem = this.props.menuSystem;
  }

  /**
   * Builds the softkeys tab elements.
   * @returns A collection of soft key div elements.
   */
  private buildSoftKeys(): HTMLDivElement[] {
    const softKeys: HTMLDivElement[] = [];
    for (let i = 0; i < 12; i++) {
      const ref = FSComponent.createRef<SoftKey>();
      softKeys.push(<SoftKey ref={ref} menuItem={SoftKeyMenu.EmptyMenuItem} />);
      this.refs[i] = ref;
    }

    return softKeys;
  }

  /**
   * Starts the softkey HEvent listener after render.
   */
  public onAfterRender(): void {
    this.menuSystem.attachSoftKeys(this);
  }

  /**
   * Binds a menu item to a soft key.
   * @param index  the index of the softkey
   * @param menuItem the menu item to set
   */
  public setMenuItem(index: number, menuItem: MenuItem): void {
    this.refs[index].instance.setMenuItem(menuItem);
  }

  /**
   * Renders the component.
   * @returns The rendered component.
   */
  public render(): VNode {
    return (
      <div class='softkeys-container'>
        {this.buildSoftKeys()}
      </div>
    );
  }
}
