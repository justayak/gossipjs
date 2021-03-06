/**
 * Created by Julian on 11/11/2014.
 */
define([
    "gossip/utils",
    "gossip/config",
    "gossip/messageType"
], function (Utils, Config, MESSAGE_TYPE) {

    var instance = null;
    var callback = null;

    /**
     * Represents the local peer system
     * @constructor
     */
    function LocalPeer() {
        var log = Utils.log;
        var name = this.name = Config.name();
        var port = Config.port();
        var bootstrapPort = Config.bootstrapPort();
        var host = Config.host();
        var self = this;

        log("Establish as node {" + name + "}");
        log("Connect to broker {" + host + ":" + port + "}");

        var peer = this.peer = new Peer(name, {
            host : host,
            port : port,
            path : "/b"
        });

        this.onMessageCallbacks = [];
        this.onLostPeerCallbacks = [];
        var bootstraped = false;
        var bootstrap = "[]";
        TxtLoader.get("http://" + host + ":" + bootstrapPort, {
            success: function(txt){
                bootstraped = true;
                bootstrap = txt;
            },
            failure: function (statusCode) {
                log("Bootstrapping failed! " + statusCode);
                bootstraped = true;
            }
        });

        peer.on("error", function (e) {
            switch (e.type) {
                case "peer-unavailable":
                    var i= 0,L=self.onLostPeerCallbacks.length;
                    var cb = self.onLostPeerCallbacks;
                    var peer = e.message.substr(26);
                    delete neighbors[peer];
                    recentlyLost[peer] = Date.now();
                    for(;i<L;i++) {
                        cb[i].call(self, peer);
                    }
                    break
                default :
                    log(e);
                    break;
            }
        });

        peer.on("open", function () {
            function _init() {
                var i= 0, U, bsNodes=[], L;
                if (bootstraped) {
                    U = bootstrap.replace("[","").replace("]","").split(",");
                    L = U.length;
                    for(;i<L;i++) {
                        if (U[i] !== self.name && U[i].length > 0) {
                            bsNodes.push(U[i]);
                        }
                    }
                    log("bootstrapping: " + JSON.stringify(bsNodes));
                    self.bootstrap = bsNodes;
                    callback.call(self, self, bsNodes);
                    for(i=0,L=onReadyCallbacks.length;i<L;i++){
                        onReadyCallbacks.call(self, self);
                    }
                } else {
                    setTimeout(_init, 100);
                }
            }
            _init();
            setInterval(cleanNeighbors, 60*1000); // every minute
            setInterval(checkLostPeers,  2*1000); // every 2 seconds
        });

        peer.on("connection", function (conn) {
            conn.on('data', function (d) {
                if (Utils.isString(d)) {
                    d = JSON.parse(d);
                }
                self._handleMessage(conn.peer, d.type, d.payload);
            });
        });

    };

    /**
     * Handles incoming messages
     * @param id
     * @param type
     * @param payload
     * @private
     */
    LocalPeer.prototype._handleMessage = function(id, type, payload) {
        var i = 0, L = this.onMessageCallbacks.length, M = this.onMessageCallbacks;
        var current;
        if (id in neighbors) {
            current = neighbors[id];
            current.missedCalls = 0; // reset
            if (current.timeoutThread !== null) {
                clearTimeout(current.timeoutThread);
                current.timeoutThread = null;
            }
        }
        switch (type){
            case MESSAGE_TYPE.ARE_YOU_ALIVE:
                this.send(id, MESSAGE_TYPE.I_AM_ALIVE, "-", {ignoreTS:true});
                break;
            case MESSAGE_TYPE.I_AM_ALIVE:
                // {id} is alive
                break;
            case MESSAGE_TYPE.MULTICAST:
                if (_.isString(payload)) {
                    payload = JSON.parse(payload);
                }
                for(i=0;i<onMulticastCallbacks.length;i++) {
                    onMulticastCallbacks[i].call(instance, id, payload);
                }
                break;
            default :
                for(;i<L;i++) {
                    M[i].call(this, id, type, payload);
                }
                break;
        }
    };

    var PEER_ALIVE_ATTEMPTS = 3;

    /**
     * check if the connection to some peers is lost
     */
    function checkLostPeers(){

        function timeout(id, obj) {
            //console.log("{" + id + "} - " + JSON.stringify(obj, repl) );
            var self = instance, i= 0, C = instance.onLostPeerCallbacks,
                L = instance.onLostPeerCallbacks.length;
            obj.timeoutThread = setTimeout(function () {
                if (obj.missedCalls >= PEER_ALIVE_ATTEMPTS) {
                    delete neighbors[id];
                    recentlyLost[id] = Date.now();
                    for(;i<L;i++) {
                        C[i].call(self, id);
                    }
                } else {
                    obj.missedCalls = obj.missedCalls + 1;
                }
            }, 500);
        };

        var key, current, N = neighbors, self = instance;
        for(key in N) {
            current = N[key];
            timeout(key, current);
            self.send(key, MESSAGE_TYPE.ARE_YOU_ALIVE, "*", {ignoreTS:true});
        }

        // ~~~~~~~~~~~~~~~~
        // Clean "recentlyLost"-List
        var now = Date.now(), deleteRecentlyLost = [];
        for(key in recentlyLost) {
            if (now - recentlyLost[key] > RECENTLY_LOST_TIMEOUT) {
                deleteRecentlyLost.push(key);
            }
        }
        var i = 0, L = deleteRecentlyLost.length;
        for(;i<L;i++){
            delete recentlyLost[deleteRecentlyLost[i]];
        }

    };

    var NEIGBORS_TIMEOUT = 120*1000; // 2 minutes

    /**
     * Checks for neighbors that are too old and removes them
     */
    function cleanNeighbors() {
        var key, i=0, L, now = Date.now(),
            deleteKeys = [], N = neighbors;
        for (key in N) {
            if ((now - N[key].ts) > NEIGBORS_TIMEOUT) {
                deleteKeys.push(key);
                Utils.log("clean {" + key + "}");
            }
        }
        L = deleteKeys.length;
        for (;i<L;i++) {
            delete N[deleteKeys[i]];
        }
    };

    /**
     *
     * @type {Object} {
     *      addr {String} : {
     *          node : {Peer},
     *          ts : {number} // Last use in millis,
     *          timeoutThread : {number} setTimeout-Thread
     *          missedCalls: {number} // how often did we fail to keep-alive
     *      }
     * }
     */
    var neighbors = {};

    var RECENTLY_LOST_TIMEOUT = 6 * 1000; // 6 secs timeout

    /**
     * Make sure that we do not reintroduce a recently lost peer through
     * other ppls message
     * @type {Object} {
     *      addr {String} : ts: {number} // in millis
     * }
     */
    var recentlyLost = {};

    LocalPeer.prototype.isRecentlyLost = function (id) {
        return id in recentlyLost;
    };

    /**
     * Sends a message to the given node
     * @param id {String}
     * @param type {number}
     * @param msg {String}
     */
    LocalPeer.prototype.send = function(id, type, msg, options){
        var temp = id;
        if (arguments.length === 1) {
            id = temp.addr;
            type = temp.type;
            msg = temp.msg;
        }
        var ignoreTS = false;
        var piggybackFunc = null;
        if (Utils.isDefined(options)) {
            if ("ignoreTS" in options) ignoreTS = options.ignoreTS;
            if ("piggybackFunc" in options) piggybackFunc = options.piggybackFunc;

        }
        var N = neighbors, current, conn;
        if (id in N) {
            current = N[id];
            current.node.send(_createMessage(type, msg, piggybackFunc));
            if (!ignoreTS) {
                current.ts = Date.now();
            }
        } else {
            conn = this.peer.connect(id);
            current = {
                ts : Date.now(),
                node : conn,
                missedCalls : 0,
                timeoutThread : null
            }
            N[id] = current;
            conn.on("open", function () {
                conn.send(_createMessage(type, msg, piggybackFunc));
            });
        }
    };

    /**
     *
     * @param type {number}
     * @param msg {string}
     * @param piggybackFunc {function}
     * @private
     */
    function _createMessage(type, msg, piggybackFunc) {
        if (Utils.isDefined(piggybackFunc)) {
            return {type:type, payload:msg, piggy:piggybackFunc()};
        } else {
            return {type:type, payload:msg};
        }
    };

    /**
     * @param callback {function} (id, type, message)
     */
    LocalPeer.prototype.onMessage = function (callback) {
        this.onMessageCallbacks.push(callback);
    };

    /**
     * @param callback {function} (id)
     */
    LocalPeer.prototype.onPeerLost = function (callback) {
        this.onLostPeerCallbacks.push(callback);
    };

    /**
     * @param view
     * @param message
     */
    LocalPeer.prototype.multicast = function (buffer, message) {
        var i = 0, L = buffer.length;
        for(;i<L;i++) {
            this.send(buffer[i].addr, MESSAGE_TYPE.MULTICAST, JSON.stringify(message));
        }
    };
    
    var onMulticastCallbacks = [];

    /**
     *
     * @param callback {function} (addr {String}, payload {Object} )
     */
    LocalPeer.prototype.onMulticast = function (callback) {
        onMulticastCallbacks.push(callback);
    };

    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        I N T E R F A C E
       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

    var onReadyCallbacks = [];

    return {
        load: function (cb) {
            if (instance === null) {
                instance = new LocalPeer();
                callback = cb;
            } else {
                cb.call(instance, instance, []);
            }
        },
        get: function () {
            if (Config.testingEnv()) {
                // MOCK-UP
                return {
                    on: function () {},
                    send: function () {},
                    onPeerLost: function () {},
                    onMessage: function() {}
                }
            } else {
                if (instance === null) throw "LocalPeer is not loaded!";
                return instance;
            }
        },
        onReady: function (callback) {
            if (instance === null) {
                onReadyCallbacks.push(callback);
            } else {
                callback.call(instance, instance);
            }

        }
    };
});