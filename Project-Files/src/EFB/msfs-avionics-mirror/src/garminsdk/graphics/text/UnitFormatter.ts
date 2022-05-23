import { Unit, UnitFamily, UnitType } from 'msfssdk';

/**
 * A utility class for creating Garmin unit formatters.
 *
 * Each unit formatter is a function which generates output strings from input measurement units.
 */
export class UnitFormatter {
  private static readonly UNIT_TEXT: Record<string, Record<string, string>> = {
    [UnitFamily.Distance]: {
      [UnitType.METER.name]: 'M',
      [UnitType.FOOT.name]: 'FT',
      [UnitType.KILOMETER.name]: 'KM',
      [UnitType.NMILE.name]: 'NM'
    },
    [UnitFamily.Angle]: {
      [UnitType.DEGREE.name]: '°',
      [UnitType.RADIAN.name]: 'rad'
    },
    [UnitFamily.Duration]: {
      [UnitType.SECOND.name]: 'S',
      [UnitType.MINUTE.name]: 'M',
      [UnitType.HOUR.name]: 'H'
    },
    [UnitFamily.Weight]: {
      [UnitType.KILOGRAM.name]: 'KG',
      [UnitType.POUND.name]: 'LB',
      [UnitType.LITER_FUEL.name]: 'L',
      [UnitType.GALLON_FUEL.name]: 'GAL'
    },
    [UnitFamily.Volume]: {
      [UnitType.LITER.name]: 'L',
      [UnitType.GALLON.name]: 'GAL'
    },
    [UnitFamily.Pressure]: {
      [UnitType.HPA.name]: 'HPA',
      [UnitType.IN_HG.name]: 'INHG'
    },
    [UnitFamily.Temperature]: {
      [UnitType.CELSIUS.name]: '°C',
      [UnitType.FAHRENHEIT.name]: '°F'
    },
    [UnitType.KNOT.family]: {
      [UnitType.KNOT.name]: 'KT',
      [UnitType.KPH.name]: 'KH',
      [UnitType.MPM.name]: 'MPM',
      [UnitType.FPM.name]: 'FPM'
    },
    [UnitType.LPH_FUEL.family]: {
      [UnitType.KGH.name]: 'KGH',
      [UnitType.PPH.name]: 'PPH',
      [UnitType.LPH_FUEL.name]: 'LPH',
      [UnitType.GPH_FUEL.name]: 'GPH'
    }
  };

  /**
   * Creates a function which formats measurement units to strings representing their abbreviated names.
   * @param defaultString The string to output when the input unit cannot be formatted. Defaults to the empty string.
   * @param charCase The case to enforce on the output string. Defaults to `'normal'`.
   * @returns A function which formats measurement units to strings representing their abbreviated names.
   */
  public static create(defaultString = '', charCase: 'normal' | 'upper' | 'lower' = 'normal'): (unit: Unit<any>) => string {
    switch (charCase) {
      case 'upper':
        return (unit: Unit<any>): string => UnitFormatter.UNIT_TEXT[unit.family]?.[unit.name]?.toUpperCase() ?? defaultString;
      case 'lower':
        return (unit: Unit<any>): string => UnitFormatter.UNIT_TEXT[unit.family]?.[unit.name]?.toLowerCase() ?? defaultString;
      default:
        return (unit: Unit<any>): string => UnitFormatter.UNIT_TEXT[unit.family]?.[unit.name] ?? defaultString;
    }
  }
}