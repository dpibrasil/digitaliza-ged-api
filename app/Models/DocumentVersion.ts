import { DateTime } from 'luxon'
import { BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Storage from './Storage'
import User from './User';
import { compose } from '@ioc:Adonis/Core/Helpers'
import fs from 'fs'
import { Observable } from '@ioc:Adonis/Addons/LucidObserver';
import Drive from '@ioc:Adonis/Core/Drive'
import Logger from '@ioc:Adonis/Core/Logger'
import DocumentVersionObserver from 'App/Observers/DocumentVersionObserver';
import AppBaseModel from './AppBaseModel';
import Document from './Document';
import Env from '@ioc:Adonis/Core/Env'
export default class DocumentVersion extends compose(AppBaseModel, Observable) {

  protected static $observers = [new DocumentVersionObserver()]

  @column({ isPrimary: true })
  public id: number

  @column()
  public storageId: number

  @belongsTo(() => Storage)
  public storage: BelongsTo<typeof Storage>

  @column()
  public path: string

  @column()
  public documentId: string

  @belongsTo(() => Document, { foreignKey: 'documentId', localKey: 'documentId' })
  public document: BelongsTo<typeof Document>

  @column()
  public editorId: number

  @belongsTo(() => User, { foreignKey: 'editorId' })
  public editor: BelongsTo<typeof User>

  @column()
  public version: number

  @column()
  public hash: string

  @column()
  public size: number

  @column()
  public s3Synced: boolean

  @column()
  declare pages: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  public async getLocalPath(): Promise<string> {
    const storage = await Storage.findOrFail(this.storageId)
    return `${storage.path}/${this.path}/${this.documentId}-v${this.version}.ged`
  }

  public async awsSync(): Promise<void> {
    if (this.s3Synced) return
    try {
      const localPath = await this.getLocalPath()
      const driverPath = `storage-${this.storageId}/${this.path}/${this.documentId}/${this.documentId}-v${this.version}.ged`

      // send to aws
      const s3 = Drive.use('s3')
      const file = fs.createReadStream(localPath)
      await s3.putStream(driverPath, file, {
        StorageClass: Env.get('S3_STORAGE_CLASS')
      })
      this.s3Synced = true
    } catch (e) {
      this.s3Synced = false
      Logger.error(`Falha ao sincronizar com AWS S3 versão ${this.version} do documento ${this.documentId}. ` + e)
    }
  }
}
