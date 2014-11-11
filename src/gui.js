/**
 * Created by Julian on 11/11/2014.
 */
define([
    "config",
    "utils",
    "LocalPeer"
], function (Config, Utils, LocalPeer) {

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

                        LocalPeer.load(function (peer) {

                        });

                    }
                });


            });
        }
    };

});