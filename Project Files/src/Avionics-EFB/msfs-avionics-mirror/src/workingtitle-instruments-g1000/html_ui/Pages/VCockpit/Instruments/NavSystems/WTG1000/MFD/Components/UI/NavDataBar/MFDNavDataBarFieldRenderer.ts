import { VNode } from 'msfssdk';
import { NavDataFieldType } from '../../../../Shared/UI/NavDataField/NavDataFieldType';
import { MFDNavDataBarFieldTypeModelMap } from './MFDNavDataBarFieldModel';

/**
 * Renders MFD navigation data bar fields.
 */
export interface MFDNavDataBarFieldRenderer {
  /**
   * Renders a navigation data bar field of a given type.
   * @param type A data bar field type.
   * @param model The data model for the field.
   * @returns A navigation data bar field of the given type, as a VNode.
   * @throws Error if an unsupported field type is specified.
   */
  render<T extends NavDataFieldType>(type: T, model: MFDNavDataBarFieldTypeModelMap[T]): VNode
}