function executeCallback(id, message, callbacks){
    if (id in callbacks){
        callbacks = callbacks[id];
        for (var i = 0; i < callbacks.length; i++) {
            callbacks[i].call(this, message);
        }
    }
};

function openConnection(conn){
    setTimeout(function(){
        executeCallback("open", conn.id, conn.callbacks);
    },100);
};

Gossip.Peer = {
    connect : function(id){

        /**
         * Connection
         */
        var conn = {
            callbacks : [],
            on : function(id, callback){
                var callbacks = this.callbacks;
                if (id in callbacks) {
                    callbacks[id].push(callback);
                } else {
                    callbacks[id] = [callback];
                }
            },
            close : function(){
                console.log("closing {" + this.id + "}")
            },
            id : id
        };

        var succ = true;
        if (Math.random() > 0.2){
            openConnection(conn);
        } else {
            succ = false;
            setTimeout(function(){
                executeCallback("error", {
                    type: "peer-unavailable",
                    message: "aaaaaaaaaaaaaaaaaaaaaaaaaa" + id},Gossip.Peer.callbacks);
            },100);
        }
        console.log("Dummy peer connect to {" + id + "} " + (succ ? "+" : "-"));
        return conn;
    },

    callbacks : {},
    on : function(id, callback){
        var callbacks = this.callbacks;
        if (id in callback) {
            callbacks[id].push(callback);
        } else {
            callbacks[id] = [callback];
        }
    }
};

/**
 * Created by Julian on 11/7/2014.
 */
describe("PeerSamplingService", function () {

    var c = 5;
    Gossip.PeerSamplingService.init({c: c});

    var view1, view2, view3;
    var PSS = Gossip.PeerSamplingService;

    beforeEach(function() {
        view2 = [{addr:"E", hopCount:7},
            {addr:"F", hopCount:29},
            {addr:"G", hopCount:3},
            {addr:"H", hopCount:1}];
        view1 = [{addr:"A", hopCount:5},
            {addr:"B", hopCount:2},
            {addr:"C", hopCount:12},
            {addr:"D", hopCount:88}];
        view3 = [
            {addr:"A", hopCount:1},
            {addr:"Q", hopCount:4},
            {addr:"B", hopCount:7}
        ];
    });

    it("should merge distinct sets correctly", function(){
        var result = _.map(PSS.inner.merge(view1, view2), function(e){return e.addr});
        expect(result).toEqual(["H", "B", "G", "A", "E"]);
    });

    it("should merge sets with equal elements correctly", function () {
        var result = PSS.inner.merge(view1, view3);
        expect(_.size(result)).toEqual(c);
        expect(result[0]).toBe(view3[0]); // A
        expect(result[1]).toBe(view1[1]); // B
        expect(result[2]).toBe(view3[1]); // Q
        expect(result[3]).toBe(view1[2]); // C
        expect(result[4]).toBe(view1[3]); // D
    });

    it("should increment correctly", function () {
        var result = _.indexBy(PSS.inner.increaseHopCount(view1), function (e) {return e.addr});
        expect(result["A"].hopCount).toEqual(6);
        expect(result["B"].hopCount).toEqual(3);
        expect(result["C"].hopCount).toEqual(13);
        expect(result["D"].hopCount).toEqual(89);
    });

    it("should select the right single head", function(){
        var result = PSS.inner.head(view1, true);
        expect(result).toEqual("B");
    });

    it("should select the right single tail", function(){
        var result = PSS.inner.tail(view1, true);
        expect(result).toEqual("D");
    });

    it("should select the right head (lower bond)", function(){
        var result = PSS.inner.head(view3);
        expect(result).toEqual(["A","Q","B"]);
    });

    it("should select the right tail (lower bond)", function(){
        var result = PSS.inner.tail(view3);
        expect(result).toEqual(["B","Q","A"]);
    });

    it("should select the right head (upper bond)", function(){
        var result = PSS.inner.head(PSS.inner.merge(view1, view3));
        expect(result).toEqual(["A","B","Q", "C", "D"]);
    });

    it("should select the right tail (upper bond)", function(){
        var result = PSS.inner.tail(PSS.inner.merge(view1, view3));
        expect(result).toEqual(["D","C","Q", "B", "A"]);
    });

    it("should serialize correctly", function () {
        var ser = PSS.inner.serialize(view3);
        expect(ser).toEqual("A:1,Q:4,B:7");
    });

    it("should deserialize correctly", function () {
        var des = PSS.inner.deserialize("A:1,Q:4,B:7");
        expect(des).toEqual(view3);
    });

    it("should serialize/deserialize symetrically", function () {
        var ser = PSS.inner.serialize;
        var des = PSS.inner.deserialize;
        expect(des(ser(view1))).toEqual(view1);
        expect(des(ser(view2))).toEqual(view2);
        expect(des(ser(view3))).toEqual(view3);
    });

});