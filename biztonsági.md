PS C:\news3> semgrep --config=auto
[00.17][WARNING](x509.decoding): negative serial number ee2b 3deb d421 de14  a862 ac04 f3dd 
c401  
[00.18][WARNING](ca-certs): Ignored 1 trust anchors.
[00.19][WARNING](x509.decoding): negative serial number ee2b 3deb d421 de14  a862 ac04 f3dd 
c401  

┌──── ○○○ ────┐
│ Semgrep CLI │
└─────────────┘


Scanning 1331 files (only git-tracked) with:

✔ Semgrep OSS
  ✔ Basic security coverage for first-party code vulnerabilities.

✘ Semgrep Code (SAST)
  ✘ Find and fix vulnerabilities in the code you write with advanced scanning
and expert security rules.

✘ Semgrep Supply Chain (SCA)
  ✘ Find and fix the reachable vulnerabilities in your OSS dependencies.

💎 Get started with all Semgrep products via `semgrep login`.
✨ Learn more at https://sg.run/cloud.

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╸ 100% 0:01:29



┌───────────────────┐
│ 104 Code Findings │
└───────────────────┘

    electron\main.cjs
    ❯❱ problem-based-packs.insecure-transport.js-node.using-http-server.using-http-server   
          Checks for any usage of http servers instead of https servers.
          Encourages the usage of https protocol instead of http, which does not
          have TLS and is therefore unencrypted. Using http can lead to man-in-
          the-middle attacks in which the attacker is able to read sensitive
          information.
          Details: https://sg.run/x1zL

           39┆ const req = http.get('http://localhost:3000', (res) => {

    ❯❱ problem-based-packs.insecure-transport.js-node.http-request.http-request
          Checks for requests sent to http:// URLs. This is dangerous as the
          server is attempting to connect to a website that does not encrypt
          traffic with TLS. Instead, only send requests to https:// URLs.
          Details: https://sg.run/N4Qy

           39┆ const req = http.get('http://localhost:3000', (res) => {
           40┆   resolve(true);
           41┆ });

    index.html
    ❯❱ html.security.audit.missing-integrity.missing-integrity
          This tag is missing an 'integrity' subresource integrity attribute. The
          'integrity' attribute allows for the browser to verify that externally
          hosted files (for example from a CDN) are delivered without unexpected
          manipulation. Without this attribute, if an attacker can modify the
          externally hosted resource, this could lead to XSS and other types of
          attacks. To prevent this, include the base64-encoded cryptographic hash
          of the resource (file) you’re telling the browser to fetch in the
          'integrity' attribute for all externally hosted files.
          Details: https://sg.run/krXA

           29┆ <link rel="canonical" href="https://yourdomain.com/" />

    models\index.js
    ❯❱ javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-      
       join-resolve-traversal
          Detected possible user input going into a `path.join` or `path.resolve`
          function. This could possibly lead to a path traversal vulnerability,
          where the attacker can access arbitrary files stored in the file system.
          Instead, be sure to sanitize or validate user input first.
          Details: https://sg.run/OPqk

           30┆ const model = require(path.join(__dirname, file))(sequelize,
               Sequelize.DataTypes);

    nginx\deploy.sh
    ❯❱ bash.curl.security.curl-pipe-bash.curl-pipe-bash
          Data is being piped into `bash` from a `curl` command. An attacker with
          control of the server in the `curl` command could inject malicious code
          into the pipe, resulting in a system compromise. Avoid piping untrusted
          data into `bash` or any other shell if you can. If you must do this,
          consider checking the SHA sum of the content returned by the server to
          verify its integrity.
          Details: https://sg.run/KXz6

           43┆ curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E
               bash -

    nginx\nginx.conf
    ❯❱ generic.nginx.security.possible-h2c-smuggling.possible-nginx-h2c-smuggling
          Conditions for Nginx H2C smuggling identified. H2C smuggling allows
          upgrading HTTP/1.1 connections to lesser-known HTTP/2 over cleartext
          (h2c) connections which can allow a bypass of reverse proxy access
          controls, and lead to long-lived, unrestricted HTTP traffic directly to
          back-end servers. To mitigate: WebSocket support required: Allow only
          the value websocket for HTTP/1.1 upgrade headers (e.g., Upgrade:
          websocket). WebSocket support not required: Do not forward Upgrade
          headers.
          Details: https://sg.run/ploZ

          113┆ proxy_http_version 1.1;
          114┆ proxy_set_header Upgrade $http_upgrade;
          115┆ proxy_set_header Connection 'upgrade';

    scripts\asia\asiascript.js
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

          217┆ console.warn(`Ă‰rvĂ©nytelen URL: ${source.url}`, error);
            ⋮┆----------------------------------------
          261┆ console.warn(`Hiba a kategĂłria-tĂ­pus meghatĂˇrozĂˇsakor:
               ${source.url}`, error);

    scripts\asia\fixLanguageCodes.js
    ❯❱ javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp   
          RegExp() called with a `countryCode` function argument, this might allow
          an attacker to cause a Regular Expression Denial-of-Service (ReDoS)
          within your application as RegExP blocks the main thread. For this
          reason, it is recommended to use hardcoded regexes instead. If your
          regex is run on user-controlled input, consider performing input
          validation or use a regex checking/sanitization library such as
          https://www.npmjs.com/package/recheck to verify that the regex does not
          appear vulnerable to ReDoS.
          Details: https://sg.run/gr65

          112┆ const regex = new RegExp(`"language":"${countryCode}"`, 'g');

    scripts\mentés\categorizeNewsSources.js
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

          217┆ console.warn(`Ă‰rvĂ©nytelen URL: ${source.url}`, error);
            ⋮┆----------------------------------------
          261┆ console.warn(`Hiba a kategĂłria-tĂ­pus meghatĂˇrozĂˇsakor:
               ${source.url}`, error);

    scripts\rss-analyzer\rssStructureAnalyzer.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

          103┆ console.error(`âťŚ Hiba ${file} betĂ¶ltĂ©sekor:`, error);

    src\apiclient\apiClient.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

          158┆ `[ApiClient] Sikeres vĂˇlasz: ${url}`,
            ⋮┆----------------------------------------
          163┆ console.error(`[ApiClient] Hiba: ${url}`, error);
            ⋮┆----------------------------------------
          258┆ console.log(`[ApiClient] âŹł Szerver mĂ©g nem elĂ©rhetĹ‘
               (${attempt}/${maxRetries}):`, error);

    src\backend\api\common\imageExtractor\imageExtractorBatch.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

          104┆ console.warn(`[Batch Processing] Failed after ${retryAttempts
               + 1} attempts at index ${globalIndex}:`, errorMessage);
            ⋮┆----------------------------------------
          158┆ console.warn(`[Batch Image Extraction] Error processing item
               ${index}:`, error);

    src\backend\api\routes\Local\Local.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

          321┆ console.log(`[DEBUG] ForrĂˇs adatai a DB-bĹ‘l
               (${item.source}):`, sourceData);
            ⋮┆----------------------------------------
          474┆ console.log(`[DEBUG] ForrĂˇs adatai a DB-bĹ‘l
               (${item.source}):`, sourceData);

    src\backend\api\routes\video\videoAggregator\videoAggregator.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

          210┆ console.error(`[VideoAggregator] đźŚ� HĂˇlĂłzati hiba a(z)
               ${config.channelName} csatornĂˇhoz:`, error.message);
            ⋮┆----------------------------------------
          213┆ console.error(`[VideoAggregator] âťŚ Ismeretlen hiba a(z)
               ${config.channelName} csatornĂˇhoz:`, error);
            ⋮┆----------------------------------------
          241┆ console.error(`[VideoAggregator] Error parsing YouTube RSS for
               ${channelName}:`, error);
            ⋮┆----------------------------------------
          419┆ console.error(`[VideoAggregator] Error fetching
               ${config.channelName}:`, error);

    src\backend\api\routes\webScraper\apNewsScraper.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

           98┆ console.error(`Error parsing AP News HTML for media
               (${articleUrl}):`, errorMessage);
            ⋮┆----------------------------------------
          154┆ console.error(`Error scraping AP News page (${url}):`,
               errorMessage);

    src\backend\auth\utils\emailService.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

           78┆ console.error(`[EmailService] Failed to send email to
               ${options.to}`, error);

    src\backend\config\database.ts
    ❯❱ javascript.sequelize.security.audit.sequelize-enforce-tls.sequelize-enforce-tls      
          If TLS is disabled on server side (Postgresql server), Sequelize
          establishes connection without TLS and no error will be thrown. To
          prevent MITN (Man In The Middle) attack, TLS must be enforce by
          Sequelize. Set "ssl: true" or define settings "ssl: {...}"
          Details: https://sg.run/yz6Z

           12┆ const environmentConfig = {
           13┆   username: process.env.DB_USER,
           14┆   password: process.env.DB_PASSWORD,
           15┆   database: process.env.DB_NAME,
           16┆   host: process.env.DB_HOST,
           17┆   port: Number(process.env.DB_PORT),
           18┆   dialect: 'postgres',
           19┆   logging: process.env.NODE_ENV === 'development' ?
               console.log : false, // FejlesztĂ©skor logolhatunk
           20┆ };

    src\backend\server\logger.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

           47┆ console.debug(`[DEBUG] ${message}`, ...meta);
            ⋮┆----------------------------------------
           54┆ console.info(`[INFO] ${message}`, ...meta);
            ⋮┆----------------------------------------
           61┆ console.warn(`[WARN] ${message}`, ...meta);
            ⋮┆----------------------------------------
           90┆ console.error(`[ERROR] ${message}${errorDetails ? ': ' +
               errorDetails : ''}`, ...meta);

    src\components\Badge\hooks\useTabNotifications.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

           18┆ console.log(`[useTabNotifications] ${message}`, ...args);

    src\components\CategoryBar\useCategoryData.ts
    ❯❱ javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp   
          RegExp() called with a `keyword` function argument, this might allow an
          attacker to cause a Regular Expression Denial-of-Service (ReDoS) within
          your application as RegExP blocks the main thread. For this reason, it
          is recommended to use hardcoded regexes instead. If your regex is run on
          user-controlled input, consider performing input validation or use a
          regex checking/sanitization library such as
          https://www.npmjs.com/package/recheck to verify that the regex does not
          appear vulnerable to ReDoS.
          Details: https://sg.run/gr65

           37┆ const regex = new RegExp(`\\b${keyword}\\b`, 'i'); // 'i' a
               kis/nagybetĹ± Ă©rzĂ©ketlensĂ©gĂ©rt

    src\components\LocalNews\Location.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

          101┆ console.error(`Hiba a lokĂˇlis forrĂˇsok lekĂ©rĂ©sĂ©nĂ©l:
               ${countryName}`, error);

    src\components\LocalNews\location\LocationProvider.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

           68┆ `[LocationProvider] Hiba a(z) ${strategy.getName()} stratĂ©gia
               inicializĂˇlĂˇsakor:`,

    src\components\LocalNews\topnews\newsDistributor.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

           61┆ `[NewsDistributor.distribute] KezdĂ©s: ${newsItems.length}
               hĂ­r, szĹ±rĂ©s beĂˇllĂ­tĂˇsok:`,
            ⋮┆----------------------------------------
          213┆ `[NewsDistributor.getNextImportanceLevel] Jelenlegi szint:
               ${currentLevel}, elĂ©rhetĹ‘ szintek:`,

    src\components\NavigationBar\SmartSearchBar\hooks\useFrontendSearch.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

          226┆ console.log(`${logPrefix} KonfigurĂˇciĂł:`, {
            ⋮┆----------------------------------------
          259┆ console.log(`${logPrefix} KeresĂ©si kifejezĂ©sek:`,
               searchTerms);

    src\components\ScrollContainer\ScrollContainer.tsx
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

           62┆ console.log(`[ScrollContainer][${activeTabId}-${tabMode}]
               [VIDEO] GĂ¶rgethetĹ‘ elem keresĂ©se:`, foundElement);
            ⋮┆----------------------------------------
           73┆ console.log(`[ScrollContainer][${activeTabId}-${tabMode}]
               [NEWS] GĂ¶rgethetĹ‘ elem keresĂ©se:`, foundElement);
            ⋮┆----------------------------------------
           75┆ console.log(`[ScrollContainer][${activeTabId}-${tabMode}] âś…
               BelsĹ‘ gĂ¶rgethetĹ‘ elem beĂˇllĂ­tva:`, foundElement ||
               containerWrapperRef.current);

    src\components\Tabs\Home\geo\GeoMatcher.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

          134┆ console.log(`${logPrefix} Tokenek:`, queryTokens);
            ⋮┆----------------------------------------
          138┆ console.log(`${logPrefix} Geo talĂˇlat:`, geoMatch);
            ⋮┆----------------------------------------
          145┆ console.log(`${logPrefix} Kulcsszavak:`, topicKeywords);
            ⋮┆----------------------------------------
          156┆ console.log(`${logPrefix} RĂ©giĂł orszĂˇgok:`,
               regionCountries);
            ⋮┆----------------------------------------
          185┆ console.error(`${logPrefix} Hiba a geo-query elemzĂ©sĂ©ben:`,
               error);

    src\components\Tabs\Home\geo\useSimpleGeoSearch.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

           91┆ console.log(`${logPrefix} Geo-elemzĂ©s:`, {
            ⋮┆----------------------------------------
          136┆ console.error(`${logPrefix} KeresĂ©si hiba:`, error);

    src\components\Tabs\NewTab\geo\GeoMatcher.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

          134┆ console.log(`${logPrefix} Tokenek:`, queryTokens);
            ⋮┆----------------------------------------
          138┆ console.log(`${logPrefix} Geo talĂˇlat:`, geoMatch);
            ⋮┆----------------------------------------
          145┆ console.log(`${logPrefix} Kulcsszavak:`, topicKeywords);
            ⋮┆----------------------------------------
          156┆ console.log(`${logPrefix} RĂ©giĂł orszĂˇgok:`,
               regionCountries);
            ⋮┆----------------------------------------
          185┆ console.error(`${logPrefix} Hiba a geo-query elemzĂ©sĂ©ben:`,
               error);

    src\components\Tabs\NewTab\geo\useSimpleGeoSearch.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

           91┆ console.log(`${logPrefix} Geo-elemzĂ©s:`, {
            ⋮┆----------------------------------------
          136┆ console.error(`${logPrefix} KeresĂ©si hiba:`, error);

    src\components\Tabs\TabManager.tsx
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

           94┆ console.error(`[fetchTabData] Error fetching data for
               ${tabId}:`, error);

    src\components\Tabs\utils\TabDebug.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

           45┆ console.log(`đź”„ Tab ${operation}:`, tabId, details);

    src\components\Utility\Settings\SearchFilters\SearchFiltersBridge.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

           78┆ console.error(`[SearchFiltersBridge] Error in listener
               ${index}:`, error);
            ⋮┆----------------------------------------
          113┆ console.error(`[SearchFiltersBridge] Error in listener
               ${index}:`, error);

  
  src\components\Utility\Settings\SearchFilters\SearchResultsMetadataBridge.ts              
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

           86┆ console.log(`[SearchResultsMetadataBridge] Ăšj metaadat fĂĽl
               ${tabId}-hez:`,
            ⋮┆----------------------------------------
          104┆ console.error(`[SearchResultsMetadataBridge] Error in listener
               ${index}:`, error);
            ⋮┆----------------------------------------
          229┆ console.error(`[SearchResultsMetadataBridge] Error in
               deprecated listener ${index}:`, error);

    src\data\Monitor\RssMonitorPanel.tsx
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

          184┆ console.error(`[RssMonitorPanel] Hiba a forrĂˇs
               ĂşjraellenĹ‘rzĂ©sekor: ${sourceId}`, error);

    src\data\Monitor\RssSourceAdmin.tsx
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

          275┆ console.error(`[RssSourceAdmin] Hiba a forrĂˇs
               ĂşjraellenĹ‘rzĂ©sekor: ${sourceId}`, error);
            ⋮┆----------------------------------------
          317┆ console.error(`[RssSourceAdmin] Hiba az RSS URL javĂ­tĂˇsakor:
               ${sourceId}`, error);

    src\hooks\useLocalStorage.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

           43┆ console.error(`Hiba a localStorage olvasĂˇsakor (${key}):`,
               error);
            ⋮┆----------------------------------------
           48┆ console.warn(`localStorage kulcs tĂ¶rlĂ©se sikertelen
               (${key}):`, removeError);
            ⋮┆----------------------------------------
           62┆ console.error(`Hiba a localStorage Ă­rĂˇsakor (${key}):`,
               error);
            ⋮┆----------------------------------------
           77┆ console.error(`Hiba a localStorage vĂˇltozĂˇs feldolgozĂˇsakor
               (${key}):`, error);
            ⋮┆----------------------------------------
           82┆ console.warn(`localStorage kulcs tĂ¶rlĂ©se sikertelen
               (${key}):`, removeError);

    src\hooks\useStorage.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

          352┆ console.log(`[useStorage] Tab tartalom mentĂ©se (${tabId}):`,
               content);
            ⋮┆----------------------------------------
          390┆ console.log(`[useStorage] Tab tartalom betĂ¶ltve
               (${tabId}):`, content);
            ⋮┆----------------------------------------
          440┆ console.error(`Hiba az olvasottsĂˇg lekĂ©rdezĂ©sekor
               (${id}):`, error);
            ⋮┆----------------------------------------
          502┆ `[useStorage] Hiba tĂ¶rtĂ©nt a USER_PREFERENCES adattĂˇrolĂłba
               mentĂ©skor (fallback a keyValueStore-ra): ${preference.id}`,
            ⋮┆----------------------------------------
          564┆ `[useStorage] Hiba tĂ¶rtĂ©nt a USER_PREFERENCES adattĂˇrolĂł
               elĂ©rĂ©sekor (fallback a keyValueStore-ra): ${preferenceId}`,

    src\hooks\useTabStorage\useTabCache.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

           39┆ console.log(`[useTabCache] ${message}`, ...args);
            ⋮┆----------------------------------------
          170┆ console.error(`[useTabCache] Hiba a hĂˇttĂ©r frissĂ­tĂ©skor:
               ${tabId}`, err);
            ⋮┆----------------------------------------
          223┆ console.log(`[useTabCache] Tab tartalom mentĂ©se: ${tabId}`,
               content);
            ⋮┆----------------------------------------
          228┆ console.log(`[useTabCache] MentĂ©s a memĂłriĂˇba: ${tabId}`,
               content);
            ⋮┆----------------------------------------
          243┆ console.error(`[useTabCache] Hiba a tab tartalom mentĂ©sekor:
               ${tabId}`, error);

    src\hooks\useTabStorage\useTabStorage.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

           73┆ console.error(`[useTabStorage] Hiba a tab tartalom
               elĹ‘tĂ¶ltĂ©sekor: ${tabId}`, err);

    src\utils\articleOpener\ArticleOpenerService.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

           27┆ console.log(`[ArticleOpenerService] Cikk megnyitĂˇsa:
               ${viewMode} mĂłdban`, { url });

    src\utils\datamanager\localStorage\localStorage.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

          138┆ console.error(`LocalStorage JSON.parse hiba a '${fullKey}'
               kulcsnĂˇl:`, parseError);
            ⋮┆----------------------------------------
          150┆ console.error(`LocalStorage olvasĂˇsi hiba a '${fullKey}'
               kulcsnĂˇl:`, error);
            ⋮┆----------------------------------------
          275┆ `Helyi Ăˇllapot (appState) JSON.parse hiba a
               '${this.LOCAL_STORAGE_KEY}' kulcsnĂˇl:`,
            ⋮┆----------------------------------------
          287┆ `LocalStorage: Hiba tĂ¶rtĂ©nt a hibĂˇs appState
               ('${this.LOCAL_STORAGE_KEY}') tĂ¶rlĂ©se kĂ¶zben:`,
            ⋮┆----------------------------------------
          295┆ `Helyi Ăˇllapot (appState) ĂˇltalĂˇnos betĂ¶ltĂ©si hiba a
               '${this.LOCAL_STORAGE_KEY}' kulcsnĂˇl:`,

    src\utils\datamanager\manager.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

          673┆ `[DataManager] âťŚ MĹ°VELET HIBA: ${operationName} -
               ${duration.toFixed(2)}ms`,

    src\utils\datamanager\storage\indexedDBService.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

          195┆ console.log(`[IndexedDBService] Tab tartalom mentĂ©se:
               ${tabId}, tartalom:`, content);
            ⋮┆----------------------------------------
          208┆ console.error(`[IndexedDBService] Hiba a tab tartalom
               mentĂ©sekor: ${tabId}`, request.error);
            ⋮┆----------------------------------------
          231┆ console.log(`[IndexedDBService] Tab tartalom betĂ¶ltĂ©se:
               ${tabId}`, request.result);
            ⋮┆----------------------------------------
          244┆ `[IndexedDBService] Hiba a tab tartalom lekĂ©rĂ©sekor:
               ${tabId}`,

    src\utils\datamanager\storage\storage.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

           83┆ console.error(`Error writing to store ${options.storeName}:`,
               request.error);
            ⋮┆----------------------------------------
           88┆ console.error(`Error accessing store ${options.storeName}:`,
               error);
            ⋮┆----------------------------------------
           95┆ `Fallback to keyValueStore also failed for key
               ${namespaceKey}:`,
            ⋮┆----------------------------------------
          108┆ console.error(`Error setting value for key ${namespaceKey} in
               StorageAdapter:`, error);
            ⋮┆----------------------------------------
          151┆ console.error(`Error reading from store
               ${options.storeName}:`, request.error);
            ⋮┆----------------------------------------
          156┆ console.error(`Error accessing store ${options.storeName}:`,
               error);
            ⋮┆----------------------------------------
          162┆ `Fallback to keyValueStore also failed for key
               ${namespaceKey}:`,
            ⋮┆----------------------------------------
          174┆ console.error(`Error getting value for key ${namespaceKey}:`,
               error);
            ⋮┆----------------------------------------
          191┆ console.error(`Error removing value for key ${namespaceKey} in
               StorageAdapter:`, error);

    src\utils\imageDebugUtils.ts
     ❱ javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
          Detected string concatenation with a non-literal variable in a
          util.format / console.log function. If an attacker injects a format
          specifier in the string, it will forge the log message. Try to use
          constant values for the format string.
          Details: https://sg.run/7Y5R

           28┆ console.log(`[${label}] ElemzĂ©s:`, analysis);

    test-secrets\test_private_key.pem
   ❯❯❱ generic.secrets.security.detected-private-key.detected-private-key
          Private Key detected. This is a sensitive credential and should not be
          hardcoded here. Instead, store this in a separate, private file.
          Details: https://sg.run/b7dr

            1┆ -----BEGIN PRIVATE KEY-----
            2┆
               MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCsV7h65wT39y
               ol



┌──────────────┐
│ Scan Summary │
└──────────────┘
✅ Scan completed successfully.
 • Findings: 104 (104 blocking)
 • Rules run: 248
 • Targets scanned: 1331
 • Parsed lines: ~99.9%
 • Scan skipped:
   ◦ Files larger than  files 1.0 MB: 27
   ◦ Files matching .semgrepignore patterns: 1097
 • For a detailed list of skipped files and lines, run semgrep with the --verbose flag      
Ran 248 rules on 1331 files: 104 findings.
💎 Missed out on 1390 pro rules since you aren't logged in!
⚡ Supercharge Semgrep OSS when you create a free account at https://sg.run/rules.

📢 Too many findings? Try Semgrep Pro for more powerful queries and less noise.
   See https://sg.run/false-positives.
PS C:\news3> 

============================================================

Eredmények csoportosítása

A legtöbb találat logolással kapcsolatos (console.log, console.error, stb.) → ezek gyakran alacsony súlyosságú figyelmeztetések.

Vannak viszont komolyabbak:

http.get('http://...') → mindig HTTPS legyen

curl | bash → CI/CD scriptben veszélyes

Sequelize ssl: true hiányzik → MITM támadás ellen védtelen

Egy-egy issue javítása

Például a models/index.js-ben path traversal figyelmeztetés: érdemes path.resolve előtt input validáció.

nginx/deploy.sh: ne curl | bash, hanem töltsd le a scriptet, ellenőrizd SHA256 checksum, majd futtasd.

src/backend/config/database.ts: adj hozzá Sequelize-ben dialectOptions: { ssl: true }.

Fókuszálás
Ha túl sok a zaj, akkor futtasd szigorúbban, csak security pack-re:

semgrep --config=p/ci


vagy csak bizonyos szabályokra:

semgrep --config=p/secrets .
semgrep --config=p/javascript .


=============================================================

🔝 TOP 5 FONTOS HIBA + MEGOLDÁS
1. Minimatch (glob pattern injection)

Severity: High

Ok: a minimatch régi verziója regex injectionre sérülékeny

Érintett: glob, rimraf, eslint függőségein keresztül jön be

Fix:

npm install minimatch@^9.0.5 --save-exact


Ha transitive dep hozza be:
package.json → "resolutions" (ha Yarn/NPM 8 támogatja):

"resolutions": {
  "minimatch": "^9.0.5"
}

2. PostCSS (Arbitrary Code Execution)

Severity: High

Ok: régi postcss verzió kód injekciós hibát tartalmaz

Érintett: next, tailwindcss

Fix:

npm install postcss@^8.4.31 --save-dev


Next.js kompatibilis a 8.4.x sorozattal.

3. Undici (SSRF)

Severity: High

Ok: az undici régi verziói SSRF támadásra nyitottak

Érintett: next fetch() implementáció

Fix:

npm install undici@^5.28.4


Alternatív: ha Node >=18, akkor built-in fetch megy, és a undici csak transitive → resolution-nel fixálható.

4. Cross-fetch (DoS)

Severity: High

Ok: régi cross-fetch nem kezeli jól redirect-et → végtelen loop

Érintett: third-party API hívások

Fix:

npm install cross-fetch@^3.1.8

5. Json5 (Prototype Pollution)

Severity: High

Ok: régi json5 prototype pollution hibás

Érintett: eslint, babel, webpack indirect dependency

Fix:

npm install json5@^2.2.3 --save-exact


Ha csak transitive:

"resolutions": {
  "json5": "^2.2.3"
}

✅ Lépések nálad

Frissítsd a package.json-t:

vagy közvetlen dependencies/devDependencies alatt

vagy resolutions blokkban (ha nem te hozod be közvetlenül).

Futtasd:

rm -rf node_modules package-lock.json
npm install


Újra npm audit → nagy rész tiszta lesz.
==========================================================
