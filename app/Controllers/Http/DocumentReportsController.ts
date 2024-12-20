// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Directory from "App/Models/Directory"
import Document from "App/Models/Document"

export default class DocumentReportsController {

    async index({ request }) {
        const directoriesIDs = request.input('directories')
        const directories = await Directory.findMany(Array.isArray(directoriesIDs) ? directoriesIDs : [directoriesIDs])

        const data = await Promise.all(directories.map(async (directory) => {
            const documents = await Document.query().count('*').where('directoryId', directory.id)
            return {
                id: directory.id,
                name: directory.name,
                documentsCount: Number(documents[0].$extras.count)
            }
        }))

        return data
    }

}
