var CBaseNode = require("../Classes/BaseNode").CBaseNode;
var RetVal = require("../Constants/RetVal");
var ExecutionResult = require("../Constants/ExecutionResult");
var Structs = require("../CommonStructures/StructClasses");
var StressToolWorker = require("../Classes/StressToolWorker");
var Consts = require("../Constants/AppConsts");
var Utils = require("../Classes/Utils");
var CUtils = new Utils();
var UIHandler=require("../core/classes/UIHandler");
var CUIHandler=new UIHandler().getInstance();
var SocketEvents=require("../core/Constants/SocketEvents");
class CDisplayMenuList extends CBaseNode {
	constructor(dbAccessor) {
		super(dbAccessor);
		this.numberOFItemsInMenuList = 0;
		this.Title;  	//Title of the Menu window.
		this.sel_index = 0;
		this.ItemList;// new Structs.Itemval();
	}
}
CDisplayMenuList.prototype.AddPrivateParameters = function (tagAttribute) {
	//Added by gaurav Kohli for UI
	this.numberOFItemsInMenuList = tagAttribute.numberOFItemsInMenuList;
	this.ItemList=CUtils.ArrayofObject(this.numberOFItemsInMenuList, Structs.Itemval)
	for (var itemnu = 0; itemnu < this.numberOFItemsInMenuList; itemnu++) {
		if (tagAttribute.ItemList[itemnu] !=null) {
			this.ParseItems(tagAttribute.ItemList[itemnu],this.ItemList[itemnu]);
		}
	}
	//////////////////////////////////

      return RetVal.RET_OK;
}
CDisplayMenuList.prototype.execute =async function () {
	// var MiniPVMMap = StressToolWorker.mapMiniPVMEntryDataList;
	// var iTag =parseInt(this.m_dwHostTlvtag.toString(16),10);
	// var MiniPVMData = MiniPVMMap.get(iTag)
	// if (MiniPVMData) {
	// 	this.AddTLVDataWithTag(this.m_dwHostTlvtag, CUtils.String2Bytes(MiniPVMData), MiniPVMData.length);
	// }
	// else{
	// 	var csMessage = "ClientID[" +this.m_pDBAccessor.m_sParamData.m_uchArrClientId+"] Didn't find required MiniPVM htl tag data";
	// 	CUIHandler.log(csMessage);
	// 	this.m_pDBAccessor.m_csResponseMssg ="Please add Htl tag in STRESS_TEST_MINI_PVM_DATA_ENTRY_TBL";
	// 	CBaseNode.bIsMiniPVMHtlDataNotPresent=true;

	// }
	var MenuList=[];
	for(var i=0;i<this.numberOFItemsInMenuList;i++)
	{
		MenuList[i]=this.ItemList[i].ItemName;

	}
	CUIHandler.socket.emit(SocketEvents.MiniPVMSetMenuUIEvent,MenuList);
	var iPosition=await CUIHandler.GetMiniPVMUIEnteredData();
	var MiniPVMData=(this.ItemList[iPosition].ItemVal).toString();
	this.AddTLVDataWithTag(this.m_dwHostTlvtag, CUtils.String2Bytes(MiniPVMData), MiniPVMData.length);
    return ExecutionResult._OK;
}
CDisplayMenuList.prototype.DisplayMenuList = function (tagAttribute) {
	var currentChild = new CBaseNode();
	var i = 0;
	var SettingsMenu = [];
	for (i = 1; i <= this.m_nNumberOfChild; i++) {
		currentChild = this.GotoIndexedChild(i);
		SettingsMenu[i - 1] = currentChild.GetName();
	}
	return 0;
}
CDisplayMenuList.prototype.ParseItems = function (ItemList, item) {
	var strPart = "";
	strPart =ItemList.split(",");
	if (strPart=="") {
		return RetVal.RET_NOT_OK;
	}
	var t=strPart[0];
	item.ItemName =strPart[0];
	if (!strPart[1]) {
		strPart[1] = item.ItemName;
	}
	item.ItemVal =strPart[1];
	return RetVal.RET_OK;
}
module.exports = CDisplayMenuList;