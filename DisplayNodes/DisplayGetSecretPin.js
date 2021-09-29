var CBaseNode = require("../Classes/BaseNode").CBaseNode;
var RetVal = require("../Constants/RetVal");
var ExecutionResult = require("../Constants/ExecutionResult");
var Consts = require("../Constants/AppConsts");
var Utils = require("../Classes/Utils");
var CUtils = new Utils();
var CHSMInterface = require("../Classes/HSMInterface");
var UIHandler=require("../core/classes/UIHandler");
var CUIHandler=new UIHandler().getInstance();
var SocketEvents=require("../core/Constants/SocketEvents");
class CDisplayGetSecretPin extends CBaseNode {
    constructor(DBAccessor) {
        super(DBAccessor);
        this.InputType;
        this.MaxLen;
        this.MinLen;
        this.m_bAlgoType;
        this.m_iKeySlot;
        this.DisplayMessage;
        this.SessionKey;
        this.PAN;
        this.m_sKeySlot;
    }
}
CDisplayGetSecretPin.prototype.AddPrivateParameters = function (tagAttribute) {
    this.SessionKey = tagAttribute.SessionKey;
    if (this.SessionKey.length == 16) {
        this.m_bAlgoType = Consts.TLV_TYPE_KDES;
    }
    if (this.SessionKey.length == 32) {
        this.m_bAlgoType = Consts.TLV_TYPE_KTDES;
    }
    this.m_iKeySlot = tagAttribute.iKeySlot;
    this.DisplayMessage = tagAttribute.DisplayMessage;
    return RetVal.RET_OK;
}
CDisplayGetSecretPin.prototype.execute =async function () {
    const iLenInBuffer = 16;
    CUIHandler.socket.emit(SocketEvents.MiniPVMSecretPinEvent);
   // const csPIN = "1234";
   const csPIN =await CUIHandler.GetMiniPVMUIEnteredData();
    const iPINLength = csPIN.length;
    var chArrModifiedPAN = new Int8Array(iLenInBuffer);
    var chArrModifiedPIN = new Int8Array(iLenInBuffer);
    var chXorPINBlock = new Int8Array(iLenInBuffer);
    //Copying modified PAN
    chArrModifiedPAN.set(this.m_pDBAccessor.m_chArrPAN.slice(3, 15), 4);
    //Making Modified PIN packet
    var iOffset = 0;
    chArrModifiedPIN[0] = (iPINLength >> 8) & 0x000000FF;
    chArrModifiedPIN[1] = (iPINLength) & 0x000000FF;
    iOffset += 2;
    chArrModifiedPIN.set(CUtils.String2Bytes(csPIN), iOffset);
    iOffset += iPINLength;
    chArrModifiedPIN.fill("F".charCodeAt(0), iOffset, iLenInBuffer);
    //XOR Modified PAN and Modified PIN to get PIN Block
    for (var i = 0; i < iLenInBuffer; i++) {
        chXorPINBlock[i] = chArrModifiedPAN[i] ^ chArrModifiedPIN[i];
    }
    var chArrDateTime = CUtils.SetCurrentDateTime();
    var objCHSMInterface = new CHSMInterface(11234, 1, 1, 180000, this.m_pDBAccessor.m_sParamData.PED_HwSerialNumber, "12345", chArrDateTime,
        "192.168.100.176", 8089);
    var iLength = 0;
    //objCHSMInterface.iGetEncryptedPin(ID_KEYSLOTPIN, cs_PINBlock.GetBuffer(),cs_PINBlock.GetLength(),chArrEncrptedPIN,&iLength);
    var Consts = require("../Constants/AppConsts");
    var chArrEncrptedPIN = new Int8Array(16);
    chArrEncrptedPIN.set(objCHSMInterface.iGetEncryptedPin(Consts.ID_KEYSLOTPIN, chXorPINBlock), 0);
    iLength = chArrEncrptedPIN.length;
    this.AddTLVDataWithTag(this.m_dwHostTlvtag, chArrEncrptedPIN, iLength);
    return ExecutionResult._OK;
}
CDisplayGetSecretPin.prototype.GetPAN = function () {
}
module.exports = CDisplayGetSecretPin;