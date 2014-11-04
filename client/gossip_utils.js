/**
 * Created by Julian on 11/4/2014.
 */
(function(Gossip){

    Gossip.util = function(){
        console.log("hi");
    }

})(typeof window.Gossip === 'undefined'?
    window.Gossip = {} : window.Gossip);