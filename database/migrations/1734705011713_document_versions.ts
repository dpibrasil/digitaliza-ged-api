import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'document_versions'

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.integer('pages').notNullable().defaultTo(1)
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('pages')
    })
  }
}
