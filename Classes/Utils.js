var dateTime = require('node-datetime');
var util = require('util');
var encoder = new util.TextEncoder('utf-8');
var decoder = new util.TextDecoder('utf-8');
class CUtils {
    constructor() {
    }
}
CUtils.prototype.a2bcd = function (strsource) {
    var len = strsource.length;
    var bArrdest = new Int8Array(len / 2);
    var temp = new Int8Array(2);
    for (var i = 0; i < len; i += 2) {
        var temp = strsource.slice(i, i + 2);
        var inum = parseInt(temp, 16);
        bArrdest[i / 2] = inum;
    }
    if (bArrdest.length > 0) {
        return bArrdest;
    }
    else {
        return null;
    }
}
CUtils.prototype.String2Bytes = function (str) {
    if (str) {
        return (encoder.encode(str));
    }
    else {
        return (null);
    }
}
CUtils.prototype.Bytes2String = function (bArr) {
    if (bArr) {
        return (decoder.decode(bArr));
    }
    else {
        return ("");
    }
}
CUtils.prototype.StrLeftPad = function (strData, ilength, cPad) {
    return (strData.padStart(ilength, cPad));
}
CUtils.prototype.StrRightPad = function (strData, ilength, cPad) {
    return (strData.padEnd(ilength, cPad));
}
CUtils.prototype.bcd2a = function (bArrSource, iLen) {
    var hexArray = this.String2Bytes("0123456789ABCDEF");
    var hexChars = new Uint8Array(iLen * 2);
    for (var j = 0; j < iLen; j++) {
        var v = bArrSource[j] & 0xFF;
        hexChars[j * 2] = hexArray[v >>> 4];
        hexChars[j * 2 + 1] = hexArray[v & 0x0F];
    }
    return hexChars;
}
CUtils.prototype.SetCurrentDateTime = function () {
    var date = dateTime.create();
    var formattedDate = date.format('dmYHMS');
    return (formattedDate.toString());
}
CUtils.prototype.ArrayofObject = function (iLen, ObjectType) {
    var array = new Array();
    for (var i = 0; i < iLen; i++) {
        array.push(new ObjectType());
    }
    return (array);
}
CUtils.prototype.a2bcdh = function (bArrdest, bArrsrc, ilen) {
    var i, c;
    for (i = 0, c = 0; i < ilen; i += 2, c++) {
        var ch1 = 48, ch2 = 48;
        if (bArrsrc[i] >= 48 && bArrsrc[i] <= 57) {
            ch1 = bArrsrc[i] - 48;
        } else if (bArrsrc[i] >= 65 && bArrsrc[i] <= 70) {
            ch1 = bArrsrc[i] - 55;
        } else if (bArrsrc[i] >= 97 && bArrsrc[i] <= 102) {
            ch1 = bArrsrc[i] - 97 + 0xa;
        } else {
            return false;
        }
        if (bArrsrc[i + 1] >= 48 && bArrsrc[i + 1] <= 57) {
            ch2 = bArrsrc[i + 1] - 48;
        } else if (bArrsrc[i + 1] >= 65 && bArrsrc[i + 1] <= 70) {
            ch2 = bArrsrc[i + 1] - 55;
        } else if (bArrsrc[i] >= 97 && bArrsrc[i] <= 102) {
            ch2 = bArrsrc[i] - 97 + 0xa;
        } else {
            return false;
        }
        bArrdest[c] = (ch1 << 4) | (ch2 & 0x0F);
    }
    return true;
}
CUtils.prototype.Sleep = function (ms) {
    return new Promise((resolve, reject) => {
        setTimeout(function () { resolve(true); }, ms);
    });
}
CUtils.prototype.SavePrintDump = function (szData, iLength) {
    //To Do Coding of function later.   
}
module.exports = CUtils;
