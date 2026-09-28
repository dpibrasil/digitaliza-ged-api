import { test } from '@japa/runner'
import { validator } from '@ioc:Adonis/Core/Validator'
import createDirectoryIndexesSchema from 'App/Util/directory-validator'

// bigint columns arrive from Postgres as strings
const index = (id: number, type: string, options: any = {}) => ({
  id,
  type,
  notNullable: false,
  min: null,
  max: null,
  minLength: null,
  maxLength: null,
  regex: null,
  ...options,
})

const validate = (indexes: any[], data: any) =>
  validator.validate({ schema: createDirectoryIndexesSchema({ indexes } as any), data })

test.group('Directory indexes schema', () => {
  test('accepts number index with length and minimum set', async ({ assert }) => {
    const indexes = [index(1, 'number', { minLength: '0', min: '0' })]

    assert.deepEqual(await validate(indexes, { 'index-1': 710 }), { 'index-1': 710 })
  })

  test('accepts datetime index with length and minimum set', async ({ assert }) => {
    const indexes = [index(1, 'datetime', { minLength: '0', min: '0' })]

    const output = await validate(indexes, { 'index-1': '2016-04-01' })
    assert.equal(output['index-1'].toISODate(), '2016-04-01')
  })

  test('accepts string index with minimum set', async ({ assert }) => {
    const indexes = [index(1, 'string', { minLength: '0', min: '0', regex: '\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}' })]

    assert.deepEqual(await validate(indexes, { 'index-1': '039.481.004-03' }), { 'index-1': '039.481.004-03' })
    await assert.rejects(() => validate(indexes, { 'index-1': '03948100403' }))
  })

  test('enforces length on string index', async ({ assert }) => {
    const indexes = [index(1, 'string', { minLength: '3', maxLength: '5' })]

    assert.deepEqual(await validate(indexes, { 'index-1': 'abc' }), { 'index-1': 'abc' })
    await assert.rejects(() => validate(indexes, { 'index-1': 'ab' }))
    await assert.rejects(() => validate(indexes, { 'index-1': 'abcdef' }))
  })

  test('enforces range on number index', async ({ assert }) => {
    const indexes = [index(1, 'number', { min: '1', max: '10' })]

    assert.deepEqual(await validate(indexes, { 'index-1': 5 }), { 'index-1': 5 })
    await assert.rejects(() => validate(indexes, { 'index-1': 0 }))
    await assert.rejects(() => validate(indexes, { 'index-1': 11 }))
  })

  test('enforces minimum alone on number index', async ({ assert }) => {
    const indexes = [index(1, 'number', { min: '0' })]

    assert.deepEqual(await validate(indexes, { 'index-1': 19038416825 }), { 'index-1': 19038416825 })
    await assert.rejects(() => validate(indexes, { 'index-1': -1 }))
  })

  test('enforces maximum alone on number index', async ({ assert }) => {
    const indexes = [index(1, 'number', { max: '10' })]

    assert.deepEqual(await validate(indexes, { 'index-1': -5 }), { 'index-1': -5 })
    await assert.rejects(() => validate(indexes, { 'index-1': 11 }))
  })

  test('ignores regex on number index', async ({ assert }) => {
    const indexes = [index(1, 'number', { regex: '\\d+' })]

    assert.deepEqual(await validate(indexes, { 'index-1': 5 }), { 'index-1': 5 })
  })
})
