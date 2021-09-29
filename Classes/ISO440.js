var CISOMsg = require("./ISOMsg");
var Consts = require("../Constants/AppConsts");
var Utils = require("./Utils");
var CUtils = new Utils();
class CISO440 extends CISOMsg {
    constructor(dbAccessor) {
        super(dbAccessor);
    }
}
CISO440.prototype.CISO440C = function (chTerminalId, iTerminalIdLen, chNII) {
    this.CISOMsgC(chTerminalId, iTerminalIdLen, chNII);
}
CISO440.prototype.packIt = function (sendee) {
    this.msgno = Consts.ACTIVATIONREQ;
    return (this.packItHost(sendee));
}
CISO440.prototype.SetActivationRequestData = function () {
    this.addField(3, Consts.PC_ONLINE_TRANSACTION_REQ, true);
    this.vFnSetTerminalActivationFlag(true);
}
CISO440.prototype.bFnGetTokenData = function (chTID, chMID) {
}
CISO440.prototype.bFnGetTokenDataForHUB = function () {
    if (this.bitmap[47 - 1]) {
        var pField47Data = this.data[47 - 1];
        var lenField47Data = this.len[47 - 1];
        var iOffset = 0;
        if (lenField47Data < 2) {
            return false;
        }
        var lenClientID = 0;
        lenClientID = pField47Data[iOffset++];
        this.dbAccessor.m_sParamData.m_uchArrClientId = CUtils.Bytes2String(pField47Data.slice(iOffset, lenClientID + 1));
        iOffset += lenClientID;
        var lenSecurityToken = 0;
        this.dbAccessor.m_sParamData.m_chsTokenData = pField47Data.slice(iOffset, lenSecurityToken);
        iOffset += lenSecurityToken;
    }
    else {
        return false;
    }
    if (this.bitmap[51 - 1]) {
        var pTerminalId = this.data[51 - 1];
        var lengthLocal = this.len[51 - 1];
        this.dbAccessor.m_sParamData.m_uchArrGUID = CUtils.Bytes2String(pTerminalId.slice(0, lengthLocal));
    } else {
        return false;
    }
    this.vFnSetTerminalActivationFlag(false);
    return true;
}
module.exports = CISO440;
