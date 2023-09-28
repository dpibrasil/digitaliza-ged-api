import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Directory from 'App/Models/Directory'

export default function createDirectoryIndexesSchema(directory: Directory)
{
    return schema.create(Object.fromEntries(directory.indexes.map(index => {
        const schemaType = {
            datetime: 'date',
            list: 'number'
        }[index.type] ?? index.type
        
        const args: any = []

        args.push([])
        if (index.minLength) args[0].push(rules.minLength(index.minLength))
        if (index.maxLength) args[0].push(rules.maxLength(index.maxLength))
        if (index.min || index.max) args[0].push(rules.range(index.min, index.max))
        if (index.regex) args[0].push(rules.regex(new RegExp(index.regex)))
        if (index.type == 'list') args[0].push(rules.exists({table: 'directory_index_list_values', column: 'id'}))
        if (schemaType == 'string') args.unshift({})

        return ['index-' + index.id, index.notNullable ? schema[schemaType](...args) : schema[schemaType].optional(...args)]
    })))
}