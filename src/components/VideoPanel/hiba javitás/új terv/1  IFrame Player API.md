YouTube Player API referencia iframe beágyazáshoz

könyvjelző_szegély



Az IFrame lejátszó API lehetővé teszi YouTube-videólejátszó beágyazását a webhelyedbe, és a lejátszó JavaScript használatával történő vezérlését.

Az API JavaScript függvényeinek használatával lejátszásra sorba állíthatod a videókat; lejátszhatod, szüneteltetheted vagy leállíthatod őket; beállíthatod a lejátszó hangerejét; vagy információkat kérhetsz le a lejátszott videóról. Hozzáadhatsz eseményfigyelőket is, amelyek bizonyos lejátszási eseményekre, például a lejátszó állapotának változására reagálva futnak le.

Ez az útmutató ismerteti az IFrame API használatát. Bemutatja a különböző eseménytípusokat, amelyeket az API küldhet, és elmagyarázza, hogyan kell eseményfigyelőket írni, hogy válaszoljanak ezekre az eseményekre. Részletezi továbbá a különböző JavaScript függvényeket, amelyeket a videolejátszó vezérléséhez meghívhat, valamint a lejátszó paramétereit, amelyekkel a lejátszó további testreszabását végezheti.

Követelmények
A felhasználó böngészőjének támogatnia kell a HTML5 postMessagefunkciót. A legtöbb modern böngésző támogatja a postMessage.

Embedded players must have a viewport that is at least 200px by 200px. If the player displays controls, it must be large enough to fully display the controls without shrinking the viewport below the minimum size. We recommend 16:9 players be at least 480 pixels wide and 270 pixels tall.

Minden olyan weboldalnak, amely az IFrame API-t használja, a következő JavaScript függvényt is meg kell valósítania:

onYouTubeIframeAPIReady– Az API meghívja ezt a függvényt, amikor az oldal befejezte a lejátszó API JavaScript letöltését, amely lehetővé teszi az API használatát az oldalon. Így ez a függvény létrehozhatja azokat a lejátszó objektumokat, amelyeket az oldal betöltésekor meg szeretne jeleníteni.

Első lépések
Az alábbi minta HTML-oldal létrehoz egy beágyazott lejátszót, amely betölt egy videót, hat másodpercig lejátssza, majd leállítja a lejátszást. A HTML-ben található számozott megjegyzések magyarázatát a példa alatti lista tartalmazza.


<!DOCTYPE html>
<html>
  <body>
    <!-- 1. The <iframe> (and video player) will replace this <div> tag. -->
    <div id="player"></div>

    <script>
      // 2. This code loads the IFrame Player API code asynchronously.
      var tag = document.createElement('script');

      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      // 3. This function creates an <iframe> (and YouTube player)
      //    after the API code downloads.
      var player;
      function onYouTubeIframeAPIReady() {
        player = new YT.Player('player', {
          height: '390',
          width: '640',
          videoId: 'M7lc1UVf-VE',
          playerVars: {
            'playsinline': 1
          },
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
          }
        });
      }

      // 4. The API will call this function when the video player is ready.
      function onPlayerReady(event) {
        event.target.playVideo();
      }

      // 5. The API calls this function when the player's state changes.
      //    The function indicates that when playing a video (state=1),
      //    the player should play for six seconds and then stop.
      var done = false;
      function onPlayerStateChange(event) {
        if (event.data == YT.PlayerState.PLAYING && !done) {
          setTimeout(stopVideo, 6000);
          done = true;
        }
      }
      function stopVideo() {
        player.stopVideo();
      }
    </script>
  </body>
</html>
A következő lista további részleteket tartalmaz a fenti mintáról:

Az <div>ebben a szakaszban található címke azonosítja azt a helyet az oldalon, ahová az IFrame API elhelyezi a videolejátszót. A lejátszó objektum konstruktora, amelyet a Videolejátszó betöltése<div> szakasz ismertet, a címkét a azonosítójával azonosítja, idhogy az API a megfelelő helyre helyezze a címkét . Konkrétan az IFrame API a címkét a következőre <iframe>cseréli:<div><iframe> .

<iframe>Alternatív megoldásként közvetlenül az oldalra is helyezheti az elemet. A Videolejátszó betöltése című szakasz ismerteti, hogyan kell ezt megtenni.

Az ebben a szakaszban található kód betölti az IFrame Player API JavaScript kódját. A példa DOM módosítást használ az API kód letöltéséhez, hogy biztosítsa a kód aszinkron lekérését. (A <script>címke asyncattribútuma, amely szintén lehetővé teszi az aszinkron letöltéseket, még nem támogatott minden modern böngészőben, amint azt ebben a Stack Overflow válaszban is tárgyaljuk .)

A onYouTubeIframeAPIReadyfüggvény a lejátszó API-kódjának letöltése után azonnal végrehajtódik. A kód ezen része egy globális változót, a -t definiál player, amely a beágyazott videolejátszóra hivatkozik, majd a függvény létrehozza a videolejátszó objektumot.

A onPlayerReadyfüggvény az esemény bekövetkeztekor fog végrehajtódni onReady. Ebben a példában a függvény azt jelzi, hogy amikor a videolejátszó készen áll, el kell kezdenie a lejátszást.

Az API meghívja a onPlayerStateChangefüggvényt, amikor a lejátszó állapota megváltozik, ami jelezheti, hogy a lejátszó lejátszás alatt áll, szünetel, befejezett stb. A függvény azt jelzi, hogy amikor a lejátszó állapota 1(lejátszás), a lejátszónak hat másodpercig kell játszania, majd meg kell hívnia a stopVideofüggvényt a videó leállításához.

Videolejátszó betöltése
Miután az API JavaScript kódja betöltődik, az API meghívja a onYouTubeIframeAPIReadyfüggvényt, ekkor létrehozhatsz egy YT.Playerobjektumot, amely egy videolejátszót illeszt be az oldaladra. Az alábbi HTML-részlet onYouTubeIframeAPIReadya fenti példában szereplő függvényt mutatja be:


var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: 'M7lc1UVf-VE',
    playerVars: {
      'playsinline': 1
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}
A videólejátszó konstruktora a következő paramétereket adja meg:

Az első paraméter vagy a DOM elemet, vagy annak ida HTML elemnek a végét adja meg, ahová az API beilleszti <iframe>a lejátszót tartalmazó címkét.

Az IFrame API a megadott elemet a lejátszót tartalmazó elemre cseréli <iframe>. Ez befolyásolhatja az oldal elrendezését, ha a cserélendő elem megjelenítési stílusa eltér a beszúrt <iframe>elemétől. Alapértelmezés szerint <iframe>a elemként jelenik meg inline-block.

A második paraméter egy objektum, amely a játékos beállításait adja meg. Az objektum a következő tulajdonságokat tartalmazza:
width(szám) – A videolejátszó szélessége. Az alapértelmezett érték 640.
height(szám) – A videolejátszó magassága. Az alapértelmezett érték 390.
videoId(karakterlánc) – A YouTube-videó azonosítója, amely azonosítja a lejátszó által betöltendő videót.
playerVars(objektum) – Az objektum tulajdonságai azonosítják a lejátszó paramétereit , amelyekkel testreszabható a lejátszó.
events(objektum) – Az objektum tulajdonságai azonosítják az API által aktivált eseményeket és a függvényeket (eseményfigyelőket), amelyeket az API meghív, amikor ezek az események bekövetkeznek. A példában a konstruktor azt jelzi, hogy a onPlayerReadyfüggvény az onReadyesemény aktiválásakor, illetve onPlayerStateChangeaz esemény aktiválásakor fog végrehajtódni onStateChange.
Ahogy az Első lépések részben említettük , ahelyett, hogy egy üres <div>elemet írnál az oldaladra, amelyet a lejátszó API JavaScript kódja ezután egy másik <iframe>elemmel helyettesít, létrehozhatod a címkét magad is. A Példák<iframe> részben található első példa bemutatja, hogyan kell ezt csinálni.


<iframe id="player" type="text/html" width="640" height="390"
  src="http://www.youtube.com/embed/M7lc1UVf-VE?enablejsapi=1&origin=http://example.com"
  frameborder="0"></iframe>
