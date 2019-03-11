#!/usr/bin/env node
'use strict'

var meow = require('meow')
var _ = require('lodash')
var resolve = require('path').resolve

var conventionalChangelog = require('./index')
var fs = require('fs')
var accessSync = require('fs-access').sync
const changeLogFile = "CHANGELOG.md";


var cli = meow(`
    Usage
      conventional-changelog
    Example
      conventional-changelog -i CHANGELOG.md --same-file
    Options
      -i, --infile              Read the CHANGELOG from this file
      -o, --outfile             Write the CHANGELOG to this file
                                If unspecified, it prints to stdout
      -s, --same-file           Outputting to the infile so you don't need to specify the same file as outfile
      -p, --preset              Name of the preset you want to use. Must be one of the following:
                                angular, atom, codemirror, ember, eslint, express, jquery, jscs or jshint
      -k, --pkg                 A filepath of where your package.json is located
                                Default is the closest package.json from cwd
      -a, --append              Should the newer release be appended to the older release
                                Default: false
      -r, --release-count       How many releases to be generated from the latest
                                If 0, the whole changelog will be regenerated and the outfile will be overwritten
                                Default: 1
      -u, --output-unreleased   Output unreleased changelog
      -v, --version             changelog new version param
                                Default: false
      -n, --config              A filepath of your config script
                                Example of a config script: https://github.com/conventional-changelog/conventional-changelog-angular/blob/master/index.js
      -c, --context             A filepath of a json that is used to define template variables
      -l, --lerna-package       Generate a changelog for a specific lerna package (:pkg-name@1.0.0)
      -t, --tag-prefix          Tag prefix to consider when reading the tags
      --commit-path             Generate a changelog scoped to a specific directory
`, {
    flags: {
        infile: {
            alias: `i`
        },
        outfile: {
            alias: `o`
        },
        'same-file': {
            alias: `s`
        },
        preset: {
            alias: `p`
        },
        pkg: {
            alias: `k`
        },
        append: {
            alias: `a`
        },
        'release-count': {
            alias: `r`
        },
        'output-unreleased': {
            alias: `u`
        },
        version: {
            alias: `v`
        },
        config: {
            alias: `n`
        },
        context: {
            alias: `c`
        },
        'lerna-package': {
            alias: `l`
        },
        'tag-prefix': {
            alias: `t`
        }
    }
})

var config
var flags = cli.flags
var infile = flags.infile
var outfile = flags.outfile
var sameFile = flags.sameFile
var append = flags.append
var releaseCount = flags.releaseCount


if (infile && infile === outfile) {
    sameFile = true
} else if (sameFile) {
    if (infile) {
        outfile = infile
    } else {
        console.error('infile must be provided if same-file flag presents.')
        process.exit(1)
    }
}

var options = _.omit({
    preset: flags.preset || 'angular',
    pkg: {
        path: flags.pkg
    },
    append: append,
    releaseCount: releaseCount || 10 ,

    outputUnreleased: flags.outputUnreleased,
    lernaPackage: flags.lernaPackage,
    tagPrefix: flags.tagPrefix
}, _.isUndefined)

var outStream

try {
    if (flags.context) {
        templateContext = require(resolve(process.cwd(), flags.context))
    }

    if (flags.config) {
        config = require(resolve(process.cwd(), flags.config))
        options.config = config
    } else {
        config = {}
    }
} catch (err) {
    console.error('Failed to get file. ' + err)
    process.exit(1)
}

var gitRawCommitsOpts = _.merge({}, config.gitRawCommitsOpts || {})
if (flags.commitPath) gitRawCommitsOpts.path = flags.commitPath

function outputChangelog () {
    createIfMissing()
    var header = '# Change Log\n\nAll notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.\n'

    var content = '';
    var changelogStream = conventionalChangelog(options,{version: flags.version})
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
outputChangelog ()

