/**
 * Created by Julian on 11/11/2014.
 */
define([
    "config"
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