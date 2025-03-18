// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Directory from "App/Models/Directory"
import UserDirectory from "App/Models/UserDirectory"

export default class DirectoriesController {

    async index({ request, auth }) {
        const organizationId = request.input('organizationId')

        const userDirectories = await UserDirectory.query().where('userId', auth.user.id)

        var directories: any = Directory.query()
        if (auth.user.type !== 'super-admin') {
            directories.whereIn('id', userDirectories.map(d => d.directoryId))
            if (organizationId) directories.andWhere('organization_id', organizationId)
        } else if (organizationId) {
            directories.where('organization_id', organizationId)
        }
        directories.preload('indexes', (index) => index.orderBy('id'))
        directories = await directories

        await Promise.all(directories.map(directory => Promise.all(directory.indexes.map(index => index.load('listValues', (query) => query.orderByRaw('value COLLATE "pt_BR"'))))))

        return directories.map(directory => directory.serialize())
    }

    async show({ request }) {
        const directoryId = request.param('id')
        const directory = await Directory.findOrFail(directoryId)

        await directory.load('indexes')
        await Promise.all(directory.indexes.map(index => index.load('listValues', (query) => query.orderByRaw('value COLLATE "pt_BR"'))))

        return directory.serialize()
    }

    async store({ request, logger, auth }) {
        const data = request.only(['name', 'organizationId', 'mantainerId'])

        const directory = await Directory.create(data)

        await UserDirectory.create({ userId: auth.user.id, directoryId: directory.id })

        logger.info(`User ${auth.user.id} created directory ${directory.id}`)

        return directory.serialize()
    }

    async update({ request, logger, auth }) {
        const directoryId = request.param('id')
        const oldDirectory = await Directory.findOrFail(directoryId)

        const data = request.only(['name'])
        const directory = await Directory.updateOrCreate({ id: oldDirectory.id }, data)

        logger.info(`User ${auth.user.id} updated directory ${directory.id}`)

        return directory.serialize()
    }

}
