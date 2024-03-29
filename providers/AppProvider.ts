import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { string } from '@poppinss/utils/build/helpers'
import { NamingStrategyContract, LucidModel, ModelRelations } from '@ioc:Adonis/Lucid/Orm'

/**
 * Uses snake case as the naming strategy for different model properties
 */
export class CamelCaseNamingStrategy implements NamingStrategyContract {
  /**
   * The default table name for the given model
   */
  public tableName(model: LucidModel): string {
    return string.pluralize(string.snakeCase(model.name))
  }

  /**
   * The database column name for a given model attribute
   */
  public columnName(_: LucidModel, attributeName: string): string {
    return string.snakeCase(attributeName)
  }

  /**
   * The post serialization name for a given model attribute
   */
  public serializedName(_: LucidModel, attributeName: string): string {
    return string.camelCase(attributeName)
  }

  /**
   * The local key for a given model relationship
   */
  public relationLocalKey(
    relation: ModelRelations['__opaque_type'],
    model: LucidModel,
    relatedModel: LucidModel
  ): string {
    if (relation === 'belongsTo') {
      return relatedModel.primaryKey
    }

    return model.primaryKey
  }

  /**
   * The foreign key for a given model relationship
   */
  public relationForeignKey(
    relation: ModelRelations['__opaque_type'],
    model: LucidModel,
    relatedModel: LucidModel
  ): string {
    if (relation === 'belongsTo') {
      return string.camelCase(`${relatedModel.name}_${relatedModel.primaryKey}`)
    }

    return string.camelCase(`${model.name}_${model.primaryKey}`)
  }

  /**
   * Pivot table name for many to many relationship
   */
  public relationPivotTable(_: 'manyToMany', model: LucidModel, relatedModel: LucidModel): string {
    return string.snakeCase([relatedModel.name, model.name].sort().join('_'))
  }

  /**
   * Pivot foreign key for many to many relationship
   */
  public relationPivotForeignKey(_: 'manyToMany', model: LucidModel): string {
    return string.snakeCase(`${model.name}_${model.primaryKey}`)
  }

  /**
   * Keys for the pagination meta
   */
  public paginationMetaKeys(): {
    total: string
    perPage: string
    currentPage: string
    lastPage: string
    firstPage: string
    firstPageUrl: string
    lastPageUrl: string
    nextPageUrl: string
    previousPageUrl: string
  } {
    return {
      total: 'total',
      perPage: 'per_page',
      currentPage: 'current_page',
      lastPage: 'last_page',
      firstPage: 'first_page',
      firstPageUrl: 'first_page_url',
      lastPageUrl: 'last_page_url',
      nextPageUrl: 'next_page_url',
      previousPageUrl: 'previous_page_url',
    }
  }
}
export default class AppProvider {
  constructor (protected app: ApplicationContract) {
  }

  public register () {
    // Register your own bindings
  }

  public async boot () {
    // IoC container is ready
  }

  public async ready () {
    // App is ready
    // Prepare all mantainers
    if (this.app.environment == 'web') {
      const {default: Mantainer} = await import('App/Models/Mantainer')
      const {default: Redis} = await import('@ioc:Adonis/Addons/Redis')
      const mantainers = await Mantainer.all()
      for (const maintainer of mantainers) {
        await Redis.hset('mantainers', maintainer.id, JSON.stringify(maintainer))
        for (const domain of maintainer.authorizedDomains) {
          await Redis.hset('authorized-domains', domain, maintainer.id)
        }
      }
    }
  }

  public async shutdown () {
    // Cleanup, since app is going down
  }
}
