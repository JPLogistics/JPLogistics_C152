import { XMLExtendedGaugeConfig, XMLGaugeConfigFactory } from 'msfssdk/components/XMLGauges';
import { xmlConfig as C172Config } from './C172';
import { xmlConfig as C208Config } from './C208';
import { xmlConfig as DA40Config } from './DA40';
import { xmlConfig as DA62Config } from './DA62';
import { xmlConfig as G36Config } from './G36';
import { xmlConfig as G58Config } from './G58';
import { xmlConfig as SR22Config } from './SR22';


/**
 * This is temporary code to allow the loading of new panel configurations for
 * default planes until we get these into SU6.
 */
export class PanelLoader {
  private factory: XMLGaugeConfigFactory;
  private parser = new DOMParser();
  private panelMapping = new Map([
    ['TT:ATCCOM.AC_MODEL C172.0.text', C172Config],
    ['TT:ATCCOM.AC_MODEL C208.0.text', C208Config],
    ['TT:ATCCOM.AC_MODEL_DA40.0.text', DA40Config],
    ['TT:ATCCOM.AC_MODEL_DA62.0.text', DA62Config],
    ['TT:ATCCOM.AC_MODEL_BE36.0.text', G36Config],
    ['TT:ATCCOM.AC_MODEL_BE58.0.text', G58Config],
    ['TT:ATCCOM.AC_MODEL_SR22.0.text', SR22Config],
  ]);

  /**
   * Create a panel loader.
   * @param factory A configured XML gauge factory.
   */
  constructor(factory: XMLGaugeConfigFactory) {
    this.factory = factory;
  }

  /**
   * Given an ATC model, load the corresponding panel configuration.
   * @param model The ATC model.
   * @returns A full XMLExtendedGaugeConfig object or undefined.
   */
  public loadConfigForModel(model: string): XMLExtendedGaugeConfig | undefined {
    const config = this.panelMapping.get(model);
    if (config) {
      return this.factory.parseConfig(this.parser.parseFromString(config, 'application/xml'));
    }
  }
}