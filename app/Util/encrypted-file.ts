import Storage from "App/Models/Storage"
import fs from 'fs'
import encrypt from 'node-file-encrypt';
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import Env from '@ioc:Adonis/Core/Env'
import path from 'path'

interface Document {
    path: string
    documentId: string
    version: number
}

export default async function createEncryptedFile(file: MultipartFileContract, document: Document, storage: Storage, key: string)
{
    const uploadsPath = Env.get('UPLOADS_PATH')
    const gedProjectName = `${document.documentId}.ged-project`
    await file.move(uploadsPath, { name: gedProjectName })
    const gedProjectPath = uploadsPath + path.sep + gedProjectName

    const encryptedFile = new encrypt.FileEncrypt(
        gedProjectPath, // Current file location
        `${storage.path}/${document.path}`, // Destination path
        '.ged.tmp', // Extension
        false
    )
    encryptedFile.openSourceFile()

    // Encrypt
    await encryptedFile.encryptAsync(key)

    // Save on storage
    fs.renameSync(encryptedFile.encryptFilePath, `${storage.path}/${document.path}/${document.documentId}-v${document.version}.ged`)
}