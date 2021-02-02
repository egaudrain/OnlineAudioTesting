/*------------------------------------------------------------------------------
 * Various tools for experiments
 *------------------------------------------------------------------------------
 * Requires jQuery, Semantic UI modal and icon, and the dbsplab.fun DataHandler
 * (only to check if the sound level adjustment has been done already).
 *----------------------------------------------------------------------------*/

function is_browser_compatible(){
    // Add here everything that needs to be tested for browser compatibility
    if( (new Audio()).canPlayType('audio/mp3') != 'probably' )
        return false;

    /*
    if( (new Audio()).canPlayType('audio/mpeg') != 'probably' )
        return false;
    */

    /*
    if( (new Audio()).canPlayType('audio/wav') != 'probably' )
        return false;
    if( (new Audio()).canPlayType('audio/flac') != 'probably' )
        return false;
    */
    return true;

    // for of
}

function show_error(msg, to="body", after=false)
{
    if(after)
        $("<div class='ui error message'>"+msg+"</div>").appendTo(to);
    else
        $("<div class='ui error message'>"+msg+"</div>").prependTo(to);
}

function sound_level_adjustment(sound_file, after_cb)
{
    // Checks in the session if sound level adjustment has been performed for this
    // experiment, and if not, shows a sound level adjustment dialog.

    if(typeof after_cb==='undefined')
        after_cb = function(){};

    window.DataHandler.get_sound_level_adj(
        // success
        function(is_adjusted){
            if(is_adjusted)
                after_cb();
            else
                _make_sound_level_adjustment(sound_file, after_cb);
        },
        // error
        show_error
    );
}

// Sound level adjustment dialog internationalisation
var SLADi18n = {};
SLADi18n['title'] = {};
SLADi18n['title']['fr'] = "Réglage du volume";
SLADi18n['title']['en'] = "Sound level adjustment";
SLADi18n['title']['nl'] = "Geluidsvolume";
SLADi18n['intro'] = {};
SLADi18n['intro']['fr'] = "Il est conseillé de completer cette expérience dans un <b>environnement calme</b>, et de préférence en utilisant un <b>casque de bonne qualité</b>. Ajustez le volume de votre ordinateur de façon à ce que le son soit présenté à un niveau confortable, et gardez le volume identique pendant toute la durée de l'expérience.";
SLADi18n['intro']['en'] = "You are kindly asked to perform this experiment in a <b>calm environment</b>, and preferably using <b>good quality headphones</b>. Adjust the sound level on your computer so that the sound plays at a comfortable level, and keep the volume the same during the whole experiment.";
SLADi18n['intro']['nl'] = "U wordt vriendelijk verzocht om dit experiment in een <b>stille omgeving</b> uit te voeren en bij voorkeur een <b>koptelefoon van goede kwaliteit</b> te gebruiken. Pas het geluidsvolume op uw computer aan zodat het geluid op een comfortabel niveau wordt afgespeeld, en verander het geluidsniveau verder niet meer gedurende het experiment.";
SLADi18n['loading'] = {};
SLADi18n['loading']['fr'] = "Chargement...";
SLADi18n['loading']['en'] = "Loading...";
SLADi18n['loading']['nl'] = "Bezig met laden...";
SLADi18n['when-ready'] = {};
SLADi18n['when-ready']['fr'] = "Quand vous êtes prêt.e, cliquez sur \"Continuer\".";
SLADi18n['when-ready']['en'] = "When you are ready, click on \"Continue\".";
SLADi18n['when-ready']['nl'] = "Als u klaar bent, klik je op \"Doorgaan\".";
SLADi18n['continue'] = {};
SLADi18n['continue']['fr'] = "Continuer";
SLADi18n['continue']['en'] = "Continue";
SLADi18n['continue']['nl'] = "Doorgaan";

function _make_sound_level_adjustment(sound_file, after_cb)
{
    // The global LANG has to be defined

    var eLANG = LANG;
    // Fallback to English if lanugage is not supported
    if(typeof SLADi18n['intro'][eLANG] === 'undefined'){
        eLANG = 'en';
    }

    var snd;
    var dialog = $(
        "<div class='ui modal' id='sound_adjustment' style='max-width: 20em;'>"+
            "<div class='header'>"+
                SLADi18n['title'][eLANG]+
            "</div>"+
            "<div class='content'>"+
                "<p>"+SLADi18n['intro'][eLANG]+"</p>"+
                "<p style='text-align: center;'>"+
                    "<button class='ui huge icon button' id='play-pause'>"+
                        "<i class='asterisk loading icon'></i>"+
                    "</button>"+
                "</p>"+
            "</div>"+
            "<div class='actions'>"+
                "<button class='ui right labeled icon disabled ok button'>"+
                    "<i class='right arrow icon'></i>"+
                    SLADi18n['continue'][eLANG]+
                "</button>"+
            "</div>"+
        "</div>").appendTo("body");
    dialog.modal({
        closable: false,
        onApprove: function(elmt){
            snd.pause();
			snd = null;
        },
        onHidden: function(){
            window.DataHandler.set_sound_level_adj(after_cb, show_error);
        }
    }).modal('show');
    $("#sound_adjustment").css("max-width", "25em");
    $("#sound_adjustment .content").css("box-sizing", "border-box");

    function load_sound(snd_file)
    {
        snd = new Audio(snd_file);
        snd.loop = true;
        snd.autoplay = false;
        snd.volume = 1;

        snd.canplaythrough_1st = true;

        snd.addEventListener("canplaythrough", function(){
            if(this.canplaythrough_1st){
                $('#play-pause i.icon').removeClass('asterisk loading').addClass("play");
                $('#sound_adjustment').find(".ok.button").removeClass('disabled');
                $('#play-pause').click(function() {
                    if($(this).children("i.icon").hasClass("play"))
                        snd.play();
                    else
                        snd.pause();
                    $(this).children("i.icon").toggleClass("play pause");
                });
                this.canplaythrough_1st = false;
            }
        });

        snd.load();
    }

    if(typeof sound_file === 'string' || sound_file instanceof String)
    {
        load_sound(sound_file);
    }
    else if(typeof sound_file === 'object')
    {
        // This must be VT query
        vt(sound_file, load_sound, show_error);
    }
    else
    {
        show_error("The sound that was passed for adjustment is not valid...: "+sound_file);
    }

}

