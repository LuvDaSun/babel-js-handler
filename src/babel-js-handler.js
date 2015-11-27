var path = require('path');
var fs = require('fs');
var assign = require('object-assign');
var babel = require('babel-core');

var parameterValue = new Date().valueOf().toString(36);

module.exports = function(basePath, options) {
    var timestamp = new Date();

    options = assign({
        presets: [],
        extname: ".js",
        parameterValue: parameterValue,
        parameterName: 'module',
    }, options);

    return function babelJsHandler(req, res, next) {
        var moduleId = path.join(path.dirname(req.path), path.basename(req.path, path.extname(req.path))).substr(1);
        var srcPath = path.join(basePath, moduleId + options.extname);

        statFileOrNull(srcPath, function(err, stat) {
            if (err) return next(err);
            if (!stat) return next();

            if (req.query[options.parameterName] === parameterValue) {
                res.set("Cache-Control", "public, max-age=0");
                res.set("Last-Modified", stat.mtime);
                res.set('Content-Type', 'text/javascript');

                if (req.fresh) return res.sendStatus(304);

                fs.readFile(srcPath, function(err, content) {
                    if (err) throw err;

                    var result = babel.transform(content, {
                        filename: srcPath,
                        sourceMaps: 'inline',
                        presets: options.presets,
                        plugins: ["transform-es2015-modules-amd"],
                    });

                    res.end(result.code);
                });
            }
            else {
                res.set("Cache-Control", "public, max-age=0");
                res.set("Last-Modified", timestamp);
                res.set('Content-Type', 'text/javascript');

                if (req.fresh) return res.sendStatus(304);

                res.write("require = " + JSON.stringify({
                    urlArgs: options.parameterName + "=" + options.parameterValue + "",
                    deps: [moduleId],
                    waitSeconds: 0,
                    shim: options.shim,
                    packages: options.packages,
                }, undefined, 2) + ";");

                var stream = fs.createReadStream(require.resolve('requirejs/require'), 'utf8');
                stream.pipe(res);
            }

        });

    };

};


function statFileOrNull(srcPath, cb) {
    fs.stat(srcPath, function(err, stat) {
        if (err) {
            if (err.code === 'ENOENT') return cb(null, null);
            return cb(err);
        }
        if (!stat.isFile()) return cb(null, null);

        cb(null, stat);
    });
}
