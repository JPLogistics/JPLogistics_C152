/**
 * A utility class defining common Garmin styles for rendering flight paths.
 */
export class MapFlightPathStyles {
  /** The stroke width, in pixels, for flight plan legs positioned after the active leg in the same segment as the active leg. */
  public static readonly STROKE_WIDTH = 4;

  /** The stroke color for flight plan legs positioned after the active leg in the same segment as the active leg. */
  public static readonly STROKE_COLOR = 'white';

  /** The stroke width, in pixels, for the active flight plan leg. */
  public static readonly ACTIVE_STROKE_WIDTH = 4;

  /** The stroke color for the active flight plan leg. */
  public static readonly ACTIVE_STROKE_COLOR = 'magenta';

  /** The stroke width, in pixels, for flight plan legs positioned before the active leg. */
  public static readonly PRIOR_STROKE_WIDTH = 2;

  /** The stroke color for flight plan legs positioned before the active leg. */
  public static readonly PRIOR_STROKE_COLOR = '#cccccc';

  /** The stroke width, in pixels, for flight plan legs in the missed approach segment while the missed approach is not active. */
  public static readonly MISSED_APPROACH_STROKE_WIDTH = 1;

  /** The stroke color for flight plan legs in the missed approach segment while the missed approach is not active. */
  public static readonly MISSED_APPROACH_STROKE_COLOR = 'white';

  /** The base stroke width, in pixels, for flight plan legs. */
  public static readonly BASE_STROKE_WIDTH = 2;

  /** The base stroke color for flight plan legs. */
  public static readonly BASE_STROKE_COLOR = 'rgba(204, 204, 204, 0.5)';

  /** The stroke width, in pixels, for procedure transition preview legs. */
  public static readonly TRANSITION_STROKE_WIDTH = 2;

  /** The stroke color for procedure transition preview legs. */
  public static readonly TRANSITION_STROKE_COLOR = '#666666';

  /** The width of the background for magenta arrows. */
  public static readonly MAGENTA_ARROW_BG_WIDTH = 6;

  /** The background color for magenta arrows. */
  public static readonly MAGENTA_ARROW_BG_COLOR = 'rgba(40, 40, 40, 0.5)';
}