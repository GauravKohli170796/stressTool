var CIsoProcessor = require("./IsoProcessor");
var CHSMInterface = require("./HSMInterface");
var ETXNType = require("../Constants/ETXNType");
var CTrackParser = require("./TrackParser");
var StressToolWorker = require("./StressToolWorker");
var Structs = require("../CommonStructures/StructClasses");
var Consts = require("../Constants/AppConsts");
var EnPadStyle = require("../Constants/EnPadStyle");
var ExecutionResult = require("../Constants/ExecutionResult");
var enFixedHostTags = require("../Constants/EnFixedHostTags");
//var CUIHandler=require("../app");//Added For response of html
var UIHandler=require("../core/classes/UIHandler");
var CUIHandler=new UIHandler().getInstance();
var Utils = require("./Utils");
var CUtils = new Utils();
var server = require("../core/server");
var ArrayList=require('arrayList');
var BaseNode=require("./BaseNode").CBaseNode;
var g_bIsCloseButtonClicked = false;//need to fix it by UI
class CPlutusTestProcessFlow {
	constructor(dwMainThreadID, pDbAccessor, nTransactionCount) {
		this.dbAccessor = pDbAccessor;
		this.m_iItrCount = nTransactionCount;
		this.m_pClientID = undefined;
		this.m_pSecurity = undefined;
		this.m_pAmount = undefined;
		this.m_pTrack1 = undefined;
		this.m_pTrack2 = undefined;
		this.m_pReqType = undefined;
		this.m_bIsActivateReq = undefined;
		this.m_dwTickCountStart;
		this.m_dwTimeElapse;
		///TODO Parameters are passed bacause of no constructor overloading.....
		this.m_objHSMInterface = new CHSMInterface(11234, 1, 1, 180000, this.dbAccessor.m_sParamData.PED_HwSerialNumber, "12345", CUtils.SetCurrentDateTime(),
			"192.168.100.176", 8089);
		this.m_objCTxnReqDataList=new ArrayList();;
		this.m_objCTxnResDataList=new ArrayList();;
	}
}
CPlutusTestProcessFlow.prototype.run = async function () {
	var g_mapTestCaseList = StressToolWorker.mapTestCaseList;
	var bIsMiniPVMPresent = false;
	var j = 0;
	var i = 0;
	var bRet = false;
	if (true == g_bIsCloseButtonClicked || true == server.g_bIsStopTxnButtonClicked) {
		return;
	}
	await this.m_objHSMInterface.iGetInitialData();
	while (j < this.m_iItrCount && (false == server.g_bIsStopTxnButtonClicked)) {
		  for (var Mapentry of g_mapTestCaseList.entries()) {
			if (true == g_bIsCloseButtonClicked || true == server.g_bIsStopTxnButtonClicked) {
				return;
			}
			BaseNode.bIsMiniPVMHtlDataNotPresent=false;
			 var objTxnData = Mapentry[1];
			// console.log(i);
			//var objTxnData =g_mapTestCaseList.get(0);
			switch (objTxnData.eTxnType) {
				case ETXNType.TAG_REQTYPE_SALE:
					await this.DoSale(i, bIsMiniPVMPresent, objTxnData);
					break;
				case ETXNType.TAG_REQTYPE_VOID:
					await this.DoVoid(i, bIsMiniPVMPresent, objTxnData);
					break;
				case ETXNType.TAG_REQTYPE_REFUND:
					await this.DoRefund(i, bIsMiniPVMPresent, objTxnData);
					break;
				case ETXNType.TAG_REQTYPE_PREAUTH:
					await this.DoPreAuth(i, bIsMiniPVMPresent, objTxnData);
					break;
				case ETXNType.TAG_REQTYPE_SALECOMPLETE:
					await this.DoSaleComplete(i, bIsMiniPVMPresent, objTxnData);
					break;
				case ETXNType.TAG_REQTYPE_TIPADJUST:
					await this.DoTipAdjust(i, bIsMiniPVMPresent, objTxnData);
					break;
				case ETXNType.TAG_REQTYPE_SETTLEMENT:
					{
						this.dbAccessor.m_sTxnTLVData = new Structs.TxnTLVData();
						this.dbAccessor.m_sNewTxnData.uiTransactionType = 0;
						var objIsoProcessor = new CIsoProcessor(this.dbAccessor);
						await this.DoSettlement(objIsoProcessor, objTxnData);
					}
					break;
				default:
					break;
			}
			i++;
			//await CUtils.Sleep(1000);
		}
		j++;
		i = 0;
	
	}
	this.m_objCTxnResDataList.clear();
	if (this.dbAccessor) {
	await this.dbAccessor.UpdateClientDetails(this.dbAccessor);
	}
}
CPlutusTestProcessFlow.prototype.DoSale = async function (iClientIndex, bIsMiniPVMPresent, objTxnData) {
	var trackData = new Uint8Array(1024);
	var offset = 0;
	var iTRack1length = objTxnData.csTrack1.length;
	trackData[offset++] = iTRack1length;
	trackData.set(CUtils.String2Bytes(objTxnData.csTrack1), offset);
	offset += iTRack1length;
	var iTRack2length = objTxnData.csTrack2.length;
	trackData[offset++] = iTRack2length;
	trackData.set(CUtils.String2Bytes(objTxnData.csTrack2), offset);
	offset += iTRack2length;
	this.dbAccessor.m_sTxnTLVData = new Structs.TxnTLVData();
	this.GetTLVData(objTxnData);
	this.dbAccessor.m_sNewTxnData.uiTransactionType = 4097;
	var objIsoProcessor = new CIsoProcessor(this.dbAccessor);
	var objSTxnRes = new Structs.STxnRes();
	var chArrRespMssg = new Int8Array(200);
	if (g_bIsCloseButtonClicked == true || server.g_bIsStopTxnButtonClicked == true) {
		return;
	}
	this.m_dwTickCountStart = Date.now();
	this.dbAccessor.m_csResponseMssg = "";
	var bReturn = await objIsoProcessor.DoOnlineTxn(bIsMiniPVMPresent, objSTxnRes);
	this.m_dwTimeElapse = Date.now() - this.m_dwTickCountStart;
	if (bReturn) {
		if (g_bIsCloseButtonClicked == true || server.g_bIsStopTxnButtonClicked == true) {
			return;
		}
		if (objSTxnRes.nTxnID > 0) {
			objSTxnRes.iIndex = objTxnData.iIndex;
			this.FillTransactionResponseStruct(objSTxnRes);//NEED TO ASK
		}
		if (this.dbAccessor) {
			if ("" == this.dbAccessor.m_csResponseMssg) {
				this.dbAccessor.m_csResponseMssg = "TXN APPROVED";
			}
			var csMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] " + this.dbAccessor.m_csResponseMssg + "[Time Elapsed=" + this.m_dwTimeElapse.toString() + "]";
			CUIHandler.log(csMessage);
		}
	}
	else {
		if (this.dbAccessor) {
			if ("" == this.dbAccessor.m_csResponseMssg) {
				this.dbAccessor.m_csResponseMssg = "TXN FAILED";
			}
			var csMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] " + this.dbAccessor.m_csResponseMssg + "[Time Elapsed=" + this.m_dwTimeElapse.toString() + "]";
			CUIHandler.log(csMessage);
		}
	}
}
CPlutusTestProcessFlow.prototype.GetTLVData = function (objTxnData) {
	var tcTrk1 = new Int8Array(Consts.MAX_TRACK1_LEN);
	var tcTrk2 = new Int8Array(Consts.MAX_TRACK2_LEN);
	var tcTrk3 = new Int8Array(Consts.MAX_TRACK2_LEN);
	var chTmpData;
	var TrackData = new Int8Array(1000);
	var itcTrk1len = 0;
	var itcTrk2len = 0;
	var itcTrk3len = 0;
	var iLocalOffset = 0x00;
	var m_chPadChar = '0';
	var m_iPadStyle = EnPadStyle._LEFT_PAD;
	itcTrk1len = objTxnData.csTrack1.length;
	tcTrk1 = Buffer.from(objTxnData.csTrack1);
	itcTrk2len = objTxnData.csTrack2.length;
	tcTrk2 = Buffer.from(objTxnData.csTrack2);
	if (true) {
		var objTrkParser = new CTrackParser(m_chPadChar, m_iPadStyle, this.m_objHSMInterface);
		if (!objTrkParser.ParseTrack1(tcTrk1, itcTrk1len)) {
			return ExecutionResult._CANCEL;
		}
		if (!objTrkParser.ParseTrack2(tcTrk2, itcTrk2len)) {
			return ExecutionResult._CANCEL;
		}
		var iLenTmpData;
		var iLen = 0;
		//Get CardHolder Name --------------------
		chTmpData = objTrkParser.GetCardHolderName();
		if (chTmpData) {
			iLenTmpData = chTmpData.length;
			this.AddTLVDataWithTag(enFixedHostTags.TAG_TYPE_TLE_CARDHOLDER_NAME, chTmpData, iLenTmpData);
		}
		//Get PAN Number --------------------
		this.dbAccessor.m_chArrPAN = objTrkParser.GetPAN();
		//Get Expiry Date --------------------
		chTmpData = objTrkParser.GetExpiryDate()
		if (chTmpData) {
			iLenTmpData = chTmpData.length;
			this.AddTLVDataWithTag(enFixedHostTags.TAG_TYPE_TLE_CARD_EXPIRY_DATE, chTmpData, iLenTmpData);
		} else {
			return ExecutionResult._CANCEL;
		}
		//Get Service Code --------------------
		chTmpData = objTrkParser.GetServiceCode();
		if (chTmpData) {
			iLenTmpData = chTmpData.length;
			this.AddTLVDataWithTag(enFixedHostTags.TAG_TYPE_TLE_CARD_SERVICE_CODE, chTmpData, iLenTmpData);
		} else {
			return ExecutionResult._CANCEL;
		}
		chTmpData = objTrkParser.GetMaskedPAN()
		if (chTmpData) {
			iLenTmpData = chTmpData.length;
			this.AddTLVDataWithTag(enFixedHostTags.TAG_TYPE_TLE_CARD_MASKED_PAN, chTmpData, iLenTmpData);
		} else {
			return ExecutionResult._CANCEL;
		}
		//Get SHA1 PAN --------------------
		chTmpData = objTrkParser.GetPANSHA1();
		var chTmpData3 = new Int8Array(chTmpData.length);
		chTmpData3.set(chTmpData, 0);
		if (chTmpData)/////////change parameters
		{
			iLenTmpData = chTmpData.length;
			this.AddTLVDataWithTag(enFixedHostTags.TAG_TYPE_TLE_CARD_SHA1_PAN, chTmpData3, iLenTmpData);
		} else {
			return ExecutionResult._CANCEL;
		}
		//Get Encrypted Track1 --------------------
		iLen = 0;
		chTmpData = objTrkParser.GetBankTLEEncryptedTrack1();
		var chTmpData2 = new Int8Array(chTmpData.length);
		chTmpData2.set(chTmpData, 0);
		if (chTmpData) {
			//Convert to ASCII
			iLen = chTmpData.length;
			var chTmpDataAsc = CUtils.bcd2a(chTmpData2, iLen);
			this.AddTLVDataWithTag(enFixedHostTags.TAG_TYPE_TLE_CARD_ENCRYPTED_TRACK1, chTmpData2, iLen);
		} else {
			return ExecutionResult._CANCEL;
		}
		//Get Encrypted Track2 --------------------
		iLen = 0;
		chTmpData = objTrkParser.GetBankTLEEncryptedTrack2();
		var chTmpData3 = new Int8Array(chTmpData.length);
		chTmpData3.set(chTmpData, 0);
		if (chTmpData) {
			//Convert to ASCII
			iLen = chTmpData.length;
			chTmpDataAsc = CUtils.bcd2a(chTmpData3, iLen);
			this.AddTLVDataWithTag(enFixedHostTags.TAG_TYPE_TLE_CARD_ENCRYPTED_TRACK2, chTmpData3, iLen);
		} else {
			return ExecutionResult._CANCEL;
		}
		//Get Encrypted PAN --------------------
		iLen = 0;
		chTmpData = objTrkParser.GetBankTLEEncryptedPAN();
		var chTmpData4 = new Int8Array(chTmpData.length);
		chTmpData4.set(chTmpData, 0);
		chTmpData4.set(chTmpData, 0);
		if (chTmpData) {
			//Convert to ASCII
			iLen = chTmpData.length;
			chTmpDataAsc = CUtils.bcd2a(chTmpData4, iLen);
			this.AddTLVDataWithTag(enFixedHostTags.TAG_TYPE_TLE_CARD_ENCRYPTED_PAN, chTmpData4, iLen);
		} else {
			return ExecutionResult._CANCEL;
		}
		iLocalOffset = 0x00;
		TrackData[iLocalOffset++] = itcTrk1len;
		TrackData.set(tcTrk1.slice(0, itcTrk1len), iLocalOffset);
		iLocalOffset += itcTrk1len;
		TrackData[iLocalOffset++] = itcTrk2len;
		TrackData.set(tcTrk2.slice(0, itcTrk2len), iLocalOffset);
		iLocalOffset += itcTrk2len;
		TrackData[iLocalOffset++] = itcTrk3len;
	}
	else {
		iLocalOffset = 0x00;
		TrackData[iLocalOffset++] = itcTrk1len;
		TrackData.set(tcTrk1.slice(0, itcTrk1len), iLocalOffset);
		iLocalOffset += itcTrk1len;
		TrackData[iLocalOffset++] = itcTrk2len;
		TrackData.set(tcTrk2.slice(0, itcTrk2len), iLocalOffset);
		iLocalOffset += itcTrk2len;
		TrackData[iLocalOffset++] = itcTrk3len;
		this.AddTLVDataWithTag(0x00001002, TrackData, iLocalOffset);
	}
	var strAmountTag = objTxnData.nAmount.toString();
	              this.AddTLVDataWithTag(0x00001021,Buffer.from(strAmountTag),strAmountTag.length);//correct tag 
	           // this.AddTLVDataWithTag(0x00001112, Buffer.from(strAmountTag), strAmountTag.length);//check for PVM
	return ExecutionResult._OK;
}
CPlutusTestProcessFlow.prototype.AddTLVDataWithTag = function (uiTag, chArrTagValue, length) {
	if ((length > 0) && (uiTag > 0) && (this.dbAccessor.m_sTxnTLVData.iTLVindex < Consts.MAX_TXN_STEPS_WITH_TLV_DATA)) {
		this.dbAccessor.m_sTxnTLVData.objTLV[this.dbAccessor.m_sTxnTLVData.iTLVindex].uiTag = uiTag;
		this.dbAccessor.m_sTxnTLVData.objTLV[this.dbAccessor.m_sTxnTLVData.iTLVindex].uiTagValLen = length;
		this.dbAccessor.m_sTxnTLVData.objTLV[this.dbAccessor.m_sTxnTLVData.iTLVindex].chArrTagVal = chArrTagValue;
		this.dbAccessor.m_sTxnTLVData.iTLVindex++;
	}
}
CPlutusTestProcessFlow.prototype.DoSettlement = async function (objIsoProcessor, objTxnData) {
	this.dbAccessor.m_sTxnTLVData = new Structs.TxnTLVData();
	this.dbAccessor.m_sNewTxnData.uiTransactionType = 0;
	var currentDateTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
	this.m_dwTickCountStart = Date.parse(currentDateTime.toLocaleString());
	var bReturn = await objIsoProcessor.DoHubSettlement();
	currentDateTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
	this.m_dwTimeElapse = Date.parse(currentDateTime.toLocaleString()) - this.m_dwTickCountStart;
	if (bReturn) {
		if (this.dbAccessor) {
			if ("" == this.dbAccessor.m_csResponseMssg) {
				this.dbAccessor.m_csResponseMssg = "Settled"
			}
			var csMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] Settled";
			CUIHandler.log(csMessage);
		}
	}
	else {
		if (this.dbAccessor) {
			if ("" == this.dbAccessor.m_csResponseMssg) {
				this.dbAccessor.m_csResponseMssg = "Settle Failed";
			}
			var csMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] Settle Failed";
			CUIHandler.log(csMessage);
		}
	}
}


