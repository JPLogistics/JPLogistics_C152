import { ComponentProps, DisplayComponent, FamilyOfUnit, FSComponent, NavAngleUnit, NumberUnitInterface, Subscribable, Unit, UnitFamily, UnitOfNumber, VNode } from 'msfssdk';
import { DurationDisplay, DurationDisplayOptions } from 'msfssdk/components/common';
import { BearingDisplay } from '../common/BearingDisplay';
import { NumberUnitDisplay } from '../common/NumberUnitDisplay';
import { TimeDisplay, TimeDisplayFormat } from '../common/TimeDisplay';
import { NavDataFieldModel } from './NavDataFieldModel';

/**
 * Component props for NavDataField.
 */
export interface NavDataFieldProps<T> extends ComponentProps {
  /** The title of the data field. */
  title: string;

  /** The model data field's data model. */
  model: NavDataFieldModel<T>;

  /** CSS class(es) to apply to the root of the component. */
  class?: string;
}

/**
 * A navigation data field, consisting of a title and a value.
 *
 * The root element of the field contains the `nav-data-field` CSS class by default.
 *
 * The root element contains a child title element with the CSS class `nav-data-field-title`.
 */
export abstract class NavDataField<T, P extends NavDataFieldProps<T> = NavDataFieldProps<T>> extends DisplayComponent<P> {
  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class={`nav-data-field ${this.props.class ?? ''}`}>
        <div class='nav-data-field-title'>{this.props.title}</div>
        {this.renderValue()}
      </div>
    );
  }

  /**
   * Renders this data field's value component.
   * @returns This data field's value component, as a VNode.
   */
  protected abstract renderValue(): VNode;
}

/**
 * Component props for NavDataGenericField.
 */
export interface NavDataGenericFieldProps<T> extends NavDataFieldProps<T> {
  /** A function to execute when the component is destroyed. */
  onDestroy?: () => void;
}

/**
 * A generic navigation data field which renders its children as its value.
 *
 * The root element of the field contains the `nav-data-field` CSS class by default.
 *
 * The root element contains a child title element with the CSS class `nav-data-field-title`.
 */
export class NavDataGenericField<T, P extends NavDataGenericFieldProps<T> = NavDataGenericFieldProps<T>> extends NavDataField<T, P> {
  /**
   * Renders this data field's value component.
   * @returns This data field's value component, as a VNode.
   */
  protected renderValue(): VNode {
    return (
      <>
        {this.props.children ?? null}
      </>
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    this.props.onDestroy && this.props.onDestroy();
  }
}

/**
 * Component props for NavDataNumberUnitField.
 */
export interface NavDataNumberUnitFieldProps<T extends NumberUnitInterface<string>> extends NavDataFieldProps<T> {
  /** A subscribable which provides the display unit type. */
  displayUnit: Subscribable<Unit<FamilyOfUnit<UnitOfNumber<T>>>>;

  /** A function which formats numbers. */
  formatter: (number: number) => string;
}

/**
 * A navigation data field which displays a value consisting of a number with unit type.
 *
 * The root element of the field contains the `nav-data-field` CSS class by default.
 *
 * The root element contains a child title element with the CSS class `nav-data-field-title`.
 */
export class NavDataNumberUnitField<T extends NumberUnitInterface<string>> extends NavDataField<T, NavDataNumberUnitFieldProps<T>> {
  private readonly numberUnitRef = FSComponent.createRef<NumberUnitDisplay<FamilyOfUnit<UnitOfNumber<T>>>>();

  /** @inheritdoc */
  public renderValue(): VNode {
    return (
      <NumberUnitDisplay
        ref={this.numberUnitRef}
        value={this.props.model.value}
        displayUnit={this.props.displayUnit}
        formatter={this.props.formatter}
      />
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();
    this.numberUnitRef.getOrDefault()?.destroy();
  }
}

/**
 * Component props for NavDataDurationField.
 */
export interface NavDataDurationFieldProps<T extends NumberUnitInterface<UnitFamily.Duration>> extends NavDataFieldProps<T> {
  /** Formatting options. */
  options?: Partial<DurationDisplayOptions>;
}

/**
 * A navigation data field which displays a value consisting of a formatted duration.
 *
 * The root element of the field contains the `nav-data-field` CSS class by default.
 *
 * The root element contains a child title element with the CSS class `nav-data-field-title`.
 */
export class NavDataDurationField<T extends NumberUnitInterface<UnitFamily.Duration>> extends NavDataField<T, NavDataDurationFieldProps<T>> {
  private readonly durationRef = FSComponent.createRef<NumberUnitDisplay<UnitFamily.Duration>>();

  /** @inheritdoc */
  public renderValue(): VNode {
    return (
      <DurationDisplay
        ref={this.durationRef}
        value={this.props.model.value}
        options={this.props.options}
      />
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();
    this.durationRef.getOrDefault()?.destroy();
  }
}

/**
 * Component props for NavDataTimeField.
 */
export interface NavDataTimeFieldProps extends NavDataFieldProps<number> {
  /** A subscribable which provides the time display format. */
  format: Subscribable<TimeDisplayFormat>;

  /** A subscribable which provides the local time offset, in milliseconds. */
  localOffset: Subscribable<number>;
}

/**
 * A navigation data field which displays a value consisting of a formatted time.
 *
 * The root element of the field contains the `nav-data-field` CSS class by default.
 *
 * The root element contains a child title element with the CSS class `nav-data-field-title`.
 */
export class NavDataTimeField extends NavDataField<number, NavDataTimeFieldProps> {
  private readonly timeRef = FSComponent.createRef<TimeDisplay>();

  /** @inheritdoc */
  public renderValue(): VNode {
    return (
      <TimeDisplay
        ref={this.timeRef}
        time={this.props.model.value}
        format={this.props.format}
        localOffset={this.props.localOffset}
      />
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();
    this.timeRef.getOrDefault()?.destroy();
  }
}

/**
 * Component props for NavDataBearingField.
 */
export interface NavDataBearingFieldProps<T extends NumberUnitInterface<typeof NavAngleUnit.FAMILY>> extends NavDataFieldProps<T> {
  /** A subscribable which provides the display unit type. */
  displayUnit: Subscribable<Unit<typeof NavAngleUnit.FAMILY> | null>;

  /** A function which formats numbers. */
  formatter: (number: number) => string;

  /** Whether to display 360 in place of 0. True by default. */
  use360?: boolean;
}

/**
 * A navigation data field which displays a bearing value.
 *
 * The root element of the field contains the `nav-data-field` CSS class by default.
 *
 * The root element contains a child title element with the CSS class `nav-data-field-title`.
 */
export class NavDataBearingField<T extends NumberUnitInterface<typeof NavAngleUnit.FAMILY>> extends NavDataField<T, NavDataBearingFieldProps<T>> {
  private readonly bearingRef = FSComponent.createRef<BearingDisplay>();

  /** @inheritdoc */
  public renderValue(): VNode {
    return (
      <BearingDisplay
        ref={this.bearingRef}
        value={this.props.model.value}
        displayUnit={this.props.displayUnit}
        formatter={this.props.formatter}
        use360={this.props.use360}
      />
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();
    this.bearingRef.getOrDefault()?.destroy();
  }
}