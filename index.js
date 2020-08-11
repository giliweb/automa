'use strict';

const minimist = require('minimist')
const args = minimist(process.argv.slice(2))

switch (args.exec) {
    case 'install':
        require('./lib/tasks/install').start()
        break
    default:
        console.log('default')
        break
}