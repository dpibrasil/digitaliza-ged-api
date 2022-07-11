// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Document from "App/Models/Document"
import encrypt from 'node-file-encrypt';
import DocumentVersion from "App/Models/DocumentVersion"
import Storage from "App/Models/Storage";
import fs from 'fs';

export default class DocumentVersionsController {
    
    async index({request}) {
        const documentId = request.param('documentId')
        const document = await Document.findOrFail(documentId)
        const versions = await DocumentVersion.query().where('document_id', document.documentId).preload('editor')

        return versions.map(version => version.serialize())
    }

    async store({request, auth}) {
        const documentId = request.param('documentId')
        const document = await Document.findOrFail(documentId)
        const lastestVersion = await DocumentVersion.query().where('document_id', document.documentId).orderBy('version', 'desc').firstOrFail()
        const storage = await Storage.findOrFail(lastestVersion.storageId)

        const versionId = lastestVersion.version + 1

        // encrypt and save file
        const filePath = `${storage.path}/${lastestVersion.path}/${document.documentId}`
        const file = request.file('file')
        const encryptedFile = new encrypt.FileEncrypt(file.tmpPath, filePath, '.ged.tmp', false)
        encryptedFile.openSourceFile()
        await encryptedFile.encryptAsync(document.secretKey)
        fs.renameSync(encryptedFile.encryptFilePath, `${filePath}/${document.documentId}-v${versionId}.ged`)

        const version = await DocumentVersion.create({
            storageId: storage.id,
            path: lastestVersion.path,
            documentId: document.documentId,
            editorId: auth.user.id,
            version: versionId
        })

        document.version = versionId
        await document.save()

        return version.serialize()
    }

    async destroy({request}) {
        const documentId = request.param('documentId')
        const document = await Document.findOrFail(documentId)

        const versionId = request.param('id')
        const version = await DocumentVersion.query().where('document_id', document.documentId).where('version', versionId).firstOrFail()
        await version.delete()

        return {message: 'OK'}
    }

}
