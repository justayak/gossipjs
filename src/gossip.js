/**
 * Created by Julian on 11/11/2014.
 */
requirejs.config({
    //By default load any module IDs from js/lib
    urlArgs: "bust=" + (new Date()).getTime(),
    baseUrl: 'src',
    paths: {
        jQuery : "//code.jquery.com/jquery-2.0.3.min",
        underscore : "//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore-min",
        peer : "//cdn.peerjs.com/0.3/peer",
        gossip : ''
    }
});

define([
    "jQuery",
    "underscore",
    "peer",
    "gossip/utils",
    "gossip/config",
    "gossip/externals",
    "gossip/LocalPeer",
    "gossip/gui"],
function (a,b,c, Utils, Config, d, LocalPeer, gui) {

    Config.debug(true);

    gui.init();

});