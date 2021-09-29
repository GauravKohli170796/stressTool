var CDBAccessor = require('./DBAccessor');
var dBAccessor = new CDBAccessor();
var Consts = require("../Constants/AppConsts");
var CIsoHandler = require("./IsoHndlr");
var CISO440 = require("./ISO440");
var CISO500 = require("./ISO500");
var CISO220 = require("./ISO220");
var CConx = require("./Conx");
var Utils = require("./Utils");
var ETXNType=require("../Constants/ETXNType");
var CHSMInterface = require("./HSMInterface");
var CISO320HostComm = require("./ISO320HostComm");
var server = require("../core/server");
var g_bIsCloseButtonClicked = false;
var UIHandler=require("../core/classes/UIHandler");
var CUIHandler=new UIHandler().getInstance();
var BaseNode=require("./BaseNode").CBaseNode;
var CUtils = new Utils();
var ISO320HostCommChangeNumberConsts = require("../Constants/ISO320HostCommChangeNumberConsts");
class CIsoProcessor {
	constructor(db) {
		this.dBAccessor = db;
		this.m_chTerminalId = this.dBAccessor.m_sParamData.chTerminalId;
		this.BYTEm_chMerchantId = undefined;
		this.m_chListnerIP = undefined;
		this.m_iListenerPort;
		this.m_bDataToReplay;
		this.m_chNII = undefined;
		this.m_bArrDataToReplay = new Uint8Array(Consts.MAX_REPLAY_DATA_LEN);
		this.m_iReplayDataLen;
	}
}
CIsoProcessor.prototype.DoHUBActivation = async function () {
	var conx = new CConx().getInstance();
	var isSSLFlag= (this.dBAccessor.m_iIsSSLOn == 1) ? true : false;
	conx.CConxC();
	var bIsConnected = await conx.waitForConnect(this.dBAccessor.m_scomparam.chListenerIP, this.dBAccessor.m_scomparam.iListenerPort, isSSLFlag)
	if (!bIsConnected) {
		this.dBAccessor.m_csResponseMssg ="Activation Unable to Connect";
		CUIHandler.log(this.dBAccessor.m_csResponseMssg);
		await conx.disconnect();
		return false;
	}
	var bIsTerminalActive = false;
	var iTerminalIdLen = this.m_chTerminalId.length;
	var cisohandler = new CIsoHandler(conx);
	var ip440 = new CISO440(this.dBAccessor);
	ip440.CISO440C(this.m_chTerminalId, iTerminalIdLen, this.m_chNII);
	ip440.SetActivationRequestData();
	var bArrSendBuffer = await cisohandler.sendISOPacket(ip440);
	var bIsSend = await conx.send(bArrSendBuffer);
	if (!bIsSend) {
		this.dBAccessor.m_csResponseMssg =" Send Failed";
		ip440.CISOMsgD();
		await conx.disconnect();
		return false;
	}
	var bArrReceivedData = await conx.ReceivedCompletePacket();
	if (bArrReceivedData == null) {
		CUIHandler.log(" Complete Data not received from server");
		return false;
	}
	if (cisohandler.getNextMessage(ip440, bArrReceivedData, bArrReceivedData.length) != 450) {
		this.dBAccessor.m_csResponseMssg =" Receive Failed";
		ip440.CISOMsgD();
		await conx.disconnect();
		return false;
	}
	if (!ip440.IsOK()) {
		dBAccessor.m_csResponseMssg =" ACTIVATION FAILED";
		ip440.CISOMsgD();
		await conx.disconnect();
		return false;
	}
	ip440.bFnGetTokenDataForHUB();
	ip440.CISOMsgD();
	await conx.disconnect();
	return true;
}
CIsoProcessor.prototype.DoHUBRegistration = async function () {
	var conx = new CConx().getInstance();
	var isSSLFlag= (this.dBAccessor.m_iIsSSLOn == 1) ? true : false;
	conx.CConxC();
	var bIsConnected = await conx.waitForConnect(this.dBAccessor.m_scomparam.chListenerIP, this.dBAccessor.m_scomparam.iListenerPort, isSSLFlag)
	if (!bIsConnected) {
		this.dBAccessor.m_csResponseMssg =" Initialization Unable to Connect";
		CUIHandler.log(this.dBAccessor.m_csResponseMssg);
		await conx.disconnect();
		return false;
	}
	var iTerminalIdLen = this.m_chTerminalId.length;
	var chArrDateTime = CUtils.SetCurrentDateTime();
	var objHSMinterface = new CHSMInterface(11234, 1, 1, 180000, this.dBAccessor.m_sParamData.PED_HwSerialNumber, "12345", chArrDateTime,
		"192.168.100.176", 8089);
	await objHSMinterface.iGetInitialData();
	var cisohandler = new CIsoHandler(conx);
	var ip320HostComm = new CISO320HostComm(this.dBAccessor, objHSMinterface);
	ip320HostComm.Start();
	var uchArrBitmap320HUB = new Uint8Array(6);
	uchArrBitmap320HUB.set(this.dBAccessor.m_sMasterParamData.m_uchArrBitmap320HUBChangeNumber, 0);
	do {
		ip320HostComm.CISO320C(this.m_chTerminalId, iTerminalIdLen, this.m_chNII);
		var bArrSendBuffer = await cisohandler.sendISOPacket(ip320HostComm);
		var bIsSend = await conx.send(bArrSendBuffer);
		if (!bIsSend) {
			this.dBAccessor.m_csResponseMssg =" Initialization Send Failed";
			ip320HostComm.CISOMsgD();
			ip320HostComm.CISO320MsgD();
			await conx.disconnect();
			return false;
		}
		//Receiving complete packet here 
		var bArrReceivedData = await conx.ReceivedCompletePacket();
		if (bArrReceivedData == null) {
			CUIHandler.log(" Complete Data not received from server");
			return false;
		}
		if (cisohandler.getNextMessage(ip320HostComm, bArrReceivedData, bArrReceivedData.length) != 330) {
			this.dBAccessor.m_csResponseMssg =" Initialization Receive Failed";
			ip320HostComm.CISOMsgD();
			ip320HostComm.CISO320MsgD();
			await conx.disconnect();
			return false;
		}
		if (!await ip320HostComm.ProcessData()) {
			this.dBAccessor.m_csResponseMssg =" Initialization ProcessData Failed";
			ip320HostComm.CISOMsgD();
			ip320HostComm.CISO320MsgD();
			await conx.disconnect();
			return false;
		}
		else {
			ip320HostComm.CISOMsgD();
		}
	}
	while (ip320HostComm.m_iChangeNumber <= ISO320HostCommChangeNumberConsts.HUB_GET_PINE_SESSION_KEY);//*//*HUB_GET_PINE_SESSION_KEY*/);
	ip320HostComm.CISO320MsgD();
	await conx.disconnect();
	return true;
}
CIsoProcessor.prototype.DoHubSettlement = async function () {
	var conx = new CConx().getInstance();
	var isSSLFlag= (this.dBAccessor.m_iIsSSLOn == 1) ? true : false;
	conx.CConxC();
	var bIsConnected = await conx.waitForConnect(this.dBAccessor.m_scomparam.chListenerIP, this.dBAccessor.m_scomparam.iListenerPort, isSSLFlag)
	if (!bIsConnected) {
		this.dBAccessor.m_csResponseMssg =" Settlement Unable to Connect";
		CUIHandler.log(this.dBAccessor.m_csResponseMssg);
		await conx.disconnect();
		return false;
	}
	var iTerminalIdLen = this.m_chTerminalId.length;
	var cisohandler = new CIsoHandler(conx);
	this.dBAccessor.m_sParamData.bIsBatchLocked =true;
	this.dBAccessor.UpdateClientDetails(this.dBAccessor);
	var ip500 = new CISO500(this.dBAccessor);
	ip500.Start();
	do {
		ip500.CISO500C(this.m_chTerminalId, iTerminalIdLen, this.m_chNII);
		var bArrSendBuffer = await cisohandler.sendISOPacket(ip500);
		var bIsSend = await conx.send(bArrSendBuffer);
		if (!bIsSend) {
			ip500.CISOMsgD();
			await conx.disconnect();
			return fasle;
		}
		//Receiving complete packet here 
		var bArrReceivedData = await conx.ReceivedCompletePacket();
		if (bArrReceivedData == null) {
			CUIHandler.log(" Complete Data not received from server");
			return false;
		}
		if (cisohandler.getNextMessage(ip500, bArrReceivedData, bArrReceivedData.length) != 510) {
			this.dBAccessor.m_csResponseMssg =" Settlement Receive Failed";
			ip500.CISOMsgD();
			await conx.disconnect();
			return false;
		}
		if (!await ip500.ProcessData()) {
			this.dBAccessor.m_csResponseMssg =" Settlement ProcessData Failed";
			ip500.CISOMsgD();
			await conx.disconnect();
			return false;
		}
		ip500.CISOMsgD();
	}
	while (ip500.m_iChangeNumber != 2);
	this.dBAccessor.m_sParamData.bIsBatchLocked = false;
	await this.dBAccessor.UpdateClientDetails(this.dBAccessor);
	await conx.disconnect();
	return true;
}
CIsoProcessor.prototype.setROC = function (bIsMiniPVMPresent, lastRoc) {
	if (bIsMiniPVMPresent) {
		return lastRoc
	}
	else {
		if (lastRoc <= 100) {
			lastRoc = 100;
		}
		lastRoc = lastRoc + 1;
	}
	return lastRoc;
}
CIsoProcessor.prototype.DoOnlineTxn = async function (bIsMiniPVMPreset, objSTxnRes) {
	var conx = new CConx().getInstance();
	if (true == g_bIsCloseButtonClicked || true == server.g_bIsStopTxnButtonClicked) {
		return false;
	}
	g_bIsConnectionFailed = false;
	conx.CConxC();
	var bisSSLFlag = (this.dBAccessor.m_iIsSSLOn == 1) ? true : false;
	var bIsConnected = await conx.waitForConnect(this.dBAccessor.m_scomparam.chListenerIP, this.dBAccessor.m_scomparam.iListenerPort, bisSSLFlag)
	if (!bIsConnected) {
		await conx.disconnect();
		g_bIsConnectionFailed = true;
		this.dBAccessor.m_csResponseMssg =" Transaction Unable to Connect";
		CUIHandler.log(this.dBAccessor.m_csResponseMssg);
		return false;
	}
	if (true == g_bIsCloseButtonClicked || true == server.g_bIsStopTxnButtonClicked) {
		await conx.disconnect();
		return false;
	}
	var iTerminalIdLen = this.m_chTerminalId.length;
	var cisohandler = new CIsoHandler(conx);
	var ullastRoc = 0x00;
	var ulcurrentRoc = 0x00;
	var ulBatchId = 0x00;
	var bReceiptPrinted = true;
	if (true == g_bIsCloseButtonClicked || true == server.g_bIsStopTxnButtonClicked) {
		this.dBAccessor.m_csResponseMssg =" Disconnect Called";
		CUIHandler.log(this.dBAccessor.m_csResponseMssg);
		await conx.disconnect();
		return false;
	}
	ullastRoc = this.dBAccessor.m_sParamData.iCurrentROC;
	ulBatchId = this.dBAccessor.m_sParamData.iCurrentBatchId;
	if (ulBatchId == 0) {
		ulBatchId = 9001;
	}
	if (ullastRoc == 0) {
		ullastRoc = 101;
	}
	ulcurrentRoc = this.setROC(bIsMiniPVMPreset, ullastRoc);
	var bContinue = true;
	while (bContinue) {
		if (true == g_bIsCloseButtonClicked || true == server.g_bIsStopTxnButtonClicked) {
			this.dBAccessor.m_csResponseMssg = "Disconnect Called";
			CUIHandler.log(this.dBAccessor.m_csResponseMssg);
			await conx.disconnect();
			return false;
		}
		var ip220 = new CISO220(this.dBAccessor);
		ip220.CISO220C(this.m_chTerminalId, iTerminalIdLen, this.m_chNII);
		if (bIsMiniPVMPreset)
			ip220.SetDataToReplay(this.m_bArrDataToReplay, this.m_iReplayDataLen, this.m_bDataToReplay);
		ip220.SetOnlineTransactionRequestData(ulcurrentRoc, ulBatchId);
		if (true == g_bIsCloseButtonClicked || true == server.g_bIsStopTxnButtonClicked) {
			this.dBAccessor.m_csResponseMssg =" Disconnect Called";
			CUIHandler.log(this.dBAccessor.m_csResponseMssg);
			ip220.CISOMsgD();
			await conx.disconnect();
			return false;
		}
		this.dBAccessor.m_sParamData.iCurrentROC = ulcurrentRoc;
		if (true == g_bIsCloseButtonClicked || true == server.g_bIsStopTxnButtonClicked) {
			this.dBAccessor.m_csResponseMssg =" Disconnect Called";
			CUIHandler.log(this.dBAccessor.m_csResponseMssg);
			ip220.CISOMsgD();
			await conx.disconnect();
			return false;
		}
		var bArrSendBuffer = await cisohandler.sendISOPacket(ip220);
		var bIsSend = await conx.send(bArrSendBuffer);
		if (!bIsSend) {
			ip220.CISOMsgD();
			await conx.disconnect();
			if (bIsMiniPVMPreset) {
				bIsMiniPVMPreset = false;
			}
			return fasle;
		}
		else {
			bIsMiniPVMPreset = false;
		}
		if (true == g_bIsCloseButtonClicked || true == server.g_bIsStopTxnButtonClicked) {
			this.dBAccessor.m_csResponseMssg =" Disconnect Called";
			CUIHandler.log(this.dBAccessor.m_csResponseMssg);
			ip220.CISOMsgD();
			await conx.disconnect();
			return false;
		}
		var bArrReceivedData = await conx.ReceivedCompletePacket();
		if (bArrReceivedData == null) {
			CUIHandler.log(" Complete Data not received from server");
			return false;
		}
		if (cisohandler.getNextMessage(ip220, bArrReceivedData, bArrReceivedData.length) != 230) {
			this.dBAccessor.m_csResponseMssg =" Receive Failed";
			ip220.CISOMsgD();
			await conx.disconnect();
			return false;
		}
		if (!ip220.IsOK()) {
			ip220.CISOMsgD();
			await conx.disconnect();
			return false;
		}
		if (true == g_bIsCloseButtonClicked || true == server.g_bIsStopTxnButtonClicked) {
			this.dBAccessor.m_csResponseMssg =" Disconnect Called";
			CUIHandler.log(this.dBAccessor.m_csResponseMssg);
			ip220.CISOMsgD();
			await conx.disconnect();
			return false;
		}
		var iActionResponse = ip220.GetActionToDoFromFirstResponse();
		this.m_bDataToReplay = ip220.CheckIfDataToReplay();
		if (this.m_bDataToReplay) {
			this.m_bArrDataToReplay.fill(0x00);
			this.m_bArrDataToReplay = ip220.GetDataToReplay();
			this.m_iReplayDataLen = this.m_bArrDataToReplay.length;
		}
		else {
			this.m_bArrDataToReplay.fill(0x00);
			this.m_iReplayDataLen = 0;
		}
		if ((iActionResponse > Consts.ONLINE_RESPONSE_NO_ADDITIONAL_INFO) && (iActionResponse < Consts.ONLINE_RESPONSE_INVALID_ADDITIONAL_INFO)) {
			var iReturnee = Consts.MINI_PVM_EXCEEDS_LENGTH;
			var iCount = 0x00;
			do {
				iReturnee =await ip220.GetMiniPVM();
				if (iReturnee == Consts.MINI_PVM_EXCEEDS_LENGTH) {
					break;
				}
				else if (iReturnee == Consts.MINI_PVM_FINISHED) {
					bIsMiniPVMPreset = true;
					break;
				}
				iCount++;
				if (iCount > 30) {
					break;
				}
				if (iReturnee == Consts.MINI_PVM_ADDITIONAL_DATA_LEFT) {
					ip220.CISOMsgD();
					ip220.SetOnlineGetMiniPVMData();
					if (!cisohandler.sendISOPacket(ip220)) {
						ip220.CISOMsgD();
						await conx.disconnect();
						return false;
					}
					if (cisohandler.getNextMessage(ip220) != 230) {
						this.dBAccessor.m_csResponseMssg =" Receive Failed";
						CUIHandler.log(this.dBAccessor.m_csResponseMssg);
						ip220.CISOMsgD();
						await conx.disconnect();
						return false;
					}
				}
			} while (true);
		}
		if (BaseNode.bIsMiniPVMHtlDataNotPresent)
		{
			BaseNode.bIsMiniPVMHtlDataNotPresent=false;
			ip220.CISOMsgD();
			await conx.disconnect();
			return false;
		}
		if (iActionResponse == Consts.ONLINE_RESPONSE_INVALID_ADDITIONAL_INFO) {
			this.dBAccessor.m_csResponseMssg =" Invalid Additional Info";
			CUIHandler.log(this.dBAccessor.m_csResponseMssg);
			ip220.CISOMsgD();
			await conx.disconnect();
		}
		var iReturnee = Consts.RESPONSE_DATA_EXCEEDS_LENGTH;
		if (iActionResponse == Consts.ONLINE_RESPONSE_NO_ADDITIONAL_INFO) {
			iReturnee = ip220.iFnGetReponseData();
		}
		else if ((iActionResponse > Consts.ONLINE_RESPONSE_INVALID_ADDITIONAL_INFO) && (iActionResponse <= Consts.ONLINE_RESPONSE_MULTI_PACKET_RESP_ENDED)) {
			var iCount = 0x00;
			do {
				iReturnee = ip220.iFnGetReponseData();
				if (iReturnee == Consts.RESPONSE_DATA_EXCEEDS_LENGTH) {
					break;
				}
				else if (iReturnee == Consts.RESPONSE_DATA_FINISHED) {
					break;
				}
				iCount++;
				if (iCount > 30) {
					break;
				}
				if (iReturnee == Consts.RESPONSE_ADDITIONAL_DATA_LEFT) {
					ip220.CISOMsgD();
					ip220.SetAdditionalResponseData();
					if (!cisohandler.sendISOPacket(ip220)) {
						ip220.CISOMsgD();
						await conx.disconnect();
						return false;
					}
					if (cisohandler.getNextMessage(ip220) != 230) {
						this.dBAccessor.m_csResponseMssg =" Receive Failed";
						CUIHandler.log(this.dBAccessor.m_csResponseMssg);
						ip220.CISOMsgD();
						await conx.disconnect();
						return false;
					}
				}
			} while (true);
		}
		if (!bIsMiniPVMPreset) {
			if (true == g_bIsCloseButtonClicked || true == server.g_bIsStopTxnButtonClicked) {
				this.dBAccessor.m_csResponseMssg =" Disconnect Called";
				CUIHandler.log(this.dBAccessor.m_csResponseMssg);
				ip220.CISOMsgD();
				await conx.disconnect();
				return false;
			}
			if (!ip220.isTxOK()) {
				ip220.CISOMsgD();
				await conx.disconnect();
				return false;
			}
			if (iReturnee == Consts.RESPONSE_DATA_FINISHED) {
				if (true == g_bIsCloseButtonClicked || true == server.g_bIsStopTxnButtonClicked) {
					this.dBAccessor.m_csResponseMssg =" Disconnect Called";
					CUIHandler.log(this.dBAccessor.m_csResponseMssg);
					ip220.CISOMsgD();
					await conx.disconnect();
					return false;
				}
				// var bReceiptPrinted = ip220.vFnParseAndPrintTransactionResponse(objSTxnRes);
				// if(!bReceiptPrinted)
				// {
				// 	this.dBAccessor.m_csResponseMssg="Print Receipt Failed";
				// 	ip220.CISOMsgD();
				// 	await conx.disconnect();
				// 	return false;
				// }
				bContinue = false;
			}
		}
		ip220.CISOMsgD();
	}
	await conx.disconnect();
	return true;
}

// CIsoProcessor.prototype.vFnParseAndPrintTransactionResponse =function (objSTxnRes) {
// 	var bRet = false;
// 	var length =this.m_iCurrentPrintDumpOffset;
// 	if(length > 0)
// 	{
      
		
// 		if(CUtils.ProcessPrintDump(this.m_bPrintData,length/*,chArrParsedPrintDump*/,ETXNType.TAG_REQTYPE_SALE,objSTxnRes))
// 		{
// 			return true;
// 		}
// 	}
// return false;
// }
module.exports = CIsoProcessor;