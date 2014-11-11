/**
 * Created by Julian on 11/11/2014.
 */
define([

], function () {

    var isDebug = false;
    var host = null;
    var bootstrapPort = null;
    var peers = null;
    var name = null;
    var port = null;
    var isSet = false;
    var isTestingEnv = false;

    return {

        testingEnv: function (test) {
            if (arguments.length > 0) {
                isTestingEnv = test;
            } else {
                return isTestingEnv;
            }
        },

        /**
         *
         * @param debug
         * @returns {boolean}
         */
        debug : function(debug){
            if (arguments.length > 0) {
                isDebug = debug;
            } else {
                return isDebug;
            }
        },

        /**
         *
         * @param srv
         * @returns {*}
         */
        set : function (options) {
            if (typeof options === "undefined") throw "Missing options";
            if (!('name' in options)) throw "Missing parameter {name}";
            if (!('host' in options)) throw "Missing parameter {host}";
            if (!('port' in options)) throw "Missing parameter {port}";
            if (!('bootstrapPort' in options)) throw "Missing parameter {bootstrapPort}";
            //if (!('peers' in options)) options['peers'] = [];
            host = options.host;
            name = options.name;
            port = options.port;
            bootstrapPort = options.bootstrapPort;
            //peers = options.peers; // ["A", "B", ... ]
            isSet = true;
        },

        host : function () {
            if (!isSet) throw "Config not set!";
            return host;
        },

        peers : function () {
            if (!isSet) throw "Config not set!";
            return peers;
        },

        bootstrapPort : function () {
            if (!isSet) throw "Config not set!";
            return bootstrapPort;
        },

        name : function () {
            if (!isSet) throw "Config not set!";
            return name;
        },

        port : function () {
            if (!isSet) throw "Config not set!";
            return port;
        }
    }
});