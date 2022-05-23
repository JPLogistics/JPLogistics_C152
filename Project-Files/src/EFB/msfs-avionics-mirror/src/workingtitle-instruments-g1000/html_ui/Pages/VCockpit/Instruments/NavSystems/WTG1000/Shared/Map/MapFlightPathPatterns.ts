import { PathPattern, PathStream } from 'msfssdk/graphics/path';

/**
 * A repeating pattern of triangular arrows pointing in the direction of the input path.
 */
export class FlightPathArrowPattern implements PathPattern {
  /** @inheritdoc */
  public readonly length = 12;

  /** @inheritdoc */
  public readonly anchor = 0.5;

  /** The canvas 2D rendering context to which to render. */
  public context: CanvasRenderingContext2D | null = null;

  /** The color of the arrows to render. */
  public color = 'white';

  /** @inheritdoc */
  public draw(stream: PathStream): void {
    if (!this.context) {
      return;
    }

    stream.moveTo(5, 0);
    stream.lineTo(-5, -3);
    stream.lineTo(-5, 3);
    stream.closePath();

    this.context.fillStyle = this.color;
    this.context.fill();
  }
}