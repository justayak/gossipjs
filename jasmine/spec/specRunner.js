/**
 * Created by Julian on 11/11/2014.
 */
require.config({
    urlArgs: "bust=" + (new Date()).getTime(),
    baseUrl: '../src',
    paths: {
        spec: "../jasmine/spec",
        jQuery : "//code.jquery.com/jquery-2.0.3.min",
        underscore : "//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore-min",
        peer : "//cdn.peerjs.com/0.3/peer"
    }
});

require([
    "jQuery",
    "underscore",
    "peer",
    "spec/PeerSamplingServiceSpec",
    "spec/T_ManSpec",
    "config"], function (a,b,c,d,e, Config) {

    jasmine.getEnv().execute();

});