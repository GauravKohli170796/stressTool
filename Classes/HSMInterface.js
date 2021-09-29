var Utils = require("./Utils");
var Structs = require("../CommonStructures/StructClasses");
var CUtils = new Utils();
var Consts = require("../Constants/AppConsts");
var DBAccessor = require("./DBAccessor");
var CryptoHandlerObj = require("./CryptoHandler");
var EnPadStyle = require("../Constants/EnPadStyle");
var CryptoHandler = new CryptoHandlerObj();
var PTMKRequestTypeConsts = require("../Constants/PTMKRequestTypeConsts");
class CHSMInterface {
	constructor(iClientId, iDeviceType, iAcquirerCode, uiTimeOut, csDeviceSerialNumber, csTerminalId, csDateTime, csServerIP, usServerPort) {
		this.m_iClientId = iClientId;
		this.m_iReqMTI = 0;
		this.m_iResMTI = 0;
		this.m_iDeviceType = iDeviceType;
		this.m_iAcquirerCode = iAcquirerCode;
		this.m_uiTimeOut = uiTimeOut;
		//this.m_csDeviceSerialNumber = csDeviceSerialNumber;
		this.m_csTerminalId = csTerminalId;
		this.m_csDateTime = csDateTime;
		this.m_csSessionKey;
		this.m_pSocket;
		this.m_bisConnected;
		this.m_bisSessionStarted;
		this.m_csServerIP = csServerIP;
		this.m_usServerPort = usServerPort;
		this.uchArrSendRecvBuff = new Uint8Array(3000);
		this.iLenDNS = csDeviceSerialNumber.length;
		this.chArrDeviceSerialNumber = new Int8Array(49);
		this.chArrDateTime = new Int8Array(14);
		this.uchArrSessionKey = new Uint8Array(32);
		this.iLenSessionKey;
		this.uchArrHashAuthToken = new Uint8Array(20);
		this.chArrReqAuthTextData = new Int8Array(20);
		this.iLenHashAuthToken;
		this.iLenReqAuthTextData;
		this.uchArrEncTokenData = new Uint8Array(49);
		this.iLenEncTokenData;
		this.chArrAsciiAuthDataFromSeed = new Int8Array(49);
		this.uchArrHexDecryptedTokenData = new Uint8Array(49);
		this.uchArrAsciiAuthTextData = new Uint8Array(49);
		this.uchArrHexEncPMKComp1 = new Uint8Array(39);
		this.uchArrHexEncPMKComp2 = new Uint8Array(39);
		this.m_uchArrHexPMKHSM = new Uint8Array(49);
		this.stPMK = new Structs.st_PMK();
		this.stResetResponse = new Structs.st_RESET_RESPONSE();
		this.iNumKeySlotsPTMK;
		this.sArrPTMK = CUtils.ArrayofObject((Consts.NUM_KEYSLOTS), Structs.st_ENCRYPTION_KEY);
		this.iNumKeySlotsPSK;
		this.sArrPSK = CUtils.ArrayofObject((Consts.NUM_KEYSLOTS), Structs.st_ENCRYPTION_KEY);
		this.iNumKeySlotsEncryptedPSK;
		this.sArrPSKEncrypted = CUtils.ArrayofObject((Consts.NUM_KEYSLOTS), Structs.st_ENCRYPTION_KEY);
		this.chArrDeviceSerialNumber.set(CUtils.String2Bytes(csDeviceSerialNumber), 0);
		this.chArrDeviceSerialNumber = this.chArrDeviceSerialNumber.slice(0, this.iLenDNS);
		this.chArrDateTime.set(CUtils.String2Bytes(this.m_csDateTime), 0);
	}
}
CHSMInterface.prototype.iGetInitialData = async function () {
	var it = 0;
	var iRetVal = 0;
	var dbAccessor = new DBAccessor();
	await dbAccessor.iGetPMK(126, this.chArrDeviceSerialNumber, this.stPMK);
	for (it = 0; it < Consts.NUM_KEYSLOTS; it++) {
		iRetVal = await dbAccessor.iGetPTMKPin(Consts.keySlotMap[it], this.chArrDeviceSerialNumber, this.sArrPTMK[it]);
		if (iRetVal != true) {
			break;
		}
		this.sArrPTMK[it].iSlotID = Consts.keySlotMap[it];
	}
	for (it = 0; it < Consts.NUM_KEYSLOTS; it++) {
		iRetVal = await dbAccessor.iGetPTMKTLE(Consts.keySlotMap[it], this.chArrDeviceSerialNumber, this.sArrPTMK[it]);
		if (iRetVal != true) {
			break;
		}
		this.sArrPTMK[it].iSlotID = Consts.keySlotMap[it];
	}
	this.iNumKeySlotsPTMK = it;
	for (it = 0; it < Consts.NUM_KEYSLOTS; it++) {
		iRetVal = await dbAccessor.iGetPSKPin(Consts.keySlotMap[it], this.chArrDeviceSerialNumber, this.sArrPSK[it]);
		if (iRetVal != true) {
			break;
		}
		this.sArrPSK[it].iSlotID = Consts.keySlotMap[it];
	}
	for (it = 0; it < Consts.NUM_KEYSLOTS; it++) {
		iRetVal = await dbAccessor.iGetPSKTLE(Consts.keySlotMap[it], this.chArrDeviceSerialNumber, this.sArrPSK[it]);
		if (iRetVal != true) {
			break;
		}
		this.sArrPSK[it].iSlotID = Consts.keySlotMap[it];
	}
	this.iNumKeySlotsPSK = it;
	for (it = 0; it < Consts.NUM_KEYSLOTS; it++) {
		iRetVal = await dbAccessor.iGetEncryptedPSKPin(Consts.keySlotMap[it], this.chArrDeviceSerialNumber, this.sArrPSKEncrypted[it]);
		if (iRetVal != true) {
			break;
		}
		this.sArrPSKEncrypted[it].iSlotID = Consts.keySlotMap[it];
	}
	for (it = 0; it < Consts.NUM_KEYSLOTS; it++) {
		iRetVal = await dbAccessor.iGetEncryptedPSKTLE(Consts.keySlotMap[it], this.chArrDeviceSerialNumber, this.sArrPSKEncrypted[it]);
		if (iRetVal != true) {
			break;
		}
		this.sArrPSKEncrypted[it].iSlotID = Consts.keySlotMap[it];
	}
	this.iNumKeySlotsEncryptedPSK = it;
	return true;
}
CHSMInterface.prototype.iGetPSKRequestForPaymentController = function (uchSendBuffer)//TO DO FOR 15 IN INITIALISATION
{
	var it = 0;
	var iKeySlotPin = 10;
	var iKeySlotTLE = 12;
	var iNumKeySlot = 1;
	var iUseDefaultKeySlotOnly = 1;
	if (0x0001 == iUseDefaultKeySlotOnly) {//need to edit 0x0001 by windows constant 
		iNumKeySlot = Consts.DEFAULT_NUM_KEYSLOT;
	} else {
		iNumKeySlot = Consts.NUM_KEYSLOTS;
	}
	var iFunctionCode = 0;
	var chArrData = new Int8Array(2000);
	var iOffset = 0;
	chArrData[iOffset++] = iNumKeySlot;
	if (this.iNumKeySlotsEncryptedPSK <= 0) {
		for (var it = 0; it < iNumKeySlot; it++) {
			chArrData[iOffset++] = Consts.keySlotMap[it] & 0x00FF;
			chArrData[iOffset++] = 0x00;
			chArrData[iOffset++] = 0x00;
		}
	} else {
		for (var it = 0; it < iNumKeySlot; it++) {
			chArrData[iOffset++] = Consts.keySlotMap[it] & 0x00FF;
			chArrData[iOffset++] = 0x20;
			chArrData.set(this.sArrPSKEncrypted[it].uchArrPINKey, iOffset);
			iOffset += 32;
			chArrData[iOffset++] = 0x20;
			chArrData.set(this.sArrPSKEncrypted[it].uchArrTLEKey, iOffset);
			iOffset += 32;
		}
	}
	uchSendBuffer.set(chArrData, 0);
	uchSendBuffer = uchSendBuffer.slice(0, iOffset);
	return iOffset;
}
CHSMInterface.prototype.iStartSessionRequest = function (uchSendBuffer) {
	var chArrData = new Int8Array(200);
	var iOffset = 0;
	chArrData[iOffset++] = this.m_iDeviceType;
	chArrData[iOffset++] = this.iLenDNS & 0x00FF;
	if (this.iLenDNS > 0) {
		chArrData.set(this.chArrDeviceSerialNumber, iOffset);
		iOffset += this.iLenDNS;
	}
	var lSessionExpiryTimeOutMillis = 180000;
	chArrData[iOffset++] = ((lSessionExpiryTimeOutMillis >> 24) & 0x000000FF);
	chArrData[iOffset++] = ((lSessionExpiryTimeOutMillis >> 16) & 0x000000FF);
	chArrData[iOffset++] = ((lSessionExpiryTimeOutMillis >> 8) & 0x000000FF);
	chArrData[iOffset++] = (lSessionExpiryTimeOutMillis & 0x000000FF);
	chArrData.set(this.chArrDateTime, iOffset);
	iOffset += 14;
	var iDataLen = iOffset;
	iOffset = this.iGetRequestMessage(Consts.FUNCTIONCODE_START_SESSION_REQ, chArrData, iDataLen);
	uchSendBuffer.set(this.uchArrSendRecvBuff.slice(0, iOffset), 0);
	this.uchArrSendRecvBuff.fill(0X00);
	return iOffset;
}
CHSMInterface.prototype.iGetRequestMessage = function (iFunctinCode, chArrData, iLenData) {
	var iOffset = 0;
	var iDataLen = 0;
	this.uchArrSendRecvBuff[iOffset++] = (Consts.SOURCEID_HSM_COMMUNICATION_REQUEST >> 8) & 0x00FF;
	this.uchArrSendRecvBuff[iOffset++] = Consts.SOURCEID_HSM_COMMUNICATION_REQUEST & 0x00FF;
	this.uchArrSendRecvBuff[iOffset++] = (iFunctinCode >> 8) & 0x00FF;
	this.uchArrSendRecvBuff[iOffset++] = iFunctinCode & 0x00FF;
	iDataLen = iLenData;
	this.uchArrSendRecvBuff[iOffset++] = (iDataLen >> 8) & 0x00FF;
	this.uchArrSendRecvBuff[iOffset++] = iDataLen & 0x00FF;
	if (iLenData > 0) {
		this.uchArrSendRecvBuff.set(chArrData, iOffset);
		iOffset += iLenData;
	}
	this.uchArrSendRecvBuff[iOffset++] = 0xFF;
	return iOffset;
}
CHSMInterface.prototype.iGetPSKResponseForPaymentController = async function (chArrReceiveBuffer, iOffset) {
	var iRetVal = -1;
	this.iParsePSKResponseForPaymentController(chArrReceiveBuffer, iOffset);
	iRetVal = await this.getandUpdateClearPSKPin();
	iRetVal = await this.getandUpdateClearPSKTLE();
	if (iRetVal != Consts.OK) {
		return false;
	}
	return true;
}
CHSMInterface.prototype.iParsePSKResponseForPaymentController = function (chArrReceiveBuffer, iLenData) {
	var iOffset = 0;
	this.iNumKeySlotsEncryptedPSK = chArrReceiveBuffer[iOffset++];
	var uchArrTempPSK = new Uint8Array(32);
	var uchArrTempKCVPSK = new Uint8Array(6);
	for (var it = 0; it < this.iNumKeySlotsEncryptedPSK; it++) {
		this.sArrPSKEncrypted[it].iSlotID = chArrReceiveBuffer[iOffset++];
		this.sArrPSKEncrypted[it].uchArrPINKey.set(chArrReceiveBuffer.slice(iOffset, iOffset + 32), 0);
		iOffset += 32;
		this.sArrPSKEncrypted[it].uchArrKCVPINKey.set(chArrReceiveBuffer.slice(iOffset, iOffset + 6), 0);
		iOffset += 6;
		this.sArrPSKEncrypted[it].uchArrTLEKey.set(chArrReceiveBuffer.slice(iOffset, iOffset + 32), 0);
		iOffset += 32;
		this.sArrPSKEncrypted[it].uchArrKCVTLEKey.set(chArrReceiveBuffer.slice(iOffset, iOffset + 6), 0);
		iOffset += 6;
	}
	return 0;
}
CHSMInterface.prototype.getandUpdateClearPSKPin = async function () {
	var it = 0;
	this.iNumKeySlotsPSK = this.iNumKeySlotsEncryptedPSK;
	var chArrPinEncryptionKey = new Uint8Array(16);
	var chArrEncryptedPSKPin = new Uint8Array(16);
	for (it = 0; it < this.iNumKeySlotsPSK; it++) {
		chArrPinEncryptionKey.set(CUtils.a2bcd(CUtils.Bytes2String(this.sArrPTMK[it].uchArrPINKey)), 0);
		chArrEncryptedPSKPin.set(CUtils.a2bcd(CUtils.Bytes2String(this.sArrPSKEncrypted[it].uchArrPINKey)), 0);
		var chArrDecryptedPSKPin = new Uint8Array(16);
		chArrDecryptedPSKPin.set(CryptoHandler.TripleDesDecrypt(chArrEncryptedPSKPin, chArrPinEncryptionKey), 0);
		var chArrChecksumFinal = new Uint8Array(3);
		chArrChecksumFinal.set(CryptoHandler.GetChecksum(chArrDecryptedPSKPin).slice(0, 3), 0);
		var chArrChecksumPin = CUtils.a2bcd(CUtils.Bytes2String(this.sArrPSKEncrypted[it].uchArrKCVPINKey));
		if (CUtils.Bytes2String(chArrChecksumFinal).slice(0, 3) != CUtils.Bytes2String(chArrChecksumPin).slice(0, 3)) {
			return -1;
		}
		this.sArrPSK[it].uchArrPINKey = CUtils.bcd2a(chArrDecryptedPSKPin, 16);
		this.sArrPSK[it].uchArrKCVPINKey = CUtils.bcd2a(chArrChecksumFinal, 3);
		this.sArrPSK[it].iSlotID = Consts.keySlotMap[it];
		dbAccessor = new DBAccessor();
		await dbAccessor.iInsertOrUpdateEncryptedPSKPin(this.chArrDeviceSerialNumber, this.sArrPSKEncrypted[it]);
		await dbAccessor.iInsertOrUpdatePSKPin(this.chArrDeviceSerialNumber, this.sArrPSK[it]);
	}
	return 0;
}
CHSMInterface.prototype.getandUpdateClearPSKTLE = async function () {
	var it = 0;
	this.iNumKeySlotsPSK = this.iNumKeySlotsEncryptedPSK;
	for (it = 0; it < this.iNumKeySlotsPSK; it++) {
		var chArrTLEEncryptionKey = CUtils.a2bcd(CUtils.Bytes2String(this.sArrPTMK[it].uchArrTLEKey));
		var chArrEncryptedPSKTLE = CUtils.a2bcd(CUtils.Bytes2String(this.sArrPSKEncrypted[it].uchArrTLEKey));
		var chArrDecryptedPSKTLE = new Uint8Array(16);
		chArrDecryptedPSKTLE.set(CryptoHandler.TripleDesDecrypt(chArrEncryptedPSKTLE, chArrTLEEncryptionKey), 0);
		var chArrChecksumFinal = new Uint8Array(3);
		chArrChecksumFinal.set(CryptoHandler.GetChecksum(chArrDecryptedPSKTLE, 3).slice(0, 3), 0);
		var chArrChecksumTLE = CUtils.a2bcd(CUtils.Bytes2String(this.sArrPSKEncrypted[it].uchArrKCVTLEKey));
		if (CUtils.Bytes2String(chArrChecksumFinal).slice(0, 3) != CUtils.Bytes2String(chArrChecksumTLE).slice(0, 3)) {
			return -1;
		}
		this.sArrPSK[it].iSlotID = Consts.keySlotMap[it];
		this.sArrPSK[it].uchArrTLEKey = CUtils.bcd2a(chArrDecryptedPSKTLE, 16);
		this.sArrPSK[it].uchArrKCVTLEKey = CUtils.bcd2a(chArrChecksumFinal, 3);
		this.sArrPSK[it].iSlotID = Consts.keySlotMap[it];
		dbAccessor = new DBAccessor();
		await dbAccessor.iInsertOrUpdateEncryptedPSKTLE(this.chArrDeviceSerialNumber, this.sArrPSKEncrypted[it]);
		await dbAccessor.iInsertOrUpdatePSKTLE(this.chArrDeviceSerialNumber, this.sArrPSK[it]);
	}
	return 0;
}
CHSMInterface.prototype.iStartSessionResponse = function (chArrReceiveBuffer, iOffset) {
	var iLenData = 0;
	var iRetVal = 0;
	iLenData = this.iParseCommunicationResponse(chArrReceiveBuffer, iOffset, Consts.FUNCTIONCODE_START_SESSION_RES);
	if (iLenData == -1) {
		return false;
	}
	iOffset = 0;
	if (iLenData > 0) {
		this.uchArrSessionKey.set(chArrReceiveBuffer, 0);
		this.iLenSessionKey = iLenData;
	}
	return true;
}
CHSMInterface.prototype.iParseCommunicationResponse = function (chArrReceivedBuffer, iLenReceivedBuffer, iReqFunctionCode) {
	var iSourceID = 0;
	var iErrorCode = 0;
	var iFunctionCode = 0;
	var iOffset = 0;
	var iDataLen = 0;
	if (iLenReceivedBuffer < 8) {
		return -1;
	}
	iSourceID = (chArrReceivedBuffer[iOffset++] << 8) & 0xFF00;
	iSourceID |= chArrReceivedBuffer[iOffset++] & 0x00FF;
	if (iSourceID != Consts.SOURCEID_HSM_COMMUNICATION_RESPONSE) {
		return -1;
	}
	iFunctionCode = (chArrReceivedBuffer[iOffset++] << 8) & 0xFF00;
	iFunctionCode |= chArrReceivedBuffer[iOffset++] & 0x00FF;
	if (iFunctionCode != iReqFunctionCode) {
		return -1;
	}
	iErrorCode = (chArrReceivedBuffer[iOffset++] << 8) & 0xFF00;
	iErrorCode |= chArrReceivedBuffer[iOffset++] & 0x00FF;
	if (iErrorCode != 0x00) {
		return -1;
	}
	iDataLen = (chArrReceivedBuffer[iOffset++] << 8) & 0xFF00;
	iDataLen |= chArrReceivedBuffer[iOffset++] & 0x00FF;
	var chArrOutData = chArrReceivedBuffer.slice(iOffset, iOffset + iDataLen);
	chArrReceivedBuffer.fill(0x00);
	chArrReceivedBuffer.set(chArrOutData, 0);
	return iDataLen;
}
CHSMInterface.prototype.iEndSessionResponse = function (chArrReceiveBuffer, iOffset) {
	var iLenData = 0;
	iLenData = this.iParseCommunicationResponse(chArrReceiveBuffer, iOffset, Consts.FUNCTIONCODE_START_SESSION_RES);
	return (iLenData != -1);
}
CHSMInterface.prototype.iGetPMKDataResponse = async function (chArrReceiveBuffer, iOffset) {
	var iLenData = -1;
	iLenData = this.iParseCommunicationResponse(chArrReceiveBuffer, iOffset, Consts.FUNCTIONCODE_PMK_HSM_RES);
	if (iLenData == -1) {
		return false;
	}
	var uchArrAsciiEncPMKComp1 = new Uint8Array(32);
	var uchArrAsciiEncPMKComp2 = new Uint8Array(32);
	iOffset = 0;
	uchArrAsciiEncPMKComp1.set((chArrReceiveBuffer.slice(iOffset, iOffset + 32)), 0);
	iOffset += 32;
	uchArrAsciiEncPMKComp2.set((chArrReceiveBuffer.slice(iOffset, iOffset + 32)), 0);
	this.uchArrHexEncPMKComp1.set(CUtils.a2bcd(CUtils.Bytes2String(uchArrAsciiEncPMKComp1)), 0);
	this.uchArrHexEncPMKComp2.set(CUtils.a2bcd(CUtils.Bytes2String(uchArrAsciiEncPMKComp2)), 0);
	this.m_uchArrHexPMKHSM.fill(0x00);
	this.GetFinalPMK_HSM(this.uchArrHexDecryptedTokenData, this.iLenEncTokenData, this.uchArrHexEncPMKComp1, this.uchArrHexEncPMKComp2, 16, 16, this.m_uchArrHexPMKHSM);//to do change
	var chArrAsciiKCV = new Int8Array(10);
	var chArrHexKCV = new Int8Array(5);
	var chArrASCIIPMK = new Int8Array(32);
	chArrASCIIPMK.set(CUtils.bcd2a(this.m_uchArrHexPMKHSM, 16), 0);
	this.stPMK = new Structs.st_PMK();
	this.stPMK.iKeySlot = Consts.KEYSLOT_PMK;
	this.stPMK.chArrPMK.set(chArrASCIIPMK, 0);
	this.stPMK.chArrHardwareID.set(this.chArrDeviceSerialNumber, 0);
	dbAccessor = new DBAccessor();
	await dbAccessor.iInsertOrUpdatePMK(this.stPMK);
	return true;
}
CHSMInterface.prototype.GetFinalPMK_HSM = function (uchArrKeyData, iLenKeyData, uchArrHexEncPMKComp1, uchArrHexEncPMKComp2, iLenEncPMKComp1, iLenEncPMKComp2, uchArrHexPMKHSM) {
	var uchArrHexDecPMKComp1 = new Uint8Array(50);
	var uchArrHexDecPMKComp2 = new Uint8Array(50);
	this.DecryptPMKComp(uchArrKeyData, iLenKeyData, uchArrHexEncPMKComp1, uchArrHexEncPMKComp2, iLenEncPMKComp1, iLenEncPMKComp2, uchArrHexDecPMKComp1, uchArrHexDecPMKComp2);//Len of Enc PMK comp(Hex) = 16
	uchArrHexPMKHSM.fill(0x00);
	uchArrHexPMKHSM.set(CryptoHandler.XOR(uchArrHexDecPMKComp1, uchArrHexDecPMKComp2, iLenEncPMKComp1), 0);//Len of Enc PMK comp(Hex) = 16
}
CHSMInterface.prototype.DecryptPMKComp = function (uchArrHexDecryptedTokenData, iLenDecTokenData, uchArrHexEncPMKComp1, uchArrHexEncPMKComp2, iLenEncPMKComp1, iLenEncPMKComp2, uchArrHexDecPMKComp1, uchArrHexDecPMKComp2) {
	var uchArrHashData = new Uint8Array(20);
	var iLenHashData = 0;
	strSHA1temp = CryptoHandler.GetSHA1(uchArrHexDecryptedTokenData);
	uchArrHashData.set(CUtils.a2bcd(strSHA1temp), 0);
	iLenHashData = (strSHA1temp.length) / 2;
	var chArrKey1 = new Uint8Array(8);
	var chArrKey2 = new Uint8Array(8);
	var ioffset = 4;
	chArrKey2.set(uchArrHashData.slice(ioffset, ioffset + 8), 0);
	ioffset += 8;
	chArrKey1.set(uchArrHashData.slice(ioffset, ioffset + 8), 0);
	var chArrKey3 = new Uint8Array(16);
	chArrKey3.set(chArrKey1, 0);
	chArrKey3.set(chArrKey2, 8);
	uchArrHexDecPMKComp1.set(CryptoHandler.TripleDesDecrypt(uchArrHexEncPMKComp1.slice(0, iLenEncPMKComp1), chArrKey3), 0);
	uchArrHexDecPMKComp2.set(CryptoHandler.TripleDesDecrypt(uchArrHexEncPMKComp2.slice(0, iLenEncPMKComp2), chArrKey3), 0);
}
CHSMInterface.prototype.iGetAuthTokenResponse = function (chArrReceiveBuffer, iOffset) {
	var iLenData = -1;
	iLenData = this.iParseCommunicationResponse(chArrReceiveBuffer, iOffset, Consts.FUNCTIONCODE_GET_AUTH_TEXTDATA_RES);
	if (iLenData == -1) {
		return false;
	}
	iOffset = 0;
	if (iLenData > 0) {
		var iTOKEN_DATA_LEN = 0x00;
		var chArrAsciiENCTokenData = new Int8Array(50);
		iTOKEN_DATA_LEN = chArrReceiveBuffer[iOffset++];
		chArrAsciiENCTokenData.set(chArrReceiveBuffer.slice(iOffset, iOffset + iTOKEN_DATA_LEN), 0);
		iOffset += iTOKEN_DATA_LEN;
		this.uchArrEncTokenData.set(CUtils.a2bcd(CUtils.Bytes2String(chArrAsciiENCTokenData).slice(0, iTOKEN_DATA_LEN)), 0);
		this.iLenEncTokenData = (iTOKEN_DATA_LEN / 2);
		this.uchArrHexDecryptedTokenData.fill(0x00);
		this.uchArrAsciiAuthTextData.fill(0x00);
		var iDecryptedTokenDataLength = this.DecryptTokenData(this.uchArrHashAuthToken, this.uchArrEncTokenData, this.iLenEncTokenData, this.uchArrHexDecryptedTokenData);
	}
	if (iDecryptedTokenDataLength) {
		this.uchArrHexDecryptedTokenData = this.uchArrHexDecryptedTokenData.slice(0, iDecryptedTokenDataLength);
		return true;
	}
	return false;
}
CHSMInterface.prototype.DecryptTokenData = function (uchArrKeyData, uchArrEncData, iLenEncData, uchArrHexDecryptedData) {
	uchArrEncData = uchArrEncData.slice(0, iLenEncData);
	var bArrDecryptedData = CryptoHandler.TripleDesDecrypt(uchArrEncData, uchArrKeyData);
	if (bArrDecryptedData == null) {
		return null;
	}
	uchArrHexDecryptedData.set(bArrDecryptedData, 0);
	return bArrDecryptedData.length;
}
CHSMInterface.prototype.iGetPTMKResponse = async function (iRequestType, chArrReceiveBuffer, iOffset) {
	var iLenData = 0;
	var iFunctionCode = 0;
	if (iRequestType == PTMKRequestTypeConsts.RESET_PTMK) {
		iFunctionCode = Consts.FUNCTIONCODE_RESETKEY_RES;
	} else {
		iFunctionCode = Consts.FUNCTIONCODE_RENEWKEY_RES;
	}
	var iRetVal = false;
	iLenData = this.iParseCommunicationResponse(chArrReceiveBuffer, iOffset, iFunctionCode);
	if (iLenData == -1) {
		return false;
	}
	this.stResetResponse = new Structs.st_RESET_RESPONSE();
	this.iParsePTMKResponse(chArrReceiveBuffer, iLenData, this.stResetResponse);
	if (this.stResetResponse.iIsZMKCompUnderPMK == 0x00) {
		iRetVal = await this.getandUpdateClearPTMKPin(this.stResetResponse);
		iRetVal = await this.getandUpdateClearPTMKTLE(this.stResetResponse);
	}
	else {
		iRetVal = await this.getandUpdateClearPTMKPin(this.stResetResponse);
		iRetVal = await this.getandUpdateClearPTMKTLE(this.stResetResponse);
	}
	if (iRetVal != 0) {
		return false;
	}
	return true;
}
CHSMInterface.prototype.iParsePTMKResponse = function (chArrReceivedBuffer, iLenReceivedBuffer, stResetResponse) {
	var iOffset = 0;
	var chArrTempComp = new Uint8Array(32);
	var chArrTempKCV = new Uint8Array(6);
	if (iLenReceivedBuffer < 247) {
		return false;
	}
	stResetResponse.iIsZMKCompUnderPMK = chArrReceivedBuffer[iOffset++];
	stResetResponse.iNumKeySlots = chArrReceivedBuffer[iOffset++];
	var it = 0;
	var iKeySlotID = 0;
	for (it = 0; it < stResetResponse.iNumKeySlots; it++) {
		iKeySlotID = chArrReceivedBuffer[iOffset++];
		stResetResponse.sZMKKeys[it].iKeySlotID = iKeySlotID;
		var chXChar = chArrReceivedBuffer[iOffset++];
		if (!(88 == chXChar || 120 == chXChar)) {
			return false;
		}
		chArrTempComp.set(chArrReceivedBuffer.slice(iOffset, iOffset + 32), 0);
		CUtils.a2bcdh(stResetResponse.sZMKKeys[it].uchArrPinZMKComp1, chArrTempComp, 32);
		iOffset += 32;
		chArrTempKCV.set(chArrReceivedBuffer.slice(iOffset, iOffset + 6), 0);
		CUtils.a2bcdh(stResetResponse.sZMKKeys[it].uchArrKCVPinZMKComp1, chArrTempKCV, 6);
		iOffset += 6;
		chXChar = chArrReceivedBuffer[iOffset++];
		if (!(88 == chXChar || 120 == chXChar)) {
			return false;
		}
		chArrTempComp.fill(0x00);
		chArrTempComp.set(chArrReceivedBuffer.slice(iOffset, iOffset + 32), 0);
		CUtils.a2bcdh(stResetResponse.sZMKKeys[it].uchArrPinZMKComp2, chArrTempComp, 32);
		iOffset += 32;
		chArrTempKCV.fill(0x00);
		chArrTempKCV.set(chArrReceivedBuffer.slice(iOffset, iOffset + 6), 0);
		CUtils.a2bcdh(stResetResponse.sZMKKeys[it].uchArrKCVPinZMKComp2, chArrTempKCV, 6);
		iOffset += 6;
		chXChar = chArrReceivedBuffer[iOffset++];
		if (!(88 == chXChar || 120 == chXChar)) {
			return false;
		}
		chArrTempComp.fill(0x00);
		chArrTempComp.set(chArrReceivedBuffer.slice(iOffset, iOffset + 32), 0);
		CUtils.a2bcdh(stResetResponse.sZMKKeys[it].uchArrPinZMKComp3, chArrTempComp, 32);
		iOffset += 32;
		chArrTempKCV.fill(0x00);
		chArrTempKCV.set(chArrReceivedBuffer.slice(iOffset, iOffset + 6), 0);
		CUtils.a2bcdh(stResetResponse.sZMKKeys[it].uchArrKCVPinZMKComp3, chArrTempKCV, 6);
		iOffset += 6;
		chArrTempComp.fill(0x00);
		chArrTempComp.set(CryptoHandler.XOR(stResetResponse.sZMKKeys[it].uchArrPinZMKComp1, stResetResponse.sZMKKeys[it].uchArrPinZMKComp2, 16), 0);
		stResetResponse.sZMKKeys[it].uchArrPinZMKFinal.set(CryptoHandler.XOR(chArrTempComp, stResetResponse.sZMKKeys[it].uchArrPinZMKComp3, 16), 0);
		chArrTempKCV.fill(0x00);
		chArrTempKCV.set(chArrReceivedBuffer.slice(iOffset, iOffset + 6), 0);
		CUtils.a2bcdh(stResetResponse.sZMKKeys[it].uchArrKCVPinZMKFinal, chArrTempKCV, 6);
		iOffset += 6;
		chXChar = chArrReceivedBuffer[iOffset++];
		if (!(88 == chXChar || 120 == chXChar)) {
			return false;
		}
		chArrTempComp.fill(0x00);
		chArrTempComp.set(chArrReceivedBuffer.slice(iOffset, iOffset + 32), 0);
		CUtils.a2bcdh(stResetResponse.sZMKKeys[it].uchArrTLEZMKComp1, chArrTempComp, 32);
		iOffset += 32;
		chArrTempKCV.fill(0x00);
		chArrTempKCV.set(chArrReceivedBuffer.slice(iOffset, iOffset + 6), 0);
		CUtils.a2bcdh(stResetResponse.sZMKKeys[it].uchArrKCVTLEZMKComp1, chArrTempKCV, 6);
		iOffset += 6;
		chXChar = chArrReceivedBuffer[iOffset++];
		if (!(88 == chXChar || 120 == chXChar)) {
			return false;
		}
		chArrTempComp.fill(0x00);
		chArrTempComp.set(chArrReceivedBuffer.slice(iOffset, iOffset + 32), 0);
		CUtils.a2bcdh(stResetResponse.sZMKKeys[it].uchArrTLEZMKComp2, chArrTempComp, 32);
		iOffset += 32;
		chArrTempKCV.fill(0x00);
		chArrTempKCV.set(chArrReceivedBuffer.slice(iOffset, iOffset + 6), 0);
		CUtils.a2bcdh(stResetResponse.sZMKKeys[it].uchArrKCVTLEZMKComp2, chArrTempKCV, 6);
		iOffset += 6;
		chXChar = chArrReceivedBuffer[iOffset++];
		if (!(88 == chXChar || 120 == chXChar)) {
			return false;
		}
		chArrTempComp.fill(0x00);
		chArrTempComp.set(chArrReceivedBuffer.slice(iOffset, iOffset + 32), 0);
		CUtils.a2bcdh(stResetResponse.sZMKKeys[it].uchArrTLEZMKComp3, chArrTempComp, 32);
		iOffset += 32;
		chArrTempKCV.fill(0x00);
		chArrTempKCV.set(chArrReceivedBuffer.slice(iOffset, iOffset + 6), 0);
		CUtils.a2bcdh(stResetResponse.sZMKKeys[it].uchArrKCVTLEZMKComp3, chArrTempKCV, 6);
		iOffset += 6;
		chArrTempComp.fill(0x00);
		chArrTempComp.set(CryptoHandler.XOR(stResetResponse.sZMKKeys[it].uchArrTLEZMKComp1, stResetResponse.sZMKKeys[it].uchArrTLEZMKComp2, 16), 0);
		stResetResponse.sZMKKeys[it].uchArrTLEZMKFinal.set(CryptoHandler.XOR(chArrTempComp, stResetResponse.sZMKKeys[it].uchArrTLEZMKComp3, 16), 0);
		chArrTempKCV.fill(0x00);
		chArrTempKCV.set(chArrReceivedBuffer.slice(iOffset, iOffset + 6), 0);
		CUtils.a2bcdh(stResetResponse.sZMKKeys[it].uchArrKCVTLEZMKFinal, chArrTempKCV, 6);
		iOffset += 6;
	}
	return true;
}
CHSMInterface.prototype.getandUpdateClearPTMKPin = async function (stResetResponse) {
	var it = 0;
	this.iNumKeySlotsPTMK = stResetResponse.iNumKeySlots;
	for (it = 0; it < stResetResponse.iNumKeySlots; it++) {
		var iPTMKUnderPMK = stResetResponse.iIsZMKCompUnderPMK;
		var chArrPinEncryptionKey = new Uint8Array(16);
		if (!iPTMKUnderPMK) {
			chArrPinEncryptionKey.set(CUtils.a2bcd(CUtils.Bytes2String(this.stPMK.chArrPMK)), 0);
		} else {
			chArrPinEncryptionKey.set(CUtils.a2bcd(CUtils.Bytes2String(this.sArrPTMK[it].uchArrPINKey)), 0);
		}
		var chArrDecryptedPTMKPinComp1 = new Uint8Array(16);
		chArrDecryptedPTMKPinComp1.set(CryptoHandler.TripleDesDecrypt(stResetResponse.sZMKKeys[it].uchArrPinZMKComp1, chArrPinEncryptionKey), 0);
		var chArrDecryptedPTMKPinComp2 = new Uint8Array(16);
		chArrDecryptedPTMKPinComp2.set(CryptoHandler.TripleDesDecrypt(stResetResponse.sZMKKeys[it].uchArrPinZMKComp2, chArrPinEncryptionKey), 0);
		var chArrDecryptedPTMKPinComp3 = new Uint8Array(16);
		chArrDecryptedPTMKPinComp3.set(CryptoHandler.TripleDesDecrypt(stResetResponse.sZMKKeys[it].uchArrPinZMKComp3, chArrPinEncryptionKey), 0);
		var chArrTempPTMKPin = new Uint8Array(16);
		var chArrPTMKPinFinal = new Uint8Array(16);
		chArrTempPTMKPin.set(CryptoHandler.XOR(chArrDecryptedPTMKPinComp1, chArrDecryptedPTMKPinComp2, 16), 0);
		chArrPTMKPinFinal.set(CryptoHandler.XOR(chArrTempPTMKPin, chArrDecryptedPTMKPinComp3, 16), 0);
		var chArrChecksumFinal = new Uint8Array(3);
		chArrChecksumFinal.set(CryptoHandler.GetChecksum(chArrPTMKPinFinal).slice(0, 3), 0);
		if (CUtils.Bytes2String(chArrChecksumFinal) != CUtils.Bytes2String(stResetResponse.sZMKKeys[it].uchArrKCVPinZMKFinal)) {
			return -1;
		}
		this.sArrPTMK[it].uchArrPINKey.set(CUtils.bcd2a(chArrPTMKPinFinal, 16), 0);
		this.sArrPTMK[it].uchArrKCVPINKey.set(CUtils.bcd2a(chArrChecksumFinal, 3), 0);
		this.sArrPTMK[it].iSlotID = Consts.keySlotMap[it];
		dbAccessor = new DBAccessor();
		await dbAccessor.iInsertOrUpdatePTMKPin(this.chArrDeviceSerialNumber, this.sArrPTMK[it]);
	}
	return 0;
}
CHSMInterface.prototype.getandUpdateClearPTMKTLE = async function (stResetResponse) {
	var it = 0;
	this.iNumKeySlotsPTMK = stResetResponse.iNumKeySlots;
	for (it = 0; it < stResetResponse.iNumKeySlots; it++) {
		var iPTMKUnderPMK = stResetResponse.iIsZMKCompUnderPMK;
		var chArrTLEEncryptionKey = new Uint8Array(16);
		if (!iPTMKUnderPMK) {
			chArrTLEEncryptionKey.set(CUtils.a2bcd(CUtils.Bytes2String(this.stPMK.chArrPMK)), 0);
		}
		else {
			chArrTLEEncryptionKey.set(CUtils.a2bcd(CUtils.Bytes2String(this.sArrPTMK[it].uchArrTLEKey)), 0);
		}
		var chArrDecryptedPTMKTLEComp1 = new Uint8Array(16);
		chArrDecryptedPTMKTLEComp1.set(CryptoHandler.TripleDesDecrypt(stResetResponse.sZMKKeys[it].uchArrTLEZMKComp1, chArrTLEEncryptionKey), 0);
		var chArrDecryptedPTMKTLEComp2 = new Uint8Array(16);
		chArrDecryptedPTMKTLEComp2.set(CryptoHandler.TripleDesDecrypt(stResetResponse.sZMKKeys[it].uchArrTLEZMKComp2, chArrTLEEncryptionKey), 0);
		var chArrDecryptedPTMKTLEComp3 = new Uint8Array(16);
		chArrDecryptedPTMKTLEComp3.set(CryptoHandler.TripleDesDecrypt(stResetResponse.sZMKKeys[it].uchArrTLEZMKComp3, chArrTLEEncryptionKey), 0);
		var chArrTempPTMKTLE = new Uint8Array(16);
		var chArrPTMKTLEFinal = new Uint8Array(16);
		chArrTempPTMKTLE.set(CryptoHandler.XOR(chArrDecryptedPTMKTLEComp1, chArrDecryptedPTMKTLEComp2, 16), 0);
		chArrPTMKTLEFinal.set(CryptoHandler.XOR(chArrTempPTMKTLE, chArrDecryptedPTMKTLEComp3, 16), 0);
		var chArrChecksumFinal = new Uint8Array(3);
		chArrChecksumFinal.set(CryptoHandler.GetChecksum(chArrPTMKTLEFinal).slice(0, 3), 0);
		if (CUtils.Bytes2String(chArrChecksumFinal) != CUtils.Bytes2String(stResetResponse.sZMKKeys[it].uchArrKCVTLEZMKFinal)) {
			return -1;
		}
		this.sArrPTMK[it].uchArrTLEKey.set(CUtils.bcd2a(chArrPTMKTLEFinal, 16), 0);
		this.sArrPTMK[it].uchArrKCVTLEKey.set(CUtils.bcd2a(chArrChecksumFinal, 3), 0);
		this.sArrPTMK[it].iSlotID = Consts.keySlotMap[it];
		dbAccessor = new DBAccessor();
		await dbAccessor.iInsertOrUpdatePTMKTLE(this.chArrDeviceSerialNumber, this.sArrPTMK[it]);
	}
	return 0;
}
CHSMInterface.prototype.iGetAuthTokenRequest = function (uchSendBuffer) {
	if (!this.GetAuthToken(this.uchArrHashAuthToken)) {
		return false;
	}
	this.iLenHashAuthToken = this.uchArrHashAuthToken.length;
	var str1 = CUtils.Bytes2String(this.uchArrHashAuthToken);
	var str2 = Buffer.from(this.uchArrHashAuthToken).toString('ascii');
	var strFinalHash = CryptoHandler.GetSHA1(this.uchArrHashAuthToken);
	if (strFinalHash == null) {
		return false;
	}
	this.chArrReqAuthTextData.set(CUtils.a2bcd(strFinalHash));
	this.iLenReqAuthTextData = this.chArrReqAuthTextData.length;
	this.uchArrEncTokenData.fill(0x00);
	this.chArrAsciiAuthDataFromSeed.fill(0x00);
	this.chArrAsciiAuthDataFromSeed.set(CUtils.String2Bytes(strFinalHash));
	this.iLenReqAuthTextData = this.iLenReqAuthTextData * 2;
	var chArrData = new Int8Array(200);
	var iOffset = 0;
	chArrData[iOffset++] = this.m_iDeviceType;
	chArrData[iOffset++] = this.iLenDNS & 0x000000FF;
	if (this.iLenDNS > 0) {
		chArrData.set(this.chArrDeviceSerialNumber, iOffset);
		iOffset += this.iLenDNS;
	}
	chArrData.set(this.chArrDateTime, iOffset);
	iOffset += this.chArrDateTime.length;
	chArrData[iOffset++] = (this.iLenReqAuthTextData & 0x00FF) & (255);
	if (this.iLenReqAuthTextData > 0) {
		chArrData.set(this.chArrAsciiAuthDataFromSeed, iOffset);
		iOffset += this.iLenReqAuthTextData;
	}
	var iDataLen = iOffset;
	iOffset = 0;
	iOffset = this.iGetRequestMessage(Consts.FUNCTIONCODE_GET_AUTH_TEXTDATA_REQ, chArrData, iDataLen);
	uchSendBuffer.set(this.uchArrSendRecvBuff.slice(0, iOffset), 0);
	this.uchArrSendRecvBuff.fill(0x00);
	return iOffset;
}
CHSMInterface.prototype.GetAuthToken = function (uchArrHashRegAuthToken) {
	var uchArrAuthSeed = new Int8Array(50);
	uchArrAuthSeed.set(CUtils.String2Bytes(Consts.MY_AUTH_TOKEN_SEED), 0);
	uchArrHashRegAuthToken.set(CryptoHandler.GetHashEncKey_PMK_HSM(CUtils.Bytes2String(uchArrAuthSeed).slice(0, Consts.MY_AUTH_TOKEN_SEED.length), CUtils.Bytes2String(this.chArrDeviceSerialNumber), CUtils.Bytes2String(this.chArrDateTime)), 0);
	return true;
}
CHSMInterface.prototype.iGetPMKDataRequest = function (uchSendBuffer) {
	this.chArrReqAuthTextData.fill(0x00);
	this.iLenReqAuthTextData = 0;
	this.GetAuthTextData(this.uchArrHexDecryptedTokenData, this.iLenEncTokenData, this.chArrReqAuthTextData);
	this.iLenReqAuthTextData = this.chArrReqAuthTextData.length;
	this.uchArrHexEncPMKComp1.fill(0x00);
	this.uchArrHexEncPMKComp2.fill(0x00);
	var bArrAsciiAuthTextTempData = CUtils.bcd2a(this.chArrReqAuthTextData, this.iLenReqAuthTextData);
	this.uchArrAsciiAuthTextData.set(bArrAsciiAuthTextTempData, 0);
	var chArrData = new Uint8Array(200);
	var iOffset = 0;
	chArrData[iOffset++] = this.m_iDeviceType & 0x00FF;
	chArrData[iOffset++] = this.iLenDNS & 0x00FF;
	if (this.iLenDNS > 0) {
		chArrData.set(this.chArrDeviceSerialNumber, iOffset);
		iOffset += this.iLenDNS;
	}
	chArrData.set(this.chArrDateTime, iOffset);
	iOffset += this.chArrDateTime.length;
	var iLenTOKENData = this.uchArrAsciiAuthTextData.slice(0, bArrAsciiAuthTextTempData.length).length;
	chArrData[iOffset++] = iLenTOKENData & 0x000000FF;
	chArrData.set(this.uchArrAsciiAuthTextData.slice(0, iLenTOKENData), iOffset);
	iOffset += iLenTOKENData;
	var iDataLen = iOffset;
	iOffset = 0;
	iOffset = this.iGetRequestMessage(Consts.FUNCTIONCODE_PMK_HSM_REQ, chArrData, iDataLen);
	uchSendBuffer.set(this.uchArrSendRecvBuff.slice(0, iOffset), 0);
	this.uchArrSendRecvBuff.fill(0x00);
	return iOffset;
}
CHSMInterface.prototype.GetAuthTextData = function (chArrDecTokenData, iLenDecTokenData, uchArrRegAuthTextData) {
	uchArrRegAuthTextData.set(CryptoHandler.GetHashEncKey_PMK_HSM(chArrDecTokenData, this.chArrDeviceSerialNumber, this.chArrDateTime), 0);
	if (uchArrRegAuthTextData) {
		uLenRegAuthTextData = uchArrRegAuthTextData.length;
		return true;
	}
	return false;
}
CHSMInterface.prototype.iGetPTMKRequest = function (iRequestType, uchSendBuffer) {
	var it = 0;
	var iKeySlotPin = 10;
	var iKeySlotTLE = 12;
	var iNumKeySlot = 1;
	var iUseDefaultKeySlotOnly = 1;
	if (0x0001 == iUseDefaultKeySlotOnly) {//need to change constatnt 0x0001=BST_CHECKED 
		iNumKeySlot = Consts.DEFAULT_NUM_KEYSLOT;
	} else {
		iNumKeySlot = Consts.NUM_KEYSLOTS;
	}
	var iFunctionCode = 0;
	var chArrData = new Int8Array(2000);
	var iOffset = 0;
	chArrData[iOffset++] = this.m_iDeviceType & 0x00FF;
	chArrData[iOffset++] = this.iLenDNS & 0x00FF;
	if (this.iLenDNS > 0) {
		chArrData.set(this.chArrDeviceSerialNumber, iOffset);
		iOffset += this.iLenDNS;
	}
	chArrData[iOffset++] = iNumKeySlot;
	for (it = 0; it < iNumKeySlot; it++) {
		chArrData[iOffset++] = Consts.keySlotMap[it] & 0x00FF;
		if (iRequestType == PTMKRequestTypeConsts.RENEW_PTMK) {
			chArrData.set(this.sArrPTMK[it].uchArrKCVPINKey, iOffset);
			iOffset += 6;
			chArrData.set(this.sArrPTMK[it].uchArrKCVTLEKey, iOffset);
			iOffset += 6;
		}
	}
	var iDataLen = iOffset;
	iOffset = 0;
	if (iRequestType == PTMKRequestTypeConsts.RESET_PTMK) {
		iFunctionCode = Consts.FUNCTIONCODE_RESETKEY_REQ;
	} else {
		iFunctionCode = Consts.FUNCTIONCODE_RENEWKEY_REQ;
	}
	iOffset = this.iGetRequestMessage(iFunctionCode, chArrData, iDataLen);
	uchSendBuffer.set(this.uchArrSendRecvBuff.slice(0, iOffset), 0);
	this.uchArrSendRecvBuff.fill(0x00);
	return iOffset;
}
CHSMInterface.prototype.iEndSessionRequest = function (uchSendBuffer) {
	var iOffset = 0;
	this.uchArrSendRecvBuff.fill(0x00);
	iOffset = this.iGetRequestMessage(Consts.FUNCTIONCODE_END_SESSION_REQ, "", 0);
	uchSendBuffer.set(this.uchArrSendRecvBuff.slice(0, iOffset), 0);
	this.uchArrSendRecvBuff.fill(0x00);
	return iOffset;
}
CHSMInterface.prototype.iFormatAndECBEncrypt = function (chArrInput, iInputLength, chPadChar, iPadType, iSlotID) {
	var iLenInput = iInputLength;
	var iretTLE = 0;
	var chArrTempInput;
	if (iInputLength % 8 != 0) {
		iLenInput = iInputLength + 8 - iInputLength % 8;
		chArrInput = chArrInput.slice(0, iLenInput);
		if (iPadType == EnPadStyle._LEFT_PAD) {
			chArrTempInput = CUtils.String2Bytes(CUtils.StrLeftPad(CUtils.Bytes2String(chArrInput), iLenInput, chPadChar));
		} else {
			chArrTempInput = CUtils.String2Bytes(CUtils.StrRightPad(chArrInput, iLenInput, chPadChar));
		}
	} else {
		chArrTempInput = chArrInput.slice(0, iLenInput);
	}
	var chArroutput = this.iGetEncryptedData(iSlotID, chArrTempInput, iLenInput);
	return chArroutput;
}
CHSMInterface.prototype.iGetEncryptedData = function (iKeySlotID, chArrInputData, iLenInputData) {
	var iIndex = parseInt((iKeySlotID - Consts.keySlotMap[0]) / (Consts.keySlotMap[1] - Consts.keySlotMap[0]));
	var chArrEncryptionKey = new Uint8Array((this.sArrPSK[iIndex].uchArrTLEKey.length) / 2)
	chArrEncryptionKey.set(CUtils.a2bcd(CUtils.Bytes2String(this.sArrPSK[iIndex].uchArrTLEKey)), 0);
	var chArrOutputData = CryptoHandler.TripleDesEncrypt(chArrInputData, chArrEncryptionKey, " ");
	return chArrOutputData;
}
CHSMInterface.prototype.iGetEncryptedPin = function (iKeySlotID, chArrInputData, iLenInputData) {
	var iIndex = iKeySlotID;
	var chArrEncryptionKey = new Uint8Array(16);
	chArrEncryptionKey.fill("0".charCodeAt(0), 0);
	var chArrOutputData = CryptoHandler.TripleDesEncrypt(chArrInputData, chArrEncryptionKey, " ");
	return chArrOutputData;
}
module.exports = CHSMInterface;
