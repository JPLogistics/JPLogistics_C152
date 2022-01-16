import { MapLocationTextLabelOptions } from 'msfssdk/components/map';

import { AirportSize } from '../Navigation/Waypoint';

/**
 * Styles for waypoints rendered in a normal role.
 */
export type MapWaypointNormalStyles = {
  /** The render priority of airport icons. */
  airportIconPriority: Record<AirportSize, number>,

  /** The render priority of VOR icons. */
  vorIconPriority: number,

  /** The render priority of NDB icons. */
  ndbIconPriority: number,

  /** The render priority of intersection icons. */
  intIconPriority: number,

  /** The size of airport icons, in pixels. */
  airportIconSize: Record<AirportSize, number>,

  /** The size of VOR icons, in pixels. */
  vorIconSize: number,

  /** The size of NDB icons, in pixels. */
  ndbIconSize: number,

  /** The size of intersection icons, in pixels. */
  intIconSize: number,

  /** The render priority of airport labels. */
  airportLabelPriority: Record<AirportSize, number>,

  /** The render priority of VOR labels. */
  vorLabelPriority: number,

  /** The render priority of NDB labels. */
  ndbLabelPriority: number,

  /** The render priority of intersection labels. */
  intLabelPriority: number,

  /** Initialization options for airport labels. */
  airportLabelOptions: Record<AirportSize, MapLocationTextLabelOptions>,

  /** Initialization options for VOR labels. */
  vorLabelOptions: MapLocationTextLabelOptions,

  /** Initialization options for NDB labels. */
  ndbLabelOptions: MapLocationTextLabelOptions,

  /** Initialization options for intersection labels. */
  intLabelOptions: MapLocationTextLabelOptions
};

/**
 * Styles for waypoints rendered as part of a flight plan.
 */
export type MapWaypointFlightPlanStyles = {
  /** The render priority of airport icons. */
  airportIconPriority: Record<AirportSize, number>,

  /** The render priority of VOR icons. */
  vorIconPriority: number,

  /** The render priority of NDB icons. */
  ndbIconPriority: number,

  /** The render priority of intersection icons. */
  intIconPriority: number,

  /** The render priority of runway waypoint icons. */
  rwyIconPriority: number,

  /** The render priority of user waypoint icons. */
  userIconPriority: number,

  /** The render priority of flight path waypoint icons. */
  fpIconPriority: number,

  /** The render priority of VNAV waypoint icons. */
  vnavIconPriority: number,

  /** The size of airport icons, in pixels. */
  airportIconSize: Record<AirportSize, number>,

  /** The size of VOR icons, in pixels. */
  vorIconSize: number,

  /** The size of NDB icons, in pixels. */
  ndbIconSize: number,

  /** The size of intersection icons, in pixels. */
  intIconSize: number,

  /** The size of runway waypoint icons, in pixels. */
  rwyIconSize: number,

  /** The size of user waypoint icons, in pixels. */
  userIconSize: number,

  /** The size of flight path waypoint icons, in pixels. */
  fpIconSize: number,

  /** The size of VNAV waypoint icons, in pixels. */
  vnavIconSize: number,

  /** The render priority of airport labels. */
  airportLabelPriority: Record<AirportSize, number>,

  /** The render priority of VOR labels. */
  vorLabelPriority: number,

  /** The render priority of NDB labels. */
  ndbLabelPriority: number,

  /** The render priority of intersection labels. */
  intLabelPriority: number,

  /** The render priority of user waypoint labels. */
  userLabelPriority: number,

  /** The render priority of runway waypoint labels. */
  rwyLabelPriority: number,

  /** The render priority of flight path waypoint labels. */
  fpLabelPriority: number,

  /** The render priority of VNAV waypoint labels. */
  vnavLabelPriority: number,

  /** Initialization options for airport labels. */
  airportLabelOptions: Record<AirportSize, MapLocationTextLabelOptions>,

  /** Initialization options for VOR labels. */
  vorLabelOptions: MapLocationTextLabelOptions,

  /** Initialization options for NDB labels. */
  ndbLabelOptions: MapLocationTextLabelOptions,

  /** Initialization options for intersection labels. */
  intLabelOptions: MapLocationTextLabelOptions,

  /** Initialization options for runway waypoint labels. */
  rwyLabelOptions: MapLocationTextLabelOptions,

  /** Initialization options for user waypoint labels. */
  userLabelOptions: MapLocationTextLabelOptions,

  /** Initialization options for flight path waypoint labels. */
  fpLabelOptions: MapLocationTextLabelOptions,

  /** Initialization options for VNAV waypoint labels. */
  vnavLabelOptions: MapLocationTextLabelOptions
};

