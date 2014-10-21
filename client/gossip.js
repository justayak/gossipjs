window.Gossip = (function(){

    var isDebugging = false;

    function debug(msg) {
        if (isDebugging) {
            console.log('[gossipjs][' + new Date().toISOString().substr(12) + ']' + msg);
        }
    };

    // check if peerjs is actually loaded (naive aproach!)
    // http://peerjs.com/
    if (typeof Peer === 'undefined'){
        throw 'gossip.js needs peerjs to be loaded. See: http://peerjs.com';
    }

    var others = {};
    var receivedMessages = {};

    var messageID = 0;

    var onMessageList = [];

    var peerName = null;

    function getMessageID() {
        return peerName + messageID;
    };

    return {

        /**
         * Set options for the Gossiper
         * @param options
         */
        options : function(options){
            if (typeof options !== 'undefined') {
                isDebugging = ('debug' in options && options.debug === true);
            }
        },
    
        /**
         *  @param options {Object} name as String, host as String, port as Integer
         *
         */
        init : function(options){
            if (typeof options === "undefined") throw "Missing options";
            if (!('name' in options)) throw "Missing parameter {name}";
            if (!('host' in options)) throw "Missing parameter {host}";
            if (!('port' in options)) throw "Missing parameter {port}";
            if (!('peers' in options)) options['peers'] = [];
            var name = options.name;
            peerName = name;
            delete options.name;
            options['path'] = '/b';
            debug('Establish as node {' + name + '}');
            debug('Connect to broker {' + options.host + ':' + options.port + '}');
            var peer = new Peer(name, options);
            this.peer = peer;
            options.peers.forEach(function(otherPeer){
                others[otherPeer] = peer.connect(otherPeer);
            });
            var self = this;

            peer.on('connection', function(conn){
                if (! (conn.peer in others)){
                    others[conn.peer] = peer.connect(conn.peer);
                    debug('hello from {' + conn.peer + '}');
                }
                conn.on('data', function(json) {
                    var message = JSON.parse(json);
                    if (!(message.id in receivedMessages)) {
                        receivedMessages[message.id] = Date.now();
                        onMessageList.forEach(function(callback){
                            callback.call(self, message.txt);
                        });
                    }
                });
            });

        },


        connect : function(peer){
            if (peer in others) throw "already exists";
            others[peer] = this.peer.connect(peer);
        },


        onMessage : function(callback){
            onMessageList.push(callback);
        },


        /**
         *
         */
        broadcast : function(msg) {
            for(var key in others) {
                others[key].send(JSON.stringify({id: getMessageID() , txt: msg }));
            }
        }
    };    

})();
