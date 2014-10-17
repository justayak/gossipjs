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
        connect : function(options){
            if (typeof options === "undefined") throw "Missing options";
            if (!('name' in options)) throw "Missing parameter {name}";
            if (!('host' in options)) throw "Missing parameter {host}";
            if (!('port' in options)) throw "Missing parameter {port}";
            var name = options.name;
            delete options.name;
            options['path'] = '/b';
            debug('Establish as node {' + name + '}');
            debug('Connect to broker {' + options.host + ':' + options.port + '}');
            var peer = new Peer(name, options);


        }
    };    

})();