Vegye figyelembe, hogy ha Ön írja a <iframe>címkét, akkor az objektum létrehozásakor YT.Playernem kell megadnia az widthés paraméterek értékeit height, amelyek a címke attribútumaiként vannak megadva <iframe>, illetve az videoIdés lejátszó paramétereinek értékeit is, amelyek az URL-ben vannak megadva src. További biztonsági intézkedésként a originparamétert az URL-be is bele kell foglalnia, megadva az URL-sémát ( http://vagy https://) és a tárhelyoldal teljes domainjét paraméterértékként. Bár a originbelefoglalása opcionális, védelmet nyújt a rosszindulatú, harmadik féltől származó JavaScript kód oldalra történő befecskendezése és a YouTube-lejátszó feletti irányítás eltérítése ellen.

A videolejátszó objektumok létrehozásának további példáiért lásd : Példák .

Műveletek
A lejátszó API metódusainak meghívásához először le kell szerezned egy referenciát a vezérelni kívánt lejátszó objektumra. A referenciát egy YT.Playerobjektum létrehozásával szerezheted meg, ahogyan azt a dokumentum Első lépések és Videólejátszó betöltése szakaszaiban tárgyaltuk.

Funkciók
Sorbaállítási függvények
A sorba állító függvények lehetővé teszik videók, lejátszási listák vagy más videók listájának betöltését és lejátszását. Ha az alább leírt objektumszintaxist használod ezen függvények meghívásához, akkor a felhasználó által feltöltött videók listáját is sorba állíthatod vagy betöltheted.

Az API két különböző szintaxist támogat a sorba állító függvények meghívásához.

Az argumentum szintaxis megköveteli, hogy a függvények argumentumai előírt sorrendben legyenek felsorolva.

Az objektumszintaxis lehetővé teszi egy objektum egyetlen paraméterként való átadását, és objektumtulajdonságok definiálását a beállítani kívánt függvényargumentumokhoz. Ezenkívül az API további funkciókat is támogathat, amelyeket az argumentumszintaxis nem támogat.

Például a loadVideoByIdfüggvény a következő módokon hívható meg. Vegye figyelembe, hogy az objektum szintaxisa támogatja a endSecondstulajdonságot, amelyet az argumentum szintaxisa nem.

Argumentum szintaxis


loadVideoById("bHQqvYy5KYo", 5, "large")
Objektumszintaxis


loadVideoById({'videoId': 'bHQqvYy5KYo',
               'startSeconds': 5,
               'endSeconds': 60});
Videók sorba állítási funkciói
cueVideoById
Argumentum szintaxis


player.cueVideoById(videoId:String,
                    startSeconds:Number):Void
Objektumszintaxis


player.cueVideoById({videoId:String,
                     startSeconds:Number,
                     endSeconds:Number}):Void
Ez a függvény betölti a megadott videó előnézeti képét, és felkészíti a lejátszót a videó lejátszására. A lejátszó nem kéri le az FLV-t, amíg a playVideo()vagy a seekTo()függvény meg nem hívásra nem kerül.

A kötelező videoIdparaméter a lejátszandó videó YouTube-videóazonosítóját adja meg. A YouTube Data API-ban az videoerőforrás idtulajdonsága adja meg az azonosítót.
Az opcionális startSecondsparaméter lebegőpontos/egész számot fogad el, és meghatározza azt az időpontot, amikor a playVideo()meghívásakor a videó lejátszásának kezdődnie kell. Ha megad egy startSecondsértéket, majd meghívja a függvényt seekTo(), akkor a lejátszó a hívásban megadott időponttól kezdi a lejátszást seekTo(). Amikor a videó ütemezése megtörtént és lejátszásra kész, a lejátszó egy video cuedeseményt ( 5) küld sugározni.
Az opcionális endSecondsparaméter, amely csak objektumszintaxisban támogatott, lebegőpontos/egész számot fogad el, és meghatározza azt az időpontot, amikor a videó lejátszásának le kell állnia a függvény meghívásakor playVideo(). Ha megad egy endSecondsértéket, majd meghívja a függvényt seekTo(), az endSecondsérték már nem lesz érvényben.
loadVideoById

Argumentum szintaxis


player.loadVideoById(videoId:String,
                     startSeconds:Number):Void
Objektumszintaxis


player.loadVideoById({videoId:String,
                      startSeconds:Number,
                      endSeconds:Number}):Void
Ez a függvény betölti és lejátssza a megadott videót.

A kötelező videoIdparaméter a lejátszandó videó YouTube-videóazonosítóját adja meg. A YouTube Data API-ban az videoerőforrás idtulajdonsága adja meg az azonosítót.
Az opcionális startSecondsparaméter lebegőpontos/egész számot fogad el. Ha meg van adva, akkor a videó a megadott időponthoz legközelebbi kulcsképkockától indul.
Az opcionális endSecondsparaméter lebegőpontos/egész számot fogad el. Ha meg van adva, akkor a videó lejátszása a megadott időpontban leáll.
cueVideoByUrl

Argumentum szintaxis


player.cueVideoByUrl(mediaContentUrl:String,
                     startSeconds:Number):Void
Objektumszintaxis


player.cueVideoByUrl({mediaContentUrl:String,
                      startSeconds:Number,
                      endSeconds:Number}):Void
Ez a függvény betölti a megadott videó előnézeti képét, és felkészíti a lejátszót a videó lejátszására. A lejátszó nem kéri le az FLV-t, amíg a playVideo()vagy a seekTo()függvény meg nem hívásra nem kerül.

A kötelező mediaContentUrlparaméter egy teljesen minősített YouTube-lejátszó URL-címét adja meg a következő formátumban http://www.youtube.com/v/VIDEO_ID?version=3: .
Az opcionális startSecondsparaméter lebegőpontos/egész számot fogad el, és meghatározza azt az időpontot, amikor a videó lejátszásának el kell kezdődnie a playVideo()meghívásakor. Ha megadod startSecondsa , majd meghívod a paramétert seekTo(), akkor a lejátszó a hívásban megadott időponttól kezdi a lejátszást . Amikor a videó jelzésre kerül és lejátszásra kész, a lejátszó egy eseménytseekTo() küld (5).video cued
Az opcionális endSecondsparaméter, amely csak objektumszintaxisban támogatott, lebegőpontos/egész számot fogad el, és meghatározza azt az időpontot, amikor a videó lejátszásának le kell állnia a függvény meghívásakor playVideo(). Ha megad egy endSecondsértéket, majd meghívja a függvényt seekTo(), az endSecondsérték már nem lesz érvényben.
loadVideoByUrl

Argumentum szintaxis


player.loadVideoByUrl(mediaContentUrl:String,
                      startSeconds:Number):Void
Objektumszintaxis


player.loadVideoByUrl({mediaContentUrl:String,
                       startSeconds:Number,
                       endSeconds:Number}):Void
Ez a függvény betölti és lejátssza a megadott videót.

A kötelező mediaContentUrlparaméter egy teljesen minősített YouTube-lejátszó URL-címét adja meg a következő formátumban http://www.youtube.com/v/VIDEO_ID?version=3: .
Az opcionális startSecondsparaméter lebegőpontos/egész számot fogad el, és meghatározza azt az időpontot, amikortól a videó lejátszása kezdődjön. Ha startSecondsa (szám lehet lebegőpontos) paraméter van megadva, akkor a videó a megadott időponthoz legközelebbi kulcsképkockától indul.
Az opcionális endSecondsparaméter, amely csak objektumszintaxisban támogatott, lebegőpontos/egész számot fogad el, és meghatározza azt az időpontot, amikor a videó lejátszásának le kell állnia.
Listák sorba állítási függvényei
Az cuePlaylistand loadPlaylistfüggvények lehetővé teszik lejátszási listák betöltését és lejátszását. Ha objektumszintaxist használsz ezeknek a függvényeknek a meghívásához, akkor a felhasználó által feltöltött videók listáját is betöltheted (vagy várólistába rendezheted).

Mivel a függvények eltérően működnek attól függően, hogy argumentum- vagy objektumszintaxissal hívjuk meg őket, mindkét hívási metódust az alábbiakban dokumentáljuk.

cuePlaylist
Argumentum szintaxis


player.cuePlaylist(playlist:String|Array,
                   index:Number,
                   startSeconds:Number):Void
A megadott lejátszási listát sorba helyezi. Amikor a lejátszási lista sorba van állítva és lejátszásra kész, a lejátszó video cuedeseményt közvetít ( 5).
A kötelező playlistparaméter YouTube-videóazonosítók tömbjét adja meg. A YouTube Data API-ban az videoerőforrás idtulajdonsága azonosítja a videó azonosítóját.

Az opcionális indexparaméter a lejátszási lista első videójának indexét adja meg. A paraméter nulla alapú indexet használ, az alapértelmezett paraméterérték pedig 0, tehát az alapértelmezett viselkedés a lejátszási lista első videójának betöltése és lejátszása.

Az opcionális startSecondsparaméter lebegőpontos/egész számot fogad el, és meghatározza azt az időpontot, amikor a lejátszási lista első videójának el kell kezdődnie a playVideo()függvény meghívásakor. Ha megadsz egy startSecondsértéket, majd meghívod a függvényt seekTo(), akkor a lejátszó a hívásban megadott időponttól kezdi a lejátszást seekTo(). Ha előhívsz egy lejátszási listát, majd meghívod a playVideoAt()függvényt, a lejátszó a megadott videó elejétől kezdi a lejátszást.

Objektumszintaxis


player.cuePlaylist({listType:String,
                    list:String,
                    index:Number,
                    startSeconds:Number}):Void
A megadott videólistát sorba állítja. A lista lehet lejátszási lista vagy egy felhasználó által feltöltött videók hírfolyama. A keresési eredmények listájának sorba állítása elavult , és 2020. november 15- től már nem lesz támogatott .
Amikor a lista összeállt és lejátszásra kész, a lejátszó video cuedeseményt közvetít ( 5).

Az opcionális listTypetulajdonság határozza meg a lekért eredménycsatorna típusát. Az érvényes értékek: playlistés user_uploads. Az elavult érték, a , 2020. november 15-search től már nem támogatott . Az alapértelmezett érték: .playlist

A kötelező listtulajdonság egy kulcsot tartalmaz, amely azonosítja a YouTube által visszaadandó videók konkrét listáját.

Ha a listTypetulajdonság értéke playlist, akkor a listtulajdonság a lejátszási lista azonosítóját vagy egy videóazonosítók tömbjét adja meg. A YouTube Data API-ban az playlisterőforrás idtulajdonsága a lejátszási lista azonosítóját azonosítja, az videoerőforrás idtulajdonsága pedig egy videóazonosítót határoz meg.
Ha a listTypetulajdonság értéke user_uploads, akkor a listtulajdonság azonosítja azt a felhasználót, akinek a feltöltött videói vissza lesznek adva.
Ha a listTypetulajdonság értéke search, akkor a listtulajdonság határozza meg a keresési lekérdezést. Megjegyzés: Ez a funkció elavult , és 2020. november 15- től nem lesz támogatott .
Az opcionális indextulajdonság a listában lejátszandó első videó indexét adja meg. A paraméter nulla alapú indexet használ, az alapértelmezett paraméterérték pedig 0, tehát az alapértelmezett viselkedés a lista első videójának betöltése és lejátszása.

Az opcionális startSecondstulajdonság lebegőpontos/egész számot fogad el, és meghatározza azt az időpontot, amikor a lista első videójának lejátszása elkezdődik a playVideo()függvény meghívásakor. Ha megadsz egy startSecondsértéket, majd meghívod a függvényt seekTo(), akkor a lejátszó a hívásban megadott időponttól kezdi a lejátszást seekTo(). Ha előhívsz egy listát, majd meghívod a playVideoAt()függvényt, a lejátszó a megadott videó elejétől kezdi a lejátszást.

loadPlaylist
Argumentum szintaxis


player.loadPlaylist(playlist:String|Array,
                    index:Number,
                    startSeconds:Number):Void
Ez a függvény betölti a megadott lejátszási listát és lejátssza azt.
A kötelező playlistparaméter YouTube-videóazonosítók tömbjét adja meg. A YouTube Data API-ban az videoerőforrás idtulajdonsága egy videóazonosítót ad meg.

Az opcionális indexparaméter a lejátszási lista első videójának indexét adja meg. A paraméter nulla alapú indexet használ, az alapértelmezett paraméterérték pedig 0, tehát az alapértelmezett viselkedés a lejátszási lista első videójának betöltése és lejátszása.

Az opcionális startSecondsparaméter lebegőpontos/egész számot fogad el, és meghatározza azt az időpontot, amikortól a lejátszási lista első videójának lejátszása elkezdődhet.

Objektumszintaxis


player.loadPlaylist({list:String,
                     listType:String,
                     index:Number,
                     startSeconds:Number}):Void
Ez a függvény betölti és lejátssza a megadott listát. A lista lehet egy lejátszási lista vagy egy felhasználó által feltöltött videók hírfolyama. A keresési eredmények listájának betöltésének lehetősége elavult , és 2020. november 15- től nem lesz támogatott .
Az opcionális listTypetulajdonság határozza meg a lekért eredménycsatorna típusát. Az érvényes értékek: playlistés user_uploads. Az elavult érték, a , 2020. november 15-search től már nem támogatott . Az alapértelmezett érték: .playlist

A kötelező listtulajdonság egy kulcsot tartalmaz, amely azonosítja a YouTube által visszaadandó videók konkrét listáját.

Ha a listTypetulajdonság értéke playlist, akkor a listtulajdonság egy lejátszási lista azonosítóját vagy videoazonosítók tömbjét adja meg. A YouTube Data API-ban az playlisterőforrás idtulajdonsága egy lejátszási lista azonosítóját adja meg, az videoerőforrás idtulajdonsága pedig egy videoazonosítót.
Ha a listTypetulajdonság értéke user_uploads, akkor a listtulajdonság azonosítja azt a felhasználót, akinek a feltöltött videói vissza lesznek adva.
Ha a listTypetulajdonság értéke search, akkor a listtulajdonság határozza meg a keresési lekérdezést. Megjegyzés: Ez a funkció elavult , és 2020. november 15- től nem lesz támogatott .
Az opcionális indextulajdonság a listában lejátszandó első videó indexét adja meg. A paraméter nulla alapú indexet használ, az alapértelmezett paraméterérték pedig 0, tehát az alapértelmezett viselkedés a lista első videójának betöltése és lejátszása.

Az opcionális startSecondstulajdonság lebegőpontos/egész számot fogad el, és meghatározza azt az időpontot, amikortól a lista első videójának lejátszása elkezdődhet.

Lejátszási vezérlők és lejátszó beállításai
Videó lejátszása
player.playVideo():Void
Lejátssza az aktuálisan beállított/betöltött videót. A függvény végrehajtása után a végső lejátszási állapot (1) lesz playing.

Megjegyzés: Egy lejátszás csak akkor számít bele a videó hivatalos megtekintéseinek számába, ha a lejátszóban található natív lejátszás gombbal indítják el.
player.pauseVideo():Void
pausedSzünetelteti az aktuálisan lejátszott videót. A függvény végrehajtása után a végső lejátszó állapota ( ) lesz, 2kivéve, ha a lejátszó a ended( 0) állapotban van a függvény meghívásakor, ebben az esetben a lejátszó állapota nem változik.
player.stopVideo():Void
Leállítja és megszakítja az aktuális videó betöltését. Ezt a függvényt ritka helyzetekre kell fenntartani, amikor tudjuk, hogy a felhasználó nem fog további videót nézni a lejátszóban. Ha a videó szüneteltetésére törekszünk, egyszerűen hívjuk meg a pauseVideofüggvényt. Ha meg szeretnénk változtatni a lejátszó által lejátszott videót, meghívhatjuk az egyik várakozási függvényt anélkül, hogy stopVideoelőbb meg kellene hívnunk.

Fontos: A függvénnyel ellentétben , amely a ( ) állapotban pauseVideohagyja a lejátszót , a függvény bármilyen nem lejátszási állapotba helyezheti a lejátszót, beleértve a ( ), ( ), ( ) vagy ( ) állapotokat is.paused2stopVideoended0paused2video cued5unstarted-1
player.seekTo(seconds:Number, allowSeekAhead:Boolean):Void
A videóban egy megadott időpontra ugrik. Ha a lejátszó szünetel a függvény meghívásakor, akkor szüneteltetve is marad. Ha a függvényt egy másik állapotból ( playing, video cuedstb.) hívják meg, a lejátszó lejátssza a videót.
A secondsparaméter meghatározza azt az időt, ameddig a játékosnak előre kell lépnie.

A lejátszó a korábban beállított kulcsképkockára ugrik, kivéve, ha a lejátszó már letöltötte a videó azon részét, amelyet a felhasználó keres.

A allowSeekAheadparaméter határozza meg, hogy a lejátszó küld-e új kérést a szervernek, ha a secondsparaméter a jelenleg pufferelt videoadatokon kívüli időpontot ad meg.

Azt javasoljuk, hogy ezt a paramétert a következőre állítsa: falsemiközben a felhasználó az egérmutatót húzza a videó folyamatjelzőjén, majd a következőre: trueamikor a felhasználó elengedi az egeret. Ez a megközelítés lehetővé teszi a felhasználó számára, hogy a videó nem pufferelt pontjain túlra görgessen anélkül, hogy új videostreameket kérne. Amikor a felhasználó elengedi az egérgombot, a lejátszó a videó kívánt pontjára ugrik, és szükség esetén új videostreamet kér.

360°-os videók lejátszásának vezérlése
Megjegyzés: A 360°-os videólejátszási élmény korlátozottan támogatott mobileszközökön. Nem támogatott eszközökön a 360°-os videók torzítva jelennek meg, és a nézőpont megváltoztatására semmilyen támogatott mód nincs, beleértve az API-n keresztüli, tájolásérzékelők használatát vagy az eszköz képernyőjén történő érintési/húzási műveletekre való reagálást.

player.getSphericalProperties():Object
Lekéri azokat a tulajdonságokat, amelyek leírják a néző aktuális perspektíváját vagy nézetét egy videólejátszás során. Továbbá:
Ez az objektum csak 360°-os videóknál, más néven gömb alakú videóoknál jelenik meg.
Ha az aktuális videó nem 360°-os videó, vagy ha a függvényt nem támogatott eszközről hívják meg, akkor a függvény egy üres objektumot ad vissza.
Támogatott mobileszközökön, ha a enableOrientationSensortulajdonság értékre van állítva true, akkor ez a függvény egy olyan objektumot ad vissza, amelyben a fovtulajdonság tartalmazza a helyes értéket, a többi tulajdonság pedig értékre van állítva 0.
Az objektum a következő tulajdonságokat tartalmazza:
Tulajdonságok
yaw	Egy [0, 360] tartományba eső szám, amely a látómező vízszintes szögét jelöli fokban, azaz azt, hogy a felhasználó milyen mértékben fordítja el a nézetet balra vagy jobbra. A semleges pozíció, amely a videó közepére néz, annak derékszögű vetületében, 0°-ot jelent, és ez az érték növekszik, ahogy a néző balra fordul.
pitch	Egy [-90, 90] tartományba eső szám, amely a látószög függőleges szögét jelöli fokban, azaz azt, hogy a felhasználó milyen mértékben állítja be a nézetet felfelé vagy lefelé nézéshez. A semleges pozíció, amely a videó közepével szemben, annak derékszögű vetületében van, 0°-ot jelent, és ez az érték növekszik, ahogy a néző felfelé néz.
roll	Egy [-180, 180] tartományba eső szám, amely a nézet óramutató járásával megegyező vagy azzal ellentétes irányú elforgatási szögét jelöli fokban. A semleges helyzet, ahol a vízszintes tengely a derékszögű vetületben párhuzamos a nézet vízszintes tengelyével, 0°-ot jelent. Az érték növekszik, amikor a nézet az óramutató járásával megegyezően, és csökken, amikor az óramutató járásával ellentétesen forog.

Vegye figyelembe, hogy a beágyazott lejátszó nem jelenít meg felhasználói felületet a nézet dőlésének beállításához. A dőlés az alábbi, egymást kölcsönösen kizáró módok bármelyikén állítható be:
Használd a mobilböngészőben a tájolásérzékelőt a nézet elforgatásának biztosításához. Ha a tájolásérzékelő engedélyezve van, akkor a getSphericalPropertiesfüggvény mindig 0a tulajdonság értékeként tér vissza roll.
Ha a tájolásérzékelő le van tiltva, akkor az API használatával állítsa a tekercs értékét nullától eltérő értékre.
fov	Egy [30, 120] tartományba eső szám, amely a látómezőt fokban jelöli, a nézetablak hosszabbik éle mentén mérve. A rövidebb él automatikusan a nézet képarányához igazodik.

Az alapértelmezett érték 100 fok. Az érték csökkentése olyan, mint a videó tartalmának nagyítása, az érték növelése pedig olyan, mint a kicsinyítés. Ez az érték az API használatával vagy az egérgörgővel módosítható, amikor a videó teljes képernyős módban van.
player.setSphericalProperties(properties:Object):Void
Beállítja a videó tájolását egy 360°-os videó lejátszásához. (Ha az aktuális videó nem gömb alakú, a metódus inaktív, függetlenül a bemenettől.)

A lejátszó nézete a metódus hívásaira úgy válaszol, hogy frissíti az objektumban található ismert tulajdonságok értékeit properties. A nézet megőrzi az objektumban nem szereplő összes többi ismert tulajdonság értékeit.

Továbbá:
Ha az objektum ismeretlen és/vagy váratlan tulajdonságokat tartalmaz, a játékos figyelmen kívül hagyja azokat.
Amint azt a szakasz elején említettük, a 360°-os videólejátszási élmény nem minden mobileszközön támogatott.
Alapértelmezés szerint a támogatott mobileszközökön ez a függvény csak a fovtulajdonságot állítja be, és nem befolyásolja a yaw, pitch, és rolltulajdonságokat 360°-os videók lejátszásakor. enableOrientationSensorTovábbi részletekért lásd az alábbi tulajdonságot.
A propertiesfüggvénynek átadott objektum a következő tulajdonságokat tartalmazza:
Tulajdonságok
yaw	Lásd a fenti definíciót .
pitch	Lásd a fenti definíciót .
roll	Lásd a fenti definíciót .
fov	Lásd a fenti definíciót .
enableOrientationSensor	
Jegyzet: Ez a tulajdonság csak a támogatott eszközökön befolyásolja a 360°-os megtekintési élményt.
Egy logikai érték, amely jelzi, hogy az IFrame beágyazásnak reagálnia kell-e olyan eseményekre, amelyek egy támogatott eszköz, például egy mobilböngésző tájolásának változását jelzik DeviceOrientationEvent. Az alapértelmezett paraméterérték: true.

Támogatott mobileszközök.
Amikor az érték true, egy beágyazott lejátszó csak az eszköz mozgására hagyatkozik a yaw, pitchés rolltulajdonságok beállításához 360°-os videók lejátszásakor. A fovtulajdonság azonban továbbra is módosítható az API-n keresztül, és valójában az API az egyetlen módja a fovtulajdonság módosításának mobileszközön. Ez az alapértelmezett viselkedés.
Ha az érték false, akkor az eszköz mozgása nem befolyásolja a 360°-os megtekintési élményt, és a yaw, pitch, rollés fovtulajdonságokat mind az API-n keresztül kell beállítani.

Nem támogatott mobileszközök
A enableOrientationSensortulajdonság értékének nincs hatása a lejátszási élményre.
Videó lejátszása lejátszási listából
player.nextVideo():Void
Ez a funkció betölti és lejátssza a lejátszási lista következő videóját.
Ha a player.nextVideo()meghívódik, miközben a lejátszási lista utolsó videóját nézik, és a lejátszási lista folyamatos lejátszásra van állítva ( loop), akkor a lejátszó betölti és lejátssza a lista első videóját.

Ha player.nextVideo()a meghívódik, miközben a lejátszási lista utolsó videóját nézzük, és a lejátszási lista nincs folyamatos lejátszásra állítva, akkor a lejátszás leáll.

player.previousVideo():Void
Ez a funkció betölti és lejátssza a lejátszási lista előző videóját.
Ha a player.previousVideo()meghívódik, miközben a lejátszási lista első videóját nézik, és a lejátszási lista folyamatos lejátszásra van állítva ( loop), akkor a lejátszó betölti és lejátssza a lista utolsó videóját.

Ha player.previousVideo()a meghívódik, miközben a lejátszási lista első videóját nézik, és a lejátszási lista nincs folyamatos lejátszásra állítva, akkor a lejátszó az első lejátszási lista videóját az elejétől fogja újraindítani.

player.playVideoAt(index:Number):Void
Ez a függvény betölti és lejátssza a lejátszási listában szereplő megadott videót.
A kötelező indexparaméter adja meg a lejátszási listában lejátszani kívánt videó indexét. A paraméter nulla alapú indexet használ, így az értéke 0azonosítja a lista első videóját. Ha véletlenszerűen kiválasztotta a lejátszási listát, ez a függvény a megadott pozícióban játssza le a videót a véletlenszerűen kiválasztott lejátszási listában.

A lejátszó hangerejének módosítása
player.mute():Void
Némítja a lejátszót.
player.unMute():Void
Feloldja a játékos némítását.
player.isMuted():Boolean
Visszaadja true, hogy a játékos némítva van-e, falseha nem.
player.setVolume(volume:Number):Void
Beállítja a hangerőt. Elfogad egy 0és közötti egész számot 100.
player.getVolume():Number
Visszaadja a játékos aktuális hangerejét, amely egy 0és közötti egész szám 100. Megjegyzendő, hogy getVolume()a hangerőt akkor is visszaadja, ha a lejátszó némítva van.
A lejátszó méretének beállítása
player.setSize(width:Number, height:Number):Object
Beállítja a lejátszót tartalmazó terület méretét pixelben <iframe>.
A lejátszási sebesség beállítása
player.getPlaybackRate():Number
Ez a függvény lekéri az aktuálisan lejátszott videó lejátszási sebességét. Az alapértelmezett lejátszási sebesség 1, ami azt jelzi, hogy a videó normál sebességgel lejátszódik. A lejátszási sebességek olyan értékeket tartalmazhatnak, mint 0.25a , 0.5, 1, 1.5és 2.
player.setPlaybackRate(suggestedRate:Number):Void
Ez a függvény beállítja az aktuális videó javasolt lejátszási sebességét. Ha a lejátszási sebesség megváltozik, az csak a már beállított vagy lejátszás alatt álló videóra vonatkozik. Ha beállítod a lejátszási sebességet egy beállított videóhoz, az a sebesség továbbra is érvényben lesz, amikor a playVideofüggvényt meghívják, vagy a felhasználó közvetlenül a lejátszó vezérlőivel kezdeményezi a lejátszást. Ezenkívül a videók vagy lejátszási listák beállításához vagy betöltéséhez használt függvények ( cueVideoById, loadVideoById, stb.) meghívása visszaállítja a lejátszási sebességet értékre 1.

A függvény meghívása nem garantálja, hogy a lejátszási sebesség valóban megváltozik. Ha azonban a lejátszási sebesség megváltozik, az onPlaybackRateChangeesemény aktiválódik, és a kódodnak az eseményre kell reagálnia, nem pedig arra a tényre, hogy meghívta a setPlaybackRatefüggvényt.

A getAvailablePlaybackRatesmetódus visszaadja az aktuálisan lejátszott videó lehetséges lejátszási sebességeit. Ha azonban a suggestedRateparamétert nem támogatott egész vagy lebegőpontos értékre állítod be, a lejátszó ezt az értéket lefelé kerekíti a legközelebbi támogatott értékre a irányba 1.
player.getAvailablePlaybackRates():Array
Ez a függvény visszaadja azokat a lejátszási sebességeket, amelyeken az aktuális videó elérhető. Az alapértelmezett érték 1, ami azt jelzi, hogy a videó normál sebességgel lejátszódik.

A függvény egy számokból álló tömböt ad vissza, a leglassabbtól a leggyorsabb lejátszási sebességig rendezve. Még ha a lejátszó nem is támogatja a változó lejátszási sebességeket, a tömbnek mindig tartalmaznia kell legalább egy értéket ( 1).
Lejátszási listák lejátszási viselkedésének beállítása
player.setLoop(loopPlaylists:Boolean):Void
Ez a függvény jelzi, hogy a videolejátszó folyamatosan játssza-e le a lejátszási listát, vagy a lejátszás a lejátszási lista utolsó videójának vége után álljon le. Az alapértelmezett viselkedés az, hogy a lejátszási listák nem ismétlődnek újra.

Ez a beállítás akkor is megmarad, ha betöltesz vagy kiválasztasz egy másik lejátszási listát, ami azt jelenti, hogy ha betöltesz egy lejátszási listát, meghívod a setLoopfüggvényt értékkel true, majd betöltesz egy második lejátszási listát, akkor a második lejátszási lista is ciklusba kerül.

A kötelező loopPlaylistsparaméter azonosítja a ciklus viselkedését.

Ha a paraméter értéke true, akkor a videolejátszó folyamatosan lejátssza a lejátszási listákat. A lejátszási lista utolsó videójának lejátszása után a videolejátszó visszatér a lejátszási lista elejére, és újra lejátssza azt.

Ha a paraméter értéke false, akkor a lejátszások a lejátszási lista utolsó videójának lejátszása után érnek véget.

player.setShuffle(shufflePlaylist:Boolean):Void
Ez a funkció jelzi, hogy egy lejátszási lista videóit véletlenszerűen kell-e lejátszani, hogy azok a lejátszási lista létrehozója által megadott sorrendtől eltérő sorrendben lejátszódjanak-e. Ha egy lejátszási listát a lejátszás megkezdése után véletlenszerűen lejátszol, a lista újrarendeződik, miközben a lejátszott videó lejátszása folytatódik. A következő lejátszott videó ezután az átrendeződött lista alapján kerül kiválasztásra.

Ez a beállítás nem marad meg, ha másik lejátszási listát tölt be vagy választ ki, ami azt jelenti, hogy ha betölt egy lejátszási listát, akkor asetShuffle függvényt, majd betöltesz egy második lejátszási listát, a második lejátszási lista nem lesz véletlenszerűen lejátszva.

A kötelező shufflePlaylistparaméter jelzi, hogy a YouTube véletlenszerűen válassza-e a lejátszási listát.

Ha a paraméter értéke true, akkor a YouTube összekeveri a lejátszási listák sorrendjét. Ha arra utasítod a függvényt, hogy egy már összekevert lejátszási listát keverjen össze, a YouTube újra összekeveri a sorrendet.

Ha a paraméter értéke false, akkor a YouTube visszaállítja a lejátszási listák sorrendjét az eredeti sorrendre.

Lejátszási állapot
player.getVideoLoadedFraction():Float
0Egy és közötti számot ad vissza , 1amely meghatározza, hogy a lejátszó a videó hány százalékát jeleníti meg puffereltként. Ez a metódus megbízhatóbb számot ad vissza, mint a mára elavult getVideoBytesLoadedés getVideoBytesTotalmetódusok.
player.getPlayerState():Number
Visszaadja a játékos állapotát. A lehetséges értékek a következők:
-1– el nem indított
0– véget ért
1– játék
2– szünetel
3– pufferelés
5– videós jelzéssel
player.getCurrentTime():Number
Visszaadja a videó lejátszásának kezdete óta eltelt időt másodpercben.
player.getVideoStartBytes():Number
2012. október 31-től elavult. Visszaadja a videofájl betöltésének kezdetétől számított bájtok számát. (Ez a metódus mostantól mindig értéket ad vissza 0.) Példa forgatókönyv: a felhasználó egy olyan pontra keres előre, amely még nem töltött be, és a lejátszó új kérést küld a videó egy még be nem töltött szegmensének lejátszására.
player.getVideoBytesLoaded():Number
2012. július 18-tól elavult. Ehelyett a getVideoLoadedFractionmetódussal határozhatja meg a videó pufferelt százalékos arányát. Ez a metódus egy és

közötti értéket ad vissza, amely megközelítőleg a betöltött videó mennyiségét adja meg. A videó betöltött hányadát úgy számíthatja ki, hogy az értéket elosztja a értékkel. 01000getVideoBytesLoadedgetVideoBytesTotal
player.getVideoBytesTotal():Number
2012. július 18-tól elavult. Ehelyett a getVideoLoadedFractionmetódussal határozhatja meg a videó pufferelt részének százalékos arányát.

Visszaadja az aktuálisan betöltött/lejátszott videó méretét bájtban, vagy a videó méretének egy közelítő értékét.

Ez a metódus mindig értéket ad vissza 1000. A videó betöltött részét úgy számíthatja ki, hogy az getVideoBytesLoadedértéket elosztja a getVideoBytesTotalértékkel.
Videóinformációk lekérése
player.getDuration():Number
Visszaadja az aktuálisan lejátszott videó időtartamát másodpercben. Megjegyzendő, hogy a érték addig getDuration()tér vissza 0, amíg a videó metaadatai be nem töltődnek, ami általában a videó lejátszásának megkezdése után történik.

Ha az aktuálisan lejátszott videó egy élő esemény , a getDuration()függvény az élő videó streamelésének kezdete óta eltelt időt adja vissza. Konkrétan ez az az időtartam, ameddig a videó streamelése megtörtént anélkül, hogy visszaállításra vagy megszakításra került volna. Ezenkívül ez az időtartam általában hosszabb, mint a tényleges esemény időtartama, mivel a streamelés az esemény kezdési időpontja előtt is elkezdődhet.
player.getVideoUrl():String
Visszaadja a jelenleg betöltött/lejátszott videó YouTube.com URL-címét.
player.getVideoEmbedCode():String
Visszaadja az aktuálisan betöltött/lejátszott videó beágyazási kódját.
Lejátszási lista adatainak lekérése
player.getPlaylist():Array
Ez a függvény a lejátszási listában található videóazonosítók tömbjét adja vissza, azok aktuális sorrendjében. Alapértelmezés szerint a függvény a lejátszási lista tulajdonosa által megadott sorrendben adja vissza a videóazonosítókat. Ha azonban setShufflea lejátszási lista sorrendjének összekeverésére hívta meg a függvényt, akkor a getPlaylist()függvény visszatérési értéke a kevert sorrendet fogja tükrözni.
player.getPlaylistIndex():Number
Ez a függvény visszaadja az aktuálisan lejátszott lejátszási lista videójának indexét.
Ha nem keverted össze a lejátszási listát, a visszatérési érték azt a pozíciót azonosítja, ahová a lejátszási lista készítője a videót helyezte. A visszatérési érték nulla alapú indexet használ, tehát a érték 0a lejátszási lista első videóját azonosítja.

Ha véletlenszerűen kiválasztottad a lejátszási listát, a visszatérési érték a videó sorrendjét fogja azonosítani a véletlenszerűen kiválasztott lejátszási listán belül.

Eseményfigyelő hozzáadása vagy eltávolítása
player.addEventListener(event:String, listener:String):Void
Hozzáad egy figyelőfüggvényt a megadott eseményhez event. Az alábbi Események szakasz azonosítja a lejátszó által végrehajtható különböző eseményeket. A figyelő egy karakterlánc, amely meghatározza azt a függvényt, amely a megadott esemény végrehajtásakor végrehajtódik.
player.removeEventListener(event:String, listener:String):Void
Eltávolít egy figyelőfüggvényt a megadott eseményhez event. A listeneregy karakterlánc, amely azonosítja azt a függvényt, amely a megadott esemény bekövetkeztekor már nem fog végrehajtódni.
DOM csomópontok elérése és módosítása
player.getIframe():Object
Ez a metódus visszaadja a beágyazott DOM csomópontot <iframe>.
player.destroy():Void
Eltávolítja a <iframe>lejátszót tartalmazó elemet.
Események
Az API eseményeket indít, hogy értesítse az alkalmazást a beágyazott lejátszó változásairól. Ahogy az előző szakaszban említettük, feliratkozhatsz eseményekre egy eseményfigyelő hozzáadásával az YT.Playerobjektum létrehozásakor , és a függvényt is használhatod addEventListener.

Az API mindegyik függvénynek egy eseményobjektumot fog átadni egyetlen argumentumként. Az eseményobjektum a következő tulajdonságokkal rendelkezik:

Az esemény targetazonosítja az eseményhez tartozó videolejátszót.
Az dataeseményre vonatkozó értéket határoz meg. Fontos megjegyezni, hogy az onReadyés onAutoplayBlockedesemények nem határoznak meg datatulajdonságot.
A következő lista definiálja az API által aktivált eseményeket:

onReady
Ez az esemény akkor aktiválódik, amikor egy lejátszó befejezte a betöltést, és készen áll az API-hívások fogadására. Az alkalmazásodnak implementálnia kell ezt a függvényt, ha bizonyos műveleteket, például a videó lejátszását vagy a videóval kapcsolatos információk megjelenítését szeretnéd automatikusan végrehajtani, amint a lejátszó készen áll.

Az alábbi példa egy mintafüggvényt mutat be az esemény kezelésére. Az API által a függvénynek átadott eseményobjektum rendelkezik egy targettulajdonsággal, amely azonosítja a lejátszót. A függvény lekéri az aktuálisan betöltött videó beágyazási kódját, elindítja a videó lejátszását, és megjeleníti a beágyazási kódot a idértékkel rendelkező page elemben embed-code.

function onPlayerReady(event) {
  var embedCode = event.target.getVideoEmbedCode();
  event.target.playVideo();
  if (document.getElementById('embed-code')) {
    document.getElementById('embed-code').innerHTML = embedCode;
  }
}
onStateChange
Ez az esemény akkor aktiválódik, amikor a játékos állapota megváltozik. dataAz eseményobjektum azon tulajdonsága, amelyet az API átad az eseményfigyelő függvénynek, egy egész számot határoz meg, amely megfelel az új játékos állapotának. A lehetséges értékek a következők:
-1(el nem indított)
0(vége)
1(játszik)
2(szünetel)
3(pufferelés)
5(videós jelzéssel).
unstartedAmikor a lejátszó először betölt egy videót, egy ( ) eseményt sugároz -1. Amikor a videó lejátszásra kész, a lejátszó egy video cued( 5) eseményt sugároz. A kódban megadhatod az egész értékeket, vagy használhatod a következő névtéres változók egyikét:
YT.PlayerState.ENDED
YT.PlayerState.PLAYING
YT.PlayerState.PAUSED
YT.PlayerState.BUFFERING
YT.PlayerState.CUED
onPlaybackQualityChange
Ez az esemény akkor aktiválódik, amikor a videó lejátszási minősége megváltozik. Jelezheti a néző lejátszási környezetének változását. További információért a lejátszási feltételeket befolyásoló vagy az esemény aktiválódását kiváltó tényezőkről, lásd a YouTube Súgóközpontot.

Az dataeseményobjektum tulajdonságértéke, amelyet az API átad az eseményfigyelő függvénynek, egy karakterlánc lesz, amely azonosítja az új lejátszási minőséget. A lehetséges értékek a következők:
small
medium
large
hd720
hd1080
highres
onPlaybackRateChange
Ez az esemény akkor aktiválódik, amikor a videó lejátszási sebessége megváltozik. Például, ha meghívod a setPlaybackRate(suggestedRate)függvényt, az esemény akkor aktiválódik, ha a lejátszási sebesség ténylegesen megváltozik. Az alkalmazásodnak reagálnia kell az eseményre, és nem feltételezheti, hogy a lejátszási sebesség automatikusan megváltozik a setPlaybackRate(suggestedRate)függvény meghívásakor. Hasonlóképpen, a kódodnak sem feltételezheti, hogy a videó lejátszási sebessége csak a explicit hívása eredményeként változik setPlaybackRate.

Az dataeseményobjektum tulajdonságának értéke, amelyet az API átad az eseményfigyelő függvénynek, egy szám lesz, amely azonosítja az új lejátszási sebességet. A getAvailablePlaybackRatesmetódus visszaadja az aktuálisan beállított vagy lejátszott videó érvényes lejátszási sebességeinek listáját.
onError
Ez az esemény akkor aktiválódik, ha hiba történik a lejátszóban. Az API egy eventobjektumot ad át az eseményfigyelő függvénynek. Az objektum datatulajdonsága egy egész számot ad meg, amely azonosítja a felmerült hiba típusát. A lehetséges értékek a következők:
2– A kérés érvénytelen paraméterértéket tartalmaz. Ez a hiba például akkor fordul elő, ha olyan videoazonosítót ad meg, amely nem 11 karakterből áll, vagy ha a videoazonosító érvénytelen karaktereket tartalmaz, például felkiáltójelet vagy csillagot.
5– A kért tartalom nem játszható le HTML5-lejátszóban, vagy más, a HTML5-lejátszóval kapcsolatos hiba történt.
100– A kért videó nem található. Ez a hiba akkor fordul elő, ha egy videót eltávolítottak (bármilyen okból), vagy privátként jelöltek meg.
101– A kért videó tulajdonosa nem engedélyezi a lejátszását beágyazott lejátszókban.
150– Ez a hiba ugyanaz, mint a 101. Ez csak egy 101álcázott hiba!
153– A kérés nem tartalmazza a HTTP Refererfejlécet vagy az azzal egyenértékű API kliens azonosítót. További információkért lásd az API kliens identitását és hitelesítő adatait ismertető részt .
onApiChange
Ez az esemény azt jelzi, hogy a lejátszó betöltött (vagy eltávolított) egy elérhető API-metódusokkal rendelkező modult. Az alkalmazásod figyelheti ezt az eseményt, majd lekérdezheti a lejátszót, hogy meghatározza, mely beállítások vannak elérhetők a nemrég betöltött modulhoz. Az alkalmazásod ezután lekérheti vagy frissítheti az adott beállítások meglévő beállításait.

A következő parancs lekéri a modulnevek tömbjét, amelyekhez beállíthatod a lejátszó beállításait:

player.getOptions();
Jelenleg csak ahhoz a modulhoz adhatsz meg beállításokat captions, amely a lejátszóban a zárt feliratozást kezeli. onApiChangeEsemény fogadásakor az alkalmazás a következő paranccsal állapíthatja meg, hogy mely beállítások adhatók meg a captionsmodulhoz:

player.getOptions('captions');
A játékos lekérdezésével ezzel a paranccsal megerősítheted, hogy a kívánt beállítások valóban elérhetők. A következő parancsok kérik le és frissítik a modul beállításait:

Retrieving an option:
player.getOption(module, option);

Setting an option
player.setOption(module, option, value);
Az alábbi táblázat felsorolja az API által támogatott beállításokat:

Modul	Opció	Leírás
captions	fontSize	Ez a beállítás a lejátszóban megjelenített feliratok betűméretét módosítja.

Az érvényes értékek -1: 0, 1, 2, és 3. Az alapértelmezett méret 0, a legkisebb méret pedig -1. Ha ezt a beállítást egy egész számra állítja be, -1akkor a legkisebb feliratméret jelenik meg, míg ha ezt a beállítást egy egész számra állítja be, 3akkor a legnagyobb feliratméret jelenik meg.
captions	reload	Ez a beállítás újratölti a lejátszott videó feliratait. Az érték a következő lesz: null, ha lekéri a beállítás értékét. Állítsa be a következő értéket: truea feliratok újratöltéséhez.
onAutoplayBlocked
Ez az esemény akkor aktiválódik, amikor a böngésző blokkolja az automatikus lejátszást vagy a szkriptelt videolejátszási funkciókat, amelyeket együttesen „automatikus lejátszásnak” nevezünk. Ez magában foglalja a következő lejátszó API-k bármelyikével megkísérelt lejátszást is:
autoplayparaméter
loadPlaylistfunkció
loadVideoByIdfunkció
loadVideoByUrlfunkció
playVideofunkció
A legtöbb böngésző rendelkezik olyan szabályzatokkal, amelyek bizonyos feltételek teljesülése esetén blokkolhatják az automatikus lejátszást asztali, mobil és más környezetben. Ez a szabályzat akkor aktiválódhat, ha felhasználói beavatkozás nélkül némítatlan lejátszás történik, vagy ha nincs beállítva olyan engedélyezési szabályzat, amely engedélyezi az automatikus lejátszást egy kereszt-eredetű iframe-en.

A részletes információkért lásd a böngészőspecifikus szabályzatokat ( Apple Safari / Webkit , Google Chrome , Mozilla Firefox ) és a Mozilla automatikus lejátszási útmutatóját .
Példák
Objektumok létrehozásaYT.Player
1. példa: API használata meglévő <iframe>-mel

Ebben a példában <iframe>az oldalon található egyik elem már meghatározza azt a lejátszót, amellyel az API-t használni fogják. Fontos megjegyezni, hogy vagy a lejátszó URL-címének paraméterét értékre srckell állítani, vagy az elem attribútumát értékre kell állítani .enablejsapi1<iframe>enablejsapitrue

A onPlayerReadyfüggvény narancssárgára változtatja a lejátszó körüli szegély színét, amikor a lejátszó készen áll. A onPlayerStateChangefüggvény ezután a lejátszó aktuális állapota alapján módosítja a lejátszó körüli szegély színét. Például a szín zöld, amikor a lejátszó játszik, piros, amikor szünetel, kék, amikor pufferel, és így tovább.


Ez a példa a következő kódot használja:


<iframe id="existing-iframe-example"
        width="640" height="360"
        src="https://www.youtube.com/embed/M7lc1UVf-VE?enablejsapi=1"
        frameborder="0"
        style="border: solid 4px #37474F"
></iframe>

<script type="text/javascript">
  var tag = document.createElement('script');
  tag.id = 'iframe-demo';
  tag.src = 'https://www.youtube.com/iframe_api';
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  var player;
  function onYouTubeIframeAPIReady() {
    player = new YT.Player('existing-iframe-example', {
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
    });
  }
  function onPlayerReady(event) {
    document.getElementById('existing-iframe-example').style.borderColor = '#FF6D00';
  }
  function changeBorderColor(playerStatus) {
    var color;
    if (playerStatus == -1) {
      color = "#37474F"; // unstarted = gray
    } else if (playerStatus == 0) {
      color = "#FFFF00"; // ended = yellow
    } else if (playerStatus == 1) {
      color = "#33691E"; // playing = green
    } else if (playerStatus == 2) {
      color = "#DD2C00"; // paused = red
    } else if (playerStatus == 3) {
      color = "#AA00FF"; // buffering = purple
    } else if (playerStatus == 5) {
      color = "#FF6DOO"; // video cued = orange
    }
    if (color) {
      document.getElementById('existing-iframe-example').style.borderColor = color;
    }
  }
  function onPlayerStateChange(event) {
    changeBorderColor(event.data);
  }
</script>
2. példa: Hangos lejátszás

Ez a példa egy 1280 x 720 képpontos videolejátszót hoz létre. Az eseményfigyelő onReadyezután meghívja a setVolumefüggvényt, hogy a hangerőt a legmagasabb értékre állítsa.


function onYouTubeIframeAPIReady() {
  var player;
  player = new YT.Player('player', {
    width: 1280,
    height: 720,
    videoId: 'M7lc1UVf-VE',
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
      'onError': onPlayerError
    }
  });
}

