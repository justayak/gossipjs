/**
 * Created by Julian on 11/6/2014.
 * http://infoscience.epfl.ch/record/83409/files/neg--1184036295all.pdf
 */
(function(Gossip){

    /**
     *
     */
    function init() {

    };

    /**
     * Returns a list of peer addresses if the group contains more than one node.
     * The returned addresses are a sample drawn from the group.
     */
    function getPeers(n) {

    }

    Gossip.PeerSamplingService = {

        init : init,
        getPeers : getPeers

    };

})(typeof window.Gossip === 'undefined'?
    window.Gossip = {} : window.Gossip);