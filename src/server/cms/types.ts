import { AnyCMSModel, CMSModelName } from "../../types/cms-generated"
import { CMSField, CMSBlock } from "../../types/fields"

/**
 * RecordManager handles operations on individual CMS records.
 * It provides a domain-centric interface for fetching, creating,
 * updating, and deleting records within the CMS.
 */
export interface RecordManager {
  /**
   * Fetches all records for a specific model.
   * @param model - The name of the CMS model (e.g., 'authors').
   * @returns A list of records.
   */
  getRecords(model: CMSModelName): Promise<AnyCMSModel[]>

  /**
   * Fetches a single record by its ID.
   * @param model - The name of the CMS model.
   * @param id - The unique identifier of the record.
   * @returns The record if found, otherwise null.
   */
  getRecordById(model: CMSModelName, id: string): Promise<AnyCMSModel | null>

  /**
   * Creates a new record.
   * @param model - The name of the CMS model.
   * @param data - The record data to insert.
   * @returns The created record.
   */
  createRecord(
    model: CMSModelName,
    data: Partial<AnyCMSModel>
  ): Promise<AnyCMSModel>

  /**
   * Updates an existing record.
   * @param model - The name of the CMS model.
   * @param id - The unique identifier of the record to update.
   * @param data - The partial data to update.
   * @returns The updated record.
   */
  updateRecord(
    model: CMSModelName,
    id: string,
    data: Partial<AnyCMSModel>
  ): Promise<AnyCMSModel>

  /**
   * Deletes a record.
   * @param model - The name of the CMS model.
   * @param id - The unique identifier of the record to delete.
   */
  deleteRecord(model: CMSModelName, id: string): Promise<void>
}

/**
 * SchemaManager handles operations on the CMS schema definition.
 * It provides methods to query and potentially modify the structure
 * of models, fields, and blocks.
 */
export interface SchemaManager {
  /**
   * Fetches the configuration for a specific field.
   * @param model - The name of the CMS model.
   * @param fieldSlug - The slug/identifier of the field.
   */
  getField(model: CMSModelName, fieldSlug: string): Promise<CMSField | null>

  /**
   * Fetches all fields defined for a specific model.
   * @param model - The name of the CMS model.
   */
  getFieldsForModel(model: CMSModelName): Promise<CMSField[]>

  /**
   * Fetches a block definition by its identifier.
   * @param blockId - The ID or slug of the block.
   */
  getBlock(blockId: string): Promise<CMSBlock | null>

  /**
   * Fetches all available blocks in the CMS.
   */
  getAllBlocks(): Promise<CMSBlock[]>
}
