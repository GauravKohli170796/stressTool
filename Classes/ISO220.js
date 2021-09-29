var CISOMsg = require("./ISOMsg");
var Consts = require("../Constants/AppConsts");
var Utils = require("./Utils");
var IsoConst = require("../Constants/IsoFieldsConsts");
var CAppController = require("./AppControllers");
exports.AppControllerObj = CAppController;
var CUtils = new Utils();
class CISO220 extends CISOMsg {
	constructor(dbAccessor) {
		super(dbAccessor);
	}
}
CISO220.prototype.CISO220C = function (chTerminalId, iTerminalIdLen, chNII) {
	this.CISOMsgC(chTerminalId, iTerminalIdLen, chNII);
	this.m_iMiniPVMOffset = 0x00;
	this.m_bCurrentPacketCount = 0x00;
	this.m_bTotalPacketCount = 0x00;
	this.m_uchMiniPVM = new Int8Array(Consts.MAX_MINI_PVM_LEN);
	this.m_bOldTLV = new Uint8Array(Consts.MAX_TLV_LEN);
	this.m_iOldTLVLen = 0x00;
	this.m_iCSVOffset = 0;
	this.m_bCSVData = new Uint8Array(5000);
	this.m_iCurrentPrintDumpOffset = 0x00;
	this.m_bPrintData = new Uint8Array(Consts.MAX_RESPONSE_DATA_LEN);
	this.m_bDataToReplay = false;
	this.m_iReplayDataLen = 0;
	this.m_bArrDataToReplay = new Uint8Array(Consts.MAX_REPLAY_DATA_LEN);
}
CISO220.prototype.packIt = function (sendee) {
	this.vFnSetTerminalActivationFlag(false);
	this.msgno = Consts.UPDATAREQ;
	return (this.packItHost(sendee));
}
CISO220.prototype.SetOnlineTransactionRequestData = function (iLastROC, iBatchId) {
	var tempBuffer = null;
	var iLocalOffset = 0x00;
	/*	***************************************************************************
				   FEILD 3 ::Processing Code
		***************************************************************************/
	this.addField(IsoConst.ISO_FIELD_3, Consts.PC_ONLINE_TRANSACTION_REQ, true);
	/*	***************************************************************************
		FEILD 6 :: Terminal Type
		***************************************************************************/
	//TODO check with DB string, Remove hardcoded value
	var TerminalType =this.dbAccessor.m_sParamData.uchTerminalType.toString().padStart(2, "0");
	this.addField(IsoConst.ISO_FIELD_6, TerminalType, true);
	//this.addField(IsoConst.ISO_FIELD_6, dbAccessor.m_sParamData.uchTerminalType, true);
	/*	***************************************************************************
			  FEILD 11 ::ROC
		***************************************************************************/
	var strLastROC = iLastROC.toString();
	strLastROC = CUtils.StrLeftPad(strLastROC, 4, '0');
	this.addField(IsoConst.ISO_FIELD_11, strLastROC, true)
	/*	***************************************************************************
			  FEILD 26 ::BatchId
		***************************************************************************/
	var strBatchID = iBatchId.toString();
	strBatchID = CUtils.StrLeftPad(strBatchID, 6, '0');
	this.addField(IsoConst.ISO_FIELD_26, strBatchID, true)
	/*	***************************************************************************
				  FEILD 48 ::Transaction Type
		***************************************************************************/
	tempBuffer = new Uint8Array(2);
	tempBuffer[0] = (this.dbAccessor.m_sNewTxnData.uiTransactionType >> 8) & 0x000000ff;
	tempBuffer[1] = (this.dbAccessor.m_sNewTxnData.uiTransactionType) & 0x000000ff;
	this.addLLLCHARData(IsoConst.ISO_FIELD_48, tempBuffer, 2);
	this.vFnSetPEDHardwareSerialNumer();
	/*	***************************************************************************
				  FEILD 61 ::Transaction Data
		***************************************************************************/
	var TxnBuffer = null;
	//Add TLV data to Field 61
	var iTotalNodes = 0;
	var iTag = 0x00;
	var iTagValLen = 0x00;
	iTotalNodes = this.dbAccessor.m_sTxnTLVData.iTLVindex;
	iLocalOffset = 0x00;
	if (iTotalNodes > 0) {
		TxnBuffer = new Uint8Array(iTotalNodes * 204);
		iLocalOffset = 0x00;
		for (var i = 0; i < iTotalNodes; i++) {
			//TAG
			iTag = this.dbAccessor.m_sTxnTLVData.objTLV[i].uiTag;
			TxnBuffer[iLocalOffset++] = ((iTag) >> 8) & 0x000000FF;
			TxnBuffer[iLocalOffset++] = ((iTag)) & 0x000000FF;
			//Length
			iTagValLen = (this.dbAccessor.m_sTxnTLVData.objTLV[i].uiTagValLen);
			TxnBuffer[iLocalOffset++] = ((iTagValLen >> 8) & 0x000000FF);
			TxnBuffer[iLocalOffset++] = ((iTagValLen) & 0x000000FF);
			TxnBuffer.set(this.dbAccessor.m_sTxnTLVData.objTLV[i].chArrTagVal, iLocalOffset);
			iLocalOffset += iTagValLen;
		}
		if (iLocalOffset > 0) {
			this.addLLLCHARData(IsoConst.ISO_FIELD_61, TxnBuffer, iLocalOffset);
		}
	}
	if (this.m_bDataToReplay) {
		this.addLLLCHARData(IsoConst.ISO_FIELD_54, this.m_bArrDataToReplay, m_iReplayDataLen);
		m_bDataToReplay = false;
	}
}
CISO220.prototype.GetActionToDoFromFirstResponse = function () {
	this.m_bDataToReplay = false;
	if (this.bitmap[54 - 1]) {
		var length = this.len[54 - 1];
		var bArrtempDataToReplay = this.data[54 - 1].slice(0, length);
		this.m_iReplayDataLen = length;
		this.m_bDataToReplay = true;
		this.m_bArrDataToReplay.set(bArrtempDataToReplay, 0);
	}
	if (!this.bitmap[3 - 1]) {
		return Consts.ONLINE_RESPONSE_NO_ADDITIONAL_INFO; //no addtional information
	}
	if (CUtils.Bytes2String(this.data[3 - 1]) == (Consts.PC_ONLINE_TRANSACTION_REQ)) {
		return Consts.ONLINE_RESPONSE_NO_ADDITIONAL_INFO; //no addtional information
	} else if (CUtils.Bytes2String(this.data[3 - 1]) == (Consts.PC_ONLINE_RESPONSE_GET_ADDTIONAL_INFO_START)) {
		return Consts.ONLINE_RESPONSE_MULTIPLE_ADDITIONAL_INFO; //there is additional information but the packet is not enough
	} else if (CUtils.Bytes2String(this.data[3 - 1]) == (Consts.PC_ONLINE_RESPONSE_GET_ADDTIONAL_INFO_END)) {
		return Consts.ONLINE_RESPONSE_SINGLE_LAST_ADDITIONAL_INFO; //there is additional information and this packet is enough
	} else if (CUtils.Bytes2String(this.data[3 - 1]) == (Consts.PC_ONLINE_RESPONSE_MULTI_PACKET_DATA_START)) {
		return Consts.ONLINE_RESPONSE_MULTI_PACKET_RESP_CONTINUED; //multi packet response from the host 
	} else if (CUtils.Bytes2String(this.data[3 - 1]) == (Consts.PC_ONLINE_RESPONSE_MULTI_PACKET_DATA_END)) {
		return Consts.ONLINE_RESPONSE_MULTI_PACKET_RESP_ENDED; //multi packet response data has ended
	} else if (CUtils.Bytes2String(this.data[3 - 1]) == (Consts.PC_ONLINE_KEY_EXCHANGE_REQ_PCAKET)) {
		return Consts.ONLINE_RESPONSE_GET_SESSION_KEY;
	}
	else {
		return Consts.ONLINE_RESPONSE_INVALID_ADDITIONAL_INFO; //invalid processing code and will no be processed
	}
}
CISO220.prototype.CheckIfDataToReplay = function () {
	return this.m_bDataToReplay;
}
CISO220.prototype.GetDataToReplay = function () {
	var bArrDataToReplay = m_bArrDataToReplay.slice(0, this.m_iReplayDataLen);
	return bArrDataToReplay;
}
CISO220.prototype.SetDataToReplay = function (bArrDataToReplay, iDataReplayLength, bIsDataToReplay) {
	this.m_iReplayDataLen = iDataReplayLength;
	this.m_bDataToReplay = bIsDataToReplay;
	this.m_bArrDataToReplay.fill(0x00);
	this.m_bArrDataToReplay.set(bArrDataToReplay.slice(0, this.m_iReplayDataLen), iDataReplayLength);
}
CISO220.prototype.GetMiniPVM =async function () {
	var length = this.len[57 - 1];
	var bArrFieldData = this.data[57 - 1];
	var iReturnee = Consts.MINI_PVM_EXCEEDS_LENGTH;
	if (this.bitmap[57 - 1] == false)
		return iReturnee;
	if ((this.m_iMiniPVMOffset + length) < Consts.MAX_MINI_PVM_LEN) {
		this.m_uchMiniPVM.set(bArrFieldData, this.m_iMiniPVMOffset);
		this.m_uchMiniPVM = this.m_uchMiniPVM.slice(0, this.m_iMiniPVMOffset + length);
		this.m_iMiniPVMOffset += length;
		iReturnee = Consts.MINI_PVM_ADDITIONAL_DATA_LEFT;
	} else {
		return iReturnee; //valid case; //invalid case display an error message		 
	}
	var ilength = this.len[53 - 1];
	var pFieldPVMDef = this.data[53 - 1];
	if (ilength >= 2) {
		this.m_bCurrentPacketCount = pFieldPVMDef[0];
		this.m_bTotalPacketCount = pFieldPVMDef[1];
		if (this.m_bCurrentPacketCount == this.m_bTotalPacketCount) {
			iReturnee = Consts.MINI_PVM_FINISHED;
			await new CAppController().GetInstance().RunMiniPvm(this.m_uchMiniPVM, this.dbAccessor);
		}
	}
	return iReturnee;
}
CISO220.prototype.SetOnlineGetMiniPVMData = function () {
	this.addField(IsoConst.ISO_FIELD_3, Consts.PC_ONLINE_RESPONSE_GET_ADDTIONAL_INFO_START, true);
	this.vFnSetTerminalActivationFlag(false);
	if (this.m_bCurrentPacketCount > 0) {
		var buffer = new Uint8Array(4);
		var iLocalOffset = 0x00;
		buffer[iLocalOffset++] = m_bCurrentPacketCount;
		buffer[iLocalOffset++] = m_bTotalPacketCount;
		this.addLLLCHARData(IsoConst.ISO_FIELD_53, buffer, iLocalOffset);
	}
}
CISO220.prototype.SetAdditionalResponseData = function () {
	//field 3
	this.addField(3, Consts.PC_ONLINE_RESPONSE_MULTI_PACKET_DATA_START, true);
	this.vFnSetTerminalActivationFlag(false);
	if (this.m_bCurrentPacketCount > 0) {
		var buffer = new Uint8Array(4);
		var iLocalOffset = 0x00;
		buffer[iLocalOffset++] = m_bCurrentPacketCount;
		buffer[iLocalOffset++] = m_bTotalPacketCount;
		this.addLLLCHARData(IsoConst.ISO_FIELD_53, buffer, iLocalOffset);
	}
}
CISO220.prototype.iFnGetReponseData = function () {
	var iReturnee = Consts.RESPONSE_DATA_EXCEEDS_LENGTH;
	var bArrFieldData;
	if (this.bitmap[52 - 1]) {
		var csvLength = this.len[52 - 1];
		bArrFieldData = data[52 - 1];
		this.m_bCSVData.set(bARRFieldData, this.m_iCSVOffset);
		this.m_bCSVData = this.m_bCSVData.slice(0, this.m_iCSVOffset + csvLength)
		this.m_iCSVOffset += csvLength;
	}
	if (false == this.IsOK()) {
		if (this.bitmap[58 - 1] == false) {
			//::MessageBox(NULL,"DECLINED","Plutus",MB_OK);
		}
		return iReturnee;
	}
	if (!this.bitmap[62 - 1]) {
		return Consts.RESPONSE_DATA_EXCEEDS_LENGTH;
	}
	bArrFieldData = this.data[62 - 1];
	var length = this.len[62 - 1];
	if ((this.m_iCurrentPrintDumpOffset + length) < Consts.MAX_RESPONSE_DATA_LEN) {
		this.m_bPrintData.set(bArrFieldData, this.m_iCurrentPrintDumpOffset);
		this.m_iCurrentPrintDumpOffset += length;
		this.m_bPrintData = this.m_bPrintData.slice(0, this.m_iCurrentPrintDumpOffset);
		iReturnee = Consts.RESPONSE_ADDITIONAL_DATA_LEFT;
	} else {
		return iReturnee;
	}
	var pFieldPVMDef = this.data[53 - 1];
	var ilength = this.len[53 - 1];
	if (ilength >= 2) {
		this.m_bCurrentPacketCount = pFieldPVMDef[0];
		this.m_bTotalPacketCount = pFieldPVMDef[1];
		if (this.m_bCurrentPacketCount == this.m_bTotalPacketCount) {
			iReturnee = Consts.RESPONSE_DATA_FINISHED;
		}
	}
	return iReturnee;
}
CISO220.prototype.isTxOK = function () {
	if (this.bitmap[39 - 1]) {
		if (CUtils.Bytes2String(this.data[39 - 1]) == Consts.AC_SUCCESS)
			return true;
		else
			return false;
	}
	return false;
}
module.exports = CISO220;