function onPlayerReady(event) {
  event.target.setVolume(100);
  event.target.playVideo();
}
3. példa: Ez a példa úgy állítja be a lejátszó paramétereit, hogy a videó automatikusan lejátszódjon a betöltéskor, és elrejtse a videolejátszó vezérlőit. Emellett eseményfigyelőket is hozzáad számos, az API által sugárzott eseményhez.


function onYouTubeIframeAPIReady() {
  var player;
  player = new YT.Player('player', {
    videoId: 'M7lc1UVf-VE',
    playerVars: { 'autoplay': 1, 'controls': 0 },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
      'onError': onPlayerError
    }
  });
}
360°-os videók vezérlése

Ez a példa a következő kódot használja:


<style>
  .current-values {
    color: #666;
    font-size: 12px;
  }
</style>
<!-- The player is inserted in the following div element -->
<div id="spherical-video-player"></div>

<!-- Display spherical property values and enable user to update them. -->
<table style="border: 0; width: 640px;">
  <tr style="background: #fff;">
    <td>
      <label for="yaw-property">yaw: </label>
      <input type="text" id="yaw-property" style="width: 80px"><br>
      <div id="yaw-current-value" class="current-values"> </div>
    </td>
    <td>
      <label for="pitch-property">pitch: </label>
      <input type="text" id="pitch-property" style="width: 80px"><br>
      <div id="pitch-current-value" class="current-values"> </div>
    </td>
    <td>
      <label for="roll-property">roll: </label>
      <input type="text" id="roll-property" style="width: 80px"><br>
      <div id="roll-current-value" class="current-values"> </div>
    </td>
    <td>
      <label for="fov-property">fov: </label>
      <input type="text" id="fov-property" style="width: 80px"><br>
      <div id="fov-current-value" class="current-values"> </div>
    </td>
    <td style="vertical-align: bottom;">
      <button id="spherical-properties-button">Update properties</button>
    </td>
  </tr>
