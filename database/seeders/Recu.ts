import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Document from 'App/Models/Document'
import Env from '@ioc:Adonis/Core/Env'
import path from 'path'
import { existsSync } from 'fs'
import Logger from '@ioc:Adonis/Core/Logger'
import encrypt from 'node-file-encrypt'
import fs from 'fs/promises'
import jszip from 'jszip'
import { DocumentVersion } from 'App/Models'

export default class extends BaseSeeder {
  public async run () {
    // Write your database queries inside the run method
    const documents = await Document.query()
      // .where('created_at', '>=', '2023-09-29 00:00:00')
    const UPLOADS_PATH = Env.get('UPLOADS_PATH')

    for (const document of documents) {
      const gedProjectPath = UPLOADS_PATH + path.sep + document.documentId + '.ged-project'
      const gedProjectDir = path.dirname(gedProjectPath)
      if (existsSync(gedProjectPath)) {
        try {
          const file = await fs.readFile(gedProjectPath)
          const zip = await jszip.loadAsync(file)
          const pdf: any = await zip.file('data')?.async('uint8array')
          const tempPath = gedProjectPath + '.pdf.tmp'

          fs.writeFile(tempPath, pdf)

          const encryptedFile = new encrypt.FileEncrypt(
            tempPath,
            gedProjectDir,
            '.ged.tmp',
            false
          )
          encryptedFile.openSourceFile()
          await encryptedFile.encryptAsync(document.secretKey)
         
          const lastestVersion = await DocumentVersion.query().where('document_id', document.documentId).orderBy('version', 'desc').preload('storage').firstOrFail()
          const filePath = `${lastestVersion.storage.path}/${lastestVersion.path}`
          
          const storagePath = `${filePath}/${document.documentId}-v${lastestVersion.version}.ged`
          existsSync(storagePath)
          if (existsSync(storagePath)) {
            await fs.rename(storagePath, UPLOADS_PATH + `/old_ged/${document.documentId}`)
          }
          await fs.rename(encryptedFile.encryptFilePath, storagePath)
        } catch (e) {
          console.log(e)
          Logger.info('GED Project inválido: ' + gedProjectPath)
        }
      }
    }
  }
}
