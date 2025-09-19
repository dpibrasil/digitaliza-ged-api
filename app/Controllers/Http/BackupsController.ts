import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DocumentVersion } from 'App/Models'
import Directory from 'App/Models/Directory'
import DirectoryIndex from 'App/Models/DirectoryIndex'
import DirectoryIndexListValue from 'App/Models/DirectoryIndexListValue'
import Document from 'App/Models/Document'
import DocumentIndex from 'App/Models/DocumentIndex'
import Organization from 'App/Models/Organization'
import { v4 as uuid } from 'uuid'
import fs from 'fs/promises'
import Env from '@ioc:Adonis/Core/Env'
import path from 'path'
import AdmZip from 'adm-zip';
import encrypt from 'node-file-encrypt'
import Backup from 'App/Models/Backup'

export default class BackupsController {

    async showByOrganization({ request }: HttpContextContract)
    {
        const organizationId = request.param('organizationId')
        const organization = await Organization.query().where('id', organizationId).preload('backups').firstOrFail()

        return organization
    }

    async index({})
    {
        const organizations = await Organization.query().preload('backups')

        return organizations.map(organization => organization.serialize())
    }

    async store({ request }: HttpContextContract)
    {
        const organizationId = request.input('organizationId')

        const organization = await Organization.firstOrFail(organizationId)

        const directories = await Directory.query()
            .where('organization_id', organization.id)

        const directoryIndexes = await DirectoryIndex
            .query()
            .whereRaw(`directory_id IN (SELECT id FROM directories WHERE organization_id = ${organization.id})`)

        const directoryIndexListValues = await DirectoryIndexListValue.query()
            .whereRaw(`
                index_id IN
                (
                    SELECT id FROM directory_indexes
                    WHERE directory_id IN (SELECT id FROM directories WHERE organization_id = ${organization.id})
                )
            `)

        const documents = await Document.query()
            .where('organizationId', organization.id)

        const documentVersions = await DocumentVersion.query()
            .whereRaw(`
                document_id IN (SELECT document_id FROM documents WHERE organization_id = ${organization.id})
            `)

        const documentIndexes = await DocumentIndex.query()
            .whereRaw(`
                document_id IN (SELECT id FROM documents WHERE organization_id = ${organization.id})
            `)

        const backupId = uuid()
        const outputPath = `${Env.get('BACKUPS_PATH')}${path.sep}backup-${organization.id}-${backupId}${path.sep}`

        await fs.mkdir(outputPath, { recursive: true })

        const storagePath = outputPath + 'storage' + path.sep
        await fs.mkdir(storagePath, { recursive: true })

        const data = {
            organization,
            directories: directories.map(x => x.$attributes),
            directoryIndexes: directoryIndexes.map(x => x.$attributes),
            directoryIndexListValues: directoryIndexListValues.map(x => x.$attributes),
            documents: documents.map(x => x.$attributes),
            documentVersions: documentVersions.map(x => x.$attributes),
            documentIndexes: documentIndexes.map(x => x.$attributes)
        }

        const dataPath = outputPath + 'data'
        const dataJson = JSON.stringify(data, (_, value) => {
            if (value !== null) return value
        })
        await fs.writeFile(dataPath, dataJson)
        const zip = new AdmZip()
        zip.addFile('data', Buffer.from(dataJson, 'utf-8'))

        for (const documentVersion of documentVersions) {
            const documentPath = await documentVersion.getLocalPath()
            const secretKey = documents.find(document => document.documentId == documentVersion.documentId)?.secretKey

            const outputName = `${documentVersion.documentId}-v${documentVersion.version}.pdf`


            const encryptedFile = new encrypt.FileEncrypt(documentPath, storagePath)
            encryptedFile.openSourceFile()
            await encryptedFile.decryptAsync(secretKey)

            const output = encryptedFile.decryptFilePath

            zip.addFile(outputName, await fs.readFile(output))
        }

        const output = outputPath + 'output.zip'
        await zip.writeZip(output)

        const backup = await Backup.create({
            organizationId: organization.id,
            size: (await fs.stat(output)).size,
            path: outputPath
        })

        return backup
    }

    async downloadBackup({ request, response }: HttpContextContract)
    {
        const backupId = request.param('id')
        const backup = await Backup.findOrFail(backupId)

        response.header('Content-Type', 'application/zip')
        
        response.download(backup.path + 'output.zip')
    }

    async destroy({ request })
    {
        const backupId = request.param('id')
        const backup = await Backup.findOrFail(backupId)

        try {
            await fs.rmdir(backup.path)
        } catch (e) {}

        await backup.delete()
    }

    async getDocumentsBackupsHealth()
    {
        const documents = await DocumentVersion.query()
            .count('* as total')
            .where('s3_synced', false)
        
        return {
            unsyncedDocuments: documents[0].$extras.total
        }
    }

}