CPlutusTestProcessFlow.prototype.DoVoid=async function(iClientIndex,bIsMiniPVMPresent,objTxnData)
{
	var chArrTxnID=new Int8Array(10);	
			if(objTxnData.iDepTxnIndex > 0 && this.m_objCTxnResDataList.size() > 0)
			{
				var iIndex = objTxnData.iDepTxnIndex/*-1*/;
				for(var i =0; i<=this.m_objCTxnResDataList.size();i++)
				{
					if(this.m_objCTxnResDataList[i].iIndex==iIndex)
					{
						//itoa(ItCTxnResDataList->nTxnID,chArrTxnID,10);
						break;
					}
				}

				if(this.m_objCTxnResDataList.get(iIndex).nTxnID > 0)
				{
					//itoa(m_objCTxnResDataList[iIndex].nTxnID,chArrTxnID,10);
				}

			    this.dbAccessor.m_sTxnTLVData=new Structs.TxnTLVData();
                this.dbAccessor.m_sTxnTLVData.iTLVindex = 1;
				this.dbAccessor.m_sTxnTLVData.objTLV[0].uiTag=0x00001017;
				this.dbAccessor.m_sTxnTLVData.objTLV[0].uiTagValLen =chArrTxnID.length;
				this.dbAccessor.m_sTxnTLVData.objTLV[0].chArrTagVal=chArrTxnID;

				this.dbAccessor.m_sNewTxnData.uiTransactionType = 4101;
				var objIsoProcessor = new CIsoProcessor(this.dbAccessor);
                var objSTxnRes=new Structs.STxnRes();
		 var bReturn = await objIsoProcessor.DoOnlineTxn(bIsMiniPVMPresent, objSTxnRes).catch((error) => {
				CUIHandler.log("Error in Coding :"+"ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] " + +error);
			  });

			if (bReturn) {
				
				var csMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] "+"Void Approved.";
				CUIHandler.log(csMessage);
				
			}
			else {
				
					var csMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] " +"Void Failed.";
					CUIHandler.log(csMessage);
				}
	}
	else {
				
		var csMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] " +"Void Failed.";
		CUIHandler.log(csMessage);
	}

}
CPlutusTestProcessFlow.prototype.DoTipAdjust=async function(iClientIndex,bIsMiniPVMPresent,objTxnData)
{
	var chArrTxnID=new Int8Array(10);	
			if(objTxnData.iDepTxnIndex > 0 && this.m_objCTxnResDataList.size() > 0)
			{
				var iIndex = objTxnData.iDepTxnIndex/*-1*/;
				for(var i =0; i<=this.m_objCTxnResDataList.size();i++)
				{
					if(this.m_objCTxnResDataList[i].iIndex==iIndex)
					{
						//itoa(ItCTxnResDataList->nTxnID,chArrTxnID,10);
						break;
					}
				}

                this.dbAccessor.m_sTxnTLVData=new Structs.TxnTLVData();
                this.dbAccessor.m_sTxnTLVData.iTLVindex = 1;
				this.dbAccessor.m_sTxnTLVData.objTLV[0].uiTag=0x00001017;
				this.dbAccessor.m_sTxnTLVData.objTLV[0].uiTagValLen =chArrTxnID.length;
				this.dbAccessor.m_sTxnTLVData.objTLV[0].chArrTagVal=chArrTxnID;

				this.dbAccessor.m_sNewTxnData.uiTransactionType = 4357;
				var objIsoProcessor = new CIsoProcessor(this.dbAccessor);
                var objSTxnRes=new Structs.STxnRes();
		 var bReturn = await objIsoProcessor.DoOnlineTxn(bIsMiniPVMPresent, objSTxnRes).catch((error) => {
				CUIHandler.log("Error in Coding :"+"ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] " + +error);
			  });

			if (bReturn) {
				
				var csMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] "+"Tip Adjust Approved.";
				CUIHandler.log(csMessage);
				
			}
			else {
				
					var csMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] " +"Tip Adjust Failed.";
					CUIHandler.log(csMessage);
				}
	}
	else {
				
		var csMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] " +"Tip Adjust Failed.";
		CUIHandler.log(csMessage);
	}

}

