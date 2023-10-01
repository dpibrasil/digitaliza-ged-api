import Application from '@ioc:Adonis/Core/Application'
import Env from '@ioc:Adonis/Core/Env'

export default {

    // Define the models that must be included in backups
    models: ['User', 'Document', 'Directory', 'Organization', 'DirectoryIndex'],

    // Define the paths that must be included in backups
    paths: [],

    // Define if the backup should be encrypted
    // IMPORTANT: You can only restore the backup if you have the key
    encrypt: true,
    encryptKey: Env.get('BACKUP_ENCRYPT_KEY')

}