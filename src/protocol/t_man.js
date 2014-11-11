/**
 * Created by Julian on 11/11/2014.
 */
define([
    "utils",
    "LocalPeer",
    "protocol/peerSamplingService",
    "messageType"
], function (Utils, LocalPeer, PeerSamplingService, MESSAGE_TYPE) {


    var myProfile = 5;

    var peer = null;


    /**
     *
     */
    function init(options) {

        PeerSamplingService.init({
            myProfile : myProfile,
            bootstrap : options.bootstrap
        });

        peer = LocalPeer.get();


    };

    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        I N T E R F A C E
       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

    return {
        init: init
    };

});