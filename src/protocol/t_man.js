/**
 * Created by Julian on 11/11/2014.
 */
define([
    "utils",
    "LocalPeer",
    "protocol/peerSamplingService",
    "messageType"
], function (Utils, LocalPeer, PeerSamplingService, MESSAGE_TYPE) {


    var myProfile = Utils.randomInt(1,99);

    var peer = null;


    /**
     *
     */
    function init(options) {

        PeerSamplingService.init({
            profile : myProfile,
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