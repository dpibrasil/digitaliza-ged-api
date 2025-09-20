import { BaseTask } from 'adonis5-scheduler/build'
import { DocumentVersion } from 'App/Models'

export default class Awss3Sync extends BaseTask {
	public static get schedule() {
		return '0 * * * *'
	}
	/**
	 * Set enable use .lock file for block run retry task
	 * Lock file save to `build/tmpTaskLock`
	 */
	public static get useLock() {
		return true
	}

	public async handle() {
		const versions = await DocumentVersion.query().where('s3_synced', false)
		for (const version of versions) {
			await version.awsSync()
			await version.save()
		}
  	}
}
