/**
 * Created by Julian on 11/7/2014.
 */
describe("PeerSamplingService", function () {

    Gossip.PeerSamplingService.init({c: 5});

    var view1;
    var view2;
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
    });

    it("should merge correctly", function(){
        var result = _.map(PSS.inner.merge(view1, view2), function(e){return e.addr});
        expect(result).toEqual(["H", "B", "G", "A", "E"]);
    });

    it("should increment correctly", function () {
        var result = _.indexBy(PSS.inner.increaseHopCount(view1), function (e) {return e.addr});
        expect(result["A"].hopCount).toEqual(6);
        expect(result["B"].hopCount).toEqual(3);
        expect(result["C"].hopCount).toEqual(13);
        expect(result["D"].hopCount).toEqual(89);
    });
});