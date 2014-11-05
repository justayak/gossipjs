/**
 * Created by Julian on 11/4/2014.
 *
 * T-Man
 * http://www.cs.unibo.it/bison/publications/esoa05.pdf
 *
 *
 *
 *
 */
(function(Gossip){

    /**
     * This profile will be used for the ranking
     * function
     * @type {Object}
     */
    var profile = null;

    /**
     * This function must be defined by the user
     * @type {function}
     */
    var rankingFunction = null;

    /**
     * Size of the partial view of other nodes
     * @type {number}
     */
    var c = 0;

    /**
     * List of objects to where a message will be send
     * @type {Object}
     * {
     *      nodeNameA : {profile: {profile}, node : {Peer}}
     * }
     */
    var partialView = {};

    /**
     * merge the local partial view with a neighbors view
     * A possible connection to other nodes will not be established yet
     * @param buffer {Object}
     * {
     *      nodeNameA : {profile},
     *      nodeNameB : {profile},
     *      ..
     * }
     */
    function merge(buffer){
        var result = {}, node;
        for (node in partialView){
            result[node] = partialView[node];
        }

        for (node in buffer){
            if (! (node in result)){
                result[node] = {profile: result[node], node: null};
            }
        }

        return result;
    };

    /**
     *
     * @param callback {function} with param of the first node
     * @param noPeersCallback {function} gets called when no peers are there
     * @returns {*}
     */
    function selectPeer(callback, noPeersCallback){
        var sort = rankingFunction(profile, partialView);
        if (sort.length === 0) noPeersCallback.call(Gossip);
        else {
            var fstName = sort[0];
            var fst = partialView[fstName];
            if (fst.node === null) {
                fst.node = Gossip.Peer.connect(fstName);
                fst.node.on("open", function(){
                    // wait until the connection is established
                    callback.call(Gossip, fst.node);
                });
            } else {
                callback.call(Gossip, fst.node);
            }
        };
    };

    function selectView(buffer, callback, noPeersCallback) {
        var result = {}, initCounter, key, current;
        var sort = rankingFunction(profile, buffer);
        if (sort.length === 0) noPeersCallback.call(Gossip);
        else {
            initCounter = 0;
            for (var i = 0; i < sort.length && i < c; i++) {
                key = sort[i];
                result[key] = buffer[key];
                if (result[key].node === null) {
                    initCounter += 1;
                }
            }

            if (initCounter > 0) {
                for (key in result) {
                    current = result[key];
                    if (current.node === null) {
                        current.node = Gossip.Peer.connect(key);
                        current.node.on("open", function(){
                            initCounter -= 1;
                            if (initCounter === 0) {
                                callback.call(Gossip, result);
                            }
                        });
                    }
                }
            }
        }
        return result;
    }
    
    Gossip.TMan = {

        /**
         *
         * @param options
         * {
         *      profile : xxx,
         *
         *      // @param x       - my own {profile}
         *      // @param nodes   - {Object} of {profile}'s Objects
         *      //              -> See partial view!
         *      // sort peer names in right order
         *      rankingFunction : function(x,nodes) {
         *
         *      }
         * }
         * @returns {object}
         */
        init : function(options){
            if (typeof options === "undefined") throw "options must be defined";
            if (!("profile" in options)) throw "options must contain a profile";
            if (!("rankingFunction" in options)) throw "options must contain a ranking function";
            if (!("partialViewSize" in options)) options.partialViewSize = 5;

            profile = options.profile;
            rankingFunction = options.rankingFunction;
            c = options.partialViewSize;

            return {



            }
        }



    };

})(typeof window.Gossip === 'undefined'?
    window.Gossip = {} : window.Gossip);