</table>

<script type="text/javascript">
  var tag = document.createElement('script');
  tag.id = 'iframe-demo';
  tag.src = 'https://www.youtube.com/iframe_api';
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  var PROPERTIES = ['yaw', 'pitch', 'roll', 'fov'];
  var updateButton = document.getElementById('spherical-properties-button');

  // Create the YouTube Player.
  var ytplayer;
  function onYouTubeIframeAPIReady() {
    ytplayer = new YT.Player('spherical-video-player', {
        height: '360',
        width: '640',
        videoId: 'FAtdv94yzp4',
    });
  }

  // Don't display current spherical settings because there aren't any.
  function hideCurrentSettings() {
    for (var p = 0; p < PROPERTIES.length; p++) {
      document.getElementById(PROPERTIES[p] + '-current-value').innerHTML = '';
    }
  }

  // Retrieve current spherical property values from the API and display them.
  function updateSetting() {
    if (!ytplayer || !ytplayer.getSphericalProperties) {
      hideCurrentSettings();
    } else {
      let newSettings = ytplayer.getSphericalProperties();
      if (Object.keys(newSettings).length === 0) {
        hideCurrentSettings();
      } else {
        for (var p = 0; p < PROPERTIES.length; p++) {
          if (newSettings.hasOwnProperty(PROPERTIES[p])) {
            currentValueNode = document.getElementById(PROPERTIES[p] +
                                                       '-current-value');
            currentValueNode.innerHTML = ('current: ' +
                newSettings[PROPERTIES[p]].toFixed(4));
          }
        }
      }
    }
    requestAnimationFrame(updateSetting);
  }
  updateSetting();

  // Call the API to update spherical property values.
  updateButton.onclick = function() {
    var sphericalProperties = {};
    for (var p = 0; p < PROPERTIES.length; p++) {
      var propertyInput = document.getElementById(PROPERTIES[p] + '-property');
      sphericalProperties[PROPERTIES[p]] = parseFloat(propertyInput.value);
    }
    ytplayer.setSphericalProperties(sphericalProperties);
  }
