import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { fillPDFReport } from 'App/Lib/GenerateReport'
import { DocumentVersion } from 'App/Models'

import Directory from "App/Models/Directory"
import Document from "App/Models/Document"
import Organization from 'App/Models/Organization'

export default class DocumentReportsController {

    async index({ request, auth, response }: HttpContextContract) {
        const startDate = new Date(request.input('start-date'))
        const endDate = new Date(request.input('end-date'))
        const directoriesIDs = request.input('directories')
        const organizationId = request.param('id')
        const organization = await Organization.findOrFail(organizationId)
        const directories = await Directory.findMany(Array.isArray(directoriesIDs) ? directoriesIDs : [directoriesIDs])

        let totalDocuments = 0
        let totalPages = 0

        const data = await Promise.all(directories.map(async (directory) => {
            const documents = await Document.query().count('*')
                .where('directoryId', directory.id)
                .whereRaw(`created_at >= '${startDate.toISOString()}' AND created_at <= '${endDate.toISOString()}'`)
            const documentPages = await DocumentVersion.query()
                .sum('pages', 'sumPages')
                .whereRaw(`created_at >= '${startDate.toISOString()}' AND created_at <= '${endDate.toISOString()}' AND document_id IN (SELECT document_id FROM documents WHERE directory_id = ${directory.id})`)
                .first()
            totalDocuments += Number(documents[0].$extras.count)
            totalPages += Number(documentPages?.$extras.sumPages)
            return {
                id: directory.id,
                name: directory.name,
                documentsCount: Number(documents[0].$extras.count),
                documentPagesCount: Number(documentPages?.$extras.sumPages),
            }
        }))

        const today = new Date()
        const date = `${('0' + (today.getDate() + 1)).slice(-2)}/${('0' + (today.getMonth() + 1)).slice(-2)}/${String(today.getFullYear()).slice(-2)}`
        const content = `Período do relatório
De ${startDate.toLocaleString('pt-BR')}
Até ${endDate.toLocaleString('pt-BR')}
Relatório gerado em: ${new Date().toLocaleString('pt-BR')}
Usuário: ${auth.user?.name}

Diretórios: ${directories.map(d => d.name).join(', ')}
Quantidade de documentos: ${totalDocuments.toLocaleString('pt-BR')}
Quantidade de páginas: ${totalPages.toLocaleString('pt-BR')}

Relatório por diretório:
${data.map(d => `${d.name}: ${d.documentsCount.toLocaleString('pt-BR')} documentos e ${d.documentPagesCount.toLocaleString('pt-BR')} páginas`).join('\n')}`

        const pdf = await fillPDFReport({
            companyName: organization.name,
            content,
            date,
            page: 'PAGE 01'
        })

        response.header('content-type', 'application/pdf')
        return response.send(pdf);
    }

}
