import { FSComponent, CollectionComponent, CollectionComponentProps } from 'msfssdk';
import { EventBus, HEvent } from 'msfssdk/data';

/** Props for the test fpl */
interface TestFplProps extends CollectionComponentProps {
  /** the bus */
  bus: EventBus;
}

/** test component */
export class TestFPL extends CollectionComponent<TestFplProps> {
  private counter = 0;
  /**
   * A callback after the component renders.
   */
  public onAfterRender(): void {
    const sub = this.props.bus.getSubscriber<HEvent>();
    sub.on('hEvent').handle(this.addThingy.bind(this));
  }

  /**
   * Add a thingy.
   */
  private addThingy(): void {
    let val = this.addItem(<div>I HAVE ADDED THINGY NUMBER {this.counter.toFixed(0)}</div>);
    this.counter++;
    // eslint-disable-next-line no-console
    console.log(`added thingy number ${val}`);
    val = this.insertBefore(<div>THIS IS INSERTED BEFORE {val}.</div>, val);
    this.insertAfter(<div>AND THEN THIS IS INSERTED AFTER {val}</div>, val);
  }
}