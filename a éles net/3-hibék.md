==> Cloning from https://github.com/gyorei/NewsTide-backend
==> Checking out commit e08783cba8be0764a6b8dac0000b90a878839d52 in branch main
==> Using Node.js version 22.16.0 (default)
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Using Bun version 1.1.0 (default)
==> Docs on specifying a Bun version: https://render.com/docs/bun-version
==> Running build command 'npm install && npm run build'...
added 103 packages, and audited 104 packages in 8s
15 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
> build
> tsc
api/common/safeRssXmlParser/safeRssXmlParser.ts(4,37): error TS2307: Cannot find module 'xml2js' or its corresponding type declarations.
api/common/safeRssXmlParser/safeRssXmlParser.ts(5,21): error TS2307: Cannot find module 'chardet' or its corresponding type declarations.
api/common/safeRssXmlParser/safeRssXmlParser.ts(6,43): error TS7016: Could not find a declaration file for module 'content-type'. '/opt/render/project/src/node_modules/content-type/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/content-type` if it exists or add a new declaration (.d.ts) file containing `declare module 'content-type';`
api/common/safeRssXmlParser/safeRssXmlParser.ts(7,24): error TS2307: Cannot find module 'buffer' or its corresponding type declarations.
api/common/safeRssXmlParser/safeRssXmlParser.ts(75,29): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
api/common/safeRssXmlParser/safeRssXmlParser.ts(84,48): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
api/common/safeRssXmlParser/safeRssXmlParser.ts(101,36): error TS7006: Parameter 'err' implicitly has an 'any' type.
api/common/safeRssXmlParser/safeRssXmlParser.ts(101,41): error TS7006: Parameter 'result' implicitly has an 'any' type.
api/routes/Continent/Continent.ts(40,21): error TS7016: Could not find a declaration file for module 'express'. '/opt/render/project/src/node_modules/express/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/express` if it exists or add a new declaration (.d.ts) file containing `declare module 'express';`
api/routes/Continent/Continent.ts(49,19): error TS2307: Cannot find module 'axios' or its corresponding type declarations.
api/routes/Continent/Continent.ts(146,27): error TS2580: Cannot find name 'Buffer'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
api/routes/Continent/Continent.ts(231,42): error TS7006: Parameter 'req' implicitly has an 'any' type.
api/routes/Continent/Continent.ts(231,47): error TS7006: Parameter 'res' implicitly has an 'any' type.
api/routes/Continent/Continent.ts(292,9): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
api/routes/Continent/Continent.ts(308,44): error TS7006: Parameter 'req' implicitly has an 'any' type.
api/routes/Continent/Continent.ts(308,49): error TS7006: Parameter 'res' implicitly has an 'any' type.
api/routes/Continent/Continent.ts(335,9): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
api/routes/Continent/Continent.ts(352,39): error TS7006: Parameter 'req' implicitly has an 'any' type.
api/routes/Continent/Continent.ts(352,44): error TS7006: Parameter 'res' implicitly has an 'any' type.
api/routes/Continent/Continent.ts(378,41): error TS7006: Parameter 'source' implicitly has an 'any' type.
api/routes/Continent/Continent.ts(388,51): error TS7006: Parameter 'row' implicitly has an 'any' type.
api/routes/Continent/Continent.ts(519,9): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
api/routes/Country/Country.ts(26,24): error TS7016: Could not find a declaration file for module 'express'. '/opt/render/project/src/node_modules/express/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/express` if it exists or add a new declaration (.d.ts) file containing `declare module 'express';`
api/routes/Country/Country.ts(44,19): error TS2307: Cannot find module 'axios' or its corresponding type declarations.
api/routes/Country/Country.ts(125,29): error TS2580: Cannot find name 'Buffer'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
api/routes/Country/Country.ts(247,40): error TS7006: Parameter 'req' implicitly has an 'any' type.
api/routes/Country/Country.ts(247,45): error TS7006: Parameter 'res' implicitly has an 'any' type.
api/routes/Country/Country.ts(262,37): error TS7006: Parameter 'row' implicitly has an 'any' type.
api/routes/Country/Country.ts(280,16): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
api/routes/Country/Country.ts(289,37): error TS7006: Parameter 'req' implicitly has an 'any' type.
api/routes/Country/Country.ts(289,42): error TS7006: Parameter 'res' implicitly has an 'any' type.
api/routes/Country/Country.ts(330,40): error TS7006: Parameter 'source' implicitly has an 'any' type.
api/routes/Country/Country.ts(353,29): error TS7006: Parameter 'items' implicitly has an 'any' type.
api/routes/Country/Country.ts(422,16): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
api/routes/Country/Country.ts(431,41): error TS7006: Parameter 'req' implicitly has an 'any' type.
api/routes/Country/Country.ts(431,46): error TS7006: Parameter 'res' implicitly has an 'any' type.
api/routes/Country/Country.ts(446,16): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
api/routes/Local/Local.ts(10,21): error TS7016: Could not find a declaration file for module 'express'. '/opt/render/project/src/node_modules/express/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/express` if it exists or add a new declaration (.d.ts) file containing `declare module 'express';`
api/routes/Local/Local.ts(15,19): error TS2307: Cannot find module 'axios' or its corresponding type declarations.
api/routes/Local/Local.ts(115,27): error TS2580: Cannot find name 'Buffer'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
api/routes/Local/Local.ts(248,18): error TS7006: Parameter 'source' implicitly has an 'any' type.
api/routes/Local/Local.ts(249,19): error TS7006: Parameter 'source' implicitly has an 'any' type.
api/routes/Local/Local.ts(277,18): error TS7006: Parameter 'result' implicitly has an 'any' type.
api/routes/Local/Local.ts(278,19): error TS7006: Parameter 'result' implicitly has an 'any' type.
api/routes/index.ts(9,21): error TS7016: Could not find a declaration file for module 'express'. '/opt/render/project/src/node_modules/express/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/express` if it exists or add a new declaration (.d.ts) file containing `declare module 'express';`
api/routes/index.ts(20,21): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
api/routes/index.ts(23,24): error TS7006: Parameter 'req' implicitly has an 'any' type.
api/routes/index.ts(23,29): error TS7006: Parameter 'res' implicitly has an 'any' type.
api/routes/index.ts(32,22): error TS7006: Parameter 'req' implicitly has an 'any' type.
api/routes/index.ts(32,27): error TS7006: Parameter 'res' implicitly has an 'any' type.
api/routes/index.ts(49,27): error TS7006: Parameter 'req' implicitly has an 'any' type.
api/routes/index.ts(49,32): error TS7006: Parameter 'res' implicitly has an 'any' type.
api/routes/index.ts(56,23): error TS7006: Parameter 'req' implicitly has an 'any' type.
api/routes/index.ts(56,28): error TS7006: Parameter 'res' implicitly has an 'any' type.
api/routes/index.ts(64,18): error TS7006: Parameter 'req' implicitly has an 'any' type.
api/routes/index.ts(64,23): error TS7006: Parameter 'res' implicitly has an 'any' type.
api/routes/webScraper/apNewsScraper.ts(1,19): error TS2307: Cannot find module 'axios' or its corresponding type declarations.
api/routes/webScraper/apNewsScraper.ts(2,26): error TS2307: Cannot find module 'cheerio' or its corresponding type declarations.
api/routes/webScraper/webScraper.ts(2,19): error TS2307: Cannot find module 'axios' or its corresponding type declarations.
api/routes/webScraper/webScraper.ts(3,26): error TS2307: Cannot find module 'cheerio' or its corresponding type declarations.
api/routes/webScraper/webScraper.ts(105,23): error TS7006: Parameter '_' implicitly has an 'any' type.
api/routes/webScraper/webScraper.ts(105,26): error TS7006: Parameter 'script' implicitly has an 'any' type.
api/utils/cacheUtils.ts(8,20): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.
search/index.ts(19,24): error TS7016: Could not find a declaration file for module 'express'. '/opt/render/project/src/node_modules/express/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/express` if it exists or add a new declaration (.d.ts) file containing `declare module 'express';`
search/index.ts(46,30): error TS7006: Parameter 'req' implicitly has an 'any' type.
search/index.ts(46,35): error TS7006: Parameter 'res' implicitly has an 'any' type.
server/PostgreSQLManager.ts(1,51): error TS7016: Could not find a declaration file for module 'pg'. '/opt/render/project/src/node_modules/pg/lib/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/pg` if it exists or add a new declaration (.d.ts) file containing `declare module 'pg';`
server/PostgreSQLManager.ts(25,28): error TS7006: Parameter 'err' implicitly has an 'any' type.
server/app.ts(1,41): error TS7016: Could not find a declaration file for module 'express'. '/opt/render/project/src/node_modules/express/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/express` if it exists or add a new declaration (.d.ts) file containing `declare module 'express';`
server/app.ts(2,18): error TS7016: Could not find a declaration file for module 'cors'. '/opt/render/project/src/node_modules/cors/lib/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/cors` if it exists or add a new declaration (.d.ts) file containing `declare module 'cors';`
server/app.ts(7,32): error TS7016: Could not find a declaration file for module 'express-session'. '/opt/render/project/src/node_modules/express-session/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/express-session` if it exists or add a new declaration (.d.ts) file containing `declare module 'express-session';`
server/app.ts(45,44): error TS7016: Could not find a declaration file for module 'compression'. '/opt/render/project/src/node_modules/compression/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/compression` if it exists or add a new declaration (.d.ts) file containing `declare module 'compression';`
server/app.ts(73,40): error TS7016: Could not find a declaration file for module 'express-session'. '/opt/render/project/src/node_modules/express-session/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/express-session` if it exists or add a new declaration (.d.ts) file containing `declare module 'express-session';`
server/app.ts(128,17): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/app.ts(132,19): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/app.ts(181,12): error TS7006: Parameter 'req' implicitly has an 'any' type.
server/app.ts(181,17): error TS7006: Parameter 'res' implicitly has an 'any' type.
server/app.ts(181,22): error TS7006: Parameter 'next' implicitly has an 'any' type.
server/config/environment.ts(6,25): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/config/environment.ts(11,30): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/config/environment.ts(15,9): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/config/environment.ts(16,9): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/config/environment.ts(17,13): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/config/environment.ts(18,13): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/config/environment.ts(19,18): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/config/environment.ts(26,21): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/config/environment.ts(41,28): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/config/environment.ts(49,12): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/data/PostgreSQLDataAccess.ts(152,31): error TS7006: Parameter 'row' implicitly has an 'any' type.
server/data/PostgreSQLDataAccess.ts(178,31): error TS7006: Parameter 'row' implicitly has an 'any' type.
server/data/PostgreSQLDataAccess.ts(216,31): error TS7006: Parameter 'row' implicitly has an 'any' type.
server/index.ts(17,5): error TS2580: Cannot find name 'require'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/index.ts(17,22): error TS2580: Cannot find name 'module'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/index.ts(20,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/index.ts(25,1): error TS4094: Property 'ignoredDebugPatterns' of exported anonymous class type may not be private or protected.
server/index.ts(25,1): error TS4094: Property 'ignoredErrorPatterns' of exported anonymous class type may not be private or protected.
server/index.ts(25,1): error TS4094: Property 'isConnected' of exported anonymous class type may not be private or protected.
server/index.ts(25,1): error TS4094: Property 'pool' of exported anonymous class type may not be private or protected.
server/index.ts(25,1): error TS4094: Property 'reconnect' of exported anonymous class type may not be private or protected.
server/middleware/error-handler.ts(1,49): error TS7016: Could not find a declaration file for module 'express'. '/opt/render/project/src/node_modules/express/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/express` if it exists or add a new declaration (.d.ts) file containing `declare module 'express';`
server/middleware/error-handler.ts(14,11): error TS2339: Property 'captureStackTrace' does not exist on type 'ErrorConstructor'.
server/server.ts(5,24): error TS2307: Cannot find module 'http' or its corresponding type declarations.
server/server.ts(28,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/server.ts(39,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/server.ts(57,15): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/server.ts(65,15): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/server.ts(75,11): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/server.ts(83,5): error TS2580: Cannot find name 'require'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/server.ts(83,22): error TS2580: Cannot find name 'module'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
server/server.ts(86,5): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
==> Build failed 😞
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys