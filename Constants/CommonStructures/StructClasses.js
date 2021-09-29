var Utils = require("../Classes/Utils");
var Consts = require("../Constants/AppConsts");
var ETXNType = require("../Constants/ETXNType");
var CUtils = new Utils();
class TerminalData {
    constructor() {
        this.connType = undefined;
        this.primary_phone = undefined;
        this.secondary_phone = undefined;
        this.dial_type = undefined;
        this.conn_timeout = undefined;
        this.lstBthCloseDT = undefined;
        this.samAcctId = undefined;
        this.retryBDpassword = undefined;
        this.lstBthDeleted = undefined;
        this.locked = undefined;
        this.isoPort = undefined;
        this.isoServerIP = undefined;
        this.userName = undefined;
        this.password = undefined;
        this.sendRecTimeOut = undefined;
        this.init_chNo = undefined;
        this.paramFileChNo = undefined;
        this.RFMDebug = undefined;
        this.isParamFile = undefined;
        this.nii = undefined;
        this.tpdu = undefined;
    }
};
class TerminalParamData {
    constructor() {
        this.chTerminalId = undefined;
        this.chMerchantId = undefined;
        this.iCurrentBatchId = undefined;
        this.iCurrentROC = undefined;
        this.ulPvmVersion = undefined;
        this.app_version = undefined;
        this.HwSerialNumber = undefined;
        this.TotalCTids = undefined;
        this.TotalImageIds = undefined;
        this.TotalTransaction = undefined;
        this.m_chsTokenData = [];
        this.m_isTokenDataLen = undefined;
        this.chParameterUpdateDate = undefined;
        this.bIsBatchLocked =0;
        this.lTimeDifferential =0;
        this.FetchedHWSerialNo = undefined;
        this.PED_HwSerialNumber = undefined;
        this.m_chArrEMVParVersion = undefined;
        this.bArrIsDataChanged = undefined;
        this.m_uchArrClientId = undefined;
        this.m_uchArrGUID = undefined;
        this.uchTerminalType = undefined;
    }
};
class ReceiptInfo {
    constructor() {
        this.reciptPrinterType = undefined;
        this.chReceiptPrinterName = undefined;
        this.nNumberOfLinesInFooter = undefined;
        this.nPrintLogo = undefined;
    }
};
class TerminalSettings {
    constructor() {
        this.nServerPort = undefined;
        this.chServerIP = undefined;
        this.currentTerminal = undefined;
        this.nSwipePort = undefined;
        this.currentPrinter = undefined;
        this.nPrintPort = undefined;
        this.pinDeviceType = undefined;
        this.nPinDevicePort = undefined;
        this.ReceiptInfo = new ReceiptInfo();
        this.nPrintInECRMode = undefined;
        this.uchTerminalType = undefined;
    }
};
class TerminalTransactionData {
    constructor() {
        this.ulBatchId = undefined;
        this.ulROC = undefined;
        this.uiTransactionType = undefined;
        this.bIsOnline = undefined;
        this.bIsReversalPending = undefined;
        this.bIsTransactionReversed = undefined;
        this.chArrTxDateTime = undefined;
    }
};
class TLVTxData {
    constructor() {
        this.uiTag;
        this.uiTagValLen;
        this.chArrTagVal;
    }
};
class TxnTLVData {
    constructor() {
        this.objTLV = CUtils.ArrayofObject(20, TLVTxData);
        this.iTLVindex = 0;
    }
};
class TerminalMasterParamData {
    constructor() {
        this.bArrIsDataChanged;
        this.m_uchArrBitmap320CentralChangeNumber = [];
        this.m_uchArrBitmap320HUBChangeNumber = [];
        this.m_uchArrBitmap320ActiveHost = [];
        this.m_uchArrBitmap440ActiveHost = [];
        this.m_uchArrBitmap500ActiveHost = [];
        this.bArrIsBitmap320ActiveHostSet = [];
        this.bArrIsBitmap440ActiveHostSet = [];
        this.bArrIsBitmap500ActiveHostSet = [];
        this.ulPvmVersion = undefined;
        this.ulArrAPPVERSION = [];
        this.HwSerialNumber = [];
        this.TotalCTids = undefined;
        this.TotalImageIds = undefined;
        this.m_chArrEMVParVersion = [];
        this.m_chArrBinRangeDownloadDate = [];
        this.ulTotalBinRange = undefined;
        this.bArrIsBinRangeChanged = [];
        this.bArrIsPKExchangePacket = [];
        this.m_uchArrPMK = [];
        this.m_uchArrPSKPin = [];
        this.m_uchArrKCVPSKPin = [];
        this.m_uchArrPSKTLE = [];
        this.m_uchArrKCVPSKTLE = [];
        this.m_uchArrHSMPrimaryIP = [];
        this.m_uchArrHSMPrimaryPort = [];
        this.m_uchArrHSMSecondaryIP = [];
        this.m_uchArrHSMSecondaryPort = [];
        this.m_iHSMRetryCount = undefined;
    }
};
class CommParams {
    constructor() {
        this.chTerminalId = undefined;
        this.chMerchantId = undefined;
        this.chListenerIP = undefined;
        this.iListenerPort = undefined;
        this.chListenerSecIP = undefined;
        this.iListenerSecPort = undefined;
        this.iConType = undefined;
    }
};
class ProxySettings {
    constructor() {
        this.bEnableProxyServer = undefined;
        this.nProxySocksVersion = undefined;
        this.chProxyServerIP = undefined;
        this.nProxyServerPort = undefined;
        this.bProxyServerUseDNS = undefined;
        this.chProxyServerDNS = undefined;
        this.bAuthenticateUser = undefined;
        this.chProxyServerUserID = undefined;
        this.chProxyServerPassword = undefined;
    }
};
class ClientDetails {
    constructor() {
        this.Client_DetailID = undefined;
        this.ClientID = undefined;
        this.Security = undefined;
        this.Amount = undefined;
        this.Track1 = undefined;
        this.Track2 = undefined;
        this.ReqType = undefined;
        this.CurrentRoc = undefined;
        this.CurrentBatchID = undefined;
        this.TransactionType = undefined;
        this.TerminalID = undefined;
        this.MerchantID = undefined;
        this.HWSerialNo = undefined;
        this.TotalTransaction = undefined;
        this.EMVParVersion = undefined;
        this.GUID = undefined;
        this.TerminalType = undefined;
        this.PED_HW_Serial_Number = undefined;
        this.Parameter_Update_Date = undefined;
        this.Is_Data_changed = undefined;
        this.bIsBatchLocked = undefined;
        this.TimeDifferential = undefined;
        this.bIsActiveClient = undefined;
        this.m_csListenerIP = undefined;
        this.m_iListenerPort = undefined;
    }
};
class st_PMK {
    constructor() {
        this.iKeySlot;
        this.chArrPMK = new Uint8Array(32);
        this.chArrChecksum = new Uint8Array(4);
        this.chArrHardwareID = new Int8Array(20);
    }
};
class st_RESET_RESPONSE {
    constructor() {
        this.iIsZMKCompUnderPMK;
        this.iNumKeySlots;
        this.sZMKKeys = CUtils.ArrayofObject((Consts.NUM_KEYSLOTS + 1), st_ZMK_KEY);
    }
}
class st_ZMK_KEY {
    constructor() {
        this.iKeySlotID;
        this.uchArrPinZMKComp1 = new Uint8Array(16);
        this.uchArrKCVPinZMKComp1 = new Uint8Array(3);
        this.uchArrPinZMKComp2 = new Uint8Array(16);
        this.uchArrKCVPinZMKComp2 = new Uint8Array(3);
        this.uchArrPinZMKComp3 = new Uint8Array(16);
        this.uchArrKCVPinZMKComp3 = new Uint8Array(3);
        this.uchArrPinZMKFinal = new Uint8Array(16);
        this.uchArrKCVPinZMKFinal = new Uint8Array(3);
        this.uchArrTLEZMKComp1 = new Uint8Array(16);
        this.uchArrKCVTLEZMKComp1 = new Uint8Array(3);
        this.uchArrTLEZMKComp2 = new Uint8Array(16);
        this.uchArrKCVTLEZMKComp2 = new Uint8Array(3);
        this.uchArrTLEZMKComp3 = new Uint8Array(16);
        this.uchArrKCVTLEZMKComp3 = new Uint8Array(3);
        this.uchArrTLEZMKFinal = new Uint8Array(16);
        this.uchArrKCVTLEZMKFinal = new Uint8Array(3);
    }
};
class st_ENCRYPTION_KEY {
    constructor() {
        this.iSlotID;
        this.uchArrPINKey = new Uint8Array(32);
        this.uchArrKCVPINKey = new Uint8Array(6);
        this.uchArrTLEKey = new Uint8Array(32);
        this.uchArrKCVTLEKey = new Uint8Array(6);
    }
};
class ParameterData {
    constructor() {
        this.uiHostID = undefined;
        this.ulParameterId;
        this.ulParameterLen;
        this.chArrParameterVal = new Int8Array(255);
    }
};
class CurrentDownloadingInfo {
    constructor() {
        this.id = 0;
        this.currentpacketCount = 0;
        this.totalpacketCount = 0;
        this.chunkSize = 0;
    }
};
class CurrentEMVParDownloadingInfo {
    constructor() {
        this.chVersion = new Int8Array(13);
        this.currentpacketCount = 0;
        this.totalpacketCount = 0;
        this.chunkSize = 0;
    }
};
class STxnRes {
    constructor() {
        this.iIndex;
        this.nTxnID;
        this.csPrintRecipt;
    }
};
class STxnReq {
    constructor() {
        this.iIndex = -1;
        this.eTxnType = ETXNType.TAG_REQTYPE;
        this.csTrack1 = "";
        this.csTrack2 = "";
        this.nAmount = 0;
        this.iDepTxnIndex = -1;
        this.bIsEMI = false;
        this.nEMIMonths = -1;
    }
};
class XMLAttributeMiniPVM {
    constructor() {
        this.node_type; //node type of the class
        this.iName = new Int8Array(20); //name of the node.
        this.Timeout; //Timeout parameter for the execution.
        this.HostTlvtag; //host tag for this node .
        this.HostActiontag;
        this.IsOnSSL;
        this.onOk; //Action to take if excutions is completed successfully.
        this.onCancel; //Action to take if execution is cancled.
        this.onExit; //Action to take if execution is exited.
        this.onTimeout; //Action to take if timeout has happened during execution.
        this.Title = new Int8Array(10);
        this.ItemName = new Int8Array(10);
        this.ItemIndex;
        this.DisplayMessage = new Int8Array(100);
        this.DisplayMessageLine2; 
        this.DisplayMessageLine3; 
        this.DisplayMessageLine4; 
        this.MaxLen;
        this.MinLen;
        this.CurrencyName = new Int8Array(5);
        this.Decimals;
        this.KEY__F1;
        this.KEY__F2;
        this.KEY__F3;
        this.KEY__F4;
        this.KEY__ENTER;
        this.KEY__CANCEL;
        this.KeyF1 = new Int8Array(10);
        this.KeyF2 = new Int8Array(10);
        this.KeyF3 = new Int8Array(10);
        this.KeyF4 = new Int8Array(10);
        this.EventMask;
        this.numberOFItemsInMenuList;
        this.ItemList;
        this.iKeySlot;
        this.SessionKey = new Uint8Array(50);
        //this.m_chArrAmount=new Int8Array(256);
        this.m_chArrAmount = undefined;//for checking purpose
    }
}
class Itemval {
    constructor() {
        this.ItemName=undefined; //= new Int8Array(20);
        this.ItemVal=undefined; //= new Int8Array(20);
    }
}
module.exports = {
    st_ENCRYPTION_KEY: st_ENCRYPTION_KEY,
    st_ZMK_KEY: st_ZMK_KEY,
    st_RESET_RESPONSE: st_RESET_RESPONSE,
    st_PMK: st_PMK,
    ParameterData: ParameterData,
    CurrentDownloadingInfo: CurrentDownloadingInfo,
    TerminalData: TerminalData,
    TerminalParamData: TerminalParamData,
    TerminalSettings: TerminalSettings,
    TerminalTransactionData: TerminalTransactionData,
    TxnTLVData: TxnTLVData,
    TerminalMasterParamData: TerminalMasterParamData,
    CommParams: CommParams,
    ProxySettings: ProxySettings,
    ClientDetails: ClientDetails,
    CurrentEMVParDownloadingInfo: CurrentEMVParDownloadingInfo,
    STxnRes: STxnRes,
    STxnReq: STxnReq,
    XMLAttributeMiniPVM: XMLAttributeMiniPVM,
    Itemval: Itemval,
}
