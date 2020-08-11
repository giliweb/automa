const { readFileSync, writeFileSync } = require("fs")
const appRoot = require('app-root-path')
const start = () => {
    console.log('installing...')

    const jsonData = JSON.parse(readFileSync(`${appRoot}/package.json`).toString())

    jsonData.scripts = jsonData.scripts || {}
    jsonData.scripts.automa = "automa --increment-version --auto-commit --update-changelog"

    jsonData.husky = jsonData.husky || {}
    jsonData.husky.hooks = jsonData.husky.hooks || {}
    jsonData.husky.hooks["post-commit"] = "yarn automa"
    jsonData.husky.hooks["post-merge"] = "yarn automa"

    writeFileSync(`${appRoot}/package.json`, JSON.stringify(jsonData, null, 4))
}


module.exports = {
    start
}