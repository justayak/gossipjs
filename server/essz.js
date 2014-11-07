/**
 * Created by Julian on 10/23/2014.
 */
(function(exports){

    "use strict";

    // == HASH LIST

    /**
     *
     * @type {HashList}
     */
    var HashList = exports.HashList = function () {
        if (! (this instanceof HashList)) return new HashList();
        this.values = {};
    };

    HashList.prototype.has = function(key){
        return key in this.values;
    };

    HashList.prototype.put = function (key, value) {
        this.values[key] = value;
        return this;
    };

    HashList.prototype.remove = function (key) {
        delete this.values[key];
        return this;
    };

    HashList.prototype.get = function (key) {
        return this.values[key];
    };

    /**
     * Fisher-Yates-shuffle
     * @param n
     * @returns {Array}
     */
    HashList.prototype.sample = function (n) {
        var keys = Object.keys(this.values);
        var s = keys.length-1;
        var m = n > keys.length ? keys.length : n;

        var result = [], j, i = 0, V = this.values;
        for(;i < m; i++){
            j = getRandomInt(i,s);
            swap(keys,i,j);
            result.push(V[keys[i]]);
        }
        return result;
    };

    HashList.prototype.at = function(index){
        var keys = Object.keys(this.values);
        if (index < 0 || index >= keys.length) throw "HashList: OutOfBounds";
        return this.values[keys[index]];
    };

    HashList.prototype.size = function () {
        return Object.keys(this.values).length;
    };

    function swap(array, i, j) {
        if (i !== j) {
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     *
     * @type {BitMatrix2D}
     */
    var BitMatrix2D = exports.BitMatrix2D = function(w,h){
        // we have to align w to the size of byte..
        var remainder = w % 8;
        if (remainder !== 0) {
            w = w + 8 - remainder;
        }
        w = Math.ceil(w / 8);
        var buffer = new ArrayBuffer(w * h);
        this.data = new Uint8Array(buffer);
        this.bytePerRow = w;
        this.h = h;
    };

    BitMatrix2D.prototype.set = function(x,y){
        var bytePos = this.bytePerRow * y;
        var lineAdd = x / 8;
        lineAdd = lineAdd|lineAdd; // fast floor
        var bit = x % 8;
        var pos = bytePos + lineAdd;
        var n = this.data[pos];
        var mask = 1 << bit;
        n |= mask;
        this.data[pos] = n;
        return this;
    };

    BitMatrix2D.prototype.clear = function(x,y){
        var bytePos = this.bytePerRow * y;
        var lineAdd = x / 8;
        lineAdd = lineAdd|lineAdd;
        var bit = x % 8;
        var pos = bytePos + lineAdd;
        var n = this.data[pos];
        var mask = 1 << bit;
        n &= ~mask;
        this.data[pos] = n;
        return this;
    };

    BitMatrix2D.prototype.test = function(x,y) {
        var bytePos = this.bytePerRow * y;
        var lineAdd = x / 8;
        lineAdd = lineAdd|lineAdd;
        var bit = x % 8;
        var pos = bytePos + lineAdd;
        var n = this.data[pos];
        var mask = 1 << bit;
        return ((n&mask) !== 0);
    };

    BitMatrix2D.prototype.debug = function(options){
        if (typeof options === "undefined") options = {};
        var lineBreak = options.lineBreak || "\n";
        var bit8sign = options.bit8 || "";
        var bit4sign = options.bit4 || "";
        var result = "";
        for (var y = 0; y < this.h;y++){
            for (var x = 0; x < (this.bytePerRow * 8);x++){
                if (x%8===0){
                    result += " ";
                }else if (x%4===0){
                    result += bit4sign;
                }
                result += (this.test(x,y) ? "1" : "0");
            }
            result +=lineBreak;
        }
        return result;
    };

    var IntMatrix2D = exports.IntMatrix2D = function(w,h){
        var buffer = new ArrayBuffer(w*h*4);
        this.data = new Int32Array(buffer);
        this.w = w;
        this.h = h;
    };

    IntMatrix2D.prototype.get = function(x,y){
        var pos = (y*this.w) + x;
        return this.data[pos];
    };

    IntMatrix2D.prototype.set = function(x,y,value){
        var pos = (y*this.w) + x;
        this.data[pos] = value;
        return this;
    };

    IntMatrix2D.prototype.setField = function(x,y,w,h,value){
        var data = this.data;
        var thisw = this.w;
        for (var Y = 0; Y < h; Y++){
            for (var X = 0; X < w; X++){
                var pos = ((y + Y) * thisw) + (x + X);
                data[pos] = value;
            }
        }
    };

    IntMatrix2D.prototype.hasValue = function(value, x, y, width, height){
        if ((width === undefined || height === undefined) ||
            (width === 1 && height === 1)) {
            return this.get(x, y) === value;
        } else {
            for (var h = 0; h < height; h++){
                for (var w = 0; w < width; w++){
                    if (this.get(x+w,y+h) === value){
                        return true;
                    }
                }
            }
            return false;
        }
    };

    IntMatrix2D.prototype.debug = function(){
        var newLine = "\n";
        var result = "";
        for (var y = -1; y < this.h;y++){
            for (var x = -1; x < this.w;x++){
                if (y === -1 && x === -1 ){
                    result = "\t\t";
                }else if (y === -1){
                    result += "|\t" + "<" + x + ">\t";
                }else if (x === -1 ){
                    result += "|\t" + "<" + y + ">\t";
                }else{
                    var pos = (y*this.w) + x;
                    result += "|\t" + this.data[pos] + "\t";
                }
            }
            result += newLine;
        }
        return result;
    };

})(typeof exports === 'undefined' ? this['essz'] = {} : exports);