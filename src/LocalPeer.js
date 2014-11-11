/**
 * Created by Julian on 11/11/2014.
 */
define([
    "utils",
    "config"
], function (Utils, Config) {

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

        log("Establish as node {" + name + "}");
        log("Connect to broker {" + host + ":" + port + "}");

        var peer = this.peer = new Peer(name, {
            host : host,
            port : port,
            path : "/b"
        });

        var bootstraped = false;
        var bootstrap = "[]";
        TxtLoader.get("http://" + host + ":" + bootstrapPort, {
            success: function(txt){
                log("bootstrapping: " + txt);
                bootstraped = true;
                bootstrap = txt;
            },
            failure: function (statusCode) {
                log("Bootstrapping failed! " + statusCode);
                bootstraped = true;
            }
        });

        peer.on("error", function (e) {
            log(e);
        });

        var self = this;
        peer.on("open", function () {
            function _init() {
                var i= 0, U, bsNodes=[], L;
                if (bootstraped) {
                    U = bootstrap.replace("[","").replace("]","").split(",");
                    L = U.length;
                    for(;i<L;i++) {
                        bsNodes.push(U[i]);
                    }
                    self.bootstrap = bsNodes;
                    callback.call(self, self, bsNodes);
                } else {
                    setTimeout(_init, 100);
                }
            }
            _init();
            setInterval(cleanNeighbors, 60*1000); // every minute
        });
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
     *          ts : {number} // Last use in millis
     *      }
     * }
     */
    var neighbors = {};

    /**
     * Sends a message to the given node
     * @param id {String}
     * @param type {number}
     * @param msg {String}
     */
    LocalPeer.prototype.send = function(id, type, msg){
        var N = neighbors, current, conn;
        if (id in N) {
            current = N[id];
            current.node.send({type:type, payload:msg});
            current.ts = Date.now();
        } else {
            conn = this.peer.connect(id);
            current = {
                ts : Date.now(),
                node : conn
            }
            N[id] = current;
            conn.on("open", function () {
                conn.send({type:type, payload:msg});
            });
        }
    };

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
            if (instance === null) throw "LocalPeer is not loaded!";
            return instance;
        }
    };
});