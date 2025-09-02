

## SELECT table_schema, table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE';

"continents"	"europe"
"continents"	"oceania"
"continents"	"africa"
"continents"	"asia"
"pg_catalog"	"pg_statistic"
"pg_catalog"	"pg_type"
"public"	"articles"
"public"	"SequelizeMeta"
"pg_catalog"	"pg_foreign_table"
"public"	"news"
"pg_catalog"	"pg_authid"
"continents"	"south america"
"continents"	"north america"
"pg_catalog"	"pg_statistic_ext_data"
"public"	"licenses"
"pg_catalog"	"pg_user_mapping"
"pg_catalog"	"pg_subscription"
"pg_catalog"	"pg_attribute"
"pg_catalog"	"pg_proc"
"pg_catalog"	"pg_class"
"pg_catalog"	"pg_attrdef"
"pg_catalog"	"pg_constraint"
"pg_catalog"	"pg_inherits"
"pg_catalog"	"pg_index"
"pg_catalog"	"pg_operator"
"pg_catalog"	"pg_opfamily"
"pg_catalog"	"pg_opclass"
"pg_catalog"	"pg_am"
"pg_catalog"	"pg_amop"
"pg_catalog"	"pg_amproc"
"pg_catalog"	"pg_language"
"pg_catalog"	"pg_largeobject_metadata"
"pg_catalog"	"pg_aggregate"
"pg_catalog"	"pg_statistic_ext"
"pg_catalog"	"pg_rewrite"
"pg_catalog"	"pg_trigger"
"pg_catalog"	"pg_event_trigger"
"pg_catalog"	"pg_description"
"pg_catalog"	"pg_cast"
"pg_catalog"	"pg_enum"
"pg_catalog"	"pg_namespace"
"pg_catalog"	"pg_conversion"
"pg_catalog"	"pg_depend"
"pg_catalog"	"pg_database"
"pg_catalog"	"pg_db_role_setting"
"pg_catalog"	"pg_tablespace"
"pg_catalog"	"pg_auth_members"
"pg_catalog"	"pg_shdepend"
"pg_catalog"	"pg_shdescription"
"pg_catalog"	"pg_ts_config"
"pg_catalog"	"pg_ts_config_map"
"pg_catalog"	"pg_ts_dict"
"pg_catalog"	"pg_ts_parser"
"pg_catalog"	"pg_ts_template"
"pg_catalog"	"pg_extension"
"pg_catalog"	"pg_foreign_data_wrapper"
"pg_catalog"	"pg_foreign_server"
"pg_catalog"	"pg_policy"
"pg_catalog"	"pg_replication_origin"
"pg_catalog"	"pg_default_acl"
"pg_catalog"	"pg_init_privs"
"pg_catalog"	"pg_seclabel"
"pg_catalog"	"pg_shseclabel"
"pg_catalog"	"pg_collation"
"pg_catalog"	"pg_parameter_acl"
"pg_catalog"	"pg_partitioned_table"
"pg_catalog"	"pg_range"
"pg_catalog"	"pg_transform"
"pg_catalog"	"pg_sequence"
"pg_catalog"	"pg_publication"
"pg_catalog"	"pg_publication_namespace"
"pg_catalog"	"pg_publication_rel"
"pg_catalog"	"pg_subscription_rel"
"pg_catalog"	"pg_largeobject"
"information_schema"	"sql_parts"
"information_schema"	"sql_features"
"information_schema"	"sql_implementation_info"
"information_schema"	"sql_sizing"

==========================================================

## SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema = 'continents';

"continents"	"europe"
"continents"	"oceania"
"continents"	"africa"
"continents"	"asia"
"continents"	"south america"
"continents"	"north america"

========================================================

## SELECT * FROM continents.europe LIMIT 10;

73584	1	"Albania"	"Panorama"	"https://www.panorama.com.al/"	"https://www.panorama.com.al/feed"	"al"	"al-panorama-com-al"	"[]"	"Europe"

=========================================================

## SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'continents' AND table_name = 'europe';

"oldal_id"	"integer"
"fontossag"	"integer"
"orszag"	"character varying"
"cim"	"character varying"
"url"	"text"
"rss_feed"	"text"
"nyelv"	"character varying"
"eredeti_id"	"character varying"
"sections"	"jsonb"
"kontinens"	"character varying"
========================================================

A kontinens táblából (például continents.europe) a következő mezők lehetnek hasznosak a hírekhez és a Card komponens egységes megjelenítéséhez:

- orszag (ország teljes neve, pl. "Belgium")
- cim (forrásnév, pl. "De Standaard")
- eredeti_id (forrás slug, pl. "be-destandaard-be")
- kontinens (pl. "Europe")

Ezeken kívül általában nincs szükség más mezőre a Card egységesítéséhez.  
A többi mező (url, rss_feed, nyelv, sections) inkább technikai vagy háttér-információ.

