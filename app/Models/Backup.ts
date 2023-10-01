import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Backup extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public organizationId: number

  @column()
  public size: number

  @column()
  public hash: string

  @column()
  public path: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
