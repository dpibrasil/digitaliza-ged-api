import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Directory from 'App/Models/Directory'
import DirectoryIndex from 'App/Models/DirectoryIndex'

// bigint columns arrive from Postgres as strings
const limit = (value: any) => value === null || value === undefined || value === '' ? undefined : Number(value)

export function createIndexRules(index: DirectoryIndex)
{
    const indexRules: any = []
    const min = limit(index.min)
    const max = limit(index.max)
    const minLength = limit(index.minLength)
    const maxLength = limit(index.maxLength)

    if (index.type == 'string') {
        if (minLength) indexRules.push(rules.minLength(minLength))
        if (maxLength) indexRules.push(rules.maxLength(maxLength))
        if (index.regex) indexRules.push(rules.regex(new RegExp(index.regex)))
    }
    if (index.type == 'number' && (min !== undefined || max !== undefined)) {
        indexRules.push(rules.range(min ?? Number.MIN_SAFE_INTEGER, max ?? Number.MAX_SAFE_INTEGER))
    }
    if (index.type == 'list') indexRules.push(rules.exists({table: 'directory_index_list_values', column: 'id'}))

    return indexRules
}

export default function createDirectoryIndexesSchema(directory: Directory)
{
    return schema.create(Object.fromEntries(directory.indexes.map(index => {
        const schemaType = {
            datetime: 'date',
            list: 'number'
        }[index.type] ?? index.type

        const args: any = []

        args.push(createIndexRules(index))
        if (schemaType == 'string') args.unshift({})

        return ['index-' + index.id, index.notNullable ? schema[schemaType](...args) : schema[schemaType].optional(...args)]
    })))
}
