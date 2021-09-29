var CBaseNode = require("../Classes/BaseNode").CBaseNode;
var RetVal = require("../Constants/RetVal");
var ExecutionResult = require("../Constants/ExecutionResult");
var Actions = require("../Constants/Actions");
class CDisplayEventReceived extends CBaseNode {
    constructor(DBAccessor) {
        super(DBAccessor);
        this.EventOfNode;
        this.HardwareMaskReceived;
        this.DisplayMessage;
    }
}
CDisplayEventReceived.prototype.AddPrivateParameters = function (tagAttribute) {
    this.m_ActionOnOk = Actions.gotoChild;
    this.EventOfNode = tagAttribute.EventMask;
    this.DisplayMessage = tagAttribute.DisplayMessage;
    return RetVal.RET_OK;
}
CDisplayEventReceived.prototype.execute = function () {
    this.AddAmountFromXmlinTlV();
    return ExecutionResult._OK;
}
CDisplayEventReceived.prototype.GetEventMask = function () {
    return this.EventOfNode;
}
CDisplayEventReceived.prototype.SetHardwareMask = function (iHardWareMask) {
    this.HardwareMaskReceived = iHardWareMask;
    return true;
}
CDisplayEventReceived.prototype.handleBarCodeEvent = function () {
}
CDisplayEventReceived.prototype.handleSwipeEvent = function () {
}
module.exports = CDisplayEventReceived;