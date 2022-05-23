import { ArraySubject, FSComponent, VNode } from 'msfssdk';

import { MenuItemDefinition, PopoutMenuItem } from '../../../Shared/UI/Dialogs/PopoutMenuItem';
import { FmsHEvent } from '../../../Shared/UI/FmsHEvent';
import { List } from '../../../Shared/UI/List';
import { UiControl } from '../../../Shared/UI/UiControl';
import { ScrollableControl, UiView, UiViewProps } from '../../../Shared/UI/UiView';

import './MFDPageSelect.css';

/**
 * A definition for a page select list item used by MFDPageSelect.
 */
type PageListItemDef = {
  /** The name of the page. */
  name: string;

  /** The key of the page. */
  key: string;
}

/**
 * Component props for MFDPageSelect.
 */
export type MFDPageSelectProps = Omit<UiViewProps, 'upperKnobCanScroll'>

/**
 * A pop-up which allows the user to select the open MFD page.
 */
export class MFDPageSelect extends UiView<MFDPageSelectProps & UiViewProps> {
  private static readonly OPEN_TIME = 3000; // ms

  private static readonly PAGE_GROUPS = [
    [
      { name: 'Navigation Map', key: 'NavMapPage' },
      { name: 'IFR/VFR Charts', key: '' },
      { name: 'Traffic Map', key: 'TrafficPage' },
      { name: 'Weather Data Link', key: '' },
      { name: 'TAWS-B', key: '' }
    ],
    [
      { name: 'Airport Information', key: 'AirportInformation' },
      { name: 'Intersection Information', key: 'IntersectionInformation' },
      { name: 'NDB Information', key: 'NdbInformation' },
      { name: 'VOR Information', key: 'VorInformation' },
      { name: 'VRP Information', key: '' },
      { name: 'User WPT Information', key: '' }
    ],
    [
      { name: 'Trip Planning', key: '' },
      { name: 'Utility', key: '' },
      { name: 'GPS Status', key: '' },
      { name: 'System Setup', key: 'SystemSetupPage' },
      { name: 'XM Radio', key: '' },
      { name: 'System Status', key: '' },
      { name: 'Connext Setup', key: '' },
      { name: 'Databases', key: '' }
    ],
    [
      { name: 'Active Flight Plan', key: 'FPLPage' },
      { name: 'Flight Plan Catalog', key: '' }
    ],
    [
      { name: 'Nearest Airports', key: 'NearestAirports' },
      { name: 'Nearest Intersections', key: 'NearestIntersections' },
      { name: 'Nearest NDB', key: 'NearestNDBs' },
      { name: 'Nearest VOR', key: 'NearestVORs' },
      { name: 'Nearest VRP', key: '' },
      { name: 'Nearest User WPTs', key: '' },
      { name: 'Nearest Frequencies', key: '' },
      { name: 'Nearest Airspaces', key: '' }
    ]
  ];

  private readonly listRef = FSComponent.createRef<List>();
  private readonly tabRefs = [
    FSComponent.createRef<HTMLDivElement>(),
    FSComponent.createRef<HTMLDivElement>(),
    FSComponent.createRef<HTMLDivElement>(),
    FSComponent.createRef<HTMLDivElement>(),
    FSComponent.createRef<HTMLDivElement>()
  ];

  private readonly listItemDefs = MFDPageSelect.PAGE_GROUPS.map(defs => defs.map(this.buildListItemDefinition.bind(this)));

  private readonly listDataSub = ArraySubject.create<MenuItemDefinition>();

  private activeGroupIndex = -1;
  private lastSelectedIndex = [0, 0, 0, 0, 0];

  private ignoreSelection = false;

  private openTimer: NodeJS.Timeout | null = null;

  /** @inheritdoc */
  constructor(props: MFDPageSelectProps & UiViewProps) {
    super(props);

    props.upperKnobCanScroll = true;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onAfterRender(): void {
    this.props.viewService.openPageKey.sub(key => {
      let itemIndex = -1;
      const groupIndex = this.listItemDefs.findIndex(defs => (itemIndex = defs.findIndex(def => def.isEnabled && def.id === key)) >= 0);
      if (groupIndex >= 0) {
        this.setActiveGroup(groupIndex, itemIndex);
      }
    }, true);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.UPPER_PUSH:
      case FmsHEvent.CLR:
        this.close();
        return true;
    }

    return false;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected processScrollEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.UPPER_INC:
        this.listRef.instance.processHEvent(FmsHEvent.LOWER_INC);
        break;
      case FmsHEvent.UPPER_DEC:
        this.listRef.instance.processHEvent(FmsHEvent.LOWER_DEC);
        break;
      case FmsHEvent.LOWER_INC:
        this.cycleActiveGroup(1);
        break;
      case FmsHEvent.LOWER_DEC:
        this.cycleActiveGroup(-1);
        break;
    }

