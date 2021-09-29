var CBaseNode = require("../Classes/BaseNode").CBaseNode;
var RetVal = require("../Constants/RetVal");
var ExecutionResult = require("../Constants/ExecutionResult");
var SocketEvents=require("../core/Constants/SocketEvents");
var UIHandler=require("../core/classes/UIHandler");
var CUIHandler=new UIHandler().getInstance();
var Utils=require("../Classes/Utils");
var CUtils=new Utils();
class CDisplayGetAmount extends CBaseNode {
    constructor(DBAccessor) {
        super(DBAccessor);
        this.MaxLen;
        this.MinLen;
        this.DisplayMessage;
        this.CurrencyName;
        this.Decimals;
    }
}
CDisplayGetAmount.prototype.AddPrivateParameters = function (tagAttribute) {
    this.MaxLen = tagAttribute.MaxLen;
    this.MinLen = tagAttribute.MinLen;
    this.Decimals = tagAttribute.Decimals;
    this.DisplayMessage = tagAttribute.DisplayMessage;
    this.CurrencyName = tagAttribute.CurrencyName
    return RetVal.RET_OK;
}
CDisplayGetAmount.prototype.execute =async function () {
    CUIHandler.socket.emit(SocketEvents.MiniPVMAmountEvent);
    var strEnteredAmountFromUI=await CUIHandler.GetMiniPVMUIEnteredData();
    //this.m_dAmt=CUtils.String2Bytes(strEnteredAmountFromUI);
    this.AddTLVDataWithInput(strEnteredAmountFromUI);
    //this.AddTLVData();
    return ExecutionResult._OK;
}
module.exports = CDisplayGetAmount;