</script>
Android WebView Media Integrity API integráció
A YouTube kibővítette az Android WebView Media Integrity API-t , hogy a beágyazott médialejátszók, beleértve az Android-alkalmazásokba beágyazott YouTube-lejátszókat is, ellenőrizhessék a beágyazó alkalmazás hitelességét. Ezzel a változtatással a beágyazó alkalmazások automatikusan elküldenek egy hitelesített alkalmazásazonosítót a YouTube-nak. Az API használatával gyűjtött adatok az alkalmazás metaadatai (a csomag neve, a verziószám és az aláíró tanúsítvány) és a Google Play szolgáltatások által generált eszközigazolási token.

Az adatokat az alkalmazás és az eszköz integritásának ellenőrzésére használjuk. Titkosítva vannak, nem kerülnek megosztásra harmadik felekkel, és egy meghatározott megőrzési időszak után törlődnek. Az alkalmazásfejlesztők a WebView Media Integrity API-ban konfigurálhatják alkalmazásuk identitását . A konfiguráció támogatja a leiratkozási lehetőséget.

Revíziós előzmények
July 9, 2025
The onError event API has been updated with a new error code 153. Error 153 indicates the request does not include the HTTP Referer header or equivalent API Client identification. See API Client Identity and Credentials for more information.

June 24, 2024
The documentation has been updated to note that YouTube has extended the Android WebView Media Integrity API to enable embedded media players, including YouTube player embeds in Android applications, to verify the embedding app's authenticity. With this change, embedding apps automatically send an attested app ID to YouTube.