    this.resetOpenTimer();

    return true;
  }

  /**
   * Cycles through the list of page groups to set the active page group.
   * @param delta The direction in which to cycle through the groups.
   */
  private cycleActiveGroup(delta: 1 | -1): void {
    this.setActiveGroup(Utils.Clamp(this.activeGroupIndex + delta, 0, 4));
  }

  /**
   * Sets the active page group.
   * @param groupIndex The index of the new active group.
   * @param itemIndex The index of the group list item to which to initially scroll. Defaults to 0.
   */
  private setActiveGroup(groupIndex: number, itemIndex?: number): void {
    if (groupIndex === this.activeGroupIndex) {
      return;
    }

    this.ignoreSelection = true;
    this.listDataSub.set(this.listItemDefs[groupIndex]);
    this.listRef.instance.scrollToIndex(itemIndex ?? this.lastSelectedIndex[groupIndex]);
    this.ignoreSelection = false;

    const index = this.listRef.instance.getSelectedIndex();
    this.onListItemSelected(this.listDataSub.tryGet(index) ?? null, this.listRef.instance.getListItemInstance(index), index);

    this.tabRefs[this.activeGroupIndex]?.instance.classList.remove('active-tab');
    this.tabRefs[groupIndex]?.instance.classList.add('active-tab');

    this.activeGroupIndex = groupIndex;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onViewOpened(): void {
    this.resetOpenTimer();
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onViewClosed(): void {
    this.clearOpenTimer();
  }

  /**
   * Resets the open timer.
   */
  private resetOpenTimer(): void {
    this.clearOpenTimer();

    this.openTimer = setTimeout(() => {
      this.openTimer = null;
      this.close();
    }, MFDPageSelect.OPEN_TIME);
  }

  /**
   * Clears the open timer.
   */
  private clearOpenTimer(): void {
    if (this.openTimer !== null) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
  }

  /**
   * Builds a MenuItemDefinition from a page list item definition.
   * @param def A page list item definition.
   * @returns A MenuItemDefinition.
   */
  private buildListItemDefinition(def: PageListItemDef): MenuItemDefinition {
    return {
      id: def.key,
      renderContent: (): VNode => <span>{def.name}</span>,
      isEnabled: def.key !== '',
      action: (): void => {
        this.props.viewService.open(def.key);
      }
    };
  }

  /**
   * Renders a list item.
   * @param d The item definition.
   * @param registerFn The register function.
   * @returns The rendered list item.
   */
  private renderListItem(d: MenuItemDefinition, registerFn: (ctrl: UiControl) => void): VNode {
    return <PopoutMenuItem onRegister={registerFn} parent={this} def={d} />;
  }

  /**
   * A callback which is called when a list item is selected.
   * @param d The selected item.
   * @param element The control associated with the selected item.
   * @param index The index of the selected item.
   */
  private onListItemSelected(d: MenuItemDefinition | null, element: ScrollableControl | null, index: number): void {
    if (this.ignoreSelection || !d) {
      return;
    }

    this.lastSelectedIndex[this.activeGroupIndex] = index;

    if (this.props.viewService.openPageKey.get() === d.id) {
      return;
    }

    this.props.viewService.open(d.id);
    this.props.viewService.open('PageSelect');
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public render(): VNode {
    return (
      <div ref={this.viewContainerRef} class='popout-dialog mfd-pageselect'>
        <List
          ref={this.listRef}
          data={this.listDataSub}
          renderItem={this.renderListItem.bind(this)}
          onItemSelected={this.onListItemSelected.bind(this)}
          class='mfd-pageselect-group'
        />
        <div class='mfd-pageselect-tabs'>
          <div ref={this.tabRefs[0]}>Map</div>
          <div ref={this.tabRefs[1]}>WPT</div>
          <div ref={this.tabRefs[2]}>Aux</div>
          <div ref={this.tabRefs[3]}>FPL</div>
          <div ref={this.tabRefs[4]}>NRST</div>
        </div>
      </div>
    );
  }
}
