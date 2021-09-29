var CBaseNode = require("../Classes/BaseNode").CBaseNode;
var RetVal = require("../Constants/RetVal");
var ExecutionResult = require("../Constants/ExecutionResult");
var UIHandler=require("../core/classes/UIHandler");
var SocketEvents=require("../core/Constants/SocketEvents");
var CUIHandler=new UIHandler().getInstance();
var SettingsMenu=[];
class CDisplayMenu extends CBaseNode {
	constructor(dbAccessor) {
		super(dbAccessor);
		this.numMenuItems = 0;
		this.Title;
		this.sel_index =0;
	}
}
CDisplayMenu.prototype.AddPrivateParameters = function (tagAttribute) {
	this.Title = tagAttribute.Title;
	return RetVal.RET_OK;
}
CDisplayMenu.prototype.execute =async function () {
	this.DisplayMenuList();
	CUIHandler.socket.emit(SocketEvents.MiniPVMSetMenuUIEvent,SettingsMenu);
	var iPosition=await CUIHandler.GetMiniPVMUIEnteredData();
	if(iPosition!=undefined){
	this.sel_index=(parseInt(iPosition)+1);
     }
    return ExecutionResult._OK;
	
}
CDisplayMenu.prototype.DisplayMenuList = function () {
	var currentChild = new CBaseNode();
	var i = 0;
	SettingsMenu =[];
	for (i = 1; i <= this.m_nNumberOfChild; i++) {
		currentChild = this.GotoChildIndex(i);
		SettingsMenu[i - 1] =currentChild.GetName();
	}
	return 0;
}
CDisplayMenu.prototype.GotoChild = function () {
	return this.GotoChildIndex(this.sel_index);
}
CDisplayMenu.prototype.GotoChildIndex = function (iIndex) {
	if (null == this.m_pChild) {
		return null;
	}
	else {
		return (this.m_pChild.GotoIndexedChild(iIndex));
	}
}
CDisplayMenu.prototype.GetTitle = function (tagAttribute) {
}
module.exports = CDisplayMenu;
