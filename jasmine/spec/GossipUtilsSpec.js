function sendMessageToConnector(connector, msg, id) {
    var peer = connector.peer;
    var conn = {
        on : function (id,cb) {
            var callbacks;
            if (id in this.callbacks){
                this.callbacks[id].push(cb);
            } else {
                this.callbacks[id] = [cb];
            }
        },
        peer: id,
        callbacks: {}
    };
    executeCallback("connection", conn, peer.callbacks);
    setTimeout(function () {
        executeCallback("data", msg, conn.callbacks);
    }, 200);
};
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
        connector.update(view1, function(view){
            expect(true).toBe(true);
            done();
        });
    });

    it('should get a message', function (done) {
        connector.onMessage(function (id, msg) {
            expect(id).toBe("Q");
            expect(msg.msg).toBe("hallo welt");
            done();
        });
        sendMessageToConnector(connector, {msg:"hallo welt"}, "Q");
    });


});