import Route from '@ioc:Adonis/Core/Route'

Route.post('/auth/login', 'AuthController.login')
Route.get('/test-connection', () => ({message: 'OK'}))
Route.resource('/backups', 'BackupsController').only(['store', 'index', 'destroy'])
Route.get('/backups/organization/:organizationId', 'BackupsController.showByOrganization')
Route.get('/backups/:id', 'BackupsController.downloadBackup')

Route.group(() => {
    Route.resource('/organizations', 'OrganizationsController')
    Route.resource('/directories', 'DirectoriesController')
    Route.resource('/directory-indexes', 'DirectoryIndexesController')
    Route.resource('/directory-indexes/:indexId/list-values', 'DirectoryIndexesListValuesController')
    Route.post('/documents/search', 'DocumentsController.search')
    Route.resource('/documents', 'DocumentsController')
    Route.get('/documents/:id/file', 'DocumentsController.download')
    Route.post('/documents/:id/duplicate', 'DocumentsController.duplicate')
    Route.resource('/documents/:documentId/versions', 'DocumentVersionsController')
    Route.put('/documents/:documentId/indexes', 'DocumentIndexesController.update')
    Route.post('/documents-indexes/validate', 'DocumentIndexesController.validate')
    Route.post('/documents/export-list', 'DocumentsController.exportList')

    Route.post('/pdfs', 'PdfsController.init')
    Route.post('/pdfs/:id/image', 'PdfsController.uploadImage')
    Route.get('/pdfs/:id/export', 'PdfsController.export')

    Route.group(() => {
        Route.resource('/users', 'UsersController')
        Route.resource('/storages', 'StoragesController')
        Route.resource('/users/:userId/organizations', 'UserOrganizationsController')
        Route.resource('/users/:userId/directories', 'UserDirectoriesController')
        Route.resource('/mantainers', 'MantainersController')
        Route.get('/organizations/:id/report', 'DocumentReportsController.index')
        Route.get('/path', 'PathsController.index')
        Route.get('/documents/:id/project', 'DocumentsController.downloadProject')
    }).middleware('isAdmin')
}).middleware('auth')