/**
 * Styles for waypoints rendered in a normal role.
 */
export type MapWaypointHighlightStyles = {
  /** The buffer of the highlight ring around the base icon, in pixels. */
  highlightRingRadiusBuffer: number,

  /** The width of the stroke for the highlight ring, in pixels. */
  highlightRingStrokeWidth: number

  /** The color of the stroke for the highlight ring. */
  highlightRingStrokeColor: string

  /** The width of the outline for the highlight ring, in pixels. */
  highlightRingOutlineWidth: number

  /** The color of the outline for the highlight ring. */
  highlightRingOutlineColor: string

  /** The color of the highlight ring background. */
  highlightBgColor: string;

  /** The render priority of airport icons. */
  airportIconPriority: Record<AirportSize, number>,

  /** The render priority of VOR icons. */
  vorIconPriority: number,

  /** The render priority of NDB icons. */
  ndbIconPriority: number,

  /** The render priority of intersection icons. */
  intIconPriority: number,

  /** The render priority of user waypoint icons. */
  userIconPriority: number,

  /** The size of airport icons, in pixels. */
  airportIconSize: Record<AirportSize, number>,

  /** The size of VOR icons, in pixels. */
  vorIconSize: number,

  /** The size of NDB icons, in pixels. */
  ndbIconSize: number,

  /** The size of intersection icons, in pixels. */
  intIconSize: number,

  /** The size of user waypoint icons, in pixels. */
  userIconSize: number,

  /** The render priority of airport labels. */
  airportLabelPriority: Record<AirportSize, number>,

  /** The render priority of VOR labels. */
  vorLabelPriority: number,

  /** The render priority of NDB labels. */
  ndbLabelPriority: number,

  /** The render priority of intersection labels. */
  intLabelPriority: number,

  /** The render priority of user waypoint labels. */
  userLabelPriority: number,

  /** Initialization options for airport labels. */
  airportLabelOptions: Record<AirportSize, MapLocationTextLabelOptions>,

  /** Initialization options for VOR labels. */
  vorLabelOptions: MapLocationTextLabelOptions,

  /** Initialization options for NDB labels. */
  ndbLabelOptions: MapLocationTextLabelOptions,

  /** Initialization options for intersection labels. */
  intLabelOptions: MapLocationTextLabelOptions

  /** Initialization options for user waypoint labels. */
  userLabelOptions: MapLocationTextLabelOptions
};

/**
 * A utility class for generating Garmin-based waypoint styles.
 */
