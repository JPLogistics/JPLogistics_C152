import { FSComponent, DisplayComponent, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { WindOptionController, WindOptionStore, WindOverlayRenderOption } from '../../../../Shared/UI/Controllers/WindOptionController';
import { WindOption1 } from './WindOption1';
import { WindOption2 } from './WindOption2';
import { WindOption3 } from './WindOption3';

import './WindOverlay.css';

/** The properties on the wind overlay component */
interface WindOverlayProps {

  /** An instance of the event bus. */
  bus: EventBus;
}

/** The PFD wind overlay. */
export class WindOverlay extends DisplayComponent<WindOverlayProps> {

  private option1Ref = FSComponent.createRef<WindOption1>();
  private option2Ref = FSComponent.createRef<WindOption2>();
  private option3Ref = FSComponent.createRef<WindOption3>();
  private windBoxRef = FSComponent.createRef<HTMLElement>();
  private noDataRef = FSComponent.createRef<HTMLDivElement>();

  private readonly store: WindOptionStore;
  private readonly controller: WindOptionController;

  /**
   * Creates an instance of Wind Overlay.
   * @param props The props.
   */
  constructor(props: WindOverlayProps) {
    super(props);
    this.store = new WindOptionStore();
    this.controller = new WindOptionController(this.props.bus, this.store);
  }

  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    this.store.renderOption.sub((v) => {
      this.noDataRef.instance.classList.toggle('hide-element', v !== WindOverlayRenderOption.NOWIND);
      this.windBoxRef.instance.classList.toggle('hide-element', v === WindOverlayRenderOption.NONE);
      this.option1Ref.instance.setVisible(v === WindOverlayRenderOption.OPT1);
      this.option2Ref.instance.setVisible(v === WindOverlayRenderOption.OPT2);
      this.option3Ref.instance.setVisible(v === WindOverlayRenderOption.OPT3);
    }, true);
  }


  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div ref={this.windBoxRef} class="wind-overlay hide-element">
        <div ref={this.noDataRef} >NO WIND DATA</div>
        <WindOption1 ref={this.option1Ref} windData={this.store.currentWind} aircraftHeading={this.store.currentHeading} />
        <WindOption2 ref={this.option2Ref} windData={this.store.currentWind} aircraftHeading={this.store.currentHeading} />
        <WindOption3 ref={this.option3Ref} windData={this.store.currentWind} aircraftHeading={this.store.currentHeading} />
      </div>
    );
  }
}
