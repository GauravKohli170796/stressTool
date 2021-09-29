var RetVal = require("../Constants/RetVal");
var Structs = require("../CommonStructures/StructClasses");
var CurrentNode = null;
var ParenNode = null;
var NodeType = require("../Constants/NodeType");
var Utils = require("./Utils");
var CUtils = new Utils();
var Actions = require("../Constants/Actions");
var CDisplayMessage = require("../DisplayNodes/DisplayMessage");
var CDisplayMenu = require("../DisplayNodes/DisplayMenu");
var CDisplayMenuItem = require("../DisplayNodes/DisplayMenuItem");
var CDisplayGetAmount = require("../DisplayNodes/DisplayGetAmount");
var CDisplayDataEntry = require("../DisplayNodes/DisplayDataEntry");
var CDisplayGetPassword = require("../DisplayNodes/DisplayGetPassword");
var CDisplayConfirmation = require("../DisplayNodes/DisplayConfirmation");
var CDisplayWait = require("../DisplayNodes/DisplayWait");
var CDisplayMenuList = require("../DisplayNodes/DisplayMenuList");
var CDisplayEventReceived = require("../DisplayNodes/DisplayEventReceived");
var CDisplayGetSecretPin = require("../DisplayNodes/DisplayGetSecretPin");
var ISO220 = require("./ISO220");
var CurrentNode = null;
var parentNode = null;
var iDepth = 0;
var TopofStack = null;
class CParserWrapper {
	constructor(DBAccessor) {
		this.m_pDBAccessor = DBAccessor;
	}
}
class CStackNode {
	constructor() {
		this.this_node = null;
		this.next_node = null;
	}
}
CParserWrapper.prototype.AddNewNode = function (mapAttributes) {
	var nParsedAttributes;
	var newNode = null;
	var tagAttribute = new Structs.XMLAttributeMiniPVM();
	nParsedAttributes = this.ParseNodeAttributes(tagAttribute, mapAttributes);
	switch (tagAttribute.node_type) {
		case NodeType.Dispaly_message_node:
			newNode = new CDisplayMessage(this.m_pDBAccessor);
			CurrentNode = newNode;
			break;
		case NodeType.Menu_node:
			newNode = new CDisplayMenu(this.m_pDBAccessor);
			CurrentNode = newNode;
			break;
		case NodeType.Menu_item_node:
			newNode = new CDisplayMenuItem(this.m_pDBAccessor);
			CurrentNode = newNode;
			break;
		case NodeType.Amount_entry_node:
			newNode = new CDisplayGetAmount(this.m_pDBAccessor);
			CurrentNode = newNode;
			break;
		case NodeType.Data_entry_node:
			newNode = new CDisplayDataEntry(this.m_pDBAccessor);
			CurrentNode = newNode;
			break;
		case NodeType.Pin_entry_node:
			newNode = new CDisplayGetPassword(this.m_pDBAccessor);
			CurrentNode = newNode;
			break;
		case NodeType.Confirmation_node:
			tagAttribute.onOk = Actions.gotoChild;
			tagAttribute.onCancel = Actions.goBack;
			newNode = new CDisplayConfirmation(this.m_pDBAccessor);
			CurrentNode = newNode;
			break;
		case NodeType.Event_wait_node:
			if (tagAttribute.onOk == 0)
				tagAttribute.onOk = Actions.gotoChild;
			if (tagAttribute.onCancel == 0)
				tagAttribute.onCancel = Actions.goBack;
			newNode = new CDisplayWait(this.m_pDBAccessor);
			CurrentNode = newNode;
			break;
		case NodeType.Menu_list_node:
			newNode = new CDisplayMenuList(this.m_pDBAccessor);
			CurrentNode = newNode;
			break;
		case NodeType.Event_Received_node:
			newNode = new CDisplayEventReceived(this.m_pDBAccessor);
			CurrentNode = newNode;
			break;
		case NodeType.Sec_Pin_entry_node:
			newNode = new CDisplayGetSecretPin(this.m_pDBAccessor);
			CurrentNode = newNode;
			break;
		case NodeType.Invalid_node:
		default:
			break;
	}
	newNode.AddParameters(tagAttribute);
	new CStackNode().PushNode(newNode);
	iDepth++;
	var currentParentNode;
	if (TopofStack.next_node != null) {
		currentParentNode = TopofStack.next_node.this_node;
		currentParentNode.AddChild(newNode);
		newNode.AddParent(currentParentNode);
		//var tmpNode=newNode;
	}
	for (var itemnu = 0; itemnu < tagAttribute.numberOFItemsInMenuList; itemnu++) {
		if (tagAttribute.ItemList[itemnu] != null) {
			tagAttribute.ItemList[itemnu] = null;
		}
	}
	if (tagAttribute.ItemList != null) {
		tagAttribute.ItemList = null;
	}
}
CParserWrapper.prototype.ParseNodeAttributes = function (tagAttribute, mapAttributes) {
	var iAttributesNumber = mapAttributes.length;
	var nParsedAtt = 0;
	var iIndex = 0;
	for (var i = 0; i < iAttributesNumber; i++) {
		var szAttributeName = mapAttributes.item(i).name;
		var szAttributeValue = mapAttributes.item(i).value;
		if (szAttributeName == "nt") {
			nParsedAtt++;
			tagAttribute.node_type = parseInt(szAttributeValue);
		}
		if (szAttributeName == "nm") {
			nParsedAtt++;
			tagAttribute.iName = CUtils.String2Bytes(szAttributeValue.toString());
		}
		if (szAttributeName == "to") {
			nParsedAtt++;
			tagAttribute.Timeout = parseInt(szAttributeValue);
		}
		if (szAttributeName == "ok") {
			nParsedAtt++;
			if (szAttributeValue == "Next") { tagAttribute.onOk = Actions.gotoChild; }
			else if (szAttributeValue == "bk") { tagAttribute.onOk = Actions.goBack; }
			else if (szAttributeValue == "ext") { tagAttribute.onOk = Actions.gotoRoot; }
			else if (szAttributeValue == "go") { tagAttribute.onOk = Actions.goOnline; }
		}
		if (szAttributeName == "can") {
			nParsedAtt++;
			if (szAttributeValue == "Next") { tagAttribute.onCancel = Actions.gotoChild; }
			else if (szAttributeValue == "bk") { tagAttribute.onCancel = Actions.goBack; }
			else if (szAttributeValue == "ext") { tagAttribute.onCancel = Actions.gotoRoot; }
			else if (szAttributeValue == "go") { tagAttribute.onCancel = Actions.goOnline; }
		}
		if (szAttributeName == "oto") {
			nParsedAtt++;
			if (szAttributeValue == "Next") { tagAttribute.onTimeout = Actions.gotoChild; }
			else if (szAttributeValue == "bk") { tagAttribute.onTimeout = Actions.goBack; }
			else if (szAttributeValue == "ext") { tagAttribute.onTimeout = Actions.gotoRoot; }
			else if (szAttributeValue == "go") { tagAttribute.onTimeout = Actions.goOnline; }
		}
		if (szAttributeName == "Onet") {
			nParsedAtt++;
			if (szAttributeValue == "Next") { tagAttribute.onExit = Actions.gotoChild; }
			else if (szAttributeValue == "bk") { tagAttribute.onExit = Actions.goBack; }
			else if (szAttributeValue == "ext") { tagAttribute.onExit = Actions.exitPvm; }
			else if (szAttributeValue == "go") { tagAttribute.onExit = Actions.goOnline; }
		}
		if (szAttributeName == "htl") {
			++nParsedAtt;
			tagAttribute.HostTlvtag = parseInt(szAttributeValue, 16);
		}
		if (szAttributeName == "hat") {
			nParsedAtt++;
			var hostTag = CUtils.a2bcd(szAttributeValue);
			tagAttribute.HostActiontag = hostTag[0];
			tagAttribute.HostActiontag = ((tagAttribute.HostActiontag) << 8) | hostTag[1];
		}
		if (szAttributeName == "iss") {
			nParsedAtt++;
			tagAttribute.IsOnSSL = parseInt(szAttributeValue);
		}
		if (szAttributeName == "ti") {
			nParsedAtt++;
			tagAttribute.Title = CUtils.String2Bytes(szAttributeValue);
			// CString csTemp;
			// csTemp.Format(Title = %s==tagAttribute.Title);
		}
		if (szAttributeName == "name") {
			nParsedAtt++;
			tagAttribute.Title = tagAttribute.iName;
		}
		if (szAttributeName == "ix") {
			nParsedAtt++;
			tagAttribute.ItemIndex = parseInt(szAttributeValue);
		}
		if (szAttributeName == "dm") {
			nParsedAtt++;
			var iOffset = 0;
			var token = "";
			token = (szAttributeValue).split("\\");
			if (token != "") {
				tagAttribute.DisplayMessage =token[0];
				iOffset += token[0].length;
			}
			var j = 1;
			while (j < token.length) {
				tagAttribute.DisplayMessage[iOffset] =' ';
				iOffset++;
				tagAttribute.DisplayMessage+=token[j].slice(1, token[j].length);
				iOffset += (token[j].length) - 1;
				j++;
			}
		}
		/////////////////Added by gaurav kohli to display conplete messages in confirmation dialog of MiniPVM.
		if (szAttributeName == "dm2") {
			nParsedAtt++;
			var iOffset = 0;
			var token = "";
			token = (szAttributeValue).split("\\");
			if (token != "") {
				tagAttribute.DisplayMessageLine2 =token[0];
				iOffset += token[0].length;
			}
			var j = 1;
			while (j < token.length) {
				tagAttribute.DisplayMessageLine2[iOffset] =' ';
				iOffset++;
				tagAttribute.DisplayMessageLine2+=token[j].slice(1, token[j].length);
				iOffset += (token[j].length) - 1;
				j++;
			}
		}
		if (szAttributeName == "dm3") {
			nParsedAtt++;
			var iOffset = 0;
			var token = "";
			token = (szAttributeValue).split("\\");
			if (token != "") {
				tagAttribute.DisplayMessageLine3 =token[0];
				iOffset += token[0].length;
			}
			var j = 1;
			while (j < token.length) {
				tagAttribute.DisplayMessageLine3[iOffset] =' ';
				iOffset++;
				tagAttribute.DisplayMessageLine3+=token[j].slice(1, token[j].length);
				iOffset += (token[j].length) - 1;
				j++;
			}
		}
		if (szAttributeName == "dm4") {
			nParsedAtt++;
			var iOffset = 0;
			var token = "";
			token = (szAttributeValue).split("\\");
			if (token != "") {
				tagAttribute.DisplayMessageLine4 =token[0];
				iOffset += token[0].length;
			}
			var j = 1;
			while (j < token.length) {
				tagAttribute.DisplayMessageLine4[iOffset] =' ';
				iOffset++;
				tagAttribute.DisplayMessageLine4+=token[j].slice(1, token[j].length);
				iOffset += (token[j].length) - 1;
				j++;
			}
		}

		///////////////////////////////////////////////////////////////////////////////////////////////////
		if (szAttributeName == "mal") {
			nParsedAtt++;
			tagAttribute.MaxLen = parseInt(szAttributeValue) & 255;
		}
		if (szAttributeName == "mil") {
			nParsedAtt++;
			tagAttribute.MinLen = parseInt(szAttributeValue) & 255;
		}
		if (szAttributeName == "dcn") {
			nParsedAtt++;
			tagAttribute.CurrencyName = CUtils.String2Bytes(szAttributeValue);
		}
		if (szAttributeName == "dec") {
			nParsedAtt++;
			tagAttribute.Decimals = parseInt(szAttributeValue) & 255;
		}
		if ((szAttributeName == "Key_F1") || (szAttributeName == "KEY_F1")) {
			tagAttribute.KEY__F1 = Actions.gotoRoot;
			var strpart = "";
			strpart =szAttributeValue.split(",");
			if (strpart != "") {
				tagAttribute.KeyF1 =strpart[1];
			}
			nParsedAtt++;
			if (strpart[0] == "Next") { tagAttribute.KEY__F1 = Actions.gotoChild; }
			else if (strpart[0] == "bk") { tagAttribute.KEY__F1 = Actions.goBack; }
			else if (strpart[0] == "ext") { tagAttribute.KEY__F1 = Actions.gotoRoot; }
		}
		if ((szAttributeName == "Key_F2") || (szAttributeName == "KEY_F2")) {
			tagAttribute.KEY__F2 = Actions.gotoRoot;
			var strpart = "";
			strpart = szAttributeValue.split(",");
			if (strpart != "") {
				tagAttribute.KeyF2 =strpart[1];
			}
			nParsedAtt++;
			if (strpart[0] == "Next") {
				tagAttribute.KEY__F2 = Actions.gotoChild;
			}
			else if (strpart[0] == "bk") {
				tagAttribute.KEY__F2 = Actions.goBack;
			}
			else if (strpart[0] == "ext") {
				tagAttribute.KEY__F2 = Actions.gotoRoot;
			}
		}
		if ((szAttributeName == "Key_F3") || (szAttributeName == "KEY_F3")) {
			tagAttribute.KEY__F3 = Actions.gotoRoot;
			var strpart = "";
			strpart =szAttributeValue.split(",");
			if (strpart != "") {
				tagAttribute.KeyF3 =strpart[1];
			}
			nParsedAtt++;
			if (strpart[0] == "Next") {
				tagAttribute.KEY__F3 = Actions.gotoChild;
			}
			else if (strpart[0] == "bk") {
				tagAttribute.KEY__F3 = Actions.goBack;
			}
			else if (strpart[0] == "ext") {
				tagAttribute.KEY__F3 = Actions.gotoRoot;
			}
		}
		if ((szAttributeName == "Key_F4") || (szAttributeName == "KEY_F4")) {
			tagAttribute.KEY__F4 = Actions.gotoRoot;
			var strpart = "";
			strpart = szAttributeValue.split(",");
			if (strpart != "") {
				tagAttribute.KeyF4 =strpart[1];
			}
			nParsedAtt++;
			if (strpart[0] == "Next") {
				tagAttribute.KEY__F4 = Actions.gotoChild;
			}
			else if (strpart[0] == "bk") {
				tagAttribute.KEY__F4 = Actions.goBack;
			}
			else if (strpart[0] == "ext") {
				tagAttribute.KEY__F4 = Actions.gotoRoot;
			}
		}
		if (szAttributeName == "Key_Enter") {
			nParsedAtt++;
			if (szAttributeValue == "Next") { tagAttribute.KEY__ENTER = Actions.gotoChild; }
			else if (szAttributeValue == "bk") { tagAttribute.KEY__ENTER = Actions.goBack; }
			else if (szAttributeValue == "ext") {
			tagAttribute.KEY__ENTER = Actions.gotoRoot;
			}
		}
		if (szAttributeName == "Key_Cancel") {
			nParsedAtt++;
			if (szAttributeValue == "Next") { tagAttribute.KEY__CANCEL = Actions.gotoChild; }
			else if (szAttributeValue == "bk") { tagAttribute.KEY__CANCEL = Actions.goBack; }
			else if (szAttributeValue == "ext") {
			tagAttribute.KEY__CANCEL = Actions.gotoRoot;
			}
		}
		if (szAttributeName == "em") {
			nParsedAtt++;
			if (szAttributeValue.slice(0, 2) != "0x") {
				tagAttribute.EventMask = parseInt(szAttributeValue, 16);
			} else {
				tagAttribute.EventMask = parseInt(szAttributeValue.slice(2, szAttributeValue.length), 16);
			}
		}
		if (szAttributeName.toString().slice(0, 2) == "it") {
			if (szAttributeName == "itc") {
				tagAttribute.numberOFItemsInMenuList = parseInt(szAttributeValue);
				tagAttribute.ItemList = [];
			}
			else {
				if (tagAttribute.ItemList != null) {
					var nValueLength = szAttributeValue.length;
					tagAttribute.ItemList[iIndex++] = szAttributeValue;
				}
			}
		}
		if (szAttributeName == "sk") {
			tagAttribute.SessionKey = CUtils.String2Bytes(szAttributeValue);
			nParsedAtt++;
		}
		if (szAttributeName == "ks") {
			tagAttribute.iKeySlot = parseInt(szAttributeValue) & 255;
			nParsedAtt++;
		}
		if (szAttributeName == "amt") {
			tagAttribute.m_chArrAmount = CUtils.String2Bytes(szAttributeValue);
			++nParsedAtt;
		}
	}
	return nParsedAtt;
}
CParserWrapper.prototype.PopNode = function () {
	return (new CStackNode().PopNode());
}
//  
CParserWrapper.prototype.SaveRootNode = function () {
	var CAppcontrollerobj = ISO220.AppControllerObj;
	new CAppcontrollerobj().GetInstance().SetRootNode(CurrentNode);
}
CStackNode.prototype.TopNode = function () {
	return TopofStack;
}
CStackNode.prototype.PushNode = function (/*CBaseNode*/ addThisNode) {
	var tmpNode = new CStackNode();
	tmpNode.next_node = TopofStack;
	tmpNode.this_node = addThisNode;
	TopofStack = tmpNode;
	return TopofStack;
}
CStackNode.prototype.PopNode = function () {
	var tmpNode = this.TopNode();
	TopofStack = tmpNode.next_node;
	return tmpNode;
}
module.exports = CParserWrapper;