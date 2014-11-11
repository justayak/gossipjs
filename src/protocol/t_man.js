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
     *
     */
    function init() {
        PeerSamplingService.init();
    };

    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        I N T E R F A C E
       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

    return {
        init: init
    };

});