November 20, 2023
The new onAutoplayBlocked event API is now available. This event notifies your application if the browser blocks autoplay or scripted playback. Verification of autoplay success or failure is an established paradigm for HTMLMediaElements, and the onAutoplayBlocked event now provides similar functionality for the IFrame Player API.

April 27, 2021
The Getting Started and Loading a Video Player sections have been updated to include examples of using a playerVars object to customize the player.

October 13, 2020
Note: This is a deprecation announcement for the embedded player functionality that lets you configure the player to load search results. This announcement affects the IFrame Player API's queueing functions for lists, cuePlaylist and loadPlaylist.

This change will become effective on or after 15 November 2020. After that time, calls to the cuePlaylist or loadPlaylist functions that set the listType property to search will generate a 4xx response code, such as 404 (Not Found) or 410 (Gone). This change also affects the list property for those functions as that property no longer supports the ability to specify a search query.

As an alternative, you can use the YouTube Data API's search.list method to retrieve search results and then load selected videos in the player.

October 24, 2019
The documentation has been updated to reflect the fact that the API no longer supports functions for setting or retrieving playback quality. As explained in this YouTube Help Center article, to give you the best viewing experience, YouTube adjusts the quality of your video stream based on your viewing conditions.

The changes explained below have been in effect for more than one year. This update merely aligns the documentation with current functionality:

