/**
 * Created by Julian on 11/4/2014.
 */
(function(Gossip){

    // ** HELPER **

    var isDebugging = false;
    function isReady() {
        return hasPeerjs() && hasUnderscore();
    };

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

    function hasUnderscore() {
        return typeof _ !== "undefined";
    };
    var UNDERSCORE_CDN = "//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore-min.js";

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

        if (!hasUnderscore()){
            log("injecting underscore.js...");
            inject(UNDERSCORE_CDN);
        }

        if (!hasPeerjs()){
            //throw 'scamp.js needs peerjs to be loaded. See: http://peerjs.com';
            log("injecting peerjs...");
            inject(PEERJS_CDN);
        }

        if (isReady()){
            _init();
        } else {
            function test() {
                if (isReady()) {
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


            peer.on("open", function(id){
                console.log(id);
            });


            peer.on("connection", function(e){

                e.on("data", function (d) {
                    console.log("received: ", d);
                });

            });


            peer.on("error", function(err){
                switch (err.type){
                    case "peer-unavailable":
                        var peer = err.message.substr(26); //TODO that's bad...
                        executePending(peer, false);
                        break;
                }
                log(err);
            });

            callback.call(window);
        };
    };

    /**
     * List of Peers that we send data to
     * @type {Object}
     */
    var outgoings = {};

    Gossip.connect = function(id, success, failure){
        if (id in outgoings){
            success.call(Gossip, outgoings[id]);
        } else {
            addToPending(id,
                function succ() {
                    success.call(Gossip, outgoings[id]);
            },  function fail() {
                    delete outgoings[id];
                    failure.call(Gossip);
            });
            var conn = Gossip.peer.connect(id);
            outgoings[id] = conn;
            conn.on("open", function(){
                executePending(id, true);
            });
        }
    };

    Gossip.disconnect = function(id){
        //TODO
    };


    /**
     *
     * @type {Object} {
     *      NodeID : { success: [callbacks], failure: [callbacks] },
     *      ....
     * }
     */
    var pendingTestAlive = {};

    /**
     *
     * @param id {String}
     * @param success {function}
     * @param failure {function}
     */
    function addToPending(id, success, failure) {
        if (id in pendingTestAlive) {
            pendingTestAlive[id].success.push(success);
            pendingTestAlive[id].failure.push(failure);
        } else {
            pendingTestAlive[id] = {
                success : [success],
                failure : [failure]
            };
        }
    };

    /**
     *
     * @param id {String}
     * @param success {Boolean}
     */
    function executePending(id, success) {
        if (id in pendingTestAlive) {
            var callbacks = success ? pendingTestAlive[id].success : pendingTestAlive[id].failure;
            callbacks.forEach(function(c){
                c.call(Gossip);
            });
        }
    };

    /**
     *
     * @param peerName {String}
     * @param alive {function}
     * @param notAlive {function}
     */
    Gossip.testAlive = function (peerName, alive, notAlive) {
        if (!(peerName in pendingTestAlive)){
            //Gossip.Peer.
        }
    };

})(typeof window.Gossip === 'undefined'?
    window.Gossip = {} : window.Gossip);