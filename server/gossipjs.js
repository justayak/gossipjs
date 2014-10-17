/**
 * Created by julian on 17/10/14.
 */

var PeerServer = require('peer').PeerServer;

function GossipBroker(options){
    if (! (this instanceof GossipBroker)) return new GossipBroker(options);
    if (typeof options === 'undefined') throw "GossipBroker needs options-parameter";
    if (! ('port' in options)) throw "GossipBroker options need to specify a port";
    this._debug = 'debug' in options && options.debug;
    var server = new PeerServer({port:options.port, path: '/b'});
    var self = this;
    this.debug('Gossip broker on port ' + options.port);
    server.on('connection', function(id){
        self.debug(id);
    });
};

GossipBroker.prototype.debug = function(msg){
    if (this._debug) {
        console.log('[gossipjs][' + new Date().toISOString().substr(12) + ']' + msg);
    }
};

module.exports = {
    Broker : GossipBroker
}