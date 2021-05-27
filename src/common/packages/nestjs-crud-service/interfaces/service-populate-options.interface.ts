export interface ServicePopulateOptions {
  /*
   * Declare which field used to save join result
   * Required when type = mapOne or mapMany
   * Field need declared in entity without @Column
   */
  property?: string;

  /*
   * If type = relation => relation name declared in entity
   * Else tableName need to join
   */
  table?: string;

  /*
   * Alias table join
   * Default: relation
   */
  tableAlias?: string;

  /*
   * Always populate
   */
  eager?: boolean;

  /*
   * Map type:
   * - relations: have relations declare in entity, use decorator OneToMany, ManyToMany, OneToOne
   * - mapOne:
   * - mapMany:
   */
  type: 'relation' | 'mapOne' | 'mapMany';

  /*
   * On conditions
   * Optional for type relation, required for others
   * Example: `${this.aliasTable}.tag_id = tags.id`
   */
  onConditions?: string;

  /*
   * Use inner join or left join
   */
  required?: boolean;

  /*
   * Child join
   * For example: user join tag join tagCategory => tagCategory is childJoin of tag
   */
  populates?: ServicePopulateOptions[];
}
