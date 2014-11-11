/**
 * Created by Julian on 11/11/2014.
 */
define([
    "config",
    "utils",
    "LocalPeer",
    "protocol/t_man",
    "protocol/peerSamplingService"
], function (Config, Utils, LocalPeer, TMan, PeerSamplingService) {

    return {

        init : function(){
            $(function () {

                $("#connectBtn").on("click", function () {
                    var name = $("#me").val();
                    if (name.length > 0) {

                        Config.set({
                            name: name,
                            host : '85.25.215.113',
                            port: 9000,
                            bootstrapPort: 9001
                        });
                        $("#start").html(
                            "<h2>" + name + "</h2>"
                        );

                        LocalPeer.load(function (peer, bootstrap) {

                            PeerSamplingService.init({
                                bootstrap: bootstrap
                            });


                            setInterval(function () {
                                var peers = PeerSamplingService.getPeers();
                                var html = "";
                                for(var i = 0; i < peers.length; i++) {
                                    html += JSON.stringify(peers[i]) + "</br>";
                                }
                                $("#data").html(html);
                            }, 900);

                            /*
                            var i = 0, L = bootstrap.length;
                            for(;i<L;i++) {
                                peer.send(bootstrap[i], 5, "hello");
                            }

                            peer.onMessage(function(id, type, msg) {
                                console.log("{"+id+"}[" + type+"][" + msg + "]");
                            });

                            peer.onPeerLost(function (id) {
                                console.log("lost:" + id);
                            });
                            */



                        });

                    }
                });


            });
        }
    };

});