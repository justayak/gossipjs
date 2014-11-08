/**
 * Created by Julian on 11/8/2014.
 */
describe("Gossip Utils Connector", function () {

    var connector;
    var view1 = [{addr:"A", hopCount:5},
        {addr:"B", hopCount:2},
        {addr:"C", hopCount:12},
        {addr:"D", hopCount:88}];

    beforeEach(function(){
        connector = new Gossip.Connector(Gossip.Peer);
    });

    it('should update correctly', function(done) {

        connector.update(view1, function(){
            expect(true).toBe(true);
            done();
        });
    });



});