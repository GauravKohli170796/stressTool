var CBaseNode = require("../Classes/BaseNode").CBaseNode;
var RetVal = require("../Constants/RetVal");
var ExecutionResult = require("../Constants/ExecutionResult");
var StressToolWorker = require("../Classes/StressToolWorker");
var Utils = require("../Classes/Utils");
var CUtils = new Utils();
var UIHandler=require("../core/classes/UIHandler");
var CUIHandler=new UIHandler().getInstance();
class CDisplayDataEntry extends CBaseNode {
	constructor(DBAccessor) {
		super(DBAccessor);
		this.InputType;
		this.MaxLen;
		this.MinLen;
		this.DisplayMessage;
	}
}
CDisplayDataEntry.prototype.AddPrivateParameters = function (tagAttribute) {
	this.MaxLen = tagAttribute.MaxLen;
	this.MinLen = tagAttribute.MinLen;
	this.DisplayMessage = tagAttribute.DisplayMessage;
	return RetVal.RET_OK;
}
CDisplayDataEntry.prototype.execute = function () {
	var MiniPVMMap = StressToolWorker.mapMiniPVMEntryDataList;
	var iTag =parseInt(this.m_dwHostTlvtag.toString(16),10);
	var MiniPVMData = MiniPVMMap.get(iTag)
	if (MiniPVMData) {
		this.AddTLVDataWithTag(this.m_dwHostTlvtag, CUtils.String2Bytes(MiniPVMData), MiniPVMData.length);
	}
	else{
		var csMessage = "ClientID[" +this.m_pDBAccessor.m_sParamData.m_uchArrClientId+"] Didn't find required MiniPVM htl tag data";
		CUIHandler.log(csMessage);
		this.m_pDBAccessor.m_csResponseMssg ="Add Htl tag in STRESS_TEST_MINI_PVM_DATA_ENTRY_TBL";
		CBaseNode.bIsMiniPVMHtlDataNotPresent =true;

	}
	return ExecutionResult._OK;
}
module.exports = CDisplayDataEntry;