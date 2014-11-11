/**
 * Created by Julian on 11/11/2014.
 */
define([
    "utils",
    "LocalPeer",
    "messageType"
], function (Utils, LocalPeer, MESSAGE_TYPE) {

    /**
     * Count of node descriptors
     * @type {number}
     */
    var c = 3;

    /**
     * Times in millis for active thread
     * @type {number}
     */
    var T = 1000;

    /**
     * @type {LocalPeer}
     */
    var peer = null;

    /**
     * Contains the Node Descriptors
     * @type {Array}
     * [
     *      { addr: {String}, hopCount: {number}, node: {Peer} },
     *      ...
     * ]
     */
    var view = [];

    /**
     * @type {String}
     */
    var myAddress = null;

    var POLICY = {
        SELECT_PEER : {
            RAND: 0,
            HEAD: 1,
            TAIL: 2
        },
        SELECT_VIEW : {
            RAND: 0,
            HEAD: 1,
            TAIL: 2
        },
        VIEW_PROPAGATION : {
            PUSH: 0,
            PULL: 1,
            PUSH_PULL: 2
        }
    };

    var push = false;
    var pull = false;

    var selectionPolicy = {
        selectPeer : null,
        selectView : null
    };

    var DEFAULT_POLICY = {
        SELECT_PEER : POLICY.SELECT_PEER.RAND,
        SELECT_VIEW : POLICY.SELECT_VIEW.RAND,
        VIEW_PROPAGATION : POLICY.VIEW_PROPAGATION.PUSH_PULL
    };

    /**
     *
     */
    function init(options) {
        var def = Utils.isDefined, policy = DEFAULT_POLICY, bootstrap=[]; // ["A", "B", ..]
        if (def(options)){
            c = def(options.c) ? options.c : c;
            T = def(options.T) ? options.T : T;
            if (def(options.policy)) {
                policy = options.policy;
            }
            bootstrap = def(options.bootstrap) ? options.bootstrap : bootstrap;
        }

        peer = LocalPeer.get();

        peer.onPeerLost(function (id) {
            Utils.log("We lost connection to " + id );
            for(var i = 0; i < view.length;i++) {
                if (view[i].addr === id) {
                    view.splice(i,1);
                    break;
                }
            }
        });

        myAddress = peer.name;

        for(var i=0; i < bootstrap.length; i++) {
            view.push({addr: bootstrap[i], hopCount:1});
        }

        switch (policy.SELECT_PEER){
            case POLICY.SELECT_PEER.HEAD:
                selectionPolicy.selectPeer = function (v) {
                    if (!def(v)) v = view;
                    return head.call(this,v,true);
                };
                break;
            case POLICY.SELECT_PEER.RAND:
                selectionPolicy.selectPeer = function (v) {
                    if (!def(v)) v = view;
                    return rand.call(this,v,true);
                };
                break;
            case POLICY.SELECT_PEER.TAIL:
                selectionPolicy.selectPeer = function (v) {
                    if (!def(v)) v = view;
                    return tail.call(this,v,true);
                };
                break;
        }

        switch (policy.SELECT_VIEW){
            case POLICY.SELECT_VIEW.HEAD:
                selectionPolicy.selectView = function (v) {
                    if (!def(v)) v = view;
                    return _.first(head.call(this,v,false), c);
                };
                break;
            case POLICY.SELECT_VIEW.RAND:
                selectionPolicy.selectView = function (v) {
                    if (!def(v)) v = view;
                    return _.first(rand.call(this,v,false), c);
                };
                break;
            case POLICY.SELECT_VIEW.TAIL:
                selectionPolicy.selectView = function (v) {
                    if (myAddress === "a") console.log(v);
                    if (!def(v)) v = view;
                    return _.first(tail.call(this,v,false),c);
                };
                break;
        }

        switch (policy.VIEW_PROPAGATION){
            case POLICY.VIEW_PROPAGATION.PULL:
                pull = true;
                push = false;
                break;
            case POLICY.VIEW_PROPAGATION.PUSH:
                push = true;
                pull = false;
                break;
            case POLICY.VIEW_PROPAGATION.PUSH_PULL:
                pull = push = true;
                break;
        }
        setInterval(active, T);
        setInterval(passive, T/c);

        peer.onMessage(function (id, type, payload) {
            var i, L;
            switch (type) {
                case MESSAGE_TYPE.PSS_BUFFER:
                    for(i=0,L=bufferQueue.length;i<L;i++){
                        //TODO maybe its clever to send a ts here as well..
                        if (bufferQueue[i].addr === id) {
                            bufferQueue[i].view = deserialize(payload);
                            return;
                        }
                    }
                    bufferQueue.push({addr: id, view:deserialize(payload)});
                    break;
                case MESSAGE_TYPE.PSS_BUFFER_PULL:
                    onPull.call(peer, id, deserialize(payload));
                    break;
            }
        });

    };

    /**
     * Merge the views, return a max of c elements. The nodes with
     * the lowest hopCount are prefered
     * @param view1 {Object} see view
     * @param view2 {Object} see view
     */
    function merge(view1, view2){
        var isDef = Utils.isDefined;
        var sort1 = _.sortBy(view1, function(e){return e.hopCount;});
        var sort2 = _.sortBy(view2, function(e){return e.hopCount;});
        var result = [];
        var tempLookup = {};

        function shiftInto(from, to) {
            var e = from.shift();
            if (e.addr in tempLookup) {
                if (e.hopCount >= tempLookup[e.addr]){
                    return false;
                }
            }
            tempLookup[e.addr] = e.hopCount;
            to.push(e);
            return true;
        }
        while (result.length < c && (sort1.length > 0 || sort2.length > 0)) {
            var left = sort1[0];
            var right = sort2[0];
            if (isDef(left) && isDef(right)) {
                if (left.hopCount < right.hopCount){
                    shiftInto(sort1,result);
                } else {
                    shiftInto(sort2,result);
                }
            } else if (isDef(right)){
                shiftInto(sort2,result);
            } else {
                shiftInto(sort1,result);
            }
        }
        return result;
    };

    /**
     * @param view {[Node]}
     * @param singleValue {Boolean} determines if we should return a single value or
     *                              a list with at most c elements
     * @returns {Peer}
     */
    function rand(view, singleValue){
        var s = _.size(view);
        if (s > 0) {
            return singleValue ?
                _.sample(view).addr :
                _.sample(view, s > c ? c : s);
        }
        return null;
    };

    /**
     * @param view {[Node]}
     * @param singleValue {Boolean} determines if we should return a single value or
     *                              a list with at most c elements
     * @returns {Peer}
     */
    function head(view, singleValue) {
        var s = _.size(view);
        if (s > 0) {
            return singleValue ?
                _.min(view, function (e) {return e.hopCount;}).addr :
                _.first(_.sortBy(view, function(e){return e.hopCount;}), s > c ? c : s);
        }
        return null;
    };

    /**
     * @param view {[Node]}
     * @param singleValue {Boolean} determines if we should return a single value or
     *                              a list with at most c elements
     * @returns {Peer}
     */
    function tail(view, singleValue) {
        var s = _.size(view);
        if (s > 0) {
            return singleValue ?
                _.max(view, function (e) {return e.hopCount;}).addr :
                _.first(_.sortBy(view, function(e){return -(e.hopCount);}), s > c ? c : s);
        }
        return null;
    };

    /**
     * Increment the hop count of every element in the view
     * @param view
     */
    function increaseHopCount(view) {
        var current, addr;
        for(addr in view) {
            current = view[addr];
            current.hopCount += 1;
        }
        return view;
    };

    /**
     * Makes a string out of the buffer
     * @param buffer
     * @returns {string}
     */
    function serialize(buffer) {
        if (buffer.length === 0) return "#";
        var result = "", i = 0, L = buffer.length;
        for (;i<L;i++){
            result += buffer[i].addr + ":" + buffer[i].hopCount;
            if (i < L-1){
                result += ",";
            }
        }
        return result;
    };

    /**
     * Gets the object out of a serialized string
     * @param str
     * @returns {Array}
     */
    function deserialize(str) {
        if (str === "#") return [];
        var buffer = [];
        var U = str.split(",");
        var i = 0, L = U.length, current;
        for(;i<L;i++){
            current = U[i].split(":");
            buffer.push({
                addr : current[0],
                hopCount : parseInt(current[1],10)
            });
        }
        return buffer;
    };

    var bufferQueue = [];

    /**
     * Checks, if a message is there and can be processed
     * @returns {Descriptor}
     */
    function waitMessage() {
        if (bufferQueue.length > 0) {
            return bufferQueue.shift();
        }
        return null;
    };

    function sendBufferTo(buffer, to, isPull) {
        var type = MESSAGE_TYPE.PSS_BUFFER;
        if (isPull) MESSAGE_TYPE.PSS_BUFFER_PULL;
        peer.send(to, type, serialize(buffer));
    }

    /**
     * removes the own node from a buffer
     * @param buffer
     * @returns {*}
     */
    function sanitize(buffer) {
        var i = 0, L = buffer.length;
        for(;i<L;i++) {
            if (buffer[i].addr === myAddress) {
                buffer.splice(i,1);
                break;
            }
        }
        return buffer;
    }

    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     T H R E A D S
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

    function active() {
        var p = selectionPolicy.selectPeer(), myDescriptor, buffer = [];
        if (p !== null) {

            if (push) {
                myDescriptor = {addr: myAddress, hopCount:0};
                buffer = merge(view, [myDescriptor]);
            }

            sendBufferTo(buffer, p);

            if (pull) {
                //TODO
            }

        }
    };

    function onPull(p, viewP) {
        viewP = increaseHopCount(viewP);
        view = selectionPolicy.selectView(
            sanitize(merge(viewP, view))
        );
    };


    function passive() {
        var m = waitMessage(), p, viewP, myDescriptor, buffer;
        if (m !== null) {
            p = m.addr; viewP = increaseHopCount(m.view);

            if (pull) {
                myDescriptor = {addr: myAddress, hopCount:0};
                buffer = merge(view,[myDescriptor]);
                sendBufferTo(buffer, p, true);
            }

            buffer = merge(viewP, view);
            view = selectionPolicy.selectView(sanitize(buffer));

        }
    }

    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     I N T E R F A C E
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

    return {
        init: init,
        getPeers: function () {
            return view;
        },
        inner: {
            merge: merge,
            rand: rand,
            head: head,
            tail: tail,
            increaseHopCount: increaseHopCount,
            serialize: serialize,
            deserialize: deserialize
        }
    };

});