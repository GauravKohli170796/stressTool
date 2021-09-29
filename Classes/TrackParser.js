var Utils = require("./Utils");
var CUtils = new Utils();
var CryptoHandlers = require("./CryptoHandler");
var EnPadStyle = require("../Constants/EnPadStyle");
var Consts = require("../Constants/AppConsts");
var CryptoHandler = new CryptoHandlers();
class CTrackParser {
	constructor(chPadChar, iPadStyle, objHSMInterface) {
		this.m_chPadChar = chPadChar;
		this.m_iPadStyle = iPadStyle;
		this.m_chArrTrack1 = new Int8Array(250);
		this.m_chArrTrack2 = new Int8Array(128);
		this.m_chArrPAN = new Int8Array(50);
		this.m_chArrMaskedPAN = new Int8Array(50);
		this.m_chArrExpiry = new Int8Array(10);
		this.m_chArrServiceCode = new Int8Array(5);
		this.m_chArrCardHolder = new Int8Array(100);
		this.m_iEncrytpionSlotId = Consts._INVALID_SLOT_ID;
		this.objEncryption = objHSMInterface;
	}
}
CTrackParser.prototype.ParseTrack1 = function (chArrTrack1, iTrack1len) {
	var chArrtmpTrack1 = new Int8Array(250);
	chArrtmpTrack1 = chArrTrack1;
	this.m_chArrTrack1 = chArrTrack1;
	var strpart = "";
	var x = CUtils.Bytes2String(chArrtmpTrack1);
	strpart = CUtils.Bytes2String(chArrtmpTrack1).split("^");
	if (strpart == "")
		return false;
	this.m_chArrCardHolder.fill(0x00);
	this.m_chArrCardHolder = CUtils.String2Bytes(strpart[1]);
	return true;
}
CTrackParser.prototype.ParseTrack2 = function (chArrTrack2, iTrack2Len) {
	var tmpTrack2;
	if (';'.charCodeAt(0) == chArrTrack2[0]) {
		this.m_chArrTrack2 = chArrTrack2.slice(1, iTrack2Len - 1);
		tmpTrack2 = chArrTrack2.slice(1, iTrack2Len - 1);
	} else {
		this.m_chArrTrack2.set(chArrTrack2, 0);
		tmpTrack2 = chArrTrack2.slice(1, iTrack2Len - 1);
	}
	var strpart = "";
	//Get Pan
	strpart = CUtils.Bytes2String(tmpTrack2).split("=");
	this.m_chArrPAN = CUtils.String2Bytes(strpart[0]);
	var iPANlen = this.m_chArrPAN.length;
	this.m_chArrMaskedPAN = this.m_chArrPAN;
	//this.m_chArrMaskedPAN.set(CUtils.String2Bytes("************************").slice(0, iPANlen - 10), 6);//need to change this line
	  this.m_chArrMaskedPAN.fill("*".charCodeAt(0),6,(6+iPANlen-10));
	//Get Rest of Track 2
	this.m_chArrPAN = CUtils.String2Bytes(strpart[0]);
	var tmpRemainingTrack2 = CUtils.String2Bytes(strpart[1]);
	var iOffset = 0;
	//Get Expiry
	this.m_chArrExpiry = tmpRemainingTrack2.slice(iOffset, iOffset + 4);
	iOffset += 4;
	//Get Service Code
	this.m_chArrServiceCode = tmpRemainingTrack2.slice(iOffset, iOffset + 3);
	iOffset += 3;
	return true;
}
CTrackParser.prototype.GetCardHolderName = function () {
	if (this.m_chArrCardHolder.length > 1) {
		return (this.m_chArrCardHolder);
	} else {
		return null;
	}
}
CTrackParser.prototype.GetExpiryDate = function () {
	if (this.m_chArrExpiry.length > 1) {
		return (this.m_chArrExpiry);
	} else {
		return null;
	}
}
CTrackParser.prototype.GetServiceCode = function () {
	if (this.m_chArrServiceCode.length > 1) {
		return (this.m_chArrServiceCode);
	} else {
		return null;
	}
}
CTrackParser.prototype.GetPAN = function () {
	if (this.m_chArrPAN.length > 1) {
		return (this.m_chArrPAN);
	} else {
		return null;
	}
}
CTrackParser.prototype.GetMaskedPAN = function () {
	if (this.m_chArrMaskedPAN.length > 1) {
		return (this.m_chArrMaskedPAN);
	} else {
		return null;
	}
}
CTrackParser.prototype.GetPANSHA1 = function () {
	if (this.m_chArrPAN.length > 1) {
		var bArrPAN = new Uint8Array(this.m_chArrPAN.length);
		bArrPAN.set(this.m_chArrPAN, 0);
		var x = CryptoHandler.GetSHA1(Buffer.from(bArrPAN));
		return (CUtils.a2bcd(x));
	} else {
		return null;
	}
}
CTrackParser.prototype.GetBankTLEEncryptedTrack1 = function () {
	var uchArrTrack1 = new Uint8Array(250);
	var iTrackLen = this.m_chArrTrack1.length;
	var iPadOffset = 0;
	var iOffset = 0x00;
	var modulus = iTrackLen % 8;
	if (modulus > 0) {
		iPadOffset = 8 - modulus;
	}
	if (EnPadStyle._LEFT_PAD == this.m_iPadStyle) {
		uchArrTrack1.fill(this.m_chPadChar.charCodeAt(0), 0, 7);
		uchArrTrack1.set(this.m_chArrTrack1, iPadOffset);
	} else {
		uchArrTrack1.set(this.m_chArrTrack1, 0);
		uchArrTrack1.fill(this.m_chPadChar.charCodeAt(0), iTrackLen, iTrackLen + iPadOffset);
	}
	//Get Encryption Slot ID
	if (Consts._INVALID_SLOT_ID == this.m_iEncrytpionSlotId) {
		var chArrPanFirst6 = this.m_chArrPAN.slice(0, 6);
		var ulPAN = parseInt(CUtils.Bytes2String(chArrPanFirst6), 10);
		//Get Slot ID
		this.m_iEncrytpionSlotId = Consts.DEFAULT_BIN_KEYSLOTID;
	}
	var uchArrTLETrack1 = new Uint8Array(Consts.MAX_TRACK1_LEN);
	//TLE ENCRYPTION TRUE
	uchArrTLETrack1[iOffset++] = true & 0x000000FF;
	//Add Slot ID
	uchArrTLETrack1[iOffset++] = this.m_iEncrytpionSlotId & 0x000000FF;
	//Add Pad Char
	uchArrTLETrack1[iOffset++] = (this.m_chPadChar.charCodeAt(0)) & 0x000000FF;
	//Add Pad Style
	uchArrTLETrack1[iOffset++] = this.m_iPadStyle & 0x000000FF;
	var bArrOutput = this.objEncryption.iFormatAndECBEncrypt(uchArrTrack1, iTrackLen + iPadOffset, this.m_chPadChar, this.m_iPadStyle, this.m_iEncrytpionSlotId);
	if (bArrOutput) {
		uchArrTLETrack1.set(bArrOutput, iOffset);
		iOffset += bArrOutput.length;
		uchArrTLETrack1 = uchArrTLETrack1.slice(0, iOffset);
		return uchArrTLETrack1;
	}
	return null;
}
CTrackParser.prototype.GetBankTLEEncryptedTrack2 = function () {
	var uchArrTrack2 = new Uint8Array(250);
	var iTrackLen = this.m_chArrTrack2.length;
	var iPadOffset = 0;
	var iOffset = 0x00;
	var modulus = iTrackLen % 8;
	if (modulus > 0) {
		iPadOffset = 8 - modulus;
	}
	if (EnPadStyle._LEFT_PAD == this.m_iPadStyle) {
		uchArrTrack2.fill(this.m_chPadChar.charCodeAt(0), 0, 7);
		uchArrTrack2.set(this.m_chArrTrack2, iPadOffset);
	} else {
		uchArrTrack2.set(this.m_chArrTrack2, 0);
		uchArrTrack2.fill(this.m_chPadChar.charCodeAt(0), iTrackLen, iTrackLen + iPadOffset);
	}
	//Get Encryption Slot ID
	if (Consts._INVALID_SLOT_ID == this.m_iEncrytpionSlotId) {
		var chArrPanFirst6 = this.m_chArrPAN.slice(0, 6);
		var ulPAN = parseInt(CUtils.Bytes2String(chArrPanFirst6), 10);
		//Get Slot ID
		this.m_iEncrytpionSlotId = Consts.DEFAULT_BIN_KEYSLOTID;
	}
	var uchArrTLETrack2 = new Uint8Array(Consts.MAX_TRACK1_LEN);
	//TLE ENCRYPTION TRUE
	uchArrTLETrack2[iOffset++] = true & 0x000000FF;
	//Add Slot ID
	uchArrTLETrack2[iOffset++] = this.m_iEncrytpionSlotId & 0x000000FF;
	//Add Pad Char
	uchArrTLETrack2[iOffset++] = this.m_chPadChar.charCodeAt(0) & 0x000000FF;
	//Add Pad Style
	uchArrTLETrack2[iOffset++] = this.m_iPadStyle & 0x000000FF;
	var bArrOutput = this.objEncryption.iFormatAndECBEncrypt(uchArrTrack2, iTrackLen + iPadOffset, this.m_chPadChar, this.m_iPadStyle, this.m_iEncrytpionSlotId);
	if (bArrOutput) {
		uchArrTLETrack2.set(bArrOutput, iOffset);
		iOffset += bArrOutput.length;
		uchArrTLETrack2 = uchArrTLETrack2.slice(0, iOffset);
		return uchArrTLETrack2;
	}
	return null;
}
CTrackParser.prototype.GetBankTLEEncryptedPAN = function () {
	var uchArrPAN = new Uint8Array(50);
	var iPanLen = this.m_chArrPAN.length;
	var iPadOffset = 0;
	var iOffset = 0x00;
	var modulus = iPanLen % 8;
	if (modulus > 0) {
		iPadOffset = 8 - modulus;
	}
	if (EnPadStyle._LEFT_PAD == this.m_iPadStyle) {
		uchArrPAN.fill(this.m_chPadChar.charCodeAt(0), 0, 7);
		uchArrPAN.set(this.m_chArrPAN, iPadOffset);
	} else {
		uchArrPAN.set(this.m_chArrPAN, 0);
		uchArrPAN.fill(this.m_chPadChar.charCodeAt(0), iPanLen, iPanLen + iPadOffset);
	}
	//Get Encryption Slot ID
	if (Consts._INVALID_SLOT_ID == this.m_iEncrytpionSlotId) {
		var chArrPanFirst6 = this.m_chArrPAN.slice(0, 6);
		var ulPAN = parseInt(CUtils.Bytes2String(chArrPanFirst6), 10);
		//Get Slot ID
		this.m_iEncrytpionSlotId = Consts.DEFAULT_BIN_KEYSLOTID;
	}
	var uchArrTLEPAN = new Uint8Array(Consts.MAX_TRACK1_LEN);
	//TLE ENCRYPTION TRUE
	uchArrTLEPAN[iOffset++] = true & 0x000000FF;
	//Add Slot ID
	uchArrTLEPAN[iOffset++] = this.m_iEncrytpionSlotId & 0x000000FF;
	//Add Pad Char
	uchArrTLEPAN[iOffset++] = this.m_chPadChar.charCodeAt(0) & 0x000000FF;
	//Add Pad Style
	uchArrTLEPAN[iOffset++] = this.m_iPadStyle & 0x000000FF;
	var bArrOutput = this.objEncryption.iFormatAndECBEncrypt(uchArrPAN, iPanLen + iPadOffset, this.m_chPadChar, this.m_iPadStyle, this.m_iEncrytpionSlotId);
	if (bArrOutput) {
		uchArrTLEPAN.set(bArrOutput, iOffset);
		iOffset += bArrOutput.length;
		uchArrTLEPAN = uchArrTLEPAN.slice(0, iOffset);
		return uchArrTLEPAN;
	}
	return null;
}
module.exports = CTrackParser;
