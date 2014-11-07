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
});