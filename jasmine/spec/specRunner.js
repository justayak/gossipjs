/**
 * Created by Julian on 11/11/2014.
 */
require.config({
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
    "spec/PeerSamplingServiceSpec"], function (a,b,c,d) {

    jasmine.getEnv().execute();

});