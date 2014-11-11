/**
 * Created by Julian on 11/11/2014.
 */
define([
    "utils",
    "LocalPeer",
    "protocol/peerSamplingService",
    "messageType"
], function (Utils, LocalPeer, PeerSamplingService, MESSAGE_TYPE) {

    /**
     * Arbitrary value which is used in the ranking function
     * @type {Object}
     */
    var myProfile = null;

    /**
     * Used for ranking other nodes profiles
     * @type {function} ({Node}, [{Node}]) -> [{Node}] ordered
     */
    var R = null;

    /**
     * @type {LocalPeer}
     */
    var peer = null;

    var myAddress = null;

    /**
     * @type {number} Max size of view
     */
    var c = 3;

    /**
     * @type {number} in millis
     */
    var T = 800;

    /**
     *
     * @type {Array}
     */
    var view = [];

    /**
     * @returns {Node}
     */
    function selectPeer() {
        if (view.length > 0) {
            return R(myProfile, view)[0].addr;
        } else {
            return null;
        }
    };

    /**
     *
     * @param buffer [Node]
     */
    function selectView(buffer) {
        return _.first(R(myProfile, buffer), c);
    };

    /**
     *
     */
    function merge(view1, view2) {
        //TODO improve this shit asap
        var lookup = {}, result = [], i, L1=view1.length, L2=view2.length, current;
        for(i=0;i<L1;i++) {
            current = view1[i];
            if (!(current.addr in lookup)) {
                result.push(current);
                lookup[current.addr] = ("profile" in current) ?
                    current.profile : null;
            } else {
                if (!Utils.isDefined(current.profile)) {
                    current.profile = lookup[current.addr];
                }
            }
        }
        for(i=0;i<L2;i++) {
            current = view2[i];
            if (!(current.addr in lookup)) {
                result.push(current);
                lookup[current.addr] = ("profile" in current) ?
                    current.profile : null;
            } else {
                if (!Utils.isDefined(current.profile)) {
                    current.profile = lookup[current.addr];
                }
            }
        }
        return result;
    };

    /**
     * employs PeerSamplingService for generating a random sample of
     * the Node-Network
     * @returns {[Node]}
     */
    function randomView() {
        return PeerSamplingService.getPeers();
    }

    function serialize(buffer) {
        return JSON.stringify(buffer);
    };

    function deserialize(str) {
        return JSON.parse(str);
    };

    function sendBufferTo(buffer, to) {
        var type = MESSAGE_TYPE.TMAN_BUFFER;
        peer.send(to, type, serialize(buffer));
    };

    /**
     *
     */
    function init(options) {

        myProfile = options.profile;
        R = options.rankingFunc;
        c = options.c || c;
        T = options.T || T;

        if (!Utils.isDefined(R) || !Utils.isDefined(myProfile)) {
            throw "T-Man Node is not setup correctly: Ranking function or Profile is missing.";
        }

        PeerSamplingService.init({
            profile : myProfile,
            bootstrap : options.bootstrap
        });

        if (Utils.isDefined(options.bootstrap)) {
            view = _.map(options.bootstrap, function (e) {
                return {addr: e};
            });
        }

        peer = LocalPeer.get();

        peer.onPeerLost(function (id) {
            view = Utils.removeFromBuffer(id, view);
        });

        peer.onMessage(function (id, type, payload) {
        var i,L;
            switch (type){
                case MESSAGE_TYPE.TMAN_BUFFER:
                    for(i=0,L=bufferQueue.length;i<L;i++){
                        //TODO maybe its clever to send a ts here as well..
                        //TODO apply OOP asap
                        if (bufferQueue[i].addr === id) {
                            bufferQueue[i].view = deserialize(payload);
                            return;
                        }
                    }
                    bufferQueue.push({addr: id, view:deserialize(payload)});
                    break;
                case MESSAGE_TYPE.TMAN_BUFFER_PULL:
                    receiveBuffer.call(peer, id, deserialize(payload));
                    break;
            }
        });

        myAddress = peer.name;

        setInterval(active, T);
        setInterval(passive, T/c);
    };

    var bufferQueue = [];

    //TODO OOP this functions!
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

    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     T H R E A D S
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

    function active() {
        var p = selectPeer(), myDescriptor, buffer;
        if (p !== null) {
            myDescriptor = {addr: myAddress, profile: myProfile};
            buffer = merge(view, [myDescriptor]);
            buffer = merge(buffer, randomView());
            sendBufferTo(buffer, p);
        }
    };

    function receiveBuffer(bufferP, p) {
        var buffer = merge(bufferP, view);
        view = selectView(Utils.sanitize(peer, buffer, myAddress));
    };

    function passive() {
        var m = waitMessage(), buffer, bufferQ, q, myDescriptor;
        if (m !== null ) {
            bufferQ = m.view;
            q = m.addr;
            myDescriptor = {addr:myAddress, profile:myProfile};
            buffer = merge(view, myDescriptor);
            buffer = merge(buffer, randomView());
            sendBufferTo(buffer, q);
            buffer = merge(bufferQ, view);
            view = selectView(Utils.sanitize(peer, buffer, myAddress));
        }
    };


    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        I N T E R F A C E
       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

    return {
        init: init,
        getPeers: function () {
            return view;
        },
        inner: {
            merge: merge
        }
    };

});