// Some polyfills for IE

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
if(!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
        value: function(search, rawPos) {
            var pos = rawPos > 0 ? rawPos|0 : 0;
            return this.substring(pos, pos + search.length) === search;
        }
    });
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign
if(!Math.sign) {
    Math.sign = function(x) {
        return ((x > 0) - (x < 0)) || +x;
    };
}

if(!Array.prototype.fill) {
    Object.defineProperty(Array.prototype, 'fill', {
        value: function(value) {

            // Steps 1-2.
            if(this == null) {
                throw new TypeError('this is null or not defined');
            }

            var O = Object(this);

            // Steps 3-5.
            var len = O.length >>> 0;

            // Steps 6-7.
            var start = arguments[1];
            var relativeStart = start >> 0;

            // Step 8.
            var k = relativeStart < 0 ?
                Math.max(len + relativeStart, 0) :
                Math.min(relativeStart, len);

            // Steps 9-10.
            var end = arguments[2];
            var relativeEnd = end === undefined ?
                len : end >> 0;

            // Step 11.
            var finalValue = relativeEnd < 0 ?
                Math.max(len + relativeEnd, 0) :
                Math.min(relativeEnd, len);

            // Step 12.
            while(k < finalValue) {
                O[k] = value;
                k++;
            }

            // Step 13.
            return O;
        }
    });
}

// Some utility functions

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

if(!Array.prototype.min){
    Array.prototype.min = function() {
        if(this.length==0)
            return null;
        return this.reduce(function(m,v){ return (v<m)?v:m; }, +Infinity);
    };
} else {
    console.warn("Array.prototype.min already exists! Its definition may not correspond to what was intended.");
}

if(!Array.prototype.max){
    Array.prototype.max = function() {
        if(this.length==0)
            return null;
        return this.reduce(function(m,v){ return (v>m)?v:m; }, -Infinity);
    };
} else {
    console.warn("Array.prototype.max already exists! Its definition may not correspond to what was intended.");
}

if(!Array.prototype.diff){
    Array.prototype.diff = function() {
            var a = [];
            for(var i = 0; i < this.length - 1; i++) {
                a.push(this[i + 1] - this[i])
            }
            return a;
    };
} else {
    console.warn("Array.prototype.diff already exists! Its definition may not correspond to what was intended.");
}

if(!Array.prototype.sum){
    Array.prototype.sum = function() {
        return this.reduce(function(S, v) {
            return S + v;
        }, 0);
    };
} else {
    console.warn("Array.prototype.sum already exists! Its definition may not correspond to what was intended.");
}

if(!Array.prototype.mean){
    Array.prototype.mean = function() {
        return this.sum() / this.length;
    };
} else {
    console.warn("Array.prototype.mean already exists! Its definition may not correspond to what was intended.");
}

if(!Array.prototype.findIndices){
    Array.prototype.findIndices = function(cnd) {
        return this.reduce(function(a, v, i) {
            if(cnd(v)) {
                a.push(i);
            };
            return a;
        }, []);
    };
} else {
    console.warn("Array.prototype.findIndices already exists! Its definition may not correspond to what was intended.");
}

if(!Array.prototype.select){
    Array.prototype.select = function(idx) {
        var a = []
        for(var i of idx){
            a.push(this[i]);
        }
        return a;
    };
} else {
    console.warn("Array.prototype.select already exists! Its definition may not correspond to what was intended.");
}

if(!Array.prototype.non_zero){
    Array.prototype.non_zero = function() {
        return this.filter(function(x) { return x != 0; });
    };
} else {
    console.warn("Array.prototype.non_zero already exists! Its definition may not correspond to what was intended.");
}

if(!Array.prototype.frequencies){
    // Adapted from jsPsych DataColumn
    Array.prototype.frequencies = function() {
        return this.reduce(function(unique, v){
            if(typeof unique[v] == 'undefined') {
                unique[v] = 1;
            } else {
                unique[v]++;
            }
            return unique;
        }, {});
    };
} else {
    console.warn("Array.prototype.frequencies already exists! Its definition may not correspond to what was intended.");
}

if(!Array.range) {
    Array.range = function(arg1, arg2=null, step = 1) {
        if(arg2===null) {
            start = 0;
            stop = arg1;
        } else {
            start = arg1;
            stop = arg2;
        }
        return Array(Math.ceil((stop - start) / step)).fill(start).map((x, y) => x + y * step);
    }
} else {
    console.warn("Array.range already exists! Its definition may not correspond to what was intended.");
}

if(!Array.prototype.keys){
    Array.prototype.keys = function() {
        // Not an iterator, but good enough
        return Array.range(this.length);
    };
}

function stringToIntArray(s){
    var a = new Array();
    for(var i=0; i<s.length; i++){
        a.push(s.charCodeAt(i));
    }
    return a;
}

if(!console) {
    console.log = function(){};
    console.warn = function(){};
}
