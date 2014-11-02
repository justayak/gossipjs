/**
 * Web-Implementation of the SCAMP (Scalable Membership Protocol)
 * http://pages.saclay.inria.fr/laurent.massoulie/ieee_tocs.pdf
 * Created by Julian on 11/2/2014.
 */
window.SCAMP = (function(){

    if (typeof _ === "undefined"){
        throw "SCAMP needs underscore.js";
    }

    /**
     * nodes that we will send messages to
     * @type {{}}
     */
    var partialView = {};

    /**
     * Nodes that we receive gossip messages from
     * @type {{}}
     */
    var inView = {};

    /**
     *
     * @param s
     */
    function onSubscription(s) {

    };


    return {



    }
})();