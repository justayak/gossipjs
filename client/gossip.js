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
    var onConnectionList = [];

    var peerName = null;

    function getMessageID() {
        return peerName + messageID;
    };

    function broadcast(message){
        debug('start broadcast ' + JSON.stringify(message) + ' with..')
        for(var key in others) {
            debug('send to ' + key);
            others[key].send(message);
        }
        debug("end broadcast");
    };

    function isString(myVar){
        return (typeof myVar === 'string' || myVar instanceof String);
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
                    onConnectionList.forEach(function(callback){
                        callback.call(self, conn.peer);
                    });
                }
                conn.on('data', function(json) {
                    var message = json;
                    if (isString(json)) messages = JSON.parse(json);
                    if (!(message.id in receivedMessages)) {
                        receivedMessages[message.id] = Date.now();
                        onMessageList.forEach(function(callback){
                            callback.call(self, message.txt);
                        });
                        broadcast(message);
                    }
                });
            });

        },


        connect : function(peer){
            if (peer in others) throw "already exists";
            others[peer] = this.peer.connect(peer);
        },

        onConnection : function(callback){
            onConnectionList.push(callback);
        },


        onMessage : function(callback){
            onMessageList.push(callback);
        },


        /**
         *
         */
        broadcast : function(msg) {
            broadcast({id: getMessageID() , txt: msg });
        }
    };    

})();
