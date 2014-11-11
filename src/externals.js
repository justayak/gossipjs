/**
 * Created by Baka on 11/11/2014.
 */
define([], function () {

    window.TxtLoader = function() {
        function h(a) {
            var f = {};
            return a && "[object Function]" === f.toString.call(a);
        }
        function k(a) {
            if ("undefined" === typeof a) {
                throw "TxtLoader: get - options are mandatory";
            }
            if ("undefined" === typeof a.success) {
                throw "TxtLoader: No success-callback set";
            }
            if (!h(a.success)) {
                throw "TxtLoader: success must be a function";
            }
            var f = a.success, c = null;
            "failure" in a && h(a.failure) && (c = a.failure);
            var d = this;
            "undefined" !== typeof a.ctx && (d = a.ctx);
            var e = "application/json";
            "undefined" !== typeof a.mime && (e = a.mime);
            return{ctx:d, success:f, fail:c, mime:e};
        }
        if ("undefined" === typeof XMLHttpRequest) {
            throw "TxtLoader: TxtLoader is not supported by this browser";
        }
        return{get:function(a, f) {
            var c = k(f), d = c.ctx, e = c.fail, g = c.success, b = new XMLHttpRequest;
            b.open("GET", a);
            b.onreadystatechange = function() {
                200 !== b.status ? null !== e && 2 === b.readyState && e.call(d, b.status) : 4 === b.readyState && g.call(d, b.responseText);
            };
            b.send();
        }, post:function(a, f, c) {
            c = k(c);
            var d = c.ctx, e = c.fail, g = c.success, b = new XMLHttpRequest;
            b.setRequestHeader("Content-type", c.mime);
            b.open("POST", a, !0);
            b.onreadystatechange = function() {
                200 !== b.status ? null !== e && 2 === b.readyState && e.call(d, b.status) : 4 === b.readyState && g.call(d, b.responseText);
            };
            b.send(f);
        }};
    }();

});