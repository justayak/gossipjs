/**
 * Created by julian on 17/10/14.
 */

var PeerServer = require('peer').PeerServer;
var Essz = require("./essz");

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
    this._debug = 'debug' in options && options.debug;
    var server = new PeerServer({port:options.port, path: '/b'});
    var self = this;
    this.debug('Gossip broker on port ' + options.port);
    this.connectedNodes = new Essz.HashList();

    server.on('connection', function(id){
        self.debug("connect: " + id);
        this.connectedNodes.put(id,id);
    });
    server.on('disconnect', function (id) {
        self.debug("disconnect:" + id);
        this.connectedNodes.remove(id);
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