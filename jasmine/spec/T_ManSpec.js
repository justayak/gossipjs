/**
 * Created by Julian on 11/11/2014.
 */
define([
    "protocol/t_man",
    "config"
], function(TMan, Config){

    describe("T-Man", function () {


        Config.testingEnv(true);

        TMan.init({
            profile: 5,
            rankingFunc: function (x, list) {
                return list;
            }
        });

        var view1, view2, view3;

        beforeEach(function () {
            view1 = [
                {addr:"A", profile:1},
                {addr:"B", profile:5},
                {addr:"C", profile:2},
                {addr:"D", profile:6}
            ];
            view2 = [
                {addr:"E", profile:1},
                {addr:"F", profile:5},
                {addr:"G", profile:2},
                {addr:"H", profile:6}
            ];

            view3 = [
                {addr:"Z", profile:1},
                {addr:"B", profile:5}
                ]
        });

        it("should merge correct", function () {
            var result = TMan.inner.merge(view1,view2);
            expect(_.pluck(result, "addr")).toEqual(["A","B","C","D","E","F","G","H"]);
        });

        it("should merge correct (intersect)", function () {
            var result = TMan.inner.merge(view1,view3);
            expect(_.pluck(result, "addr")).toEqual(["A","B","C","D","Z"]);
        });


    });




});