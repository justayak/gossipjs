define([
    "protocol/peerSamplingService",
    "config"
], function(PSS, Config){
    /**
     * Created by Julian on 11/7/2014.
     */
    describe("PeerSamplingService", function () {

        Config.testingEnv(true);

        var c = 5;
        PSS.init({c:c});

        var view1, view2, view3, view4, view5, view6;

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
            view4 = [
                {addr:"b", hopCount:1},
                {addr:"a", hopCount:2}
            ];
            view5 = [
                {addr:"b", hopCount:1}
            ];
            view6 = [
                {addr:"b", hopCount:1, profile:{c:1}},
                {addr:"a", hopCount:2, profile:{c:5}}
            ];
        });

        it("should merge distinct sets correctly", function(){
            var result = _.map(PSS.inner.merge(view1, view2), function(e){return e.addr});
            expect(result).toEqual(["H", "B", "G", "A", "E", "C","F","D"]);
        });

        it("should merge correctly (from bug)", function () {
            var result = PSS.inner.merge(view4,view5);
            expect(result).toEqual(view4);
        });

        it("should merge sets with equal elements correctly", function () {
            var result = PSS.inner.merge(view1, view3);
            expect(_.size(result)).toEqual(5);
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

        it("should select the right single head from [1]-Array", function(){
            var result = PSS.inner.head([{addr:"J", hopCount:1}], true);
            expect(result).toEqual("J");
        });

        it("should select the right single tail", function(){
            var result = PSS.inner.tail(view1, true);
            expect(result).toEqual("D");
        });

        it("should select the right head (lower bond)", function(){
            var result = _.pluck(PSS.inner.head(view3), "addr");
            expect(result).toEqual(["A","Q","B"]);
        });

        it("should select the right tail (lower bond)", function(){
            var result = _.pluck(PSS.inner.tail(view3), "addr");
            expect(result).toEqual(["B","Q","A"]);
        });

        it("should select the right head (upper bond)", function(){
            var result = _.pluck(PSS.inner.head(PSS.inner.merge(view1, view3)), "addr");
            expect(result).toEqual(["A","B","Q", "C", "D"]);
        });

        it("should select the right tail (upper bond)", function(){
            var result = _.pluck(PSS.inner.tail(PSS.inner.merge(view1, view3)), "addr");
            expect(result).toEqual(["D","C","Q", "B", "A"]);
        });

        it("should serialize empty list correctly", function () {
            var ser = PSS.inner.serialize;
            var des = PSS.inner.deserialize;
            expect(des(ser([]))).toEqual([]);
        });

        it("should serialize/deserialize symetrically", function () {
            var ser = PSS.inner.serialize;
            var des = PSS.inner.deserialize;
            expect(des(ser(view1))).toEqual(view1);
            expect(des(ser(view2))).toEqual(view2);
            expect(des(ser(view3))).toEqual(view3);
        });

        it("should serialize/deserialize symetrically with profile data", function () {
            var ser = PSS.inner.serialize;
            var des = PSS.inner.deserialize;
            var a = ser(view6);
            console.log(a);
            console.log(des(a))
            expect(des(ser(view6))).toEqual(view6);
        });

    });
});
