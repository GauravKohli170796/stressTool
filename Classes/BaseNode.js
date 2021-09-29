var Actions = require("../Constants/Actions");
var RetVal = require("../Constants/RetVal");
var Consts = require("../Constants/AppConsts");
var NodeType = require("../Constants/NodeType");
var ExecutionResult = require("../Constants/ExecutionResult");
var ISO220 = require("./ISO220");
var Utils = require("../Classes/Utils");
var CUtils = new Utils();
exports.bIsMiniPVMHtlDataNotPresent=false;//added by gaurav to prevent going online if tag data is not found from its respective table.
class CChildList {
	constructor(iIndex) {
		this.m_nIndex = iIndex;
		this.m_pNextChild = null;
		this.m_pPreviousChild = null;
		this.m_pThisNode = null;
	}
}
CChildList.prototype.AddChild = function (iIndex, addThisNode) {
	var retVal = RetVal.RET_OK;
	var tmpNode, thisNode;
	thisNode = new CChildList(iIndex);
	thisNode.m_nIndex = iIndex;
	tmpNode = this;
	while (tmpNode.m_pNextChild != null) {
		tmpNode = tmpNode.m_pNextChild;
	}
	thisNode.m_pThisNode = addThisNode;
	thisNode.m_pPreviousChild = tmpNode;
	tmpNode.m_pNextChild = thisNode;
	return retVal;
}
CChildList.prototype.GotoIndexedChild = function (iIndex) {
	var currentNode = this;
	if (currentNode) {
		while (currentNode != null) {
			if (currentNode.m_nIndex == iIndex) {
				return currentNode.m_pThisNode;
			}
			else {
				currentNode = currentNode.m_pNextChild;
			}
		}
	}
	return null;
}
CChildList.prototype.GotoPreviousChild = function () {
	if (this.m_pPreviousChild) {
		return (this.m_pPreviousChild.m_pThisNode);
	}
	else {
		return null;
	}
}
class CBaseNode {
	constructor(DBAccessor) {
		this.m_szName = new Int8Array(20);
		this.m_NodeType = NodeType.Invalid_node;
		this.m_nNumberOfChild = 0;
		this.m_pChild = null;
		this.m_nTimeout = 0;
		this.m_dwHostTlvtag = 0;
		this.m_dwHostActiontag = 0;
		this.m_IsOnSSL = 0;
		this.m_dAmt = Consts.cnInvalidAmt;
		this.m_pDBAccessor = DBAccessor;
		this.m_pParentNode = null;
		this.m_ActionOnOk = Actions.gotoChild;
		this.m_ActionOnCancel = Actions.goBack;
		this.m_ActionOnExit = Actions.gotoRoot;
		this.m_ActionOnTimeout = Actions.gotoRoot;
	}
}
CBaseNode.prototype.AddParameters = function (tagAttribute) {
	var retVal = RetVal.RET_NOT_OK;
	this.m_NodeType = tagAttribute.node_type;
	retVal = RetVal.RET_OK;
	this.m_szName = tagAttribute.iName;
	this.m_nTimeout = tagAttribute.Timeout;
	this.m_ActionOnOk = tagAttribute.onOk;
	this.m_ActionOnCancel = tagAttribute.onCancel;
	this.m_ActionOnTimeout = tagAttribute.onTimeout;
	this.m_dwHostActiontag = tagAttribute.HostActiontag;
	this.m_dwHostTlvtag = tagAttribute.HostTlvtag;
	this.m_IsOnSSL = tagAttribute.IsOnSSL;
	if (tagAttribute.m_chArrAmount) {
		this.m_dAmt = tagAttribute.m_chArrAmount;
	}
	else {
		this.m_dAmt = -1;
	}
	if (RetVal.RET_OK == retVal) {
		retVal = this.AddPrivateParameters(tagAttribute);
	}
	return RetVal.RET_OK;
}
CBaseNode.prototype.GetNumChild = function () {
	return this.m_nNumberOfChild;
}
CBaseNode.prototype.GetNodeType = function () {
	return this.m_NodeType;
}
CBaseNode.prototype.run =async function () {
	switch (await this.execute()) {
		case ExecutionResult._OK:
			return (this.OnOk());
		case ExecutionResult._CANCEL:
			return (this.OnCancel());
		case ExecutionResult._EXIT:
			return (this.OnExit());
		case ExecutionResult._TIMEOUT:
			return (this.OnTimeOut());
	}
	return null;
}
CBaseNode.prototype.AddAmountFromXmlinTlV = function () {
	if (!this.m_pDBAccessor || (Consts.cnInvalidAmt == this.m_dAmt)) {
		return;
	}
	const iAmtLen = this.m_dAmt.length;
	var bIsAmountAlreadyPresent = false;
	var iTLVindex = this.IsAmountAlreadyPresent();
	if (0 == iTLVindex) {
		iTLVindex = this.m_pDBAccessor.m_sTxnTLVData.iTLVindex;
	}
	else {
		bIsAmountAlreadyPresent = true;
	}
	if (this.m_pDBAccessor.m_sTxnTLVData.iTLVindex < Consts.MAX_TXN_STEPS_WITH_TLV_DATA) {
		if (!bIsAmountAlreadyPresent) {
			this.m_pDBAccessor.m_sTxnTLVData.objTLV[iTLVindex].uiTag = Consts.cnAmtTag2;
			this.m_pDBAccessor.m_sTxnTLVData.objTLV[iTLVindex].uiTagValLen = iAmtLen;
			this.m_pDBAccessor.m_sTxnTLVData.objTLV[iTLVindex].chArrTagVal = this.m_dAmt;
			this.m_pDBAccessor.m_sTxnTLVData.iTLVindex++;
		}
		else {
			this.m_pDBAccessor.m_sTxnTLVData.objTLV[iTLVindex].chArrTagVal = this.m_dAmt;
		}
	}
}
CBaseNode.prototype.GetName = function () {
	return CUtils.Bytes2String(this.m_szName);
}
CBaseNode.prototype.GetEventMask = function () {
	return 0;
}
CBaseNode.prototype.SetHardwareMask = function (iHardWareMask) {
	return 0;
}
CBaseNode.prototype.AddChild = function (/*CBaseNode*/addThisNode) {
	var retVal = RetVal.RET_OK;
	if (null == this.m_pChild) {
		this.m_pChild = new CChildList(0);
		this.m_pChild.m_pThisNode = addThisNode;
		this.m_pChild.m_nIndex = addThisNode.GetIndex();
	}
	else {
		retVal = this.m_pChild.AddChild(addThisNode.GetIndex(), addThisNode);
	}
	++this.m_nNumberOfChild;
	return retVal;
}
CBaseNode.prototype.AddParent = function (/*CBaseNode*/cparentNode) {
	this.m_pParentNode = cparentNode;
	return RetVal.RET_OK;
}
CBaseNode.prototype.GetIndex = function () {
	return 0;
}
CBaseNode.prototype.AddTLVData = function () {
	if (!this.m_pDBAccessor)
		return;
	const iAmtLen = this.m_dAmt.length;
	if ((iAmtLen > 0) && (this.m_dwHostTlvtag > 0) && (this.m_pDBAccessor.m_sTxnTLVData.iTLVindex < Consts.MAX_TXN_STEPS_WITH_TLV_DATA)) {
		this.m_pDBAccessor.m_sTxnTLVData.objTLV[this.m_pDBAccessor.m_sTxnTLVData.iTLVindex].uiTag = this.m_dwHostTlvtag;
		this.m_pDBAccessor.m_sTxnTLVData.objTLV[this.m_pDBAccessor.m_sTxnTLVData.iTLVindex].uiTagValLen = iAmtLen;
		this.m_pDBAccessor.m_sTxnTLVData.objTLV[this.m_pDBAccessor.m_sTxnTLVData.iTLVindex].chArrTagVal = this.m_dAmt;
		this.m_pDBAccessor.m_sTxnTLVData.iTLVindex++;
	}
}
CBaseNode.prototype.AddTLVDataWithTag = function (uiTag, chArrData, ilength) {
	if ((ilength > 0) && (uiTag > 0) && (this.m_pDBAccessor.m_sTxnTLVData.iTLVindex < Consts.MAX_TXN_STEPS_WITH_TLV_DATA)) {
		this.m_pDBAccessor.m_sTxnTLVData.objTLV[this.m_pDBAccessor.m_sTxnTLVData.iTLVindex].uiTag = uiTag;
		this.m_pDBAccessor.m_sTxnTLVData.objTLV[this.m_pDBAccessor.m_sTxnTLVData.iTLVindex].uiTagValLen = ilength;
		this.m_pDBAccessor.m_sTxnTLVData.objTLV[this.m_pDBAccessor.m_sTxnTLVData.iTLVindex].chArrTagVal = chArrData;
		this.m_pDBAccessor.m_sTxnTLVData.iTLVindex++;
	}
}
CBaseNode.prototype.AddTLVDataWithInput=function (strData)//Name Changed Because function overloading is not supported by nodejs
{
	if (!this.m_pDBAccessor)
		return;
	const iLen = strData.length;
	if ((iLen > 0) && (this.m_dwHostTlvtag > 0) && (this.m_pDBAccessor.m_sTxnTLVData.iTLVindex < Consts.MAX_TXN_STEPS_WITH_TLV_DATA)) {
		this.m_pDBAccessor.m_sTxnTLVData.objTLV[this.m_pDBAccessor.m_sTxnTLVData.iTLVindex].uiTag = this.m_dwHostTlvtag;
		this.m_pDBAccessor.m_sTxnTLVData.objTLV[this.m_pDBAccessor.m_sTxnTLVData.iTLVindex].uiTagValLen = iLen;
		this.m_pDBAccessor.m_sTxnTLVData.objTLV[this.m_pDBAccessor.m_sTxnTLVData.iTLVindex].chArrTagVal = CUtils.String2Bytes(strData);
		this.m_pDBAccessor.m_sTxnTLVData.iTLVindex++;
	}
}
CBaseNode.prototype.IsAmountAlreadyPresent = function () {
	if (!this.m_pDBAccessor)
		return 0;
	var retIndex = 0;
	for (var nIndex = 0; nIndex < this.m_pDBAccessor.m_sTxnTLVData.iTLVindex; ++nIndex) {
		if (Consts.cnAmtTag1 == this.m_pDBAccessor.m_sTxnTLVData.objTLV[nIndex].uiTag) {
			retIndex = nIndex;
			break;
		}
		if (Consts.cnAmtTag2 == this.m_pDBAccessor.m_sTxnTLVData.objTLV[nIndex].uiTag) {
			retIndex = nIndex;
			break;
		}
	}
	return retIndex;
}
CBaseNode.prototype.OnOk = function () {
	switch (this.m_ActionOnOk) {
		case Actions.gotoChild:
			return (this.GotoChild());
			break;
		case Actions.goBack:
			return (this.GotoParent());
			break;
		case Actions.gotoRoot:
			return (this.GotoRoot());
			break;
	}
	return null;
}
CBaseNode.prototype.OnCancel = function () {
	switch (this.m_ActionOnCancel) {
		case Actions.gotoChild:
			return (this.GotoChild());
			break;
		case Actions.goBack:
			return (this.GotoParent());
			break;
		case Actions.gotoRoot:
			return (this.GotoRoot());
			break;
	}
	return null;
}
CBaseNode.prototype.OnExit = function () {
	switch (this.m_ActionOnExit) {
		case Actions.gotoChild:
		case Actions.goBack:
		case Actions.gotoRoot:
		default:
			return (this.GotoRoot());
			break;
	}
	return null;
}
CBaseNode.prototype.OnTimeOut = function () {
	switch (this.m_ActionOnTimeout) {
		case Actions.gotoChild:
			return (this.GotoChild());
			break;
		case Actions.goBack:
			return (this.GotoParent());
			break;
		case Actions.gotoRoot:
			return (this.GotoRoot());
			break;
	}
	return null;
}
CBaseNode.prototype.GotoChild = function () {
	if (null == this.m_pChild) {
		return null;
	}
	else {
		return (this.m_pChild.m_pThisNode);
	}
}

CBaseNode.prototype.GotoParent = function () {
	if ((this.m_pParentNode.m_NodeType == NodeType.Event_Received_node) || (this.m_pParentNode.m_NodeType == NodeType.Menu_item_node)) {
		return (this.m_pParentNode.m_pParentNode);
	}
	return (this.m_pParentNode);
}
CBaseNode.prototype.GotoRoot = function () {
	var CAppControllerObj = ISO220.AppControllerObj;
	if (new CAppControllerObj().GetInstance().IsMiniPVMRunning()) {
		return new CAppControllerObj().GetInstance().GetMiniPVMRootNode();
	}
	else {
		return new CAppControllerObj().GetInstance().GetRootNode();
	}
}
module.exports = {
	CBaseNode: CBaseNode,
	CChildList: CChildList,
}
