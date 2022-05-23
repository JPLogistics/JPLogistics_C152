import { ArraySubject, ComponentProps, DisplayComponent, FSComponent, ReadonlyFloat64Array, Subject, Subscribable, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { BingComponent } from 'msfssdk/components/bing';
import { SynVisComponent } from 'msfssdk/components/synvis';

import { HorizonCompass } from './HorizonCompass';
import { PlaneStateInfo } from './PrimaryHorizonDisplay';
import { PFDUserSettings } from '../../PFDUserSettings';

import './G1000SynVis.css';

/**
 * Component props for G1000SynVis.
 */
export interface G1000SynVisProps extends ComponentProps {
  /** The event bus. */
  bus: EventBus;

  /** A unique ID to assign to the synthetic vision component's Bing instance. */
  bingId: string;

  /**
   * A subscribable which provides the internal resolution for the synthetic vision's Bing component.
   */
  resolution: Subscribable<ReadonlyFloat64Array>;

  /** A subscribable which provides whether synthetic vision is active. */
  isActive: Subscribable<boolean>;
}

/**
 * G1000 syn vis component
 */
export class G1000SynVis extends DisplayComponent<G1000SynVisProps> {
  private containerRef = FSComponent.createRef<HTMLDivElement>();
  private horizonRef = FSComponent.createRef<HorizonCompass>();
  private readonly settingManager;

  /**
   * Ctor
   * @param props the props.
   */
  constructor(props: G1000SynVisProps) {
    super(props);
    this.settingManager = PFDUserSettings.getManager(props.bus);
  }


  /** @inheritdoc */
  onAfterRender(): void {
    this.props.isActive.sub(this.onIsActiveChanged.bind(this), true);
    this.settingManager.whenSettingChanged('svtHdgLabelToggle').handle(this.onHdgLblActiveChanged.bind(this));
  }

  /**
   * Callback when the Hdg label setting is changed.
   * @param v true if hdg label is active, false otherwise.
   */
  private onHdgLblActiveChanged(v: boolean): void {
    this.horizonRef.instance.setHdgLabelVisibility(v);
  }

  /**
   * Responds to changes in whether synthetic vision is active.
   * @param active Whether synthetic vision is active.
   */
  private onIsActiveChanged(active: boolean): void {
    this.containerRef.instance.style.display = active ? '' : 'none';
  }

  /**
   * Creates a full Bing component earth color array for SVT which is darker than the regular topo map.
   * @returns a full Bing component earth color array for SVT absolute terrain colors.
   */
  private createSVTEarthColors(): number[] {
    return BingComponent.createEarthColorsArray('#000049', [
      {
        elev: 0,
        color: '#0c2e04'
      },
      {
        elev: 500,
        color: '#113300'
      },
      {
        elev: 2000,
        color: '#463507'
      },
      {
        elev: 3000,
        color: '#5c421f'
      },
      {
        elev: 6000,
        color: '#50331b'
      },
      {
        elev: 8000,
        color: '#512d15'
      },
      {
        elev: 10500,
        color: '#673118'
      },
      {
        elev: 27000,
        color: '#4d4d4d'
      },
      {
        elev: 29000,
        color: '#666666'
      }
    ]);
  }

  /**
   * Updates the components of the g1000 syn vis.
   * @param planeState The current plane state info.
   */
  public update(planeState: PlaneStateInfo): void {
    if (this.props.isActive.get()) {
      this.horizonRef.instance.update(planeState);
    }
  }

  /**
   * Renders the syn vis component.
   * @returns A component VNode.
   */
  public render(): VNode {
    return (
      <div class="synthetic-vision" ref={this.containerRef}>
        <SynVisComponent
          bingId={this.props.bingId}
          resolution={this.props.resolution}
          earthColors={ArraySubject.create(this.createSVTEarthColors())}
          skyColor={Subject.create(BingComponent.hexaToRGBColor('0033E6'))}
        />
        <HorizonCompass ref={this.horizonRef} />
      </div>
    );
  }
}