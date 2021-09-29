var Consts = require("../Constants/AppConsts");
var util = require('util');
var CUtils = require("./Utils");
var IsoConst = require("../Constants/IsoFieldsConsts");
var dateTime = require('node-datetime');
var CCrypto = require("./CryptoHandler");
var CCryptoHandler = new CCrypto();
var CUtils = new CUtils();
var crc = require('crc');
class CISOMsg {
    constructor(dbAccessor) {
        this.msgno = undefined;
        this.bitmap = new Array(Consts.ISO_LEN);
        this.encryptedFieldBitmap = new Array(Consts.ISO_LEN);
        this.len = new Int32Array(Consts.ISO_LEN);
        this.data = new Array(Consts.ISO_LEN);;
        this.m_chFirstKey = undefined;
        this.m_chSecondKey = undefined;
        this.m_chArrISOPacketDate = undefined;
        this.m_TPDU = new Uint8Array(Consts.MAX_LEN_TPDU);
        this.m_NII = new Int8Array(Consts.MAX_LEN_NII);
        this.dbAccessor = dbAccessor;
        this.m_iHostID = undefined;
        this.m_iRoc = undefined;
        this.m_nBatchID = undefined;
        this.m_llClientId = undefined;
        this.m_nMaxRoc = undefined;
        this.m_lTerminalID = undefined;
        this.m_lOperatorID = undefined;
        this.m_chTerminalID = undefined;
        this.m_chMerchantId = undefined;
        this.m_csTerminalID = undefined;
        this.m_chArrHardwareSerialNumber = undefined;
        this.m_bIsTerminalActivationPacket = undefined;
        this.m_chsTokenData = undefined;
        this.m_isTokenDataLen = undefined;
    }
}
CISOMsg.prototype.CISOMsgC = function (strTerminalId, iTerminalIdLen, chNII) {
    this.bitmap.fill(false);
    this.encryptedFieldBitmap.fill(false);
    this.len.fill(-1);
    this.data.fill(null);
    this.m_chTerminalID = strTerminalId;
    this.m_bIsTerminalActivationPacket = false;
    //this.m_NII.fill(0x00);
    //this.m_NII = chNII.m_chNII;
    var csTemp;
    csTemp = "CISOMsgC::m_NII =";
    csTemp += util.format("%s", this.m_NII);
    var bcdNII = Buffer.alloc(3);
    this.m_TPDU[0] = 0x60;
    this.m_TPDU[1] = bcdNII[0];
    this.m_TPDU[2] = bcdNII[1];
    this.m_TPDU[3] = 0x00;
    this.m_TPDU[4] = 0x00;
}
CISOMsg.prototype.addField = function (ibitno, strdata, boolbcd) {
    this.bitmap[ibitno - 1] = true;
    if (boolbcd) {
        this.len[ibitno - 1] = (strdata.length) / 2;
        this.data[ibitno - 1] = new Uint8Array(this.len[ibitno - 1] + 1);
        this.data[ibitno - 1] = CUtils.a2bcd(strdata);
    }
    else {
        this.len[ibitno - 1] = strdata.length;
        this.data[ibitno - 1] = new Uint8Array((this.len[ibitno - 1]) + 1);
        this.data[ibitno - 1] = strdata;
    }
    return 0;
}
CISOMsg.prototype.vFnSetTerminalActivationFlag = function (bTerminalActivationFlag) {
    this.m_bIsTerminalActivationPacket = bTerminalActivationFlag;
}
CISOMsg.prototype.vFnSetIsoPacketDate = function () {
    var dt = dateTime.create();
    var date = [];
    var formatted = dt.format('dmYHMS');
    var x = [];
    x = formatted.toString();
    date = x.slice(0, 4);
    date += x.slice(6, 14);
    var chArrIsoPacketDateTime = new Int8Array(13);
    var iLenIsoPacketDateTime = 0;
    chArrIsoPacketDateTime = date;
    iLenIsoPacketDateTime = chArrIsoPacketDateTime.length;
    this.m_chArrISOPacketDate = chArrIsoPacketDateTime;
    this.addField(IsoConst.ISO_FIELD_12, chArrIsoPacketDateTime, true);
}
CISOMsg.prototype.packItHost = function (bArrSendBuffer) {
    var buffer = new Uint8Array(50);
    var newbuffer = new Uint8Array(50);
    var temp = new Int8Array(13);
    var buftemp = new Int8Array(7);
    var TerminalType =this.dbAccessor.m_sParamData.uchTerminalType.toString().padStart(2, "0");
    this.addField(IsoConst.ISO_FIELD_6, TerminalType, true);
    this.vFnSetIsoPacketDate();
    this.addField(IsoConst.ISO_FIELD_24, "0666", true);
    this.dbAccessor.m_sMasterParamData.ulArrAPPVERSION = Consts.APP_VERSION;
    this.addField(IsoConst.ISO_FIELD_38, CUtils.String2Bytes(this.dbAccessor.m_sMasterParamData.ulArrAPPVERSION), false);
    var iOffset = 0;
    var uchArrField47Data = new Uint8Array(150);
    var iLenClientID = (this.dbAccessor.m_sParamData.m_uchArrClientId).length;
    uchArrField47Data[iOffset++] = iLenClientID;
    if (iLenClientID > 0) {
        uchArrField47Data.set(CUtils.String2Bytes(this.dbAccessor.m_sParamData.m_uchArrClientId), iOffset);
        iOffset += iLenClientID;
        this.m_llClientId = parseInt(this.dbAccessor.m_sParamData.m_uchArrClientId, 10);
    }
    var iLenSecurityToken = (this.dbAccessor.m_sParamData.m_chsTokenData).length;
    uchArrField47Data[iOffset++] = iLenSecurityToken;
    if (iLenSecurityToken > 0) {
        uchArrField47Data.set(CUtils.String2Bytes(this.dbAccessor.m_sParamData.m_chsTokenData), iOffset);
        iOffset += iLenSecurityToken;
    }
    this.addLLLCHARData(IsoConst.ISO_FIELD_47, uchArrField47Data, iOffset);
    this.vFnSetPEDHardwareSerialNumer();
    if (this.dbAccessor.m_bIsLoggedIn) {
        buffer.fill(0);
        var offset = 0;
        var UserIDlen = 0;
        var pinlen = 0;
        UserIDlen = (this.dbAccessor.m_chUserName).length;
        pinlen = (this.dbAccessor.m_chUserPassword).length;
        buffer[offset++] = UserIDlen;
        buffer.set(CUtils.String2Bytes(this.dbAccessor.m_chUserName), offset);
        offset += UserIDlen;
        buffer[offset++] = pinlen;
        buffer.set(CUtils.String2Bytes(this.dbAccessor.m_chUserPassword), offset);
        offset += pinlen;
        this.addLLLCHARData(IsoConst.ISO_FIELD_50, buffer, offset);
    }
    buffer.fill(0);
    newbuffer.fill(0);
    var iLocalOffset = 0x00;
    var ihwLen;
    ihwLen = (this.dbAccessor.m_sParamData.PED_HwSerialNumber).length;
    newbuffer.set(CUtils.String2Bytes(this.dbAccessor.m_sParamData.PED_HwSerialNumber), iLocalOffset);
    var newbuffer_temp = newbuffer.slice(0, ihwLen);
    this.vFnSetHardwareSerialNumer(newbuffer, ihwLen);
    buffer[iLocalOffset++] = ihwLen;
    buffer.set(newbuffer_temp, iLocalOffset);
    iLocalOffset += ihwLen;
    var ulPvmVersion = 0;
    newbuffer.fill(0);
    ulPvmVersion = 210213;
    newbuffer.set(CUtils.String2Bytes(ulPvmVersion.toString().padStart(4, "0")));
    buffer[iLocalOffset++] = (ulPvmVersion.toString()).length;
    newbuffer_temp = newbuffer.slice(0, (ulPvmVersion.toString()).length);
    buffer.set(newbuffer_temp, iLocalOffset);
    iLocalOffset += (ulPvmVersion.toString()).length;
    this.addLLLCHARData(IsoConst.ISO_FIELD_59, buffer, iLocalOffset);
    if (!this.m_bIsTerminalActivationPacket) {
        var bArrGUIDToken = this.bFnGetGUIDAuthToken();
        this.addLLLCHARData(IsoConst.ISO_FIELD_51, bArrGUIDToken, bArrGUIDToken.length);
    }
    var enBmap = new Uint8Array(Consts.ISO_LEN / 8 + 1);
    enBmap.fill(0x00);
    var charenBmap = new Int8Array((Consts.ISO_LEN / 8) * 2 + 1);
    charenBmap.length = ((Consts.ISO_LEN / 8) * 2 + 1);
    charenBmap.fill(0x00);
    var bToSet = false;
    for (var i = 0; i < Consts.ISO_LEN; i++) {
        if (this.encryptedFieldBitmap[i]) {
            var x = parseInt(i / 8);
            enBmap[x] |= (0x80 >> (i % 8));
            bToSet = true;
        }
    }
    if (bToSet) {
        this.addField(IsoConst.ISO_FIELD_5, charenBmap, true);
    }
    var offset = 0;
    var temp = CUtils.a2bcd(this.msgno);
    bArrSendBuffer.set(temp, offset);
    offset += 2;
    var CRC_len = 8;
    this.bitmap[64 - 1] = true;
    var CRC = new Int8Array(CRC_len + 1);
    CRC.fill(0);
    var bmap = new Uint8Array(Consts.ISO_LEN / 8 + 1);
    for (var i = 0; i < Consts.ISO_LEN / 8; bmap[i++] = 0);
    for (var i = 0; i < Consts.ISO_LEN; i++) {
        if (this.bitmap[i]) {
            var x = parseInt(i / 8);
            bmap[x] |= (0x80 >> (i % 8));
        }
    }
    var temp = bmap.slice(0, Consts.ISO_LEN / 8);
    bArrSendBuffer.set(temp, offset);
    offset += Consts.ISO_LEN / 8;
    var temp = bArrSendBuffer.slice(0, offset);
    for (var i = 0; i < Consts.ISO_LEN; i++) {
        if (!this.bitmap[i])
            continue;
        if (i != (64 - 1)) {
            bArrSendBuffer.set(this.data[i], offset);
            offset += this.len[i];
        }
    }
    var toCRC = new Uint8Array(offset)
    var crcz = 0;
    toCRC.set(bArrSendBuffer.slice(0, offset), 0);
    crcz = crc.crc32(toCRC);
    CRC = crcz.toString(16);
    CRC = CUtils.StrLeftPad(CRC, CRC_len, '0');
    bArrSendBuffer.set(CUtils.String2Bytes(CRC), offset);
    offset += CRC_len;
    this.addField(64, CRC, false);
    this.CISOMsgD();
    return offset;
}
CISOMsg.prototype.addLLLCHARData = function (ibitno, bArrdata, ilength) {
    if (bArrdata != null) {
        bArrdata = bArrdata.slice(0, ilength);
        this.bitmap[ibitno - 1] = true;
        this.len[ibitno - 1] = 2 + ilength;
        this.data[ibitno - 1] = new Int8Array(this.len[ibitno - 1]);
        var strlength = ilength.toString();
        strlength = CUtils.StrLeftPad(strlength, 4, '0');
        var temp1 = CUtils.a2bcd(strlength);
        this.data[ibitno - 1][0] = temp1[0];
        this.data[ibitno - 1][1] = temp1[1];
        this.data[ibitno - 1].set(bArrdata, 2);
    }
    return true;
}
CISOMsg.prototype.bFnGetGUIDAuthToken = function () {
    uchArrTempData = new Uint8Array(32);
    uchArrKey = new Uint8Array(16);
    var iLenOutput;
    var iOffset = 0;
    uchArrTempData.set(CUtils.String2Bytes(this.m_chArrISOPacketDate), iOffset);
    iOffset += (this.m_chArrISOPacketDate).length;
    uchArrTempData.set(this.m_chArrHardwareSerialNumber, iOffset);
    iOffset += this.m_chArrHardwareSerialNumber.length;
    var temp = uchArrTempData.slice(0, iOffset);
    var csLog = "uchArrTempData len[";
    csLog += util.format("%d", iOffset);
    csLog += "]=";
    csLog += util.format("%s", CUtils.Bytes2String(uchArrTempData.slice(0, iOffset)));
    var iLenGUID = (this.dbAccessor.m_sParamData.m_uchArrGUID).length;
    if (iLenGUID <= 16) {
        uchArrKey.set(CUtils.String2Bytes(this.dbAccessor.m_sParamData.m_uchArrGUID.slice(0, iLenGUID)), 0);
    }
    else {
        uchArrKey.set(CUtils.String2Bytes(this.dbAccessor.m_sParamData.m_uchArrGUID.slice(0, 16)), 0);
    }
    var csLog = "uchArrKey = ";
    csLog += util.format("%s", CUtils.Bytes2String(uchArrKey));
    var bArrAuthToken = new Int8Array(24);
    bArrAuthToken.set(CCryptoHandler.TripleDesEncrypt(uchArrTempData.slice(0, iOffset), uchArrKey, '0'), 0);
    return bArrAuthToken;
}
CISOMsg.prototype.vFnSetPEDHardwareSerialNumer = function () {
    var chArrHarwareSerialNumber = new Int8Array(50);
    var buffer = new Uint8Array(50);
    var newbuffer = new Uint8Array(50);;
    var iLocalOffset = 0x00;
    var iLenHardwareSerialNum = (this.dbAccessor.m_sParamData.PED_HwSerialNumber).length;
    chArrHarwareSerialNumber.set(CUtils.String2Bytes(this.dbAccessor.m_sParamData.PED_HwSerialNumber), iLocalOffset);
    if (iLenHardwareSerialNum > Consts.MAX_LEN_HARDWARE_SERIAL_NUMBER) {
        iLenHardwareSerialNum = Consts.MAX_LEN_HARDWARE_SERIAL_NUMBER;
    }
    buffer = chArrHarwareSerialNumber;
    iLocalOffset += iLenHardwareSerialNum;
    this.addLLLCHARData(IsoConst.ISO_FIELD_49, buffer, iLocalOffset);
}
CISOMsg.prototype.vFnSetHardwareSerialNumer = function (chArrHarwareSerialNumber, iLenHardwareSerialNum) {
    chArrHarwareSerialNumber = chArrHarwareSerialNumber.slice(0, iLenHardwareSerialNum);
    this.m_chArrHardwareSerialNumber = chArrHarwareSerialNumber;
}
CISOMsg.prototype.CISOMsgD = function () {
    for (var i = 0; i < Consts.ISO_LEN; i++)
        if (this.len[i] > 0) {
            this.len[i] = -1;
            if (this.data[i]) {
                this.data[i] = null;
            }
            this.len[i] = 0;
            this.bitmap[i] = false;
            this.encryptedFieldBitmap[i] = false;
        }
}
CISOMsg.prototype.unPackHostDirect = function (bArrSource) {
    this.CISOMsgC(this.m_chTerminalID, this.m_chTerminalID.length, "0660");
    var iHeaderLength = 7;
    var iOffset = 0;
    iOffset += iHeaderLength;
    var iMsgNoLength = 2;
    var bArrMsgNumber = bArrSource.slice(iOffset, iOffset + 2);
    iOffset += 2;
    this.msgno = CUtils.Bytes2String(CUtils.bcd2a(bArrMsgNumber, iMsgNoLength));
    var iLengthBeforeBitmap = iHeaderLength + iMsgNoLength;
    iOffset += parseInt(Consts.ISO_LEN / 8);
    var iFieldLength = 0;
    var bIsBCD = true;
    var totalLength = 2 + Consts.ISO_LEN / 8;
    for (var i = 0; i < Consts.ISO_LEN; i++) {
        if (bArrSource[iLengthBeforeBitmap + parseInt(i / 8)] & (0x80 >> parseInt(i % 8))) {
            bIsBCD = true;
            iFieldLength = 0;
            this.bitmap[i] = true;
            switch (i + 1) {
                case 2:
                    iFieldLength = 4; break;
                case 3:
                    iFieldLength = 3; break;
                case 4:
                case 5:
                    iFieldLength = 8; break;
                case 6:
                    iFieldLength = 1; break;
                case 7:
                    iFieldLength = 1; bIsBCD = false; break;
                case 11:
                    iFieldLength = 2; break;
                case 12:
                    iFieldLength = 6; break;
                case 20:
                    iFieldLength = 1; break;
                case 21:
                    iFieldLength = 1; break;
                case 22:
                    iFieldLength = 5; break;
                case 24:
                    iFieldLength = 2; break;
                case 25:
                    iFieldLength = 2; break;
                case 26:
                    iFieldLength = 3; break;
                case 27:
                    iFieldLength = 1; break;
                case 37:
                    iFieldLength = 2; break;
                case 38:
                    iFieldLength = 6; bIsBCD = false; break;
                case 39:
                    iFieldLength = 2; break;
                case 40:
                    iFieldLength = 2; break;
                case 41:
                    iFieldLength = 5; break;
                case 42:
                    iFieldLength = 5; break;
                case 43:
                    iFieldLength = 6; break;
                case 44:
                    iFieldLength = 6;
                    bIsBCD = false;
                    break;
                case 45:
                    iFieldLength = 3; break;
                case 47:
                case 48:
                case 49:
                case 50:
                case 51:
                case 52:
                case 53:
                case 54:
                case 55:
                case 56:
                case 57:
                case 58:
                case 59:
                case 60:
                case 61:
                case 62:
                case 63:
                    iFieldLength = ((((bArrSource[iOffset]) >> 4) & 0x0F) * 1000) + (((bArrSource[iOffset]) & 0x0F) * 100);
                    iFieldLength += ((((bArrSource[iOffset + 1]) >> 4) & 0x0F) * 10) + ((bArrSource[iOffset + 1]) & 0x0F);
                    iOffset += 2;
                    totalLength += 2;
                    bIsBCD = false;
                    break;
                case 64:
                    iFieldLength = 8;
                    bIsBCD = false;
                    break;
            }
            if (bIsBCD) {
                this.data[i] = CUtils.bcd2a(bArrSource.slice(iOffset, iOffset + iFieldLength), iFieldLength);
                iOffset += iFieldLength;
                this.len[i] = 2 * iFieldLength;
            }
            else {
                this.data[i] = bArrSource.slice(iOffset, iOffset + iFieldLength);
                iOffset += iFieldLength;
                this.len[i] = iFieldLength;
            }
            totalLength += iFieldLength;
        }
    }
    if (this.bitmap[58 - 1]) {
        this.DisplayFeild58();
    }
    if (this.bitmap[64 - 1]) {
        var bArrCRCInput = bArrSource.slice(iHeaderLength, totalLength - 8);
        var longCRC = crc.crc32(bArrCRCInput);
        var strCRCOut = longCRC.toString(16);
        strCRCOut = CUtils.StrLeftPad(strCRCOut, 8, '0');
        if (strCRCOut == this.data[64 - 1].slice(0, 8).toString()) {
            return true;
        }
        else {
            return true;
        }
    }
    else {
        return true;
    }
}
CISOMsg.prototype.IsOK = function () {
    if (this.bitmap[39 - 1]) {
        if (CUtils.Bytes2String(this.data[39 - 1].slice(0, 4)) == Consts.AC_SUCCESS)
            return true;
        else
            return false;
    }
    return true;
}
CISOMsg.prototype.DisplayFeild58 = function () {
    if (this.bitmap[58 - 1] == true) {
        if (this.len[58 - 1] > 0) {
            var iDisplayLen = this.len[58 - 1];
            var p = this.data[58 - 1];
            var iOffset = 0x00;
            // CString csTemp;
            // csTemp.Format("DisplayLen = %d ",iDisplayLen);
            var iDispArrOffset = 0x00;
            do {
                var uchAction = p[iOffset++];
                //csTemp.Format("uchAction = %d ",uchAction);
                if (uchAction == 0x02) {
                    var iLocalDataLen = 0x00;
                    iLocalDataLen = (p[iOffset++] & 0x000000FF) & (255);
                    iLocalDataLen <<= 8;
                    iLocalDataLen |= (p[iOffset++] & 0x000000FF) & (255);
                    //csTemp.Format("iLocalDataLen = %d ",iLocalDataLen);
                    this.dbAccessor.m_csResponseMssg += CUtils.Bytes2String(p.slice(iOffset, iOffset + iLocalDataLen));
                    if(this.dbAccessor.m_csResponseMssg==" ")
                    {
                        this.dbAccessor.m_csResponseMssg="";
                    }
                    //csTemp.Format("uchAction == 0x02 ::chArrDisplayMessage = %s ",chArrDisplayMessage);
                    iDispArrOffset += iLocalDataLen;
                    iOffset += iLocalDataLen;
                } else if (uchAction == 0x05) {
                    //TODO define messages offline in file with corresponding message ID .
                    //We are getting message ID from Host in 4 bytes. 
                    //We will do if there will be need.
                    //Message defination is not there in previous tool.
                } else {
                    break;
                }
            } while (iOffset < iDisplayLen);
        }
    } else {
    }
}
module.exports = CISOMsg;