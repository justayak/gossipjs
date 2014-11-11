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
        });
    };

    return {
        get: function (cb) {
            if (instance === null) {
                instance = new LocalPeer();
                callback = cb;
            } else {
                cb.call(instance, instance, []);
            }
        }
    };
});