({
    name : 'gossip',
    paths: {
        jQuery : "//code.jquery.com/jquery-2.0.3.min",
        underscore : "//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore-min",
        peer : "//cdn.peerjs.com/0.3/peer"
    },

    shim : {
        underscore : {
            exports : "_"
        }
    },

    baseUrl : "src",
    out : "dist/gossip.js",
    removeCombined: true
})
