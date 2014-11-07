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
        var result = [];
        var tempLookup = {};

        function shiftInto(from, to) {
            var e = from.shift();
            if (e.addr in tempLookup) {
                if (e.hopCount > tempLookup[e.addr]){
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
    function init(options) {
        if (Gossip.isDefined(options)) {
            T = ("T" in options) ? options.T : T;
            c = ("c" in options) ? options.c : c;
        }
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
                _.pluck(_.sample(view, s > c ? c : s), "addr");
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
                _.pluck(_.first(_.sortBy(view, function(e){return e.hopCount;}), s > c ? c : s),"addr");
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
                _.pluck(_.first(_.sortBy(view, function(e){return -(e.hopCount);}), s > c ? c : s),"addr");;
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
            merge : merge,
            increaseHopCount : increaseHopCount,
            head : head,
            tail : tail
        }

    };

})(typeof window.Gossip === 'undefined'?
    window.Gossip = {} : window.Gossip);