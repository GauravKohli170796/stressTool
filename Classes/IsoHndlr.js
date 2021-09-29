var Consts = require("../Constants/AppConsts");
var CConx = require("./Conx");
var Utils = new require("./Utils");
var server=require("../core/server");
var CUtils = new Utils();
class CIsoHandler {
	constructor(pConx) {
		this.m_pConx = new CConx;
		this.m_pConx = pConx;
		this.m_batchID = 0;
		this.m_iRoc = 0;
		this.m_bIsAsyncCommEnabled = false;
		this.m_ulClientId;
		this.m_bIsoPacketId = new Uint8Array(Consts.LEN_ISO_PACKET_PREFIX_FOR_ASYNC_COMM);
	}
}
CIsoHandler.prototype.sendISOPacket = async function (ip) {
	var bIsSend = false;
	var bArrSendBuffer = new Int8Array(Consts.MAX_SEND_DATA);
	var iPacketLength = await ip.packIt(bArrSendBuffer);
	var len = new Uint8Array(Consts.LEN_ISO_PACKET_LEN);
	len[0] = (iPacketLength >> 8);
	len[1] = iPacketLength;
	var bArrSendBufferSync = new Int8Array(iPacketLength + 7);
	ip.m_TPDU[0] = 0x61;
	bArrSendBufferSync.set(ip.m_TPDU, 0);
	bArrSendBufferSync.set(len, Consts.MAX_LEN_TPDU);
	bArrSendBufferSync.set(bArrSendBuffer.slice(0, iPacketLength), Consts.MAX_LEN_TPDU + 2);
	var g_bIsAsyncFlow =server.iAsyncFlow;
	if (g_bIsAsyncFlow) {
		ip.m_nBatchID = 0;
		ip.m_iRoc = 0;
		this.BuildPacketIdentifier(ip.m_TPDU, iPacketLength, ip.m_nBatchID, ip.m_iRoc, ip.m_llClientId);
		var iPacketLen = iPacketLength + Consts.MAX_LEN_TPDU + Consts.LEN_ISO_PACKET_LEN + Consts.LEN_ISO_PACKET_PREFIX_FOR_ASYNC_COMM;
		var sendData = new Int8Array(iPacketLen);
		sendData.set(this.m_bIsoPacketId, 0);
		sendData.set(bArrSendBufferSync, Consts.LEN_ISO_PACKET_PREFIX_FOR_ASYNC_COMM);
		return (sendData);
	}
	else {
		return (bArrSendBufferSync);
	}
}
CIsoHandler.prototype.BuildPacketIdentifier = function (TPDU, bytes, ulBatchId, ulROC, llclientid) {
	var objbatchId = { ibatchId: 0 };
	var objroc = { iroc: 0 };
	this.m_ulClientId = llclientid;
	var iRetRand = this.GetRandomNumber(objbatchId, 1000000);
	if (iRetRand == true) {
		ulBatchId = objbatchId.ibatchId;
		this.m_batchID = objbatchId.ibatchId;
	}
	iRetRand = this.GetRandomNumber(objroc, 1000000);
	if (iRetRand == true) {
		ulROC = objroc.iroc;
		this.m_iRoc = objroc.iroc;
	}
	var iOffset = 0;
	this.m_bIsoPacketId.set(TPDU, iOffset);
	this.m_bIsoPacketId[iOffset] = Consts.TPDU_DIALUP_ASYNC;
	iOffset += Consts.MAX_LEN_TPDU;
	var len = bytes + Consts.LEN_ISO_PACKET_PREFIX_FOR_ASYNC_COMM;
	this.m_bIsoPacketId[iOffset++] = ((len >> 8) & (0XFF));
	this.m_bIsoPacketId[iOffset++] = ((len >> 0) & (0XFF));
	this.m_bIsoPacketId[iOffset++] = ((llclientid >> 56) & (0XFF));
	this.m_bIsoPacketId[iOffset++] = ((llclientid >> 48) & (0XFF));
	this.m_bIsoPacketId[iOffset++] = ((llclientid >> 40) & (0XFF));
	this.m_bIsoPacketId[iOffset++] = ((llclientid >> 32) & (0XFF));
	this.m_bIsoPacketId[iOffset++] = ((llclientid >> 24) & (0XFF));
	this.m_bIsoPacketId[iOffset++] = ((llclientid >> 16) & (0XFF));
	this.m_bIsoPacketId[iOffset++] = ((llclientid >> 8) & (0XFF));
	this.m_bIsoPacketId[iOffset++] = ((llclientid >> 0) & (0XFF));
	this.m_bIsoPacketId[iOffset++] = ((ulBatchId >> 24) & (0XFF));
	this.m_bIsoPacketId[iOffset++] = ((ulBatchId >> 16) & (0XFF));
	this.m_bIsoPacketId[iOffset++] = ((ulBatchId >> 8) & (0XFF));
	this.m_bIsoPacketId[iOffset++] = ((ulBatchId >> 0) & (0XFF));
	this.m_bIsoPacketId[iOffset++] = ((ulROC >> 24) & (0XFF));
	this.m_bIsoPacketId[iOffset++] = ((ulROC >> 16) & (0XFF));
	this.m_bIsoPacketId[iOffset++] = ((ulROC >> 8) & (0XFF));
	this.m_bIsoPacketId[iOffset++] = ((ulROC >> 0) & (0XFF));
}
CIsoHandler.prototype.GetRandomNumber = function (outRandomValue, iMaxValue) {
	var iRet = false;
	outRandomValue.ibatchId = 0;
	if (iMaxValue > 0) {
		outRandomValue.ibatchId = parseInt(Math.random() * (iMaxValue - 0), 10);
		iRet = true;
	}
	return iRet;
}
CIsoHandler.prototype.getNextMessage = function (ip, bArrReceivedData, iLen) {
	if (bArrReceivedData == null || !iLen) {
		return 0;
	}
	var iOffSet = 0;
	var g_bIsAsyncFlow =server.iAsyncFlow;
	if (g_bIsAsyncFlow) {
		if (iLen < 23)
			return false;
		iOffSet = Consts.LEN_ISO_PACKET_PREFIX_FOR_ASYNC_COMM;
		var chIsoPacketId = new Int8Array(Consts.LEN_ISO_PACKET_PREFIX_FOR_ASYNC_COMM);
		var bytesRead = Consts.LEN_ISO_PACKET_PREFIX_FOR_ASYNC_COMM;
		chIsoPacketId.set(bArrReceivedData.slice(0, 23), 0);
		if (!this.VerifyPacketIdentifier(chIsoPacketId)) {
			return false;
		}
	}
	if (!ip.unPackHostDirect(bArrReceivedData.slice(iOffSet, bArrReceivedData.length))) {
		return 0;
	}
	return (parseInt(ip.msgno));
}
CIsoHandler.prototype.VerifyPacketIdentifier = function (recPacketId) {
	var bArrrecPacketId = Uint8Array.from(recPacketId);
	return (CUtils.Bytes2String(this.m_bIsoPacketId.slice(7, Consts.LEN_ISO_PACKET_PREFIX_FOR_ASYNC_COMM - 7)) == CUtils.Bytes2String(bArrrecPacketId.slice(7, Consts.LEN_ISO_PACKET_PREFIX_FOR_ASYNC_COMM - 7)));
}
module.exports = CIsoHandler;