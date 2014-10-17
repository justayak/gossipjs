window.Gossip = (function(){
   
    // check if peerjs is actually loaded (naive aproach!)
    // http://peerjs.com/
    if (typeof Peer === 'undefined'){
        throw 'gossip.js needs peerjs to be loaded. See: http://peerjs.com';
    }

    return {
    
        /**
         *  @param options {Object}
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
            //var peer = new Peer(name, options);
        }
    };    

})();
