import { BoundaryType, LodBoundary } from 'msfssdk/navigation';
import { MapAirspaceRenderer, NullAirspaceRenderer, MapSingleLineAirspaceRenderer, AbstractMapAirspaceRenderManager, MapMultiLineAirspaceRenderer, MapMultiLineAirspaceShape } from 'msfssdk/components/map';
import { PathStream } from 'msfssdk/graphics/path';

enum AirspaceRenderType {
  BlueSingle,
  MaroonSingle,
  BlueDashed,
  BlueCombed,
  MaroonCombed,
  Null
}

/**
 * An airspace render manager which renders Garmin-style airspaces.
 */
export class MapAirspaceRenderManager extends AbstractMapAirspaceRenderManager {
  protected readonly renderers = {
    [AirspaceRenderType.BlueSingle]: new MapSingleLineAirspaceRenderer(1.5, '#3080ff', []),
    [AirspaceRenderType.MaroonSingle]: new MapSingleLineAirspaceRenderer(1.5, '#4a0045', []),
    [AirspaceRenderType.BlueDashed]: new MapSingleLineAirspaceRenderer(1.5, '#3080ff', [5, 5]),
    [AirspaceRenderType.BlueCombed]: new CombedAirspaceRenderer('#3080ff', 1.5, false, 6, [1.5, 2.5]),
    [AirspaceRenderType.MaroonCombed]: new CombedAirspaceRenderer('#4a0045', 1.5, false, 6, [1.5, 2.5]),
    [AirspaceRenderType.Null]: new NullAirspaceRenderer(),
  };

  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getRenderOrder(a: LodBoundary, b: LodBoundary): number {
    return 0;
  }

  /** @inheritdoc */
  protected getAirspaceRenderer(airspace: LodBoundary): MapAirspaceRenderer {
    switch (airspace.facility.type) {
      case BoundaryType.ClassB:
        return this.renderers[AirspaceRenderType.BlueSingle];
      case BoundaryType.ClassC:
      case BoundaryType.ClassE:
        return this.renderers[AirspaceRenderType.MaroonSingle];
      case BoundaryType.ClassD:
        return this.renderers[AirspaceRenderType.BlueDashed];
      case BoundaryType.Restricted:
      case BoundaryType.Prohibited:
      case BoundaryType.Warning:
      case BoundaryType.Danger:
      case BoundaryType.Training:
        return this.renderers[AirspaceRenderType.BlueCombed];
      case BoundaryType.MOA:
      case BoundaryType.Alert:
        return this.renderers[AirspaceRenderType.MaroonCombed];
      default:
        return this.renderers[AirspaceRenderType.Null];
    }
  }
}

/**
 * Renders airspace boundaries with a comb-like pattern.
 */
class CombedAirspaceRenderer extends MapMultiLineAirspaceRenderer {
  private static readonly emptyDash = [];

  /**
   * Constructor.
   * @param color The color of the rendered airspace.
   * @param baseLineWidth The stroke width of the base line that is drawn on the airspace boundary.
   * @param isTeethOutside Whether the teeth should appear on the outside of the boundary.
   * @param teethWidth The width of the teeth.
   * @param teethDash The dash of the teeth.
   */
  constructor(
    public readonly color: string,
    public readonly baseLineWidth: number,
    public readonly isTeethOutside: boolean,
    public readonly teethWidth: number,
    public readonly teethDash: number[]
  ) {
    super();
  }

  /** @inheritdoc */
  protected renderLines(
    shape: MapMultiLineAirspaceShape,
    context: CanvasRenderingContext2D,
    stream?: PathStream
  ): void {
    // render base line
    shape.renderLine(context, 0, this.baseLineWidth, this.color, CombedAirspaceRenderer.emptyDash, stream);

    // render teeth
    shape.renderLine(context, this.teethWidth / 2 * (this.isTeethOutside ? 1 : -1), this.teethWidth, this.color, this.teethDash, stream);
  }
}