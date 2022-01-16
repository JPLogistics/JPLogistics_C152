import { NavMath, Vec2Math } from 'msfssdk';

/**
 * Projection utils for the SVT
 */
export class SvtProjectionUtils {
  private static readonly FOV = 65;
  private static readonly FOCAL_LENGTH = 614.4 / Math.tan(SvtProjectionUtils.FOV / 2 * Avionics.Utils.DEG2RAD);

  /**
   * Projects vector3 to screen FoV.
   * @param x the x value
   * @param y the y value
   * @param z the z value
   * @param out The vector to which to write the results.
   * @returns The projected vector.
   */
  public static project(x: number, y: number, z: number, out: Float64Array): Float64Array {
    return Vec2Math.set(
      x * SvtProjectionUtils.FOCAL_LENGTH / z,
      y * SvtProjectionUtils.FOCAL_LENGTH / z,
      out
    );
  }

  /**
   * Relative yaw/pitch to plane, both in radians
   * @param yaw Yaw in radians
   * @param pitch Pitch in radians
   * @param roll Roll in radians
   * @param out The vector to which to write the results.
   * @returns projected vector with yaw/pitch
   */
  public static projectYawPitch(yaw: number, pitch: number, roll: number, out: Float64Array): Float64Array {
    const cos = Math.cos, sin = Math.sin;
    let x = 0;
    let y = 0;
    let z = 1;

    // pitch
    y = -sin(pitch);
    z = cos(pitch);

    // yaw
    x = z * sin(yaw);
    z = z * cos(yaw);

    // roll
    if (roll !== 0) {
      const x0 = x;
      const y0 = y;
      const sinR = sin(roll);
      const cosR = cos(roll);
      x = x0 * cosR - y0 * sinR;
      y = x0 * sinR + y0 * cosR;
    }

    return this.project(x, y, z, out);
  }

  /**
   * Projects lat long alt
   * @param latLongAlt  The coordinates of the position to project.
   * @param planeCoordinates The plane position.
   * @param heading The heading of the plane in degrees.
   * @param roll Roll in radians
   * @param out The vector to which to write the results.
   * @returns The projected position.
   */
  public static projectLatLongAlt(
    latLongAlt: LatLongAlt,
    planeCoordinates: LatLongAlt,
    heading: number,
    roll: number,
    out: Float64Array
  ): Float64Array {
    const directionToPos = Avionics.Utils.computeGreatCircleHeading(planeCoordinates, latLongAlt);
    const yaw = NavMath.diffAngle(heading, directionToPos) * Avionics.Utils.DEG2RAD;

    const deltaPos = Avionics.Utils.computeGreatCircleDistance(planeCoordinates, latLongAlt) * 6076;
    const deltaAlt = Math.abs(latLongAlt.alt - planeCoordinates.alt);
    const pitch = -Math.atan2(deltaAlt, deltaPos);

    return this.projectYawPitch(yaw, pitch, roll, out);
  }
}