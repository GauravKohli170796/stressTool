var Structs = require("../CommonStructures/StructClasses");
var sqlDb = require("mssql");
var settings = require("../core/settings");
var Utils = require("./Utils");
var CUtils = new Utils();
var Consts = require("../Constants/AppConsts");
var KeyTypeConsts = require("../Constants/KeyTypeConsts");
var KeyEncryptionTypeConsts = require("../Constants/KeyEncryptionTypeConsts");
//var CUIHandler=require("../app");//Added For response of html
var UIHandler=require("../core/classes/UIHandler");
var CUIHandler=new UIHandler().getInstance();
class CDBAccessor {
    constructor() {
        this.m_sParamData = new Structs.TerminalParamData();
        this.m_sTerminalSettings = new Structs.TerminalSettings();
        this.m_sNewTxnData = new Structs.TerminalTransactionData();
        this.m_sTxnTLVData = new Structs.TxnTLVData();
        this.m_sMasterParamData = new Structs.TerminalMasterParamData();
        this.m_scomparam = new Structs.CommParams();
        this.m_chUserName;
        this.m_chUserPassword;
        this.m_iClient_DetailID = undefined;
        this.m_sProxySettings = new Structs.ProxySettings();
        this.m_csResponseMssg ="";
        this.m_iIsSSLOn = 0;
        this.m_chArrPAN = undefined;
    }
}
CDBAccessor.prototype.iGetPMK = function (iSlotID, chArrHardwareID, stPMK) {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var req = new sqlDb.Request(conn);
                var strllHardwareID = CUtils.Bytes2String(chArrHardwareID);
                var sp_llHardwareID = parseInt(strllHardwareID, 10);
                var sp_SlotID = iSlotID;
                var sp_KeyEncryptionType = KeyEncryptionTypeConsts.KEY_NONE_ENCRYPTION;
                var sp_KeyType = KeyTypeConsts.KEY_TYPE_PMK;
                req.input("llHardwareID", sqlDb.BigInt, sp_llHardwareID);
                req.input("nSlotID", sqlDb.SmallInt, sp_SlotID);
                req.input("nKeyEncryptionType", sqlDb.SmallInt, sp_KeyEncryptionType);
                req.input("nKeyType", sqlDb.SmallInt, sp_KeyType);
                req.execute('HSM_spGetClientKeys').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        CUIHandler.log(err.message);
                        conn.close();
                        resolve(false);
                    }
                    var objSpGetPMK = recordsets.recordset[0];
                    if (objSpGetPMK == undefined) {
                        resolve(false);
                    }
                    else {
                        stPMK.chArrHardwareID = CUtils.String2Bytes(objSpGetPMK.HARDWARE_ID);
                        stPMK.iKeySlot = objSpGetPMK.KEY_SLOT_ID;
                        stPMK.chArrPMK = CUtils.String2Bytes(objSpGetPMK.KEY_VALUE);
                        stPMK.chArrChecksum = CUtils.String2Bytes(objSpGetPMK.KEY_KCV);
                        conn.close();
                        resolve(true);
                    }
                })
            })
            .catch(function (err) {
                resolve(false);
            });
    });
}
CDBAccessor.prototype.iGetPTMKPin = function (iSlotID, chArrHardwareID, stEncryptionKey) {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var req = new sqlDb.Request(conn);
                var strllHardwareID = CUtils.Bytes2String(chArrHardwareID);
                var sp_llHardwareID = parseInt(strllHardwareID, 10);
                var sp_SlotID = iSlotID;
                var sp_KeyEncryptionType = KeyEncryptionTypeConsts.KEY_PIN_ENCRYPTION;
                var sp_KeyType = KeyTypeConsts.KEY_TYPE_PTMK;
                req.input("llHardwareID", sqlDb.BigInt, sp_llHardwareID);
                req.input("nSlotID", sqlDb.SmallInt, sp_SlotID);
                req.input("nKeyEncryptionType", sqlDb.SmallInt, sp_KeyEncryptionType);
                req.input("nKeyType", sqlDb.SmallInt, sp_KeyType);
                req.execute('HSM_spGetClientKeys').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        CUIHandler.log(err.message);
                        conn.close();
                        resolve(false);
                    }
                    var objSpGetPTMK = recordsets.recordset[0];
                    if (objSpGetPTMK == undefined) {
                        resolve(false);
                    }
                    else {
                        stEncryptionKey.uchArrPINKey = CUtils.String2Bytes(objSpGetPTMK.KEY_VALUE);
                        stEncryptionKey.uchArrKCVPINKey = CUtils.String2Bytes(objSpGetPTMK.KEY_KCV);
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
CDBAccessor.prototype.iGetPTMKTLE = function (iSlotID, chArrHardwareID, stEncryptionKey) {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var req = new sqlDb.Request(conn);
                var strllHardwareID = CUtils.Bytes2String(chArrHardwareID);
                var sp_llHardwareID = parseInt(strllHardwareID, 10);
                var sp_SlotID = iSlotID;
                var sp_KeyEncryptionType = KeyEncryptionTypeConsts.KEY_TLE_ENCRYPTION;
                var sp_KeyType = KeyTypeConsts.KEY_TYPE_PTMK;
                req.input("llHardwareID", sqlDb.BigInt, sp_llHardwareID);
                req.input("nSlotID", sqlDb.SmallInt, sp_SlotID);
                req.input("nKeyEncryptionType", sqlDb.SmallInt, sp_KeyEncryptionType);
                req.input("nKeyType", sqlDb.SmallInt, sp_KeyType);
                req.execute('HSM_spGetClientKeys').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        CUIHandler.log(err.message);
                        conn.close();
                        resolve(false);
                    }
                    var objSpGetPTMK = recordsets.recordset[0];
                    if (objSpGetPTMK == undefined) {
                        resolve(false);
                    }
                    else {
                        stEncryptionKey.uchArrTLEKey = CUtils.String2Bytes(objSpGetPTMK.KEY_VALUE);
                        stEncryptionKey.uchArrKCVTLEKey = CUtils.String2Bytes(objSpGetPTMK.KEY_KCV);
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
CDBAccessor.prototype.iGetPSKPin = function (iSlotID, chArrHardwareID, stEncryptionKey) {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var req = new sqlDb.Request(conn);
                var strllHardwareID = CUtils.Bytes2String(chArrHardwareID);
                var sp_llHardwareID = parseInt(strllHardwareID, 10);
                var sp_SlotID = iSlotID;
                var sp_KeyEncryptionType = KeyEncryptionTypeConsts.KEY_PIN_ENCRYPTION;
                var sp_KeyType = KeyTypeConsts.KEY_TYPE_PSK;
                req.input("llHardwareID", sqlDb.BigInt, sp_llHardwareID);
                req.input("nSlotID", sqlDb.SmallInt, sp_SlotID);
                req.input("nKeyEncryptionType", sqlDb.SmallInt, sp_KeyEncryptionType);
                req.input("nKeyType", sqlDb.SmallInt, sp_KeyType);
                req.execute('HSM_spGetClientKeys').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        CUIHandler.log(err.message);
                        conn.close();
                        resolve(false);
                    }
                    var objSpGetPTMK = recordsets.recordset[0];
                    if (objSpGetPTMK == undefined) {
                        resolve(false);
                    }
                    else {
                        stEncryptionKey.uchArrPINKey = CUtils.String2Bytes(objSpGetPTMK.KEY_VALUE);
                        stEncryptionKey.uchArrKCVPINKey = CUtils.String2Bytes(objSpGetPTMK.KEY_KCV);
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
CDBAccessor.prototype.iGetPSKTLE = function (iSlotID, chArrHardwareID, stEncryptionKey) {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var req = new sqlDb.Request(conn);
                var strllHardwareID = CUtils.Bytes2String(chArrHardwareID);
                var sp_llHardwareID = parseInt(strllHardwareID, 10);
                var sp_SlotID = iSlotID;
                var sp_KeyEncryptionType = KeyEncryptionTypeConsts.KEY_TLE_ENCRYPTION;
                var sp_KeyType = KeyTypeConsts.KEY_TYPE_PSK;
                req.input("llHardwareID", sqlDb.BigInt, sp_llHardwareID);
                req.input("nSlotID", sqlDb.SmallInt, sp_SlotID);
                req.input("nKeyEncryptionType", sqlDb.SmallInt, sp_KeyEncryptionType);
                req.input("nKeyType", sqlDb.SmallInt, sp_KeyType);
                req.execute('HSM_spGetClientKeys').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        CUIHandler.log(err.message);
                        conn.close();
                        resolve(false);
                    }
                    var objSpGetPTMK = recordsets.recordset[0];
                    if (objSpGetPTMK == undefined) {
                        resolve(false);
                    }
                    else {
                        stEncryptionKey.uchArrTLEKey = CUtils.String2Bytes(objSpGetPTMK.KEY_VALUE);
                        stEncryptionKey.uchArrKCVTLEKey = CUtils.String2Bytes(objSpGetPTMK.KEY_KCV);
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
CDBAccessor.prototype.iGetEncryptedPSKPin = function (iSlotID, chArrHardwareID, stEncryptionKey) {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var req = new sqlDb.Request(conn);
                var strllHardwareID = CUtils.Bytes2String(chArrHardwareID);
                var sp_llHardwareID = parseInt(strllHardwareID, 10);
                var sp_SlotID = iSlotID;
                var sp_KeyEncryptionType = KeyEncryptionTypeConsts.KEY_PIN_ENCRYPTION;
                var sp_KeyType = KeyTypeConsts.KEY_TYPE_ENCRYPTED_PSK;
                req.input("llHardwareID", sqlDb.BigInt, sp_llHardwareID);
                req.input("nSlotID", sqlDb.SmallInt, sp_SlotID);
                req.input("nKeyEncryptionType", sqlDb.SmallInt, sp_KeyEncryptionType);
                req.input("nKeyType", sqlDb.SmallInt, sp_KeyType);
                req.execute('HSM_spGetClientKeys').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        CUIHandler.log(err.message);
                        conn.close();
                        resolve(false);
                    }
                    var objSpGetPTMK = recordsets.recordset[0];
                    if (objSpGetPTMK == undefined) {
                        resolve(false);
                    }
                    else {
                        stEncryptionKey.uchArrPINKey = CUtils.String2Bytes(objSpGetPTMK.KEY_VALUE);
                        stEncryptionKey.uchArrKCVPINKey = CUtils.String2Bytes(objSpGetPTMK.KEY_KCV);
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
CDBAccessor.prototype.iGetEncryptedPSKTLE = function (iSlotID, chArrHardwareID, stEncryptionKey) {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var req = new sqlDb.Request(conn);
                var strllHardwareID = CUtils.Bytes2String(chArrHardwareID);
                var sp_llHardwareID = parseInt(strllHardwareID, 10);
                var sp_SlotID = iSlotID;
                var sp_KeyEncryptionType = KeyEncryptionTypeConsts.KEY_TLE_ENCRYPTION;
                var sp_KeyType = KeyTypeConsts.KEY_TYPE_ENCRYPTED_PSK;
                req.input("llHardwareID", sqlDb.BigInt, sp_llHardwareID);
                req.input("nSlotID", sqlDb.SmallInt, sp_SlotID);
                req.input("nKeyEncryptionType", sqlDb.SmallInt, sp_KeyEncryptionType);
                req.input("nKeyType", sqlDb.SmallInt, sp_KeyType);
                req.execute('HSM_spGetClientKeys').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        CUIHandler.log(err.message);
                        conn.close();
                        resolve(false);
                    }
                    var objSpGetPTMK = recordsets.recordset[0];
                    if (objSpGetPTMK == undefined) {
                        resolve(false);
                    }
                    else {
                        stEncryptionKey.uchArrTLEKey = CUtils.String2Bytes(objSpGetPTMK.KEY_VALUE);
                        stEncryptionKey.uchArrKCVTLEKey = CUtils.String2Bytes(objSpGetPTMK.KEY_KCV);
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
CDBAccessor.prototype.ReadChargeSlipTemplateIdFromDB = function (TemplateArr) {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var req = new sqlDb.Request(conn);
                var iNumberOfTemplates = 0;
                req.execute('TEST_spGetChargeSlipTemplateID_CentralTest').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        TemplateArr[0] = iNumberOfTemplates;
                        CUIHandler.log(err.message);
                        conn.close();
                        resolve(iNumberOfTemplates);
                    }
                    var objGetchargeslipTemplateIds = recordsets.recordset[0];
                    if (objGetchargeslipTemplateIds == undefined) {
                        TemplateArr[0] = iNumberOfTemplates;
                        resolve(iNumberOfTemplates);
                    }
                    else {
                        iNumberOfTemplates++;
                        TemplateArr[iNumberOfTemplates] = parseInt(objGetchargeslipTemplateIds.m_TEMPLATE_ID, 10);
                        conn.close();
                        resolve(iNumberOfTemplates);
                    }
                })
            })
            .catch(function (err) {
                TemplateArr[0] = iNumberOfTemplates;
                CUIHandler.log(err.message);
                resolve(iNumberOfTemplates);
            });
    });
}
CDBAccessor.prototype.ReadMessageIdFromDB = function (TemplateArr) {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var req = new sqlDb.Request(conn);
                var iNumberOfTemplates = 0;
                req.execute('TEST_spGetMessageID_CentralTest').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        TemplateArr[0] = iNumberOfTemplates;
                        conn.close();
                        resolve(iNumberOfTemplates);
                    }
                    var objGetMessageIds = recordsets.recordset[0];
                    if (objGetMessageIds == undefined) {
                        TemplateArr[0] = iNumberOfTemplates;
                        resolve(iNumberOfTemplates);
                    }
                    else {
                        iNumberOfTemplates++;
                        TemplateArr[iNumberOfTemplates] = objGetMessageIds.MESSAGE_ID;
                        conn.close();
                        resolve(iNumberOfTemplates);
                    }
                })
            })
            .catch(function (err) {
                CUIHandler.log(err.message);
                TemplateArr[0] = iNumberOfTemplates;
                resolve(iNumberOfTemplates);
            });
    });
}
CDBAccessor.prototype.GetEMVPARDownloadedInfo = function (downloadInfo) {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var req = new sqlDb.Request(conn);
                var bRet = false;
                req.execute('TEST_spGetEMVParInfo_CentralTest').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        resolve(false);
                    }
                    var objGetEMVPARInfo = recordsets.recordset[0];
                    if (objGetEMVPARInfo == undefined) {
                        resolve(false);
                    }
                    else {
                        //console.dir(objGetEMVPARInfo);
                        downloadInfo.chVersion.set(CUtils.String2Bytes(objGetEMVPARInfo.EMVPAR_VERSION), 0);
                        downloadInfo.currentpacketCount = objGetEMVPARInfo.CURRENT_PACKET_COUNT;
                        downloadInfo.totalpacketCount = objGetEMVPARInfo.TOTAL_PACKET_COUNT;
                        downloadInfo.chunkSize = objGetEMVPARInfo.CHUNK_SIZE;
                        bRet = true;
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
CDBAccessor.prototype.UpdateClientDetails = function (dbAccessor) {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var temp = dbAccessor.m_sParamData.bIsBatchLocked;
                var temp2 = dbAccessor.m_sParamData.lTimeDifferential;
                var req = new sqlDb.Request(conn);
                req.input("nTerminalID", sqlDb.VarChar(50), dbAccessor.m_sParamData.chTerminalId);
                req.input("CurrentBatchID", sqlDb.Int, dbAccessor.m_sParamData.iCurrentBatchId);
                req.input("CurrentROC", sqlDb.Int, dbAccessor.m_sParamData.iCurrentROC);
                req.input("Security_Token", sqlDb.VarChar(100), dbAccessor.m_sParamData.m_chsTokenData);
                req.input("MerchantID", sqlDb.VarChar(50), dbAccessor.m_sParamData.chMerchantId);
                req.input("HardwareSerialNumber", sqlDb.VarChar(50), dbAccessor.m_sParamData.HwSerialNumber);
                req.input("SuccessTXN", sqlDb.Int,-858993460);//Added As per default value of C++.
                req.input("ClinetID", sqlDb.VarChar(50), dbAccessor.m_sParamData.m_uchArrClientId);
                req.input("EMVPARVersion", sqlDb.VarChar(50), dbAccessor.m_sParamData.m_chArrEMVParVersion);
                req.input("GUID", sqlDb.VarChar(50), dbAccessor.m_sParamData.m_uchArrGUID);
                req.input("ParameterUpdateDate", sqlDb.VarChar(50), dbAccessor.m_sParamData.chParameterUpdateDate);
                req.input("IsDataChanged", sqlDb.VarChar(3), dbAccessor.m_sParamData.bArrIsDataChanged);
                req.input("IsBatchLocked", sqlDb.Bit, dbAccessor.m_sParamData.bIsBatchLocked);
                req.input("TimeDifferential", sqlDb.Int, dbAccessor.m_sParamData.lTimeDifferential);
                req.execute('IRIS_spUpdateClientDetail_CentralTest1').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        CUIHandler.log(err.message);
                        conn.close();
                        resolve(false);
                    }
                    else {
                        conn.close();
                        resolve(true);
                    }
                })
                    .catch(function (err) {
                        CUIHandler.log(err.message);
                        resolve(false);
                    });
            })
            .catch(function (err) {
                CUIHandler.log(err.message);
                resolve(false);
            });
    });
}
CDBAccessor.prototype.DeleteEMVPARInfo = function () {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var req = new sqlDb.Request(conn);
                req.execute('TEST_spDeleteEMVParInfo_CentralTest').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        CUIHandler.log(err.message);
                        conn.close();
                        resolve(false);
                    }
                    else {
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
CDBAccessor.prototype.SaveEMVPARInfo = function (downloadInfo) {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var req = new sqlDb.Request(conn);
                req.input("EMVParVersion", sqlDb.VarChar(13),CUtils.Bytes2String(downloadInfo.chVersion));//need to check....
                req.input("CurrentPacketCount", sqlDb.Int, downloadInfo.currentpacketCount);
                req.input("TotalPacketCount", sqlDb.Int, downloadInfo.totalpacketCount);
                req.input("ChunkSize", sqlDb.Int, downloadInfo.chunkSize);
                req.execute('TEST_spInsertEMVParInfoTbl_CentralTest').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        CUIHandler.log(err.message);
                        conn.close();
                        resolve(false);
                    }
                    else {
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
CDBAccessor.prototype.iInsertOrUpdateEncryptedPSKPin = function (chArrHardwareID, stEncryptionKey) {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var req = new sqlDb.Request(conn);
                var lHardwareID = parseInt(CUtils.Bytes2String(chArrHardwareID, 10));
                req.input("llHardwareID", sqlDb.BigInt, lHardwareID);
                req.input("nSlotID", sqlDb.SmallInt, stEncryptionKey.iSlotID);
                req.input("nKeyEncryptionType", sqlDb.SmallInt, KeyEncryptionTypeConsts.KEY_PIN_ENCRYPTION);
                req.input("nKeyType", sqlDb.SmallInt, KeyTypeConsts.KEY_TYPE_ENCRYPTED_PSK);
                req.input("vKeyValue", sqlDb.VarChar(50), CUtils.Bytes2String(stEncryptionKey.uchArrPINKey));
                req.input("vKeyKCV", sqlDb.VarChar(13), CUtils.Bytes2String(stEncryptionKey.uchArrKCVPINKey));
                req.execute('HSM_spInsertOrUpdateClientHardwareKeyMapTbl').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        CUIHandler.log(err.message);
                        conn.close();
                        resolve(false);
                    }
                    else {
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
CDBAccessor.prototype.iInsertOrUpdatePSKPin = function (chArrHardwareID, stEncryptionKey) {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var req = new sqlDb.Request(conn);
                var lHardwareID = parseInt(CUtils.Bytes2String(chArrHardwareID, 10));
                req.input("llHardwareID", sqlDb.BigInt, lHardwareID);
                req.input("nSlotID", sqlDb.SmallInt, stEncryptionKey.iSlotID);
                req.input("nKeyEncryptionType", sqlDb.SmallInt, KeyEncryptionTypeConsts.KEY_PIN_ENCRYPTION);
                req.input("nKeyType", sqlDb.SmallInt, KeyTypeConsts.KEY_TYPE_PSK);
                req.input("vKeyValue", sqlDb.VarChar(50), CUtils.Bytes2String(stEncryptionKey.uchArrPINKey));
                req.input("vKeyKCV", sqlDb.VarChar(13), CUtils.Bytes2String(stEncryptionKey.uchArrKCVPINKey));
                req.execute('HSM_spInsertOrUpdateClientHardwareKeyMapTbl').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        CUIHandler.log(err.message);
                        conn.close();
                        resolve(false);
                    }
                    else {
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
CDBAccessor.prototype.iInsertOrUpdateEncryptedPSKTLE = function (chArrHardwareID, stEncryptionKey) {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var req = new sqlDb.Request(conn);
                var lHardwareID = parseInt(CUtils.Bytes2String(chArrHardwareID, 10));
                req.input("llHardwareID", sqlDb.BigInt, lHardwareID);
                req.input("nSlotID", sqlDb.SmallInt, stEncryptionKey.iSlotID);
                req.input("nKeyEncryptionType", sqlDb.SmallInt, KeyEncryptionTypeConsts.KEY_TLE_ENCRYPTION);
                req.input("nKeyType", sqlDb.SmallInt, KeyTypeConsts.KEY_TYPE_ENCRYPTED_PSK);
                req.input("vKeyValue", sqlDb.VarChar(50), CUtils.Bytes2String(stEncryptionKey.uchArrTLEKey));
                req.input("vKeyKCV", sqlDb.VarChar(13), CUtils.Bytes2String(stEncryptionKey.uchArrKCVTLEKey));
                req.execute('HSM_spInsertOrUpdateClientHardwareKeyMapTbl').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        CUIHandler.log(err.message);
                        conn.close();
                        resolve(false);
                    }
                    else {
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
CDBAccessor.prototype.iInsertOrUpdatePSKTLE = function (chArrHardwareID, stEncryptionKey) {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var req = new sqlDb.Request(conn);
                var lHardwareID = parseInt(CUtils.Bytes2String(chArrHardwareID, 10));
                req.input("llHardwareID", sqlDb.BigInt, lHardwareID);
                req.input("nSlotID", sqlDb.SmallInt, stEncryptionKey.iSlotID);
                req.input("nKeyEncryptionType", sqlDb.SmallInt, KeyEncryptionTypeConsts.KEY_TLE_ENCRYPTION);
                req.input("nKeyType", sqlDb.SmallInt, KeyTypeConsts.KEY_TYPE_PSK);
                req.input("vKeyValue", sqlDb.VarChar(50), CUtils.Bytes2String(stEncryptionKey.uchArrTLEKey));
                req.input("vKeyKCV", sqlDb.VarChar(13), CUtils.Bytes2String(stEncryptionKey.uchArrKCVTLEKey));
                req.execute('HSM_spInsertOrUpdateClientHardwareKeyMapTbl').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        CUIHandler.log(err.message);
                        conn.close();
                        resolve(false);
                    }
                    else {
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
CDBAccessor.prototype.iInsertOrUpdatePMK = function (stPMK) {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var req = new sqlDb.Request(conn);
                var lHardwareID = parseInt(CUtils.Bytes2String(stPMK.chArrHardwareID), 10);
                var a = CUtils.Bytes2String(stPMK.chArrPMK);
                var b = CUtils.Bytes2String(stPMK.chArrChecksum);
                var c = KeyEncryptionTypeConsts.KEY_NONE_ENCRYPTION;
                var d = KeyTypeConsts.KEY_TYPE_PMK;
                req.input("llHardwareID", sqlDb.BigInt, lHardwareID);
                req.input("nSlotID", sqlDb.SmallInt, stPMK.iKeySlot);
                req.input("nKeyEncryptionType", sqlDb.SmallInt, KeyEncryptionTypeConsts.KEY_NONE_ENCRYPTION);
                req.input("nKeyType", sqlDb.SmallInt, KeyTypeConsts.KEY_TYPE_PMK);
                req.input("vKeyValue", sqlDb.VarChar(50), CUtils.Bytes2String(stPMK.chArrPMK));
                req.input("vKeyKCV", sqlDb.VarChar(13), CUtils.Bytes2String(stPMK.chArrChecksum));
                req.execute('HSM_spInsertOrUpdateClientHardwareKeyMapTbl').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        CUIHandler.log(err.message);
                        conn.close();
                        resolve(false);
                    }
                    else {
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
CDBAccessor.prototype.iInsertOrUpdatePTMKPin = function (chArrHardwareID, stEncryptionKey) {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var req = new sqlDb.Request(conn);
                var lHardwareID = parseInt(CUtils.Bytes2String(chArrHardwareID), 10);
                req.input("llHardwareID", sqlDb.BigInt, lHardwareID);
                req.input("nSlotID", sqlDb.SmallInt, stEncryptionKey.iSlotID);
                req.input("nKeyEncryptionType", sqlDb.SmallInt, KeyEncryptionTypeConsts.KEY_PIN_ENCRYPTION);
                req.input("nKeyType", sqlDb.SmallInt, KeyTypeConsts.KEY_TYPE_PTMK);
                req.input("vKeyValue", sqlDb.VarChar(50), CUtils.Bytes2String(stEncryptionKey.uchArrPINKey));
                req.input("vKeyKCV", sqlDb.VarChar(13), CUtils.Bytes2String(stEncryptionKey.uchArrKCVPINKey));
                req.execute('HSM_spInsertOrUpdateClientHardwareKeyMapTbl').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        CUIHandler.log(err.message);
                        conn.close();
                        resolve(false);
                    }
                    else {
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
CDBAccessor.prototype.iInsertOrUpdatePTMKTLE = function (chArrHardwareID, stEncryptionKey) {
    return new Promise((resolve, reject) => {
        var conn = new sqlDb.ConnectionPool(settings.dbconfig);
        conn.connect()
            .then(function () {
                var req = new sqlDb.Request(conn);
                var lHardwareID = parseInt(CUtils.Bytes2String(chArrHardwareID), 10);
                req.input("llHardwareID", sqlDb.BigInt, lHardwareID);
                req.input("nSlotID", sqlDb.SmallInt, stEncryptionKey.iSlotID);
                req.input("nKeyEncryptionType", sqlDb.SmallInt, KeyEncryptionTypeConsts.KEY_TLE_ENCRYPTION);
                req.input("nKeyType", sqlDb.SmallInt, KeyTypeConsts.KEY_TYPE_PTMK);
                req.input("vKeyValue", sqlDb.VarChar(50), CUtils.Bytes2String(stEncryptionKey.uchArrTLEKey));
                req.input("vKeyKCV", sqlDb.VarChar(13), CUtils.Bytes2String(stEncryptionKey.uchArrKCVTLEKey));
                req.execute('HSM_spInsertOrUpdateClientHardwareKeyMapTbl').then(function (recordsets, err, returnValue, affected) {
                    if (err) {
                        CUIHandler.log(err.message);
                        conn.close();
                        resolve(false);
                    }
                    else {
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
module.exports = CDBAccessor;