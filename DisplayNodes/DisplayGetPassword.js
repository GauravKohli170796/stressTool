var CBaseNode = require("../Classes/BaseNode").CBaseNode;
var RetVal = require("../Constants/RetVal");
var ExecutionResult = require("../Constants/ExecutionResult");
var SocketEvents=require("../core/Constants/SocketEvents");
var UIHandler=require("../core/classes/UIHandler");
var CUIHandler=new UIHandler().getInstance();
class CDisplayGetPassword extends CBaseNode {
    constructor(DBAccessor) {
        super(DBAccessor);
        this.InputType;
        this.MaxLen;
        this.MinLen;
        this.DisplayMessage;
    }
}
CDisplayGetPassword.prototype.AddPrivateParameters = function (tagAttribute) {
    this.MaxLen = tagAttribute.MaxLen;
    this.MinLen = tagAttribute.MinLen;
    this.DisplayMessage = tagAttribute.DisplayMessage;
    return RetVal.RET_OK;
}
CDisplayGetPassword.prototype.execute =async function () {
    CUIHandler.socket.emit(SocketEvents.MiniPVMPasswordEvent);
    var strEnteredPasswordFromUI=await CUIHandler.GetMiniPVMUIEnteredData();
    this.AddTLVDataWithInput(strEnteredPasswordFromUI);
    this.AddAmountFromXmlinTlV();
    return ExecutionResult._OK;
}
module.exports = CDisplayGetPassword;