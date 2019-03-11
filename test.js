var conventionalChangelog = require('./index')
var fs = require('fs')
var accessSync = require('fs-access').sync
const changeLogFile = "CHANGELOG.md";

function standardVersionN () {
    outputChangelog()
}

function outputChangelog () {
    createIfMissing()
    var header = '# Change Log\n\nAll notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.\n'

    var content = ''
    var changelogStream = conventionalChangelog({
        preset: 'angular',
        releaseCount: 10
    },{version: '20190311.req.5'})
    .on('error', function (err) {
        console.error(err);
    })

    changelogStream.on('data', function (buffer) {
        content += buffer.toString();
    })

    changelogStream.on('end', function () {
        fs.writeFileSync(changeLogFile, header + '\n' + (content).replace(/\n+$/, '\n'), 'utf-8');
    })
}


function createIfMissing () {
    try {
        accessSync(changeLogFile, fs.F_OK)
    } catch (err) {
        if (err.code === 'ENOENT') {
            fs.writeFileSync(changeLogFile, '\n', 'utf-8')
        }
    }
}
standardVersionN ({silent: true}, function (err) {})
