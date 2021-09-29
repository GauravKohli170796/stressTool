var CBaseNode = require("../Classes/BaseNode").CBaseNode;
var RetVal = require("../Constants/RetVal");
var ExecutionResult = require("../Constants/ExecutionResult");
var Actions = require("../Constants/Actions");
class CDisplayMenuItem extends CBaseNode {
	constructor(dbAccessor) {
		super(dbAccessor);
		this.ItemName;
		this.ItemIndex;
	}
}
CDisplayMenuItem.prototype.AddPrivateParameters = function (tagAttribute) {
	this.m_ActionOnOk = Actions.gotoChild;
	this.ItemName = tagAttribute.ItemName;
	this.ItemIndex = tagAttribute.ItemIndex;
	return RetVal.RET_OK;
}
CDisplayMenuItem.prototype.execute = function () {
	this.AddAmountFromXmlinTlV();
	return ExecutionResult._OK;
}
CDisplayMenuItem.prototype.GetIndex = function () {
	return this.ItemIndex;
}
module.exports = CDisplayMenuItem;