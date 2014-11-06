/**
 * Created by Julian on 11/6/2014.
 * http://perso.telecom-paristech.fr/~kuznetso/pubs/Lpbcast_tocs.pdf
 */
(function(Gossip){


    /**
     *
     */
    Gossip.onMessage(function(id, message){
        console.log("msg from " + id + "  ", message)
    });

    /**
     *
     * @type {LPBCast}
     */
    Gossip.LPBCast = {

    };

})(typeof window.Gossip === 'undefined'?
    window.Gossip = {} : window.Gossip);