export class MapWaypointStyles {
  /**
   * Gets styles for waypoints rendered in a normal role.
   * @param baseIconPriority The base waypoint icon render priority. Icon priorities are guaranteed to fall in the
   * range `[baseIconPriority, baseIconPriority + 1)`.
   * @param baseLabelPriority The base waypoint label render priority. Label priorities are guaranteed to fall in the
   * range `[baseLabelPriority, baseLabelPriority + 1)`.
   * @param scale The linear scale of the styles. The larger the value, the larger the rendered icons and labels.
   * Defaults to 1.
   * @returns styles for waypoints rendered in a normal role.
   */
  public static getNormalStyles(baseIconPriority: number, baseLabelPriority: number, scale = 1): MapWaypointNormalStyles {
    return {
      airportIconPriority: {
        [AirportSize.Large]: baseIconPriority + 0.8,
        [AirportSize.Medium]: baseIconPriority + 0.79,
        [AirportSize.Small]: baseIconPriority + 0.78
      },
      vorIconPriority: baseIconPriority + 0.7,
      ndbIconPriority: baseIconPriority + 0.6,
      intIconPriority: baseIconPriority + 0.5,

      airportIconSize: {
        [AirportSize.Large]: 26 * scale,
        [AirportSize.Medium]: 26 * scale,
        [AirportSize.Small]: 26 * scale
      },
      vorIconSize: 32 * scale,
      ndbIconSize: 32 * scale,
      intIconSize: 32 * scale,

      airportLabelPriority: {
        [AirportSize.Large]: baseLabelPriority + 0.8,
        [AirportSize.Medium]: baseLabelPriority + 0.79,
        [AirportSize.Small]: baseLabelPriority + 0.78
      },
      vorLabelPriority: baseLabelPriority + 0.7,
      ndbLabelPriority: baseLabelPriority + 0.6,
      intLabelPriority: baseLabelPriority + 0.5,

      airportLabelOptions: {
        [AirportSize.Large]: MapWaypointStyles.createNormalLabelOptions(new Float64Array([0, -12 * scale]), 20 * scale),
        [AirportSize.Medium]: MapWaypointStyles.createNormalLabelOptions(new Float64Array([0, -12 * scale]), 16 * scale),
        [AirportSize.Small]: MapWaypointStyles.createNormalLabelOptions(new Float64Array([0, -12 * scale]), 16 * scale)
      },
      vorLabelOptions: MapWaypointStyles.createNormalLabelOptions(new Float64Array([0, -8 * scale]), 16 * scale),
      ndbLabelOptions: MapWaypointStyles.createNormalLabelOptions(new Float64Array([0, -8 * scale]), 16 * scale),
      intLabelOptions: MapWaypointStyles.createNormalLabelOptions(new Float64Array([0, -5 * scale]), 16 * scale),
    };
  }

  /**
   * Creates initialization options for waypoint labels rendered in a normal role.
   * @param offset The label offset, in pixels.
   * @param fontSize The font size of the label, in pixels.
   * @returns initialization options for waypoint labels rendered in a normal role.
   */
  private static createNormalLabelOptions(offset: Float64Array, fontSize: number): MapLocationTextLabelOptions {
    return {
      anchor: new Float64Array([0.5, 1]),
      offset,
      fontSize,
      fontOutlineWidth: 6
    };
  }

