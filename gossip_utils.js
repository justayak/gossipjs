/**
 * Created by Julian on 11/4/2014.
 */
(function(Gossip){

    Gossip.isDefined = function (e) {
        return e !== null && typeof e !== "undefined";
    };

    // ** HELPER **

    function isString(myVar) {
        return (typeof myVar === 'string' || myVar instanceof String);
    }

    var isDebugging = false;
    function isReady() {
        return hasPeerjs() && hasUnderscore();
    };

    function log(msg) {
        if (isDebugging) {
            console.log('[gossipjs][' + new Date().toISOString().substr(12) + ']' + msg);
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
        if (!('bootstrapPort' in options)) throw "Missing parameter {bootstrapPort}";
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

        console.log(options.host);
        TxtLoader.get("http://" + options.host + ":" + options.bootstrapPort, {
            success: function(txt){
                log("bootstrapping: " + txt);
            },
            failure: function (statusCode) {
                log("Bootstrapping failed! " + statusCode);
            }
        });

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

            peer.on("connection", function(conn){

                conn.on("data", function (d) {
                    if (isString(d)){
                        d = JSON.parse(d);
                    }
                    switch (d.type){
                        case Gossip.MESSAGE_TYPE.ARE_YOU_ALIVE:
                            fireAndForget(conn.peer, {type:Gossip.MESSAGE_TYPE.I_AM_ALIVE});
                            break;
                        case Gossip.MESSAGE_TYPE.I_AM_ALIVE:
                            executePending(conn.peer, true);
                            break;
                        default:
                            for (var i = 0; i < onMessages.length; i++){
                                onMessages[i].call(Gossip, conn.peer, d);
                            }
                            break;
                    }
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

    var onMessages = [];

    /**
     *
     * @param callback {function} Key {String}, message {object}
     */
    Gossip.onMessage = function(callback){
        onMessages.push(callback);
    };

    /**
     * List of Peers that we send data to
     * @type {Object}
     */
    var outgoings = {};

    Gossip.connect = function(id, success, failure){
        if (Array.isArray(id)){
            var pending = id.length;
            id.forEach(function(peer){
                Gossip.connect(peer, function succ(){
                    pending -= 1;
                    if (pending === 0) {
                        success.call(Gossip);
                    }
                }, function fail(){
                    pending -= 1;
                    failure.call(Gossip, peer); // notify user about failed peers
                });
            });
        } else {
            if (id in outgoings) {
                success.call(Gossip, outgoings[id]);
            } else {
                addToPending(id,
                    function succ() {
                        success.call(Gossip, outgoings[id]);
                    }, function fail() {
                        delete outgoings[id];
                        failure.call(Gossip);
                    });
                var conn = Gossip.Peer.connect(id);
                outgoings[id] = conn;
                conn.on("open", function () {
                    executePending(id, true);
                });
            }
        }
    };

    Gossip.getOutgoings = function(){
        return outgoings;
    };

    Gossip.broadcast = function (buffer, message) {
        for(var key in buffer){
            buffer[key].send(message);
        }
    };

    Gossip.send = function (id, message) {
        if (id in outgoings){
            outgoings[id].send(message);
        } else {
            log("Cannot send message to {" + id + "}. Not available.");
        }
    };

    /**
     * Sends a message to the id. If the ID is not connected, a connection
     * try is attempt
     * @param id {String}
     * @param message {Object}
     */
    function fireAndForget(id, message) {
        if (id in outgoings) {
            outgoings[id].send(message);
        } else {
            var conn = Gossip.Peer.connect(id);
            conn.on("open", function(){
                executePending(id, true);
            });
            addToPending(id,
                function success() {
                    conn.send(message);
                    conn.close();
                },
                function failure() {
                    log("fireAndForget Failed");
                    conn.close();
                });
        }
    };

    Gossip.disconnect = function(id){
        //TODO research what else must be done!
        if (id in outgoings) {
            outgoings[id].close();
            delete outgoings[id];
        }
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
            delete pendingTestAlive[id];
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
        addToPending(peerName, alive, notAlive);
        if (peerName in outgoings){
            outgoings[peerName].send({type:Gossip.MESSAGE_TYPE.ARE_YOU_ALIVE});
        } else {
            fireAndForget(peerName, {type:Gossip.MESSAGE_TYPE.ARE_YOU_ALIVE});
            setTimeout(function(){
                // TIMEOUT
                executePending(peerName, false);
            },1000*3);
        }
    };

    Gossip.MESSAGE_TYPE = {
        ARE_YOU_ALIVE : 0,
        I_AM_ALIVE : 1
    }


    Gossip.utils = {
        randomInt : function(min,max){
            return (Math.floor(Math.random() * (max - min + 1)) + min)|0;
        }
    };


})(typeof window.Gossip === 'undefined'?
    window.Gossip = {} : window.Gossip);

/*
==========================================================================================
E X T E R N A L  L I B R A R I E S
 ==========================================================================================
 */
window.TxtLoader = function() {
    function h(a) {
        var f = {};
        return a && "[object Function]" === f.toString.call(a);
    }
    function k(a) {
        if ("undefined" === typeof a) {
            throw "TxtLoader: get - options are mandatory";
        }
        if ("undefined" === typeof a.success) {
            throw "TxtLoader: No success-callback set";
        }
        if (!h(a.success)) {
            throw "TxtLoader: success must be a function";
        }
        var f = a.success, c = null;
        "failure" in a && h(a.failure) && (c = a.failure);
        var d = this;
        "undefined" !== typeof a.ctx && (d = a.ctx);
        var e = "application/json";
        "undefined" !== typeof a.mime && (e = a.mime);
        return{ctx:d, success:f, fail:c, mime:e};
    }
    if ("undefined" === typeof XMLHttpRequest) {
        throw "TxtLoader: TxtLoader is not supported by this browser";
    }
    return{get:function(a, f) {
        var c = k(f), d = c.ctx, e = c.fail, g = c.success, b = new XMLHttpRequest;
        b.open("GET", a);
        b.onreadystatechange = function() {
            200 !== b.status ? null !== e && 2 === b.readyState && e.call(d, b.status) : 4 === b.readyState && g.call(d, b.responseText);
        };
        b.send();
    }, post:function(a, f, c) {
        c = k(c);
        var d = c.ctx, e = c.fail, g = c.success, b = new XMLHttpRequest;
        b.setRequestHeader("Content-type", c.mime);
        b.open("POST", a, !0);
        b.onreadystatechange = function() {
            200 !== b.status ? null !== e && 2 === b.readyState && e.call(d, b.status) : 4 === b.readyState && g.call(d, b.responseText);
        };
        b.send(f);
    }};
}();