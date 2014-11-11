/**
 * Created by Julian on 11/11/2014.
 */
define([

], function () {

    var isDebug = false;
    
    var server = null;

    return {
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

        server : function (srv) {
            if (arguments.length > 0) {
                server = srv;
            } else {
                return srv;
            }
        }
    }
});