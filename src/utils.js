/**
 * Created by Julian on 11/11/2014.
 */
define([
    "gossip/config"
], function (Config) {
    return {

        /**
         *
         * @param e
         * @returns {boolean}
         */
        isDefined : function(e) {
            return e !== null && typeof e !== "undefined";
        },

        /**
         *
         * @param myVar
         * @returns {boolean}
         */
        isString : function(myVar){
            return (typeof myVar === 'string' || myVar instanceof String);
        },

        /**
         *
         * @param msg {String}
         */
        log : function(msg){
            if (Config.debug()) {
                console.log('[gossipjs][' + new Date().toISOString().substr(12) + ']' + msg);
            }
        },

        randomInt: function(min,max){
            return (Math.floor(Math.random() * (max - min + 1)) + min)|0;
        },

        removeFromBuffer: function (id, view) {
            var i = 0, L = view.length;
            for(;i<L;i++) {
                if (view[i].addr === id) {
                    view.splice(i,1);
                    break;
                }
            }
            return view;
        },

        sanitize: function (peer,buffer,myAddress) {
            var i = 0, L = buffer.length;
            var result = [], addr;
            for(;i<L;i++) {
                addr = buffer[i].addr;
                if (addr !== myAddress && !peer.isRecentlyLost(addr)) {
                    result.push(buffer[i]);
                }
            }
            return result;
        },

        /**
         *
         * @param p {number} between 1 and 0
         * @returns {boolean}
         */
        probability : function(p) {
            if (p >= 1) {
                return true;
            } else if (p <= 0) {
                return false;
            } else {
                return Math.random() < p;
            }
        }
    }
});