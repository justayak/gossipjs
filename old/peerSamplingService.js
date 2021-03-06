/**
 * Created by Julian on 11/6/2014.
 * http://infoscience.epfl.ch/record/83409/files/neg--1184036295all.pdf
 */
(function(Gossip){

    /**
     * @type {Gossip.Connector}
     */
    var connector = null;

    /**
     * Times in millis for active thread
     * @type {number}
     */
    var T = 1000;

    /**
     * @type {String}
     */
    var myAddress = null;

    /**
     * Count of node descriptors
     * @type {number}
     */
    var c = 3;

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
        SELECT_VIEW : POLICY.SELECT_VIEW.HEAD,
        VIEW_PROPAGATION : POLICY.VIEW_PROPAGATION.PUSH_PULL
    };

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
     * @returns {boolean} true, when there are peers in the view
     */
    function hasPeers(){
        return view.length > 0;
    };

    var MESSAGE_TYPE = {
        SEND_BUFFER: 0,
        REQUEST_BUFFER_ANSWER : 1
    };

    //TODO potentially DEAD-LOCK: Proposal: Round-Robin..
    var waitForActive = false;
    var waitForPassive = false;
    var timeoutWaitForActive = null;

    /*
    function activeOld() {
        var p = selectionPolicy.selectPeer(), myDescriptor, buffer = [];
        if (hasPeers()) {

            if (push) {
                myDescriptor = {addr: myAddress, hopCount:0};
                buffer = merge(view, [myDescriptor]);
            }
            Gossip.log("a: " + p);
            connector.fireAndForget(p, MESSAGE_TYPE.SEND_BUFFER, serialize(buffer));
            view = increaseHopCount(view);

        }



    };

    var passiveIsUpdating = false;
    function passiveOld(p, viewP) {
        console.log("p");
        viewP = increaseHopCount(viewP);
        var buffer;
        if(pull) {
            //TODO
        }
        buffer = selectionPolicy.selectView(merge(viewP, view));
        passiveIsUpdating = true;
        connector.update(buffer, function(v){
            console.log("done");
            passiveIsUpdating = false;
             view = v;
        });

    };*/

    function active() {
        var p, myDescriptor, buffer = [];
        if (hasPeers()){
            p = selectionPolicy.selectPeer()

            if (push){
                myDescriptor = {addr: myAddress, hopCount:0};
                buffer = merge(view, [myDescriptor]);
            }

            console.log("a " + p  + " -> " + serialize(buffer));
            connector.send(p, MESSAGE_TYPE.SEND_BUFFER, serialize(buffer));

            if (pull) {
                // TODO
            }
        }
    };

    function onPull(p, viewP) {
        viewP = increaseHopCount(viewP);
        view = connector.update(
            selectionPolicy.selectView(merge(viewP,view)));
        console.log("p " + p + " <- " + serialize(view));
    };


    function passive() {
        var msg = waitMessage(), myDescriptor, p, viewP, buffer;
        if (msg !== null) {
            p = msg.addr;
            viewP = increaseHopCount(msg.view);

            if (pull) {
                // TODO
                myDescriptor = {addr: myAddress, hopCount:0};
                buffer = merge(view,[myDescriptor]);
                connector.fireAndForget(p, MESSAGE_TYPE.REQUEST_BUFFER_ANSWER, serialize(buffer));
            }

            view = connector.update(
                selectionPolicy.selectView(merge(viewP, view)));
            console.log("p " + p + " <- " + serialize(view));
        }
    }

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

    /**
     * Merge the views, return a max of c elements. The nodes with
     * the lowest hopCount are prefered
     * @param view1 {Object} see view
     * @param view2 {Object} see view
     */
    function merge(view1, view2){
        var isDef = Gossip.isDefined;
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
     *
     */
    function init(options, callback) {
        var peer = Gossip.Peer, policy;
        if (Gossip.isDefined(options)) {
            T = ("T" in options) ? options.T : T;
            c = ("c" in options) ? options.c : c;
            peer = ("peer" in options) ? options.peer : peer;
            view = ("bootstrap" in options) ?
                _.map(options.bootstrap, function (n) {
                    return {addr: n, hopCount:2};
                }) : [];
            policy = ("policy" in options) ?
                options.policy : DEFAULT_POLICY;
            myAddress = peer.id;

        } else {
            throw "PeerSamplingService needs options!";
        }

        switch (policy.SELECT_PEER){
            case POLICY.SELECT_PEER.HEAD:
                selectionPolicy.selectPeer = function (v) {
                    if (!Gossip.isDefined(v)) v = view;
                    return head.call(this,v,true);
                };
                break;
            case POLICY.SELECT_PEER.RAND:
                selectionPolicy.selectPeer = function (v) {
                    if (!Gossip.isDefined(v)) v = view;
                    return rand.call(this,v,true);
                };
                break;
            case POLICY.SELECT_PEER.TAIL:
                selectionPolicy.selectPeer = function (v) {
                    if (!Gossip.isDefined(v)) v = view;
                    return tail.call(this,v,true);
                };
                break;
        }

        switch (policy.SELECT_VIEW){
            case POLICY.SELECT_VIEW.HEAD:
                selectionPolicy.selectView = function (v) {
                    if (!Gossip.isDefined(v)) v = view;
                    return _.first(head.call(this,v,false), c);
                };
                break;
            case POLICY.SELECT_VIEW.RAND:
                selectionPolicy.selectView = function (v) {
                    if (!Gossip.isDefined(v)) v = view;
                    return _.first(rand.call(this,v,false), c);
                };
                break;
            case POLICY.SELECT_VIEW.TAIL:
                selectionPolicy.selectView = function (v) {
                    if (!Gossip.isDefined(v)) v = view;
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

        connector = new Gossip.Connector(peer);
        Gossip.PeerSamplingService.inner.connector = connector;
        connector.update(view, function (availableView) {
            // The view we get here is actually available!
            // Nodes, that couldn't be reached are removed
            view = availableView;
            callback.call(this);
        });
        setInterval(active, T);
        setInterval(passive, T/c);

        connector.onFail(function(id){
            Gossip.log("fireAndForget failed with: " + id);
            console.log(connector.view);
        });

        connector.onRemove(function (id) {
            Gossip.log("Node {" + id + "} is unreachable");
        });

        connector.onMessage(function(id, type, payload){
                //console.log("msg: " + id + " - " + payload);
                switch (type) {
                 case MESSAGE_TYPE.REQUEST_BUFFER_ANSWER:
                     onPull.call(connector, id, deserialize(payload));
                     break;
                 case MESSAGE_TYPE.SEND_BUFFER:
                    // put it on the Queue so it can be queried from "waitMessage"
                    // Check, if the address is already in there
                    for(var i = 0; i < bufferQueue.length; i++){
                        if (bufferQueue[i].addr === id) {
                            bufferQueue[i].view = deserialize(payload);
                            return;
                        }
                    }
                    bufferQueue.push({addr:id, view: deserialize(payload)});
                     /*if (passiveIsUpdating){
                         bufferQueue.push({addr:id, view:deserialize(payload)});
                     } else {
                         passive.call(this, id, deserialize(payload));
                     }*/
                    break;
                 default:

                     break;
             }
        });
    };

    /*
    setInterval(function(){
        if (!passiveIsUpdating){
            if (bufferQueue.length > 0) {
                var e = bufferQueue.shift();
                passive.call(connector, e.addr, e.view);
            }
        }
    },100);
    */

    var bufferQueue = [];

    /**
     * Checks, if a message is there and can be processed
     * @returns {Descriptor}
     */
    function waitMessage() {
        //if (!waitForActive && !waitForPassive){
            if (bufferQueue.length > 0) {
                return bufferQueue.shift();
            }
        //}
        return null;
    };

    // Peer Selection policies

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
     * Returns a list of peer addresses if the group contains more than one node.
     * The returned addresses are a sample drawn from the group.
     */
    function getPeers(n) {
        // TODO keep going here
    }



    Gossip.PeerSamplingService = {

        init : init,
        getPeers : getPeers,

        inner : {
            connector: null,
            merge : merge,
            increaseHopCount : increaseHopCount,
            head : head,
            tail : tail,
            serialize: serialize,
            deserialize: deserialize
        }

    };

})(typeof window.Gossip === 'undefined'?
    window.Gossip = {} : window.Gossip);
