import { APAltitudeModes, APLateralModes, APVerticalModes } from 'msfssdk/autopilot';

/**
 * A G1000 NXi FMA data object.
 */
export type FmaData = {
  /** The Active Vertical Mode */
  verticalActive: APVerticalModes,
  /** The Armed Vertical Mode */
  verticalArmed: APVerticalModes,
  /** The Armed Vertical Approach Mode */
  verticalApproachArmed: APVerticalModes,
  /** The Armed Altitude Type */
  verticalAltitudeArmed: APAltitudeModes,
  /** The Altitude Capture Armed State */
  altitideCaptureArmed: boolean,
  /** The Altitude Capture Value */
  altitideCaptureValue: number,
  /** The Active Lateral Mode */
  lateralActive: APLateralModes,
  /** The Armed Lateral Mode */
  lateralArmed: APLateralModes,
  /** Lateral Mode Failed */
  lateralModeFailed: boolean;
}