  /**
   * Gets styles for waypoints rendered as part of a flight plan.
   * @param active Whether to get styles for active waypoints.
   * @param baseIconPriority The base waypoint icon render priority. Icon priorities are guaranteed to fall in the
   * range `[baseIconPriority, baseIconPriority + 1)`.
   * @param baseLabelPriority The base waypoint label render priority. Label priorities are guaranteed to fall in the
   * range `[baseLabelPriority, baseLabelPriority + 1)`.
   * @param scale The linear scale of the styles. The larger the value, the larger the rendered icons and labels.
   * Defaults to 1.
   * @returns styles for waypoints rendered as part of a flight plan.
   */
  public static getFlightPlanStyles(
    active: boolean,
    baseIconPriority: number,
    baseLabelPriority: number,
    scale = 1
  ): MapWaypointFlightPlanStyles {
    const createLabelOptions = active
      ? MapWaypointStyles.createFlightPlanActiveLabelOptions.bind(this)
      : MapWaypointStyles.createFlightPlanInactiveLabelOptions.bind(this);

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
      vnavLabelOptions: MapWaypointStyles.createNormalLabelOptions(new Float64Array([0, -8 * scale]), 16 * scale)
    };
  }

  /**
   * Creates initialization options for labels for inactive waypoints rendered as part of a flight plan.
   * @param offset The label offset, in pixels.
   * @param fontSize The font size of the label, in pixels.
   * @returns initialization options for labels for inactive waypoints rendered as part of a flight plan.
   */
  private static createFlightPlanInactiveLabelOptions(offset: Float64Array, fontSize: number): MapLocationTextLabelOptions {
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
  private static createFlightPlanActiveLabelOptions(offset: Float64Array, fontSize: number): MapLocationTextLabelOptions {
    return {
      anchor: new Float64Array([0, 1]),
      offset,
      font: 'Roboto-Bold',
      fontSize,
      fontColor: 'magenta',
      fontOutlineWidth: 0,
      showBg: true,
      bgPadding: [1, 1, 1, 1],
      bgOutlineWidth: 1
    };
  }

  /**
   * Gets styles for waypoints rendered as highlighted.
   * @param baseIconPriority The base waypoint icon render priority. Icon priorities are guaranteed to fall in the
   * range `[baseIconPriority, baseIconPriority + 1)`.
   * @param baseLabelPriority The base waypoint label render priority. Label priorities are guaranteed to fall in the
   * range `[baseLabelPriority, baseLabelPriority + 1)`.
   * @param scale The linear scale of the styles. The larger the value, the larger the rendered icons and labels.
   * Defaults to 1.
   * @returns styles for waypoints rendered as highlighted.
   */
  public static getHighlightStyles(
    baseIconPriority: number,
    baseLabelPriority: number,
    scale = 1
  ): MapWaypointHighlightStyles {
    return {
      highlightRingRadiusBuffer: 0,
      highlightRingStrokeWidth: 2,
      highlightRingStrokeColor: 'white',
      highlightRingOutlineWidth: 0,
      highlightRingOutlineColor: 'black',
      highlightBgColor: '#3c3c3c',

      airportIconPriority: {
        [AirportSize.Large]: baseIconPriority + 0.8,
        [AirportSize.Medium]: baseIconPriority + 0.79,
        [AirportSize.Small]: baseIconPriority + 0.78
      },
      vorIconPriority: baseIconPriority + 0.7,
      ndbIconPriority: baseIconPriority + 0.6,
      intIconPriority: baseIconPriority + 0.5,
      userIconPriority: baseIconPriority + 0.9,

      airportIconSize: {
        [AirportSize.Large]: 26 * scale,
        [AirportSize.Medium]: 26 * scale,
        [AirportSize.Small]: 26 * scale
      },
      vorIconSize: 32 * scale,
      ndbIconSize: 32 * scale,
      intIconSize: 32 * scale,
      userIconSize: 32 * scale,

      airportLabelPriority: {
        [AirportSize.Large]: baseLabelPriority + 0.8,
        [AirportSize.Medium]: baseLabelPriority + 0.79,
        [AirportSize.Small]: baseLabelPriority + 0.78
      },
      vorLabelPriority: baseLabelPriority + 0.7,
      ndbLabelPriority: baseLabelPriority + 0.6,
      intLabelPriority: baseLabelPriority + 0.5,
      userLabelPriority: baseLabelPriority + 0.9,

      airportLabelOptions: {
        [AirportSize.Large]: MapWaypointStyles.createHighlightLabelOptions(new Float64Array([0, -17 * scale]), 20 * scale),
        [AirportSize.Medium]: MapWaypointStyles.createHighlightLabelOptions(new Float64Array([0, -17 * scale]), 16 * scale),
        [AirportSize.Small]: MapWaypointStyles.createHighlightLabelOptions(new Float64Array([0, -17 * scale]), 16 * scale)
      },
      vorLabelOptions: MapWaypointStyles.createHighlightLabelOptions(new Float64Array([0, -17 * scale]), 16 * scale),
      ndbLabelOptions: MapWaypointStyles.createHighlightLabelOptions(new Float64Array([0, -17 * scale]), 16 * scale),
      intLabelOptions: MapWaypointStyles.createHighlightLabelOptions(new Float64Array([0, -17 * scale]), 16 * scale),
      userLabelOptions: MapWaypointStyles.createHighlightLabelOptions(new Float64Array([0, -17 * scale]), 16 * scale)
    };
  }

  /**
   * Creates initialization options for labels for highlighted waypoints.
   * @param offset The label offset, in pixels.
   * @param fontSize The font size of the label, in pixels.
   * @returns initialization options for labels for highlighted waypoints.
   */
  private static createHighlightLabelOptions(offset: Float64Array, fontSize: number): MapLocationTextLabelOptions {
    return {
      anchor: new Float64Array([0.5, 1]),
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
}