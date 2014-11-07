/**
 * Created by Julian on 11/7/2014.
 */
describe("PeerSamplingService", function () {

    Gossip.PeerSamplingService.init({c: 5});

    var view1 = [{addr:"A", hopCount:5},
        {addr:"B", hopCount:2},
        {addr:"C", hopCount:12},
        {addr:"D", hopCount:88}];

    var view2 = [{addr:"E", hopCount:7},
        {addr:"F", hopCount:29},
        {addr:"G", hopCount:3},
        {addr:"H", hopCount:1}];

    it("should merge correctly", function(){
        var result = _.map(Gossip.PeerSamplingService.inner.merge(view1, view2), function(e){return e.addr});
        expect(result).toEqual(["H", "B", "G", "A", "E"]);
    });
});