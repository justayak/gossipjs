/**
 * Created by Julian on 11/4/2014.
 */
(function(Gossip){

    // ** HELPER **

    var isDebugging = false;
    var isReady = false;

    function log(msg) {
        if (isDebugging) {
            console.log('[scampjs][' + new Date().toISOString().substr(12) + ']' + msg);
        }
    };

    Gossip.log = log;

    Gossip.node = {
        name : null,
        peer : null
    };

    /**
     * set options
     * @param o
     */
    Gossip.options = function(o){
        if (typeof o !== 'undefined'){
            if ("debug" in o) {
                isDebugging = o.debug;
            }
        }
    };

    /**
     * inject script into dom
     * @param url
     */
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
     *
     * @param p {Number} between 1 and 0
     * @returns {boolean}
     */
    Gossip.probability = function(p) {
        if (p >= 1) {
            return true;
        } else if (p <= 0) {
            return false;
        } else {
            return Math.random() < p;
        }
    };

    // ** HELPER END **

    /**
     *
     * @param options
     * @param callback
     */
    Gossip.init = function(options, callback){
        if (typeof options === "undefined") throw "Missing options";
        if (!('name' in options)) throw "Missing parameter {name}";
        if (!('host' in options)) throw "Missing parameter {host}";
        if (!('port' in options)) throw "Missing parameter {port}";
        if (!('peers' in options)) options['peers'] = [];


        if (isReady){
            _init();
        } else {
            function test() {
                if (hasUnderscore() && hasPeerjs()) {
                    isReady = true;
                    _init();
                } else {
                    setTimeout(test, 100);
                }
            };
            test();
        }

        function _init(){
            var name = options.name;
            peerName = name;
            delete options.name;
            options.path = "/b";
            log("Establish as node {" + name + "}");
            log("Connect to broker {" + options.host + ":" + options.port + "}");
            var peer = new Peer(name, options);
            Gossip.Peer = peer;
            peer.on("error", function(err){
                log(err);
            });

            callback.call(window);
        };
    };

})(typeof window.Gossip === 'undefined'?
    window.Gossip = {} : window.Gossip);