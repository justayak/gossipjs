/**
 * Created by Julian on 11/6/2014.
 * http://www.inf.u-szeged.hu/~jelasity/cikkek/ir-cs-006.03.pdf
 */
(function(Gossip){

    var deltaT = 500; // 1/2 Sec

    /**
     * fixed size of the cache
     * @type {number}
     */
    var c = 10;

    /**
     * Get news from the agent system.
     * If there are no news, return null
     * @type {function}
     */
    var getNews = null;

    /**
     * Tell the agent system that news arrived
     * @type {function}
     */
    var newsUpdate = null;


    function heartbeat(){
        var news = getNews();
        if (news !== null) {

        }
    };

    setInterval(heartbeat, deltaT);

    /**
     *
     * @constructor
     */
    function CacheEntry(address, payload) {
        this.address = address;
        this.timeStamp = Date.now();
        this.payload = payload;
    };

    CacheEntry.getPayload = function () {
        return this.payload;
    };



    /**
     * Agent
     */
    Gossip.Newscast = {

        /**
         *
         * @param _getNews {function}        Get news from the agent system
         * @param _newsUpdate {function}     tell the agent system that new news have arrived
         */
        init : function(_getNews, _newsUpdate){
            getNews = _getNews;
            newsUpdate = _newsUpdate;
        }

    };



})(typeof window.Gossip === 'undefined'?
    window.Gossip = {} : window.Gossip);
