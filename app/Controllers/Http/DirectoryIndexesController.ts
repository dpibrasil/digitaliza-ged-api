// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import DirectoryIndex from "App/Models/DirectoryIndex"

export default class DirectoryIndexesController {

    async index() {
        const indexes = await DirectoryIndex.query().preload('listValues').orderBy('id')
        return indexes.map(index => index.serialize())
    }

    async show({ request }) {
        const indexId = request.param('id')
        const index = await DirectoryIndex.findOrFail(indexId)

        await index.load('listValues', (query) => query.orderByRaw('value COLLATE "pt_BR"'))

        return index.serialize()
    }

    async store({ request, auth, logger }) {
        const data = request.only(['directoryId', 'name', 'type', 'displayAs', 'notNullable', 'min', 'max', 'minLength', 'maxLength', 'regex'])

        if (data.displayAs == 'cpf-cnpj') {
            data.type = 'string';
            data.regex = '(^\d{3}\.\d{3}\.\d{3}\-\d{2}$)|(^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$)'
        }

        const index = await DirectoryIndex.create(data)

        logger.info(`User ${auth.user.id} created index ${index.id}`)

        return index.serialize()
    }

    async update({ request, logger, auth }) {
        const indexId = request.param('id')
        const oldIndex = await DirectoryIndex.findOrFail(indexId)
        const data = request.only(['directoryId', 'name', 'type', 'displayAs', 'notNullable', 'min', 'max', 'minLength', 'maxLength', 'regex'])

        const index = await DirectoryIndex.updateOrCreate({ id: oldIndex.id }, data)
        logger.info(`User ${auth.user.id} updated index ${index.id}`)

        return index.serialize()
    }
}
