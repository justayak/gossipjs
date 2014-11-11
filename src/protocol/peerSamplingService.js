/**
 * Created by Julian on 11/11/2014.
 */
define([
    "utils",
    "LocalPeer",
    "messageType"
], function (Utils, LocalPeer, MESSAGE_TYPE) {

    var c = 5;

    /**
     *
     */
    function init() {

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

    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     I N T E R F A C E
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

    return {
        init: init,
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