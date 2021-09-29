var sqlDb = require("mssql");
var settings = require("../core/settings");
var Structs = require("../CommonStructures/StructClasses");
var ETXNType = require("../Constants/ETXNType");
var pClientDetails = new Structs.ClientDetails();
var CDBAccessor = require('./DBAccessor');
var Utils = require('./Utils');
var server = require("../core/server");
var CUtils = new Utils();
var CPlutusActivationProcessFlow = require("./PlutusActivationProcessFlow");
var CPlutusInitialiseProcessFlow = require("./PlutusInitialiseProcessFlow");
var CPlutusSettlementProcessFlow = require("./PlutusSettlementProcessFlow");
var CPlutusTestProcessFlow = require("./PlutusTestProcessFlow");
var UIHandler=require("../core/classes/UIHandler");
var CUIHandler=new UIHandler().getInstance();
exports.mapMiniPVMEntryDataList = new Map();
exports.mapTestCaseList = new Map();
exports.mapMiniPVMNodeNameIndexName=new Map();
var g_mapMiniPVMEntryDataList = exports.mapMiniPVMEntryDataList;
var g_mapTestCaseList = exports.mapTestCaseList;
var g_mapMiniPVMNodeNameIndexName=exports.mapMiniPVMNodeNameIndexName;
class CStressToolWorker {
	constructor(dwMainThreadID, iTxnType, iIterationCount, iStartClientID, iEndClientID, iIsSSL, iAsyncFlow) {
		this.m_pClientID = undefined;
		this.m_pSecurity = undefined;
		this.m_pAmount = undefined;
		this.m_pTrack1 = undefined;
		this.m_pTrack2 = undefined;
		this.m_pReqType = undefined;
		this.dBAccessor = new CDBAccessor();
		this.m_bIsActivateReq = undefined;
		this.m_pListClientDetails;
		this.m_bIsActivateReqm_iIterationCount = undefined;
		this.m_dwMainThreadID = dwMainThreadID;
		this.m_iTxnType = iTxnType;
		this.m_iIterationCount = iIterationCount;
		this.m_iStartClientID = iStartClientID;
		this.m_iEndClientID = iEndClientID;
		this.m_iIsSSL = iIsSSL;
		this.m_iAsyncFlow = iAsyncFlow;
	}
}
CStressToolWorker.prototype.PopulateListFromDB = async function (strStartClientID, strEndClientID) {
	return new Promise((resolve, reject) => {
		var conn = new sqlDb.ConnectionPool(settings.dbconfig);
		conn.connect()
			.then(function () {
				var req = new sqlDb.Request(conn);
				var iStartClientId = parseInt(strStartClientID);
				var iEndClientId = parseInt(strEndClientID);
				req.input("iStartClientId", sqlDb.Int, strStartClientID);
				req.input("iEndClientId", sqlDb.Int, strEndClientID);
				req.execute('IRIS_spGetClientDetailForClientRange').then(function (recordsets, err, returnValue, affected) {
					if (err) {
						CUIHandler.log(err.message);
						resolve(false);
					}
					else {
					//	for (var i = 0; i < recordsets.recordset.length; i++) {
						    var i=0;
							pClientDetails.Client_DetailID = recordsets.recordset[i].PL_Client_DetailID;
							pClientDetails.ClientID = recordsets.recordset[i].ClientID;
							pClientDetails.Security = recordsets.recordset[i].Security_Token;
							pClientDetails.Amount = recordsets.recordset[i].Amount;
							pClientDetails.Track1 = recordsets.recordset[i].Track1_Data;
							pClientDetails.Track2 = recordsets.recordset[i].Track2_Data;
							pClientDetails.ReqType = recordsets.recordset[i].Request_Type;
							pClientDetails.CurrentRoc = recordsets.recordset[i].CurrentROC;
							pClientDetails.CurrentBatchID = recordsets.recordset[i].CurrentBatchID;
							pClientDetails.TransactionType = recordsets.recordset[i].TransactionType;
							pClientDetails.TerminalID = recordsets.recordset[i].TerminalID;
							pClientDetails.MerchantID = recordsets.recordset[i].MerchantID;
							pClientDetails.HWSerialNo = recordsets.recordset[i].HardwareSerialNumber;
							pClientDetails.TotalTransaction = recordsets.recordset[i].NumberofTransaction;
							pClientDetails.EMVParVersion = recordsets.recordset[i].EMVPAR_VERSION;
							pClientDetails.GUID = recordsets.recordset[i].GUID;
							pClientDetails.TerminalType = recordsets.recordset[i].TERMINAL_TYPE;
							pClientDetails.PED_HW_Serial_Number = recordsets.recordset[i].PED_HW_SERIAL_NUMBER;
							pClientDetails.Parameter_Update_Date = recordsets.recordset[i].PARAMETER_UPDATE_DATE;
							pClientDetails.Is_Data_changed = recordsets.recordset[i].IS_DATA_CHANGED;
							pClientDetails.bIsBatchLocked = recordsets.recordset[i].IS_BATCH_LOCKED;
							pClientDetails.TimeDifferential = recordsets.recordset[i].TIME_DIFFERENTIAL;
							pClientDetails.bIsActiveClient = recordsets.recordset[i].IS_ACTIVE;
							pClientDetails.m_csListenerIP = recordsets.recordset[i].LISTENER_IP;
							pClientDetails.m_iListenerPort = recordsets.recordset[i].LISTENER_PORT;
						//}
						resolve(true);
					}
				})
			})
			.catch(function (err) {
				CUIHandler.log(err.message);
				resolve(false);
			});
	})
}
CStressToolWorker.prototype.CopyClientDataToDBAccessor = function (dBAccessor, pClientDetails) {
	dBAccessor.m_bIsLoggedIn = true;
	dBAccessor.m_sParamData.iCurrentROC = pClientDetails.CurrentRoc;
	if (dBAccessor.m_sParamData.iCurrentROC == undefined) {
		dBAccessor.m_sParamData.iCurrentROC = 101;
	}
	dBAccessor.m_sParamData.iCurrentBatchId = pClientDetails.CurrentBatchID;
	if (dBAccessor.m_sParamData.iCurrentBatchId == undefined) {
		dBAccessor.m_sParamData.iCurrentBatchId = 9001;
	}
	dBAccessor.m_sNewTxnData.uiTransactionType = pClientDetails.ReqType;
	dBAccessor.m_sParamData.chTerminalId = pClientDetails.TerminalID;
	dBAccessor.m_sParamData.chMerchantId = pClientDetails.MerchantID;
	dBAccessor.m_chUserName = "Admin";
	dBAccessor.m_chUserPassword = "1234";
	dBAccessor.m_sParamData.HwSerialNumber = pClientDetails.HWSerialNo;
	dBAccessor.m_sParamData.ulPvmVersion = 33677;
	dBAccessor.m_scomparam.chListenerIP = pClientDetails.m_csListenerIP;
	dBAccessor.m_scomparam.iListenerPort =pClientDetails.m_iListenerPort;// 8094;
	dBAccessor.m_sTerminalSettings.chServerIP = "192.168.100.231";
	dBAccessor.m_sTerminalSettings.nServerPort =8094;
	dBAccessor.m_sParamData.m_uchArrClientId = pClientDetails.ClientID;
	dBAccessor.m_sParamData.uchTerminalType = pClientDetails.TerminalType;
	dBAccessor.m_sParamData.PED_HwSerialNumber = pClientDetails.PED_HW_Serial_Number;
	dBAccessor.m_sParamData.chParameterUpdateDate = pClientDetails.Parameter_Update_Date;
	dBAccessor.m_sParamData.bArrIsDataChanged = pClientDetails.Is_Data_changed;
	dBAccessor.m_sParamData.m_uchArrGUID = pClientDetails.GUID;
	//dBAccessor.m_sParamData.lTimeDifferential =pClientDetails.TimeDifferential;
	//dBAccessor.m_sParamData.bIsBatchLocked = pClientDetails.bIsBatchLocked;
	dBAccessor.m_sParamData.m_chArrEMVParVersion=pClientDetails.EMVParVersion;//Added to avoid null value in DB
}
CStressToolWorker.prototype.DoActivation = async function () {
	if (!await this.GetClientsDataFromDB()) {
		CUIHandler.log("Failed To get Data from Database");
		return;
	}
	this.dBAccessor = new CDBAccessor();
	this.CopyClientDataToDBAccessor(this.dBAccessor, pClientDetails);
	this.dBAccessor.m_iIsSSLOn=this.m_iIsSSL;
	var dwMainThreadID = undefined;
	var m_pPlutusActivationProcessFlow = new CPlutusActivationProcessFlow(dwMainThreadID, this.dBAccessor, this.m_iIterationCount);
	await m_pPlutusActivationProcessFlow.run();
}
CStressToolWorker.prototype.GetClientsDataFromDB = async function () {
	return (await this.PopulateListFromDB(this.m_iStartClientID, this.m_iEndClientID));
}
CStressToolWorker.prototype.DoInitialization = async function () {
	if (!await this.GetClientsDataFromDB()) {
		CUIHandler.log("Failed To get Data from Database");
		return;
	}
	this.dBAccessor = new CDBAccessor();
	this.CopyClientDataToDBAccessor(this.dBAccessor, pClientDetails);
	this.dBAccessor.m_iIsSSLOn=this.m_iIsSSL;
	var dwMainThreadID = undefined;
	var m_pPlutusInitialiseProcessFlow = new CPlutusInitialiseProcessFlow(dwMainThreadID, this.dBAccessor, this.m_iIterationCount);
	await m_pPlutusInitialiseProcessFlow.run();
}
CStressToolWorker.prototype.DoSettlement = async function () {
	await this.GetClientsDataFromDB();
	this.dBAccessor = new CDBAccessor();
	this.CopyClientDataToDBAccessor(this.dBAccessor, pClientDetails);
	this.dBAccessor.m_iIsSSLOn=this.m_iIsSSL;
	var dwMainThreadID = undefined;
	var m_PlutusSettlementProcessFlow = new CPlutusSettlementProcessFlow(dwMainThreadID, this.dBAccessor, this.m_iIterationCount);
	await m_PlutusSettlementProcessFlow.run();
}
CStressToolWorker.prototype.DoTransaction = async function () {
	var csStressTestCaseId = server.StressTestCaseIdinput;
	if (!await this.LoadTestCasesData(csStressTestCaseId)) {
		CUIHandler.log("FAILED TO LOAD TEST CASE");
		return;
	}
	if (!await this.LoadMiniPVMData()) {
		CUIHandler.log("FAILED TO LOAD MINI PVM  DATA");
		return;
	}
	// if (!await this.LoadMiniPVMNodeNameNodeIndex()) {////
	// 	CUIHandler.log("FAILED TO LOAD MenuNode MINI PVM DATA");
	// 	return;
	// }
	var g_bIsStopTxnButtonClicked = false;
	var g_bIsCloseButtonClicked = false;
	if (!await this.GetClientsDataFromDB()) {
		CUIHandler.log("Failed To get Data from Database");
		return;
	}
	var iClientID = parseInt((pClientDetails.ClientID), 10);
	if(iClientID <this.m_iStartClientID || iClientID >this.m_iEndClientID){
		return;
	}
	this.dBAccessor = new CDBAccessor();
	this.dBAccessor.m_bIsLoggedIn = true;
	this.dBAccessor.m_iClient_DetailID = pClientDetails.Client_DetailID;
	this.dBAccessor.m_sParamData.iCurrentROC = pClientDetails.CurrentRoc;
	this.dBAccessor.m_sParamData.iCurrentBatchId = pClientDetails.CurrentBatchID;
	this.dBAccessor.m_sNewTxnData.uiTransactionType = pClientDetails.ReqType;
	this.dBAccessor.m_sParamData.chTerminalId = pClientDetails.TerminalID;
	this.dBAccessor.m_sParamData.chMerchantId = pClientDetails.MerchantID;
	this.dBAccessor.m_chUserName = "Admin";
	this.dBAccessor.m_chUserPassword = "1234";
	this.dBAccessor.m_sParamData.HwSerialNumber = pClientDetails.HWSerialNo;
	this.dBAccessor.m_sParamData.ulPvmVersion = 33677;
	this.dBAccessor.m_sParamData.m_chsTokenData = pClientDetails.Security;
	this.dBAccessor.m_sParamData.m_isTokenDataLen = this.dBAccessor.m_sParamData.m_chsTokenData.length;
	this.dBAccessor.m_scomparam.chListenerIP = pClientDetails.m_csListenerIP;
	this.dBAccessor.m_scomparam.iListenerPort =pClientDetails.m_iListenerPort; //8094;
	this.dBAccessor.m_sTerminalSettings.chServerIP ="192.168.100.231";
	this.dBAccessor.m_sTerminalSettings.nServerPort = 8279;
	var trackData = new Uint8Array(1024);
	var offset = 0;
	var iTRack1length = pClientDetails.Track1.length;
	trackData[offset++] = iTRack1length;
	trackData.set(CUtils.String2Bytes(pClientDetails.Track1), offset);
	offset += iTRack1length;
	var iTRack2length = pClientDetails.Track2.length;
	trackData[offset++] = iTRack2length;
	trackData.set(CUtils.String2Bytes(pClientDetails.Track2), offset);
	offset += iTRack2length;
	trackData[offset++] = 0;
	this.dBAccessor.m_sTxnTLVData.iTLVindex = 2;
	this.dBAccessor.m_sTxnTLVData.objTLV[0].uiTag = 0x00001002;
	this.dBAccessor.m_sTxnTLVData.objTLV[0].uiTagValLen = offset;
	this.dBAccessor.m_sTxnTLVData.objTLV[0].chArrTagVal = trackData.slice(0, offset - 1);
	var strAmount = pClientDetails.Amount.toString();
	this.dBAccessor.m_sTxnTLVData.objTLV[1].uiTag = 0x00001021;
	this.dBAccessor.m_sTxnTLVData.objTLV[1].uiTagValLen = strAmount.length;
	this.dBAccessor.m_sTxnTLVData.objTLV[1].chArrTagVal = Buffer.from(strAmount);
	this.dBAccessor.m_sParamData.m_uchArrClientId = pClientDetails.ClientID;
	this.dBAccessor.m_sParamData.uchTerminalType = pClientDetails.TerminalType;
	this.dBAccessor.m_sParamData.PED_HwSerialNumber = pClientDetails.PED_HW_Serial_Number;
	this.dBAccessor.m_sParamData.chParameterUpdateDate = pClientDetails.Parameter_Update_Date;
	this.dBAccessor.m_sParamData.bArrIsDataChanged = pClientDetails.Is_Data_changed;
	this.dBAccessor.m_sParamData.m_uchArrGUID = pClientDetails.GUID;
	this.dBAccessor.m_iIsSSLOn = this.m_iIsSSL;
	var dwMainThreadID = undefined;
	var m_pPlutusTestProcessFlow = new CPlutusTestProcessFlow(dwMainThreadID, this.dBAccessor, this.m_iIterationCount);
	await m_pPlutusTestProcessFlow.run();
}
CStressToolWorker.prototype.LoadTestCasesData = async function (csStressTestCaseId) {
	g_mapTestCaseList.clear();
	return new Promise((resolve, reject) => {
		var conn = new sqlDb.ConnectionPool(settings.dbconfig);
		conn.connect()
			.then(function () {
				var req = new sqlDb.Request(conn);
				req.input("iStressTestCaseId", sqlDb.Int, csStressTestCaseId);
				req.execute('IRIS_spGetStressTestCase').then(function (recordsets, err, returnValue, affected) {
					if (err) {
						CUIHandler.log(err.message);
						conn.close();
						resolve(false);
					}
					else {
						for (var i = 0; i < recordsets.recordset.length; i++) {
							objSTxnReq = new Structs.STxnReq;
							switch (recordsets.recordset[i].TRANSACTION_TYPE) {
								case ETXNType.TAG_REQTYPE_SALE:
									objSTxnReq.eTxnType = ETXNType.TAG_REQTYPE_SALE;
									break;
								case ETXNType.TAG_REQTYPE_SETTLEMENT:
									objSTxnReq.eTxnType = ETXNType.TAG_REQTYPE_SETTLEMENT;
									break;
								case ETXNType.TAG_REQTYPE_VOID:
									objSTxnReq.eTxnType = ETXNType.TAG_REQTYPE_VOID;
									break;
								case ETXNType.TAG_REQTYPE_PREAUTH:
									objSTxnReq.eTxnType = ETXNType.TAG_REQTYPE_PREAUTH;
									break;
								case ETXNType.TAG_REQTYPE_REFUND:
									objSTxnReq.eTxnType = ETXNType.TAG_REQTYPE_REFUND;
									break;
								case ETXNType.TAG_REQTYPE_TIPADJUST:
									objSTxnReq.eTxnType = ETXNType.TAG_REQTYPE_TIPADJUST;
									break;
								case ETXNType.TAG_REQTYPE_SALECOMPLETE:
									objSTxnReq.eTxnType = ETXNType.TAG_REQTYPE_SALECOMPLETE;
									break;
								case ETXNType.TAG_REQTYPE:
								default:
									objSTxnReq.eTxnType = ETXNType.TAG_REQTYPE;
							}
							objSTxnReq.csTrack1 = recordsets.recordset[i].TRACK1;
							objSTxnReq.csTrack2 = recordsets.recordset[i].TRACK2;
							objSTxnReq.iDepTxnIndex = recordsets.recordset[i].ORIGINAL_TRANSACTION_NUMBER;
							objSTxnReq.nAmount = recordsets.recordset[i].AMOUNT;
							objSTxnReq.nEMIMonths = parseInt(recordsets.recordset[i].EMI_MONTHS);
							objSTxnReq.iIndex = recordsets.recordset[i].ROW_ID;
							objSTxnReq.bIsEMI = false;
							g_mapTestCaseList.set(objSTxnReq.iIndex, objSTxnReq);
						}
						conn.close();
						resolve(true);
					}
				})
			})
			.catch(function (err) {
				CUIHandler.log(err.message);
				resolve(false);
			});
	});
}
CStressToolWorker.prototype.LoadMiniPVMData = async function () {
	return new Promise((resolve, reject) => {
		var conn = new sqlDb.ConnectionPool(settings.dbconfig);
		conn.connect()
			.then(function () {
				var req = new sqlDb.Request(conn);
				req.execute('IRIS_spGetStressGetMiniPVMData').then(function (recordsets, err, returnValue, affected) {
					if (err) {
						CUIHandler.log(err.message);
						conn.close();
						resolve(false);
					}
					else {
						for (var i = 0; i < recordsets.recordset.length; i++) {
							g_mapMiniPVMEntryDataList.set(recordsets.recordset[i].TAG_ID, recordsets.recordset[i].TAG_VALUE);
						}
						conn.close();
						resolve(true);
					}
				})
			})
			.catch(function (err) {
				CUIHandler.log(err.message);
				resolve(false);
			});
	});
}

CStressToolWorker.prototype.LoadMiniPVMNodeNameNodeIndex = async function () {
	return new Promise((resolve, reject) => {
		var conn = new sqlDb.ConnectionPool(settings.dbconfig);
		conn.connect()
			.then(function () {
				var req = new sqlDb.Request(conn);
				req.execute('IRIS_spGetMiniPVMNodeNameIndex').then(function (recordsets, err, returnValue, affected) {
					if (err) {
						CUIHandler.log(err.message);
						conn.close();
						resolve(false);
					}
					else {
						for (var i = 0; i < recordsets.recordset.length; i++) {
							g_mapMiniPVMNodeNameIndexName.set(recordsets.recordset[i].Node_Name, recordsets.recordset[i].Node_Index);
						}
						conn.close();
						resolve(true);
					}
				})
			})
			.catch(function (err) {
				CUIHandler.log(err.message);
				resolve(false);
			});
	});
}
module.exports = CStressToolWorker;