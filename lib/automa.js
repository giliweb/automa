const { execSync } = require('child_process')
const { readFileSync, writeFileSync, appendFileSync, openSync } = require("fs")
const appRoot = require('app-root-path')
const gitRoot = `"` + require('app-root-path') + `/.git"`
// console.log(process.env)
/**
 *  check if this branch exists on remote
 */
class Automa {

    /**
     *
     * @type {string}
     */
    #remote = 'origin'

    /**
     *
     * @type {string}
     */
    #masterBranchName = 'master'

    /**
     *
     * @type {Object}
     */
    #args = {}

    /**
     * @type {string}
     */
    #packageVersion = ""

    /**
     *
     * @returns {string}
     */
    get localSha1(){
        return execSync(`git --git-dir=` + gitRoot + ` rev-parse HEAD`).toString().trim()
    }

    /**
     *
     * @returns {string}
     */
    get remoteSha1(){
        return execSync(`git --git-dir=` + gitRoot + ` rev-parse origin/${this.branchName}`).toString()
    }

    /**
     *
     */
    get ref(){

    }

    /**
     *
     * @returns {string}
     */
    get branchName(){
        return execSync(`git --git-dir=` + gitRoot + ` rev-parse --abbrev-ref HEAD`).toString().trim()
    }

    /**
     *
     * @returns {[]}
     */
    get pendingCommits(){
        const commits = []
        const messages = execSync(`git --git-dir=` + gitRoot + ` log @{u}.. --format=%s`).toString().split('\n')
        const currentMessage = execSync(`git --git-dir=` + gitRoot + ` log -1 --format=%s`).toString()
        const sha1s = execSync(`git --git-dir=` + gitRoot + ` log @{u}.. --format=%H`).toString().split('\n')
        messages.forEach((e, k) => {
            // e = e.trim()
            if(e === '' || e.includes('@automa') || e.toLowerCase().indexOf('wip') === 0){
                return
            }
            // Merge branch 'foo/bar' into master
            if(e.toLowerCase().indexOf('merge branch') === 0 && e.toLowerCase().includes(`into ${this.#masterBranchName}`)){
                return
            }
            if(this.changelogText.includes(sha1s[k])){
                return
            }
            commits.push({
                message: e,
                sha1: sha1s[k]
            })
        })
        return commits
    }

    get packageJson(){
        return JSON.parse(readFileSync(`${appRoot}/package.json`).toString())
    }

    get packageVersion(){
        if(!this.#packageVersion){
            this.#packageVersion = this.packageJson.version
        }
        return this.#packageVersion
    }

    set packageVersion(v){
        this.#packageVersion = v
        writeFileSync(`${appRoot}/package.json`, JSON.stringify({...this.packageJson, version: this.#packageVersion}, null, 4))
    }

    get repoLink(){
        let link = execSync(`git --git-dir=` + gitRoot + ` config --get remote.${this.#remote}.url`).toString().replace('.git', '').replace(':', '/')
        link = link.substring(link.indexOf('@') + 1)
        link = `https://${link.trim()}/commits/`
        return link
    }

    get isAutoma(){
        return execSync(`git --git-dir=` + gitRoot + ` log -1 --format=%s`).toString().includes('@automa')
    }

    get changelogText(){
        this.checkFileExists(`${appRoot}/CHANGELOG.md`)
        return readFileSync(`${appRoot}/CHANGELOG.md`).toString()
    }

    constructor() {
        /**
         * first check if this is hook wasn't triggered by automa itself, to avoid a loop
         */
        if(this.isAutoma){
            return
        }

        if(this.branchName !== this.#masterBranchName){
            return
        }

        // this.#args = process.argv.slice(2);
        process.argv.slice(2).forEach(arg => {
            const v = arg.split('=')
            this.#args[v[0]] = v[1] || 1
        })

        const scheduler = []

        if(this.#args['--remote']){
            this.#remote = this.#args['--remote']
        }

        if(this.#args['--master']){
            this.#masterBranchName = this.#args['--master']
        }

        if(this.#args['--increment-version']){
            if(this.pendingCommits && this.pendingCommits.length){
                scheduler.push('incrementPackageVersion')
            } else {
                console.info('Skipping --increment-version because there are no relevant changes')
            }

        }

        if(this.#args['--update-changelog']){
            if(this.pendingCommits && this.pendingCommits.length){
                scheduler.push('updateChangelog')
            } else {
                console.info('Skipping --update-changelog because there are no relevant changes')
            }
        }

        if(this.#args['--auto-commit']){
            scheduler.push('commit')
        }

        if(scheduler.includes('incrementPackageVersion')){
            this.incrementPackageVersion()
        }

        if(scheduler.includes('updateChangelog')){
            this.updateChangelog()
        }

        if(scheduler.includes('commit')){
            this.commit()
        }
    }

    incrementPackageVersion(){
        const versionArray = this.packageVersion.split('.')
        versionArray[2] = parseInt(versionArray[2]) + 1
        this.packageVersion = versionArray.join('.')
    }

    updateChangelog(){
        this.checkFileExists(`${appRoot}/CHANGELOG.md`)
        appendFileSync(`${appRoot}/CHANGELOG.md`, `## [${this.packageVersion}](${this.repoLink}${this.localSha1}) \n${this.pendingCommits.map(e => `* [${e.message}](${this.repoLink}${e.sha1.trim()})`).join('\n')} ${this.pendingCommits.length ? '\n\n' : ''}`);
    }

    checkFileExists(filename){
        try {
            openSync(filename, 'r')
        } catch(e){
            writeFileSync(filename, `# ${this.packageJson.name} Changelog\n\n`)
        }
    }

    commit(){
        execSync(`git --git-dir=` + gitRoot + ` add package.json CHANGELOG.md && git --git-dir=` + gitRoot + ` commit -m"Update to version ${this.packageVersion} @automa"`)
    }
}

module.exports = {
    Automa
}