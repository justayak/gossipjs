/**
 * Created by Julian on 11/4/2014.
 */
(function(Gossip){

    Gossip.real = function(){
        console.log("lol");
    }

})(typeof window.Gossip === 'undefined'?
    window.Gossip = {} : window.Gossip);