CPlutusTestProcessFlow.prototype.DoSaleComplete=async function(iClientIndex,bIsMiniPVMPresent,objTxnData)
{
	var chArrTxnID=new Int8Array(10);	
			if(objTxnData.iDepTxnIndex > 0 && this.m_objCTxnResDataList.size() > 0)
			{
				var iIndex = objTxnData.iDepTxnIndex/*-1*/;
				for(var i =0; i<=this.m_objCTxnResDataList.size();i++)
				{
					if(this.m_objCTxnResDataList[i].iIndex==iIndex)
					{
						//itoa(ItCTxnResDataList->nTxnID,chArrTxnID,10);
						break;
					}
				}

                this.dbAccessor.m_sTxnTLVData=new Structs.TxnTLVData();
                this.dbAccessor.m_sTxnTLVData.iTLVindex = 1;
				this.dbAccessor.m_sTxnTLVData.objTLV[0].uiTag=0x00001017;
				this.dbAccessor.m_sTxnTLVData.objTLV[0].uiTagValLen =chArrTxnID.length;
				this.dbAccessor.m_sTxnTLVData.objTLV[0].chArrTagVal=chArrTxnID;

				this.dbAccessor.m_sNewTxnData.uiTransactionType = 4355;
				var objIsoProcessor = new CIsoProcessor(this.dbAccessor);
                var objSTxnRes=new Structs.STxnRes();
		 var bReturn = await objIsoProcessor.DoOnlineTxn(bIsMiniPVMPresent, objSTxnRes).catch((error) => {
				CUIHandler.log("Error in Coding :"+"ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] " + +error);
			  });

			if (bReturn) {
				
				var csMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] "+"Tip Adjust Approved.";
				CUIHandler.log(csMessage);
				
			}
			else {
				
					var csMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] " +"Tip Adjust Failed.";
					CUIHandler.log(csMessage);
				}
	}
	else {
				
		var csMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] " +"Tip Adjust Failed.";
		CUIHandler.log(csMessage);
	}

}
CPlutusTestProcessFlow.prototype.DoRefund=async function(iClientIndex,bIsMiniPVMPresent,objTxnData)
{
    var trackData = new Uint8Array(1024);
	var offset = 0;
	var TRack1length = objTxnData.csTrack1.length;
	trackData[offset++] = TRack1length;
	trackData.set(CUtils.String2Bytes(objTxnData.csTrack1), offset);
	offset += iTRack1length;
	var TRack2length = objTxnData.csTrack2.length;
	trackData[offset++] = TRack2length;
	trackData.set(CUtils.String2Bytes(objTxnData.csTrack2), offset);
	offset += iTRack2length;
	this.dbAccessor.m_sTxnTLVData=new Structs.TxnTLVData();
    this.GetTLVData(objTxnData);
	this.dbAccessor.m_sNewTxnData.uiTransactionType=4356;//For Refund
    var objIsoProcessor = new CIsoProcessor(this.dbAccessor);
	var objSTxnRes=new Structs.STxnRes();
	var bReturn = await objIsoProcessor.DoOnlineTxn(bIsMiniPVMPresent, objSTxnRes).catch((error) => {
		CUIHandler.log("Error in Coding :"+"ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] " + +error);
	  });

	if(bReturn)
	{
		if(objSTxnRes.nTxnID > 0)
		{
			objSTxnRes.iIndex = objTxnData.iIndex;
			this.FillTransactionResponseStruct(objSTxnRes);
		}

			var csMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] "+"Refund Approved.";
			CUIHandler.log(csMessage);
	}

	else
	{
		var csMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] "+"Refund Failed.";
		CUIHandler.log(csMessage);

		
	}
}
CPlutusTestProcessFlow.prototype.DoPreAuth=async function(iClientIndex,bIsMiniPVMPresent,objTxnData)
{
    var trackData = new Uint8Array(1024);
	var offset = 0;
	var TRack1length = objTxnData.csTrack1.length;
	trackData[offset++] = TRack1length;
	trackData.set(CUtils.String2Bytes(objTxnData.csTrack1), offset);
	offset += iTRack1length;
	var TRack2length = objTxnData.csTrack2.length;
	trackData[offset++] = TRack2length;
	trackData.set(CUtils.String2Bytes(objTxnData.csTrack2), offset);
	offset += iTRack2length;
	this.dbAccessor.m_sTxnTLVData=new Structs.TxnTLVData();
    this.GetTLVData(objTxnData);
	this.dbAccessor.m_sNewTxnData.uiTransactionType=4354;
    var objIsoProcessor = new CIsoProcessor(this.dbAccessor);
	var objSTxnRes=new Structs.STxnRes();
	var bReturn = await objIsoProcessor.DoOnlineTxn(bIsMiniPVMPresent, objSTxnRes).catch((error) => {
		CUIHandler.log("Error in Coding :"+"ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] " + +error);
	  });

	if(bReturn)
	{
		if(objSTxnRes.nTxnID > 0)
		{
			objSTxnRes.iIndex = objTxnData.iIndex;
			this.FillTransactionResponseStruct(objSTxnRes);
		}

			var csMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] "+"PreAuth Approved.";
			CUIHandler.log(csMessage);
	}

	else
	{
		var csMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "] "+"PreAuth Failed.";
		CUIHandler.log(csMessage);

		
	}
}
CPlutusTestProcessFlow.prototype.FillTransactionResponseStruct =function (objSTxnRes) {

	this.m_objCTxnResDataList.add(objSTxnRes);
	return true;
}
module.exports = CPlutusTestProcessFlow;