The getPlaybackQuality, setPlaybackQuality, and getAvailableQualityLevels functions are no longer supported. In particular, calls to setPlaybackQuality will be no-op functions, meaning they will not actually have any impact on the viewer's playback experience.
The queueing functions for videos and playlists -- cueVideoById, loadVideoById, etc. -- no longer support the suggestedQuality argument. Similarly, if you call those functions using object syntax, the suggestedQuality field is no longer supported. If suggestedQuality is specified, it will be ignored when the request is handled. It will not generate any warnings or errors.
The onPlaybackQualityChange event is still supported and might signal a change in the viewer's playback environment. See the Help Center article referenced above for more information about factors that affect playback conditions or that might cause the event to fire.
May 16, 2018
The API now supports features that allow users (or embedders) to control the viewing perspective for 360° videos:

The getSphericalProperties function retrieves the current orientation for the video playback. The orientation includes the following data:
yaw - represents the horizontal angle of the view in degrees, which reflects the extent to which the user turns the view to face further left or right
pitch - represents the vertical angle of the view in degrees, which reflects the extent to which the user adjusts the view to look up or down
roll - represents the rotational angle (clockwise or counterclockwise) of the view in degrees.
fov - represents the field-of-view of the view in degrees, which reflects the extent to which the user zooms in or out on the video.
The setSphericalProperties function modifies the view to match the submitted property values. In addition to the orientation values described above, this function supports a Boolean field that indicates whether the IFrame embed should respond to DeviceOrientationEvents on supported mobile devices.
This example demonstrates and lets you test these new features.

