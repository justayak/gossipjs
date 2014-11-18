/**
 * Created by Julian on 11/11/2014.
 */
define([
    "gossip/config",
    "gossip/utils",
    "gossip/LocalPeer",
    "gossip/protocol/t_man",
    "gossip/protocol/peerSamplingService"
], function (Config, Utils, LocalPeer, TMan, PeerSamplingService) {

    return {

        init : function(){
            $(function () {
                $("#live").hide();
                $("#connectBtn").on("click", function () {
                    var name = $("#me").val();
                    if (name.length > 0) {

                        Config.set({
                            name: name,
                            host : '85.25.215.113',
                            port: 9000,
                            bootstrapPort: 9001
                        });
                        var profile = Utils.randomInt(1,99);
                        $("#start").html(
                            "<h2>" + name + " [" + profile +"]</h2>"
                        );

                        LocalPeer.load(function (peer, bootstrap) {

                            var nextMID = 0;
                            var messageBuffer = {};

                            function addToChat(msg) {
                                var html = $("#chat").html();
                                html += "<b>" + msg.addr + "</b>:" + msg.msg + "</br>";
                                $("#chat").html(html);
                            }

                            function createKey(message) {
                                return message.addr + "_" + message.id;
                            };

                            function isMine(message) {
                                return message.addr === peer.name;
                            }

                            peer.onMulticast(function (id, message) {
                                if (!isMine(message)) {
                                    var key = createKey(message);
                                    if (!(key in messageBuffer)) {
                                        messageBuffer[key] = true;
                                        addToChat(message);
                                        TMan.multicast(message);
                                    }
                                }
                            });

                            $("#live").show();

                            $("#sendBtn").on("click", function () {
                                var txt = $("#msg").val();
                                if (txt.length > 0) {

                                    TMan.multicast({addr: peer.name, msg: txt, id:nextMID++});

                                    addToChat({addr: peer.name, msg:txt});
                                    $("#msg").val("");
                                }
                            });

                            TMan.init({
                                bootstrap: bootstrap,
                                profile : profile,
                                rankingFunc : function (x, list) {
                                    return _.sortBy(list, function (e) {
                                        if (!("profile" in e)) {
                                            return Math.MAX_VALUE;
                                        };
                                        return Math.abs(e.profile - x);
                                    })
                                }
                            });


                            setInterval(function () {
                                var peers = PeerSamplingService.getPeers();
                                var html = "<div>PeerSamplingService [" + peers.length +"]</div>";
                                for(var i = 0; i < peers.length; i++) {
                                    html += JSON.stringify(peers[i]) + "</br>";
                                }
                                $("#data").html(html);

                                // TMAN

                                peers = TMan.getPeers();
                                for(var i = 0; i < peers.length; i++) {
                                    if (!("profile" in peers[i])){
                                        //clean.push(peers[i]).addr;
                                        //peers[i].profile = Number.MAX_VALUE;
                                    }
                                }
                                peers = _.sortBy(peers, function (e) {
                                    return e.profile;
                                });

                                html = "<div>TMAN [" + peers.length +"]</div>";

                                for(var i = 0; i < peers.length; i++) {
                                    html += JSON.stringify(peers[i]) + "</br>";
                                }

                                $("#tman").html(html);

                            }, 900);



                        });

                    }
                });


            });
        }
    };

});