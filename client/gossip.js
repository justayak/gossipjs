window.Gossip = (function(){
   
    // check if peerjs is actually loaded (naive aproach!)
    // http://peerjs.com/
    if (typeof Peer === 'undefined'){
        throw 'gossip.js needs peerjs to be loaded. See: http://peerjs.com';
    }

    return {
    
        /**
         *  @param options {Object}{
         *      name : {String} // unique name in the gossip network
         *      host : {string} // IP to broker server
         *      port : {Integer} // Port
         *  }
         *
         */
        connect : function(options){
            if (typeof options === "undefined") throw "Missing options";
            if (!('name' in options)) throw "Missing parameter {name}";
            if (!('host' in options)) throw "Missing parameter {host}";
            if (!('port' in options)) throw "Missing parameter {port}";
            console.log('connect');
            var name = options.name;
            delete options.name;
            options['path'] = '/b';
            var peer = new Peer(name, options);
        }

    };    

})();
