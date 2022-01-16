import { BingComponent } from 'msfssdk/components/bing';

/**
 * Provides utility functions for working with Garmin maps.
 */
export class MapUtils {
  /**
   * Creates a full Bing component earth color array for no terrain colors.
   * @returns a full Bing component earth color array for no terrain colors.
   */
  public static createNoTerrainEarthColors(): number[] {
    return BingComponent.createEarthColorsArray('#000049', [
      {
        elev: 0,
        color: '#000000'
      },
      {
        elev: 60000,
        color: '#000000'
      }
    ]);
  }

  /**
   * Creates a full Bing component earth color array for absolute terrain colors.
   * @returns a full Bing component earth color array for absolute terrain colors.
   */
  public static createAbsoluteTerrainEarthColors(): number[] {
    return BingComponent.createEarthColorsArray('#000049', [
      {
        elev: 0,
        color: '#427238'
      },
      {
        elev: 500,
        color: '#456821'
      },
      {
        elev: 2000,
        color: '#d0aa43'
      },
      {
        elev: 3000,
        color: '#c58f45'
      },
      {
        elev: 6000,
        color: '#9d6434'
      },
      {
        elev: 8000,
        color: '#904f25'
      },
      {
        elev: 10500,
        color: '#904522'
      },
      {
        elev: 27000,
        color: '#939393'
      },
      {
        elev: 29000,
        color: '#c8c8c8'
      }
    ]);
  }


  /**
   * Creates a full Bing component earth color array for relative terrain colors.
   * @returns a full Bing component earth color array for relative terrain colors.
   */
  public static createRelativeTerrainEarthColors(): number[] {
    return BingComponent.createEarthColorsArray('#000049', [
      {
        elev: 0,
        color: '#ff0000'
      },
      {
        elev: 99,
        color: '#ff0000'
      },
      {
        elev: 100,
        color: '#ffff00'
      },
      {
        elev: 999,
        color: '#ffff00'
      },
      {
        elev: 1000,
        color: '#00ff00'
      },
      {
        elev: 1999,
        color: '#00ff00'
      },
      {
        elev: 2000,
        color: '#000000'
      }
    ]);
  }
}