/**
 * Created by Julian on 11/4/2014.
 */
(function(Gossip){

    Gossip.isDefined = function (e) {
        return e !== null && typeof e !== "undefined";
    };

    // ** HELPER **

    function isString(myVar) {
        return (typeof myVar === 'string' || myVar instanceof String);
    }

    var isDebugging = false;
    function isReady() {
        return hasPeerjs() && hasUnderscore();
    };

    function log(msg) {
        if (isDebugging) {
            console.log('[gossipjs][' + new Date().toISOString().substr(12) + ']' + msg);
        }
    };

    Gossip.log = log;

    Gossip.node = {
        name : null,
        peer : null
    };

    /**
     * set options
     * @param o
     */
    Gossip.options = function(o){
        if (typeof o !== 'undefined'){
            if ("debug" in o) {
                isDebugging = o.debug;
            }
        }
    };

    /**
     * inject script into dom
     * @param url
     */
    function inject(url){
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

    function hasUnderscore() {
        return typeof _ !== "undefined";
    };
    var UNDERSCORE_CDN = "//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore-min.js";

    /**
     *
     * @param p {Number} between 1 and 0
     * @returns {boolean}
     */
    Gossip.probability = function(p) {
        if (p >= 1) {
            return true;
        } else if (p <= 0) {
            return false;
        } else {
            return Math.random() < p;
        }
    };

    // ** HELPER END **

    /**
     *
     * @param options
     * @param callback
     */
    Gossip.init = function(options, callback){
        if (typeof options === "undefined") throw "Missing options";
        if (!('name' in options)) throw "Missing parameter {name}";
        if (!('host' in options)) throw "Missing parameter {host}";
        if (!('port' in options)) throw "Missing parameter {port}";
        if (!('bootstrapPort' in options)) throw "Missing parameter {bootstrapPort}";
        if (!('peers' in options)) options['peers'] = [];

        if (!hasUnderscore()){
            log("injecting underscore.js...");
            inject(UNDERSCORE_CDN);
        }

        if (!hasPeerjs()){
            //throw 'scamp.js needs peerjs to be loaded. See: http://peerjs.com';
            log("injecting peerjs...");
            inject(PEERJS_CDN);
        }

        var bootstraped = false;
        var bootstrap = "[]";
        TxtLoader.get("http://" + options.host + ":" + options.bootstrapPort, {
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

        if (isReady() && bootstraped){
            _init();
        } else {
            function test() {
                if (isReady() && bootstraped) {
                    _init();
                } else {
                    setTimeout(test, 100);
                }
            };
            test();
        }

        function _init(){
            var name = options.name;
            delete options.name;
            options.path = "/b";
            log("Establish as node {" + name + "}");
            log("Connect to broker {" + options.host + ":" + options.port + "}");
            var peer = new Peer(name, options);
            Gossip.Peer = peer;
            peer.on("error", function(err){
                log(err);
            });

            var bootstrapNodes = [], U, i = 0, L;
            if (bootstrap !== "[]") {
                U = bootstrap.replace("[","").replace("]","").split(",");
                L = U.length;
                for(;i<L;i++){
                    bootstrapNodes.push(U[i]);
                }
            }

            callback.call(window, bootstrapNodes);
        };
    };


    Gossip.utils = {
        randomInt : function(min,max){
            return (Math.floor(Math.random() * (max - min + 1)) + min)|0;
        }
    };

    /*
     ==========================================================================================
     C O N N E C T O R
     ==========================================================================================
     */

    var connectors = [];

    /**
     * @param peer {Peer}
     * @type {Connector}
     */
    var Connector = Gossip.Connector = function (peer) {
        this.peer = peer;
        this.view = null;
        this.onMessagesCallback = [];
        this.onFireAndForgetFailedCallback = [];
        var self = this;
        peer.on("connection", function(conn){
            conn.on("data", function (d) {
                var i = 0;
                var cb = self.onMessagesCallback, L = cb.length;
                if (isString(d)){
                    d = JSON.parse(d);
                }
                switch (d.type) {
                    case MESSAGE_TYPE.PING:
                        self.fireAndForget(conn.peer, MESSAGE_TYPE.PONG);
                        break;
                    case MESSAGE_TYPE.PONG:
                        if (conn.peer in testNode){
                            clearInterval(testNode[conn.peer].timeout);
                            var cb = testNode[conn.peer].success;
                            delete testNode[conn.peer];
                            cb.call(self, conn.peer);
                        }
                        break;
                    default :
                        for(;i < L; i++ ){
                            cb[i].call(self, conn.peer, d.type, d.payload);
                        }
                        break;
                }
            });
        });
        connectors.push(this);

        /**
         * @type {function} (id {String})
         * @private
         */
        this._notifyUpdateAboutFail = null;

        var self = this;
        peer.on("error", function(err){
            var peer, view;
            var notifyUpdate = self._notifyUpdateAboutFail;
            switch (err.type){
                case "peer-unavailable":
                    view = self.view;
                    peer = err.message.substr(26); //TODO that's bad...
                    self.remove(peer);
                    if (notifyUpdate !== null) {
                        notifyUpdate.call(self, peer);
                    }
                    self.onFail.call(self, peer);
                    break;
            }
        });
    };

    /**
     *
     * @param callback {function}
     */
    Connector.prototype.onMessage = function (callback) {
        this.onMessagesCallback.push(callback);
    };

    /**
     *
     * @param cb {function}
     */
    Connector.prototype.onFail = function(cb){
        this.onFireAndForgetFailedCallback.push(cb);
    };

    /**
     * Removes a node from the Connector
     * @param id {String}
     * @returns {boolean} True when removal was successful, otherwise false
     */
    Connector.prototype.remove = function (id) {
        var view = this.view, L = this.view.length, current;
        for (var i = 0; i < L; i++) {
            current = view[i];
            if (current.addr === id) {
                if (current.node) {
                    current.node.close();
                }
                view.splice(i,1);
                return true;
            }
        }
        return false;
    };

    /**
     * Send a message to a node
     * @param id {String}
     * @param type {number}
     * @param message {Object}
     * @returns {boolean} True when send and false otherwise
     */
    Connector.prototype.send = function (id, type, message) {
        var view = this.view, L = this.view.length, i = 0, current;
        for(;i < L; i++){
            current = view[i];
            if (current.addr === id) {
                current.node.send(createMessage(type, message));
                return true;
            }
        }
        return false;
    };

    //TODO on-update: make the function lookup this object too to
    //TODO find already open connections
    var fireAndForgetItems = {
        /*addr: {node: {Peer}, ts:{Date in ms}*/
    };

    /**
     * Checks, if fire-and-Forget items are too old and remove them if so
     */
    function cleanFireAndForgetItems(){
        var addr, ffI = fireAndForgetItems, tDiff, i = 0, L = connectors.length;
        var _connectors = connectors;
        var TIME_THRESHOLD = 1000 * 60 * 5; // 2 minutes
        var now = Date.now();
        for(addr in ffI) {
            tDiff = now - ffI[addr].ts;
            if (tDiff > TIME_THRESHOLD) {
                // is there a reference to any other connector?
                for(;i<L;i++){
                    if (_connectors[i].contains(addr)){
                        ffI[addr].ts = Date.now();  // reset the timeout
                        return;
                    }
                }
                ffI[addr].close();
                delete ffI[addr];
            }
        }
    };
    setInterval(cleanFireAndForgetItems, 1000*60); // every minute

    /**
     * @param id {String}
     * @returns {boolean} True, when item is in view, else false
     */
    Connector.prototype.contains = function (id) {
        var i = 0, L = this.view.length, view = this.view;
        for(;i<L;i++){
            if (id === view[i].addr){
                return true;
            }
        }
        return false;
    };

    var MESSAGE_TYPE = {
        PING : -1,
        PONG : -2
    };

    var testNode = {

    };

    /**
     * Test if a node is available or not
     * @param id {String}
     * @param success {function}
     * @param failure {function}
     */
    Connector.prototype.test = function (id, success, failure) {
        if (! (id in testNode)) {
            this.fireAndForget(id, MESSAGE_TYPE.PING);
            var self = this;
            testNode[id] = {
                success : success,
                timeout: setTimeout(function(){
                    failure.call(self, id);
                    delete testNode[id];
                    delete fireAndForgetItems[id];
            }, 500)};
        }
    };

    /**
     * Sends a message to a specific node. This node does not
     * necessarily needs to be member of the current view
     * @param id {String}
     * @param type {number}
     * @param message {Object}
     */
    Connector.prototype.fireAndForget = function(id, type, message) {
        log("Fire-and-Forget: Target: {" + id + "}");
        var view = this.view, L = this.view.length, i = 0, current;
        if (id in fireAndForgetItems) {
            fireAndForgetItems[id].node.send(createMessage(type, message));
            fireAndForgetItems[id].ts = Date.now(); // update timestamp
        } else {
            // see, if we already use this id
            for(;i<L;i++){
                current = view[i];
                if (current.addr === id) {
                    current.node.send(createMessage(type, message));
                    return;
                }
            }
            // we need to open a connection:
            var conn = this.peer.connect(id);
            conn.on("open", function(){
                fireAndForgetItems[conn.peer] = {node:conn, ts: Date.now()};
                conn.send(createMessage(type, message));
                //conn.close();
                //TODO figure out if we need to do more stuff to close it..
            });
        }
    };

    /**
     * Create a message
     * @param type {number}
     * @param payload {object} OPTIONAL
     * @returns {Object}
     */
    function createMessage(type, payload) {
        if (Gossip.isDefined(payload)){
            return {type:type, payload:payload};
        } else {
            return {type:type};
        }
    }

    /**
     * Views layout MUST consist of the following elements:
     * [
     *      { addr: {String}},
     *      ...
     * ]
     * @param view {Array}
     * @param callback {function}
     */
    Connector.prototype.update = function(view, callback){
        if (this._notifyUpdateAboutFail !== null) throw "Concurrent update running!";
        //TODO close the connections that are not used anymore!
        //TODO make sure that the connections are gc'd!
        //TODO put a timeout
        var peer = this.peer, self = this;
        this.view = view;
        var i = 0, current, expectedCallbacks = 0;

        /**
         * makes sure that we reach the callback at some point
         */
        function countDown() {
            expectedCallbacks = expectedCallbacks - 1;
            if (expectedCallbacks === 0) {
                self._notifyUpdateAboutFail = null; // reset
                callback.call(self, self.view);
            }
        }
        this._notifyUpdateAboutFail = countDown;

        for(; i < view.length; i++){
            current = view[i];
            if (! ("node" in current)) {
                expectedCallbacks += 1;
                var conn = peer.connect(current.addr);
                current.node = conn;
                conn.on("open", countDown);
            }
        }

    };

    /*
     ==========================================================================================
     C O N N E C T O R  E N D
     ==========================================================================================
     */


})(typeof window.Gossip === 'undefined'?
    window.Gossip = {} : window.Gossip);

/*
==========================================================================================
E X T E R N A L  L I B R A R I E S
 ==========================================================================================
 */
window.TxtLoader = function() {
    function h(a) {
        var f = {};
        return a && "[object Function]" === f.toString.call(a);
    }
    function k(a) {
        if ("undefined" === typeof a) {
            throw "TxtLoader: get - options are mandatory";
        }
        if ("undefined" === typeof a.success) {
            throw "TxtLoader: No success-callback set";
        }
        if (!h(a.success)) {
            throw "TxtLoader: success must be a function";
        }
        var f = a.success, c = null;
        "failure" in a && h(a.failure) && (c = a.failure);
        var d = this;
        "undefined" !== typeof a.ctx && (d = a.ctx);
        var e = "application/json";
        "undefined" !== typeof a.mime && (e = a.mime);
        return{ctx:d, success:f, fail:c, mime:e};
    }
    if ("undefined" === typeof XMLHttpRequest) {
        throw "TxtLoader: TxtLoader is not supported by this browser";
    }
    return{get:function(a, f) {
        var c = k(f), d = c.ctx, e = c.fail, g = c.success, b = new XMLHttpRequest;
        b.open("GET", a);
        b.onreadystatechange = function() {
            200 !== b.status ? null !== e && 2 === b.readyState && e.call(d, b.status) : 4 === b.readyState && g.call(d, b.responseText);
        };
        b.send();
    }, post:function(a, f, c) {
        c = k(c);
        var d = c.ctx, e = c.fail, g = c.success, b = new XMLHttpRequest;
        b.setRequestHeader("Content-type", c.mime);
        b.open("POST", a, !0);
        b.onreadystatechange = function() {
            200 !== b.status ? null !== e && 2 === b.readyState && e.call(d, b.status) : 4 === b.readyState && g.call(d, b.responseText);
        };
        b.send(f);
    }};
}();