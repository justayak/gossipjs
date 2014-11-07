/**
 * Created by julian on 17/10/14.
 */

var PeerServer = require('peer').PeerServer;
var Essz = require("./essz")
var http = require("http");

/**
 *
 * @param options
 * @returns {GossipBroker}
 * @constructor
 */
function GossipBroker(options){
    if (! (this instanceof GossipBroker)) return new GossipBroker(options);
    if (typeof options === 'undefined') throw "GossipBroker needs options-parameter";
    if (! ('port' in options)) throw "GossipBroker options need to specify a port";
    if (! ('bootstrapPort' in options)) throw "GossipBroker options need to specify a bootstrapPort";
    this._debug = 'debug' in options && options.debug;
    var server = new PeerServer({port:options.port, path: '/b'});
    var self = this;
    this.debug('Gossip broker on port ' + options.port);
    this.connectedNodes = new Essz.HashList();

    http.createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("Hello world!");
    }).listen(options.bootstrapPort);
    console.log("Http bootstrap server on port " + options.bootstrapPort);

    server.on('connection', function(id){
        self.debug("connect: " + id);
        self.connectedNodes.put(id,id);
    });
    server.on('disconnect', function (id) {
        self.debug("disconnect:" + id);
        self.connectedNodes.remove(id);
    });
};

/**
 *
 * @param msg
 */
GossipBroker.prototype.debug = function(msg){
    if (this._debug) {
        console.log('[gossipjs][' + new Date().toISOString().substr(12) + ']' + msg);
    }
};

module.exports = {
    Broker : GossipBroker
}