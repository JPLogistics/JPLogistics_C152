import { MapLocationTextLabelOptions } from 'msfssdk/components/map';
import { AirportSize } from 'msfssdk/navigation';

import { MapWaypointFlightPlanStyles } from '../../../../Shared/Map/MapWaypointStyles';

/**
 * A utility class for generating MFD procedure preview map waypoint styles.
 */
export class MFDProcMapWaypointStyles {
  /**
   * Gets styles for waypoints rendered as part of a procedure or transition preview.
   * @param procedure Whether to get styles for the procedure preview.
   * @param baseIconPriority The base waypoint icon render priority. Icon priorities are guaranteed to fall in the
   * range `[baseIconPriority, baseIconPriority + 1)`.
   * @param baseLabelPriority The base waypoint label render priority. Label priorities are guaranteed to fall in the
   * range `[baseLabelPriority, baseLabelPriority + 1)`.
   * @param scale The linear scale of the styles. The larger the value, the larger the rendered icons and labels.
   * Defaults to 1.
   * @returns Styles for waypoints rendered as part of a procedure or transition preview.
   */
  public static getStyles(
    procedure: boolean,
    baseIconPriority: number,
    baseLabelPriority: number,
    scale = 1
  ): MapWaypointFlightPlanStyles {
    const createLabelOptions = procedure
      ? MFDProcMapWaypointStyles.createPrimaryLabelOptions.bind(this)
      : MFDProcMapWaypointStyles.createSecondaryLabelOptions.bind(this);

    return {
      airportIconPriority: {
        [AirportSize.Large]: baseIconPriority + 0.8,
        [AirportSize.Medium]: baseIconPriority + 0.79,
        [AirportSize.Small]: baseIconPriority + 0.78
      },
      vorIconPriority: baseIconPriority + 0.7,
      ndbIconPriority: baseIconPriority + 0.6,
      intIconPriority: baseIconPriority + 0.5,
      rwyIconPriority: baseIconPriority + 0.4,
      userIconPriority: baseIconPriority + 0.9,
      fpIconPriority: baseIconPriority + 0.1,
      vnavIconPriority: baseIconPriority + 0.95,

      airportIconSize: {
        [AirportSize.Large]: 26 * scale,
        [AirportSize.Medium]: 26 * scale,
        [AirportSize.Small]: 26 * scale
      },
      vorIconSize: 32 * scale,
      ndbIconSize: 32 * scale,
      intIconSize: 32 * scale,
      rwyIconSize: 32 * scale,
      userIconSize: 32 * scale,
      fpIconSize: 8 * scale,
      vnavIconSize: 32 * scale,

      airportLabelPriority: {
        [AirportSize.Large]: baseLabelPriority + 0.8,
        [AirportSize.Medium]: baseLabelPriority + 0.79,
        [AirportSize.Small]: baseLabelPriority + 0.78
      },
      vorLabelPriority: baseLabelPriority + 0.7,
      ndbLabelPriority: baseLabelPriority + 0.6,
      intLabelPriority: baseLabelPriority + 0.5,
      rwyLabelPriority: baseLabelPriority + 0.4,
      userLabelPriority: baseLabelPriority + 0.9,
      fpLabelPriority: baseLabelPriority + 0.1,
      vnavLabelPriority: baseLabelPriority + 0.95,

      airportLabelOptions: {
        [AirportSize.Large]: createLabelOptions(new Float64Array([0, -15 * scale]), 20 * scale),
        [AirportSize.Medium]: createLabelOptions(new Float64Array([0, -15 * scale]), 16 * scale),
        [AirportSize.Small]: createLabelOptions(new Float64Array([0, -15 * scale]), 16 * scale)
      },
      vorLabelOptions: createLabelOptions(new Float64Array([0, -11 * scale]), 16 * scale),
      ndbLabelOptions: createLabelOptions(new Float64Array([0, -11 * scale]), 16 * scale),
      intLabelOptions: createLabelOptions(new Float64Array([0, -8 * scale]), 16 * scale),
      rwyLabelOptions: createLabelOptions(new Float64Array([0, -8 * scale]), 16 * scale),
      userLabelOptions: createLabelOptions(new Float64Array([0, -12 * scale]), 16 * scale),
      fpLabelOptions: createLabelOptions(new Float64Array([0, -8 * scale]), 16 * scale),
      vnavLabelOptions: {}
    };
  }

  /**
   * Creates initialization options for labels for inactive waypoints rendered as part of a flight plan.
   * @param offset The label offset, in pixels.
   * @param fontSize The font size of the label, in pixels.
   * @returns initialization options for labels for inactive waypoints rendered as part of a flight plan.
   */
  private static createPrimaryLabelOptions(offset: Float64Array, fontSize: number): MapLocationTextLabelOptions {
    return {
      anchor: new Float64Array([0, 1]),
      offset,
      font: 'Roboto-Bold',
      fontSize,
      fontColor: 'black',
      fontOutlineWidth: 0,
      showBg: true,
      bgPadding: [1, 1, 1, 1],
      bgColor: 'white',
      bgOutlineWidth: 1,
      bgOutlineColor: 'black'
    };
  }

  /**
   * Creates initialization options for labels for inactive waypoints rendered as part of a flight plan.
   * @param offset The label offset, in pixels.
   * @param fontSize The font size of the label, in pixels.
   * @returns initialization options for labels for inactive waypoints rendered as part of a flight plan.
   */
  private static createSecondaryLabelOptions(offset: Float64Array, fontSize: number): MapLocationTextLabelOptions {
    return {
      anchor: new Float64Array([0.5, 1]),
      offset,
      fontSize,
      fontOutlineWidth: 6
    };
  }
}