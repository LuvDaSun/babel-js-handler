# babel-js-handler

Middleware for compilation of your scripts via babel. For setting up an easy and
simple development environment.

This middleware will compile your code via babel on every request, but will use
http cache headers to optimize this process. Modules are compiled into an AMD
module that is suitable for use in the browser. The first request to your script
will first load requirejs, an AMD module loader.

Then, you can simple reload your entire app by simply refreshing your browser.
By leveraging http cache headers, only the files that have changed will be
compiled and fetched.