June 19, 2017
This update contains the following changes:

Documentation for the YouTube Flash Player API and YouTube JavaScript Player API has been removed and redirected to this document. The deprecation announcement for the Flash and JavaScript players was made on January 27, 2015. If you haven't done so already, please migrate your applications to use IFrame embeds and the IFrame Player API.

August 11, 2016
This update contains the following changes:

The newly published YouTube API Services Terms of Service ("the Updated Terms"), discussed in detail on the YouTube Engineering and Developers Blog, provides a rich set of updates to the current Terms of Service. In addition to the Updated Terms, which will go into effect as of February 10, 2017, this update includes several supporting documents to help explain the policies that developers must follow.

The full set of new documents is described in the revision history for the Updated Terms. In addition, future changes to the Updated Terms or to those supporting documents will also be explained in that revision history. You can subscribe to an RSS feed listing changes in that revision history from a link in that document.

June 29, 2016
This update contains the following changes:

The documentation has been corrected to note that the onApiChange method provides access to the captions module and not the cc module.

June 24, 2016
The Examples section has been updated to include an example that demonstrates how to use the API with an existing <iframe> element.

January 6, 2016
The clearVideo function has been deprecated and removed from the documentation. The function no longer has any effect in the YouTube player.

December 18, 2015
European Union (EU) laws require that certain disclosures must be given to and consents obtained from end users in the EU. Therefore, for end users in the European Union, you must comply with the EU User Consent Policy. We have added a notice of this requirement in our YouTube API Terms of Service.

April 28, 2014
This update contains the following changes:

The new removeEventListener function lets you remove a listener for a specified event.

March 25, 2014
This update contains the following changes:

The Requirements section has been updated to note that embedded players must have a viewport that is at least 200px by 200px. If a player displays controls, it must be large enough to fully display the controls without shrinking the viewport below the minimum size. We recommend 16:9 players be at least 480 pixels wide and 270 pixels tall.

July 23, 2013
This update contains the following changes:

The Overview now includes a video of a 2011 Google I/O presentation that discusses the iframe player.

October 31, 2012
This update contains the following changes:

The Queueing functions section has been updated to explain that you can use either argument syntax or object syntax to call all of those functions. Note that the API may support additional functionality in object syntax that the argument syntax does not support.

In addition, the descriptions and examples for each of the video queueing functions have been updated to reflect the newly added support for object syntax. (The API's playlist queueing functions already supported object syntax.)

When called using object syntax, each of the video queueing functions supports an endSeconds property, which accepts a float/integer and specifies the time when the video should stop playing when playVideo() is called.

The getVideoStartBytes method has been deprecated. The method now always returns a value of 0.

August 22, 2012
This update contains the following changes:

The example in the Loading a video player section that demonstrates how to manually create the <iframe> tag has been updated to include a closing </iframe> tag since the onYouTubeIframeAPIReady function is only called if the closing </iframe> element is present.

August 6, 2012
This update contains the following changes:

The Operations section has been expanded to list all of the supported API functions rather than linking to the JavaScript Player API Reference for that list.

The API supports several new functions and one new event that can be used to control the video playback speed:

Functions

getAvailablePlaybackRates – Retrieve the supported playback rates for the cued or playing video. Note that variable playback rates are currently only supported in the HTML5 player.
getPlaybackRate – Retrieve the playback rate for the cued or playing video.
setPlaybackRate – Set the playback rate for the cued or playing video.
Events

onPlaybackRateChange – This event fires when the video's playback rate changes.
July 19, 2012
This update contains the following changes:

The new getVideoLoadedFraction method replaces the now-deprecated getVideoBytesLoaded and getVideoBytesTotal methods. The new method returns the percentage of the video that the player shows as buffered.

The onError event may now return an error code of 5, which indicates that the requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.

The Requirements section has been updated to indicate that any web page using the IFrame API must also implement the onYouTubeIframeAPIReady function. Previously, the section indicated that the required function was named onYouTubePlayerAPIReady. Code samples throughout the document have also been updated to use the new name.

Note: To ensure that this change does not break existing implementations, both names will work. If, for some reason, your page has an onYouTubeIframeAPIReady function and an onYouTubePlayerAPIReady function, both functions will be called, and the onYouTubeIframeAPIReady function will be called first.

The code sample in the Getting started section has been updated to reflect that the URL for the IFrame Player API code has changed to http://www.youtube.com/iframe_api. To ensure that this change does not affect existing implementations, the old URL (http://www.youtube.com/player_api) will continue to work.

July 16, 2012
This update contains the following changes:

The Operations section now explains that the API supports the setSize() and destroy() methods. The setSize() method sets the size in pixels of the <iframe> that contains the player and the destroy() method removes the <iframe>.

June 6, 2012
This update contains the following changes:

We have removed the experimental status from the IFrame Player API.

The Loading a video player section has been updated to point out that when inserting the <iframe> element that will contain the YouTube player, the IFrame API replaces the element specified in the constructor for the YouTube player. This documentation change does not reflect a change in the API and is intended solely to clarify existing behavior.

In addition, that section now notes that the insertion of the <iframe> element could affect the layout of your page if the element being replaced has a different display style than the inserted <iframe> element. By default, an <iframe> displays as an inline-block element.

March 30, 2012
This update contains the following changes:

The Operations section has been updated to explain that the IFrame API supports a new method, getIframe(), which returns the DOM node for the IFrame embed.

March 26, 2012
This update contains the following changes:

The Requirements section has been updated to note the minimum player size.