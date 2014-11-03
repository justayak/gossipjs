/**
 * Web-Implementation of the SCAMP (Scalable Membership Protocol)
 * http://pages.saclay.inria.fr/laurent.massoulie/ieee_tocs.pdf
 * Created by Julian on 11/2/2014.
 */
window.SCAMP = (function(){

    var isDebugging = false;
    var isReady = true;
    var peerName;
    var messageID = 0;
    function getMessageID() {
        messageID = messageID + 1;
        return peerName + messageID;
    };

    function log(msg) {
        if (isDebugging) {
            console.log('[scampjs][' + new Date().toISOString().substr(12) + ']' + msg);
        }
    };

    function inject(url){
        isReady = false; // when we need to inject a library, we need to wait until it's loaded..
        setTimeout(function(){
            var bodyEl = document.body;
            var scriptEl = document.createElement('script');
            scriptEl.type = 'text/javascript';
            scriptEl.src = url;
            bodyEl.appendChild(scriptEl);
        },100);
    };

    function hasPeerjs(){
        return typeof Peer !== 'undefined';
    }

    // check if peerjs is actually loaded (naive aproach!)
    // http://peerjs.com/
    var PEERJS_CDN = "http://cdn.peerjs.com/0.3/peer.js";
    if (!hasPeerjs()){
        //throw 'scamp.js needs peerjs to be loaded. See: http://peerjs.com';
        log("injecting peerjs...");
        inject(PEERJS_CDN);
    }

    function hasUnderscore() {
        return typeof _ !== "undefined";
    };
    var UNDERSCORE_CDN = "//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore-min.js";
    if (!hasUnderscore()){
        log("injecting underscore.js...");
        inject(UNDERSCORE_CDN);
    }

    var MessageType = {
        ForwardSubscription : 0,
        Message : 1
    };

    /**
     *
     */
    function createMessage(type, value){
        return {type:type, value:value,id:getMessageID()};
    };

    /**
     *
     * @param p {Number} between 1 and 0
     */
    function probability(p) {
        if (p >= 1) {
            return true;
        } else if (p <= 0) {
            return false;
        } else {
            return Math.random() > p;
        }
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // R E L E V A N T  C O D E
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    var PEER = null;
    var c = 5;

    /**
     * nodes that we will send messages to
     * @type {{}}
     */
    var partialView = {};

    /**
     * Nodes that we receive gossip messages from
     * @type {{}}
     */
    var inView = {};

    /**
     *
     * @param s
     */
    function onSubscription(s) {
        log("subscribe " + s);
        _.each(partialView, function(peer){
            peer.send(createMessage(MessageType.ForwardSubscription, s));
        });
        var random = _.sample(partialView, c);
        for (var i = 0; i < c; i++){
            random.send(createMessage(MessageType.ForwardSubscription, s));
        }
    };

    /**
     *
     * @param s
     */
    function onForwardedSubscription(s){
        var p = 1/(1+ _.size(partialView)); // probability that s is added to this node
        if (!(s in partialView)){

        } else {
            // Choose randomly n \in PartialView
            var n = _.first(_.shuffle(partialView));
            n.send(createMessage(MessageType.ForwardSubscription,s));
        }
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // R E L E V A N T  C O D E  E N D
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    return {

        options : function(options){
            if (typeof options !== "undefined"){
                isDebugging = ('debug' in options && options.debug === true);
            }
        },

        /**
         *
         * @param options
         * @param callback
         */
        init : function(options, callback){
            if (typeof options === "undefined") throw "Missing options";
            if (!('name' in options)) throw "Missing parameter {name}";
            if (!('host' in options)) throw "Missing parameter {host}";
            if (!('port' in options)) throw "Missing parameter {port}";
            if (!('peers' in options)) options['peers'] = [];
            if (isReady){
                _init();
            } else {
                function test(){
                    if(hasUnderscore() && hasPeerjs()){
                        isReady = true;
                        _init();
                    } else {
                        setTimeout(test,100);
                    }
                };
                test();

                function _init(){
                    var name = options.name;
                    peerName = name;
                    delete options.name;
                    options.path = "/b";
                    log("Establish as node {" + name + "}");
                    log("Connect to broker {" + options.host + ":" + options.port + "}");
                    var peer = new Peer(name, options);
                    PEER = peer;
                    peer.on("error", function(err){
                        log(err);
                    });

                    peer.on("connection", function(conn){
                        onSubscription.call(this, conn.peer);
                    });

                    callback.call(window);
                }
            }
        },

        test: onSubscription

    }
})();