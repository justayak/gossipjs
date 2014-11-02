/**
 * Web-Implementation of the SCAMP (Scalable Membership Protocol)
 * http://pages.saclay.inria.fr/laurent.massoulie/ieee_tocs.pdf
 * Created by Julian on 11/2/2014.
 */
window.SCAMP = (function(){

    var isDebugging = true;
    var isReady = true;

    function log(msg) {
        if (isDebugging) {
            console.log('[scampjs][' + new Date().toISOString().substr(12) + ']' + msg);
        }
    };

    function inject(url){
        isReady = false; // when we need to inject a library, we need to wait until it's loaded..
        setTimeout(function(){
            var bodyEl = document.body;
            var scriptEl = document.createElement('script');
            scriptEl.type = 'text/javascript';
            scriptEl.src = url;
            bodyEl.appendChild(scriptEl);
        },100);
    };

    function hasPeerjs(){
        return typeof Peer !== 'undefined';
    }

    // check if peerjs is actually loaded (naive aproach!)
    // http://peerjs.com/
    var PEERJS_CDN = "http://cdn.peerjs.com/0.3/peer.js";
    if (!hasPeerjs()){
        //throw 'scamp.js needs peerjs to be loaded. See: http://peerjs.com';
        log("injecting peerjs...");
        inject(PEERJS_CDN);
    }

    function hasUnderscore() {
        return typeof _ !== "undefined";
    };
    var UNDERSCORE_CDN = "//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore-min.js";
    if (!hasUnderscore()){
        log("injecting underscore.js...");
        inject(UNDERSCORE_CDN);
    }

    /**
     * nodes that we will send messages to
     * @type {{}}
     */
    var partialView = {};

    /**
     * Nodes that we receive gossip messages from
     * @type {{}}
     */
    var inView = {};

    /**
     *
     * @param s
     */
    function onSubscription(s) {
        log("subscribe " + s);
        _.each(partialView, function(e){
            console.log(e);
        });
    };


    return {

        init : function(options, callback){
            if (typeof options === "undefined") throw "Missing options";
            if (!('name' in options)) throw "Missing parameter {name}";
            if (!('host' in options)) throw "Missing parameter {host}";
            if (!('port' in options)) throw "Missing parameter {port}";
            if (!('peers' in options)) options['peers'] = [];
            if (isReady){
                _init();
            } else {
                function test(){
                    if(hasUnderscore() && hasPeerjs()){
                        isReady = true;
                        _init();
                    } else {
                        setTimeout(test,100);
                    }
                };
                test();

                function _init(){



                    callback.call(window);
                }
            }
        },

        test: onSubscription

    }
})();