**Összefoglalva:**  
A Card egységes megjelenítéséhez a következő mezők kellenek a kontinens táblából:
- orszag
- cim
- eredeti_id
- kontinens

Ha ezek elérhetők, minden szükséges metaadatot ki tudsz szolgálni a kereső API-ból is!
==========================================================
===================================================================
PUBLI.NEWS
=========================================================
=============================================================

## SELECT * FROM public.news LIMIT 10;

31419	"HU"	"Így tér vissza Angelina Jolie"	"https://www.magyarhirlap.hu/bulvar/20250814-igy-ter-vissza-angelina-jolie"	"964f9c03bef3aeb0d2b961deb2b1726e"	"2025-08-15 05:12:00+02"	"Hollywood dívája új thrillerrel érkezik"	"https://static.magyarhirlap.hu/images/202503/pr/075-carlino-notitle240829-nplkq.jpg"		"2025-08-15 05:24:42.03261+02"	"hu-magyarhirlap-hu"		"'angelin':4A 'dívá':7B 'hollywo':6B 'jol':5A 'thriller':9B 'tér':2A 'érkez':10B"							
30045	"HU"	"Charlie ugrik be Demjén Ferenc helyett – A barátai remélik, Rózsi talán már ott lehet az év végi Aréna-bulin"	"https://www.blikk.hu/sztarvilag/hazai-sztarok/demjen-ferenc-baleseterol-friss-hirek-horvath-charlie-helyettesiti/yhh0wwe"	"b9bcab3372d9de4d15f4c027bff6bb37"	"2025-08-15 04:45:00+02"	"Egy ország aggódik Demjén Ferenc egészségi állapota miatt. Mint ismert, a népszerű énekes az otthonában szenvedett súlyos balesetet. Alighanem egy rossz mozdulat következtében leesett a lépcsőn, és felsőcomb-törést szenvedett. Annyit már lehet tudni, hogy Rózsit megműtötték, és a"	"https://www.blikk.hu/static/image-transforms/1/8QsktkpTURBXy80MzlhZGZjMGE1NGYwMjA1OGJkM2UzMWE5ZmQwYTAzZS5qcGeSlQMAzLvNF3DNDS-TBc0EsM0Cdg"		"2025-08-15 05:09:00.048811+02"	"hu-blikk-hu"		"'aggód':23B 'alighan':39B 'anny':52B 'arén':19A 'aréna-bul':18A 'baleset':38B 'barát':8A 'bul':20A 'charl':1A 'dem':4A,24B 'egészség':26B 'felsőcomb':49B 'felsőcomb-törés':48B 'ferenc':5A,25B 'helyet':6A 'ismer':30B 'következt':43B 'leeset':44B 'lépcső':46B 'megműtötte':58B 'miat':28B 'mozdul':42B 'népszerű':32B 'ország':22B 'otthon':35B 'remél':9A 'rossz':41B 'rózs':10A,57B 'szenvedet':36B,51B 'súlyos':37B 'tudn':55B 'törés':50B 'ugr':2A 'vég':17A 'állapot':27B 'énekes':33B 'év':16A"							
30392	"HU"	"Marabu Féknyúz: Az elnök intelmei"	"https://hvg.hu/elet/20250815_Marabu-Feknyuz-Az-elnok-intelmei"	"d6a57bbf8f632d8f34fa78a24add174a"	"2025-08-15 05:05:00+02"	"No description"	"https://img.hvg.hu/Img/64092e40-39ef-4e7c-88f1-4e482711b139/0f61e95c-2509-402f-83d7-82555841b63c.jpg"		"2025-08-15 05:09:00.048811+02"	"hu-hvg-hu"		"'descript':7B 'eln':4A 'féknyúz':2A 'intelm':5A 'marabu':1A 'no':6B"

============================================================

## SELECT id, country_code, source_name, source_slug, title, published_at FROM public.news LIMIT 10;

31419	"HU"		"hu-magyarhirlap-hu"	"Így tér vissza Angelina Jolie"	"2025-08-15 05:12:00+02"
30045	"HU"		"hu-blikk-hu"	"Charlie ugrik be Demjén Ferenc helyett – A barátai remélik, Rózsi talán már ott lehet az év végi Aréna-bulin"	"2025-08-15 04:45:00+02"
30392	"HU"		"hu-hvg-hu"	"Marabu Féknyúz: Az elnök intelmei"	"2025-08-15 05:05:00+02"

========================================================

## SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'news';

"id"	"integer"
"country_code"	"character"
"title"	"text"
"url"	"text"
"url_hash"	"character"
"published_at"	"timestamp with time zone"
"description"	"text"
"image_url"	"text"
"content"	"text"
"created_at"	"timestamp with time zone"
"source_slug"	"character varying"
"search_vector_en"	"tsvector"
"search_vector_hu"	"tsvector"
"source_importance"	"integer"
"source_name"	"text"
"source_url"	"text"
"source_rss_feed"	"text"
"source_language"	"character varying"
"source_sections"	"jsonb"
"continent"	"text"