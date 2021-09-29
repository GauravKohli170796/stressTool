var CBaseNode = require("../Classes/BaseNode").CBaseNode;
var RetVal = require("../Constants/RetVal");
var ExecutionResult = require("../Constants/ExecutionResult");
class CDisplayWait extends CBaseNode {
	constructor(DBAccessor) {
		super(DBAccessor);
		this.EventMask = 0;
		this.DisplayMessage;
		this.EventReceived = 0;
		this.HardwareMaskReceived = 0;
	}
}
CDisplayWait.prototype.AddPrivateParameters = function (tagAttribute) {
	this.EventMask = tagAttribute.EventMask;
	this.DisplayMessage = tagAttribute.DisplayMessage;
	return RetVal.RET_OK;
}
CDisplayWait.prototype.execute = function () {
	this.AddAmountFromXmlinTlV();
	return ExecutionResult._OK;
}
CDisplayWait.prototype.GotoChild = function () {
	return this.GotoChildIndex(this.EventReceived);
}
CDisplayWait.prototype.GotoChildIndex = function (iIndex) {
	var CurrentChild = this.m_pChild;
	var retNode = null;
	var bContinue = true;
	if (null == CurrentChild) {
		return null;
	}
	else {
		while(CurrentChild!=null && bContinue)
		{
		if (CurrentChild.m_pThisNode.GetEventMask() & iIndex) {
			retNode = CurrentChild.m_pThisNode;
			CurrentChild.m_pThisNode.SetHardwareMask(this.HardwareMaskReceived);
			bContinue = false;
			break;
		}
		else {
			CurrentChild = CurrentChild.m_pNextChild;
		}
		}
	}
	return retNode;
}
module.exports = CDisplayWait;