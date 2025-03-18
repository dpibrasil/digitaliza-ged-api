import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import { countPdfPages } from 'App/Lib/CountPdfPages';
import { DocumentVersion } from 'App/Models'
import encrypt from 'node-file-encrypt';
import fs from 'fs/promises'

export default class extends BaseSeeder {
  public async run() {
    const documentVersions = await DocumentVersion.query()
      .preload('document')
      .preload('storage')
      .where('pages', 1)
    console.log(documentVersions.length)
    return
    for (const document of documentVersions) {
      try {
        const encryptedFilePath = await document.getLocalPath()
        const encryptedFile = new encrypt.FileEncrypt(encryptedFilePath, `${document.storage.path}/temp`)
        encryptedFile.openSourceFile()
        await encryptedFile.decryptAsync(document.document.secretKey)
        const newPath = encryptedFile.decryptFilePath
        console.log(newPath)
        const pageCount = await countPdfPages(newPath)
        await fs.unlink(newPath)

        document.pages = pageCount

        await document.save()
      } catch (e) {
        console.error(e)
      }
    }
  }
}
