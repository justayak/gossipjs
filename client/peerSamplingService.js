/**
 * Created by Julian on 11/6/2014.
 * http://infoscience.epfl.ch/record/83409/files/neg--1184036295all.pdf
 */
(function(Gossip){

    /**
     * Times in millis for active thread
     * @type {number}
     */
    var T = 250;

    /**
     * Count of node descriptors
     * @type {number}
     */
    var c = 5;

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
     * Merge the views, return a max of c elements. The nodes with
     * the lowest hopCount are prefered
     * @param view1 {Object} see view
     * @param view2 {Object} see view
     */
    function merge(view1, view2){
        var isDef = Gossip.isDefined;
        var sort1 = _.sortBy(view1, function(e){return e.hopCount;});
        var sort2 = _.sortBy(view2, function(e){return e.hopCount;});
        var total = sort1.length + sort2.length;
        var i = 0;
        var result = [];
        for (;i < total && i < c; i++) {
            var left = sort1[0];
            var right = sort2[0];
            if (isDef(left) && isDef(right)) {
                if (left.hopCount < right.hopCount){
                    result.push(sort1.shift());
                } else {
                    result.push(sort2.shift());
                }
            } else if (isDef(right)){
                result.push(sort2.shift());
            } else {
                result.push(sort1.shift());
            }
        }
        return result;
    };

    /**
     *
     */
    function init(options) {
        if (Gossip.isDefined(options)) {
            T = ("T" in options) ? options.T : T;
            c = ("c" in options) ? options.c : c;
        }
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
            merge : merge,
            increaseHopCount : increaseHopCount
        }

    };

})(typeof window.Gossip === 'undefined'?
    window.Gossip = {} : window.Gossip);