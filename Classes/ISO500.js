var CISOMsg = require("./ISOMsg");
var Consts = require("../Constants/AppConsts");
var Utils = require("./Utils");
var CUtils = new Utils();
var IsoFieldConsts = require("../Constants/IsoFieldsConsts");
var Structs = require("../CommonStructures/StructClasses");
class CISO500 extends CISOMsg {
    constructor(dbAccessor) {
        super(dbAccessor);
        this.m_iChangeNumber;
        this.m_bCurrentPacketCount;
        this.m_bTotalPacketCount;
        this.m_bSettlementPrintData;
        this.m_iCurrentPrintDumpOffset;
        this.m_lBatchID;
    }
}
CISO500.prototype.Start = function () {
    this.m_iChangeNumber = 1;
    this.m_bCurrentPacketCount = 0x00;
    this.m_bSettlementPrintData = new Uint8Array(Consts.MAX_RESPONSE_DATA_LEN);
    this.iCurrentPrintDumpOffset = 0x00;
}
CISO500.prototype.CISO500C = function (chTerminalId, iTerminalIdLen, chNII) {
    this.CISOMsgC(chTerminalId, iTerminalIdLen, chNII);
    this.m_lBatchID = 0;
}
CISO500.prototype.packIt = function (bArrsendData) {
    this.vFnSetTerminalActivationFlag(false);
    this.msgno = Consts.BATCHCOMPLREQ;
    if (this.m_iChangeNumber == 1) {
        this.addField(3, Consts.PC_SETTLEMENT_START, true);
    }
    var strBatchIDTemp = (this.dbAccessor.m_sParamData.iCurrentBatchId).toString();
    strBatchIDTemp = CUtils.StrLeftPad(strBatchIDTemp, 6, '0');
    this.addField(IsoFieldConsts.ISO_FIELD_26, strBatchIDTemp, true);
    if (this.m_bCurrentPacketCount > 0) {
        var buffer = new Int8Array(4);
        var iLocalOffset = 0x00;
        var iCount = this.m_bCurrentPacketCount & (255);
        buffer.set(iCount, iLocalOffset++);
        iCount = this.m_bTotalPacketCount & (255);
        buffer.set(iCount, iLocalOffset++);
        this.addLLLCHARData(IsoFieldConsts.ISO_FIELD_53, buffer, iLocalOffset);
    }
    return this.packItHost(bArrsendData);
}
CISO500.prototype.ProcessData = async function () {
    if (this.m_iChangeNumber == 0x01) {
        if (!this.bitmap[3 - 1]) {
            return false;
        }
        if ((CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_SETTLEMENT_START) ||
            (CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_SETTLEMENT_END)) {
            if (!(this.bitmap[62 - 1] && this.bitmap[53 - 1])) {
                return false;
            }
            if (!await this.ProcessSettlementReport()) {
                return false;
            }
        }
    }
    switch (this.m_iChangeNumber) {
        case 1:
            if (!this.bitmap[3 - 1]) {
                break;
            }
            if (CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_SETTLEMENT_END) {
                this.m_bCurrentPacketCount = 0;
                this.m_bTotalPacketCount = 0;
                this.m_iChangeNumber++;
            }
            break;
        default:
            break;
    }
    return true;
}
CISO500.prototype.ProcessSettlementReport = async function () {
    var bArrChargeSlipData = this.data[62 - 1];
    var iChargeSliplength = this.len[62 - 1];
    if (this.iCurrentPrintDumpOffset + iChargeSliplength < Consts.MAX_RESPONSE_DATA_LEN) {
        this.m_bSettlementPrintData.set(bArrChargeSlipData, this.iCurrentPrintDumpOffset);
        this.iCurrentPrintDumpOffset += iChargeSliplength;
        this.m_bSettlementPrintData = this.m_bSettlementPrintData.slice(0, iChargeSliplength);
    }
    var bArrChargeSlipPacketCounts = this.data[53 - 1];
    var iPacketCountLength = this.len[53 - 1];
    if (iPacketCountLength >= 2) {
        this.m_bCurrentPacketCount = bArrChargeSlipPacketCounts[0];
        this.m_bTotalPacketCount = bArrChargeSlipPacketCounts[1];
    }
    if (this.m_bCurrentPacketCount == this.m_bTotalPacketCount) {
        var bArrChargeSlipCompleteData = this.m_bSettlementPrintData;
        var iChargeSlipTotallength = this.iCurrentPrintDumpOffset;
        var objSTxnRes = new Structs.STxnRes();
        objSTxnRes.nTxnID = 0;
        objSTxnRes.csPrintRecipt = "";
        CUtils.SavePrintDump(bArrChargeSlipCompleteData, iChargeSlipTotallength);//To Do Function coding
        objSTxnRes.nTxnID = 0;
        objSTxnRes.csPrintRecipt = "";
        if (!this.IsOK()) {
            this.dbAccessor.m_sParamData.bIsBatchLocked = false;
            await this.dbAccessor.UpdateClientDetails(this.dbAccessor);
            return false;
        }
        await this.ResetROC();
        await this.ProcessBatchId();
    }
    return true;
}
CISO500.prototype.ProcessBatchId = async function () {
    var strBatchID = CUtils.Bytes2String(this.data[26 - 1]);
    this.dbAccessor.m_sParamData.iCurrentBatchId = parseInt(strBatchID);
    this.dbAccessor.m_sParamData.bIsBatchLocked = false;
    await this.dbAccessor.UpdateClientDetails(this.dbAccessor);
}
CISO500.prototype.ResetROC = async function () {
    this.dbAccessor.m_sParamData.iCurrentROC = 0;
    this.dbAccessor.m_sParamData.TotalTransaction = 0;
    await this.dbAccessor.UpdateClientDetails(this.dbAccessor);
}
module.exports = CISO500;