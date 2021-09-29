var Structs = require("../CommonStructures/StructClasses");
var Utils = require("./Utils");
var CISOMsg = require("./ISOMsg");
var CUtils = new Utils();
var Consts = require("../Constants/AppConsts");
var ISO320HostCommChangeNumberConsts = require("../Constants/ISO320HostCommChangeNumberConsts");
var ISO320HostUploadChangeNumberConsts = require("../Constants/ISO320HostUploadChangeNumberConsts");
var ISO320PKExchangeChangeNumberConsts = require("../Constants/ISO320PKExchangeChangeConsts");
var IsoFieldsConsts = require("../Constants/IsoFieldsConsts");
var PTMKRequestTypeConsts = require("../Constants/PTMKRequestTypeConsts");
//var CUIHandler=require("../app");//Added For response of html
var UIHandler=require("../core/classes/UIHandler");
var CUIHandler=new UIHandler().getInstance();
class CISO320HostComm extends CISOMsg {
	constructor(dbAccessor, hsmInterface) {
		super(dbAccessor)
		this.m_iChangeNumber;
		this.m_bCurrentPacketCount;
		this.m_bTotalPacketCount;
		this.m_chDownloadingEMVparVersion = new Int8Array(12);
		this.m_chDownloadingPSKVersion = new Int8Array(12);
		this.m_uchMessage = new Int8Array(Consts.MAX_MESSAGE_LEN);
		this.m_imessageOffset;
		this.m_ulDownloadingPvmVersion;
		this.m_chTempImagefileName = new Int8Array(15);
		this.m_chTempImageDwnFile = new Int8Array(15);
		this.m_chTempImageChunkFile = new Int8Array(15);
		this.m_chArrBuffer = new Int8Array(2000);
		this.m_iOffsetBuffer;
		this.m_iHostUploadPacketNumber;
		this.m_iPKExchangePacketNumber;
		this.m_ulTotalMessagesReceived;
		this.m_ulCountOfMessageId;
		this.m_ulArrMessageId = new BigUint64Array(Consts.MAX_COUNT_MESSAGES);
		this.m_ulArrChargeSlipIdAdd;
		this.m_ulArrChargeSlipIdDelete;
		this.m_ulCountOfChargeSlipIdAdd;
		this.m_ulCountOfChargeSlipIdDelete;
		this.m_ulTotalChargeSlipTemplateAdded;
		this.m_ulArrImageIdAdd;
		this.m_ulArrImageIdDelete;
		this.m_ulCountOfImageIdAdd;
		this.m_ulCountOfImageIdDelete;
		this.m_ulTotalImagesAdded;
		this.m_ulArrMessageIdAdd;
		this.m_ulArrMessageIdDelete;
		this.m_ulCountOfMessageIdAdd;
		this.m_ulCountOfMessageIdDelete;
		this.m_ulTotalMessagesAdded;
		this.m_ulTotalMessagesReceived;
		this.m_ulLastParameterId;
		this.m_ObjArrParameterData = new Structs.ParameterData();
		this.m_ulParameterIterator;
		this.m_mapParamInfo = new Map();
		this.m_ulBinRangeIterator;
		this.m_lastPVMDwndInfo = new Structs.CurrentDownloadingInfo();
		this.m_lastImageDwndInfo = new Structs.CurrentDownloadingInfo();
		this.m_lastEMVDwndInfo = new Structs.CurrentDownloadingInfo();
		this.m_objHSMInterface = hsmInterface;
	}
}
CISO320HostComm.prototype.Start = function () {
	this.m_iChangeNumber = ISO320HostCommChangeNumberConsts.HOST_BATCH_ID;
	this.m_iHostUploadPacketNumber = ISO320HostUploadChangeNumberConsts.SERIAL_UPLOAD_PACKET;
	this.m_bCurrentPacketCount = 0x00;
	this.m_bTotalPacketCount = 0x00;
	this.m_iPKExchangePacketNumber = ISO320PKExchangeChangeNumberConsts.START_SESSION;
	this.m_imessageOffset = 0;
	this.m_ulArrChargeSlipIdAdd = new Uint32Array(Consts.MAX_COUNT_CHARGE_SLIP_IMAGES);
	this.m_ulArrChargeSlipIdDelete = new Uint32Array(Consts.MAX_COUNT_CHARGE_SLIP_IMAGES);
	this.m_ulArrImageIdAdd = new Uint32Array(Consts.MAX_COUNT_CHARGE_SLIP_IMAGES);
	this.m_ulArrImageIdDelete = new Uint32Array(Consts.MAX_COUNT_CHARGE_SLIP_IMAGES);
	this.m_ulArrMessageIdAdd = new Uint32Array(Consts.MAX_COUNT_MESSAGES);
	this.m_ulArrMessageIdDelete = new Uint32Array(Consts.MAX_COUNT_MESSAGES);
	this.m_ObjArrParameterData = CUtils.ArrayofObject(Consts.MAX_COUNT_PARAMETERS, Structs.ParameterData);
	this.m_ulCountOfChargeSlipIdAdd = 0x00;
	this.m_ulCountOfChargeSlipIdDelete = 0x00;
	this.m_ulTotalChargeSlipTemplateAdded = 0x00;
	this.m_ulCountOfImageIdAdd = 0x00;
	this.m_ulCountOfImageIdDelete = 0x00;
	this.m_ulTotalImagesAdded = 0x00;
	this.m_ulCountOfMessageIdAdd = 0x00;
	this.m_ulCountOfMessageIdDelete = 0x00;
	this.m_ulTotalMessagesAdded = 0x00;
	this.m_ulParameterIterator = 0x00;
	this.m_ulLastParameterId = 0x00;
	this.m_ulDownloadingPvmVersion = 0;
	this.m_ulBinRangeIterator = 0x00;
	this.m_iHostID = 1;
}
CISO320HostComm.prototype.CISO320C = function (chTerminalId, iTerminalIdLen, chNII) {
	this.CISOMsgC(chTerminalId, iTerminalIdLen, chNII);
	this.vFnSetTerminalActivationFlag(false);
}
CISO320HostComm.prototype.packIt = async function (bArrsendData) {
	this.vFnSetTerminalActivationFlag(false);
	this.msgno = Consts.DOWNDATAREQ;
	var csDisplayMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "]";
	csDisplayMessage += " ISO Packet 320 ";
	switch (this.m_iChangeNumber) {
		case ISO320HostCommChangeNumberConsts.HOST_PVM_DOWNLOAD:
			csDisplayMessage += "HOST_PVM_DOWNLOAD Sending";
			CUIHandler.log(csDisplayMessage);
			this.addField(IsoFieldsConsts.ISO_FIELD_3, Consts.PC_PVM_DLD_START, true);
			break;
		case ISO320HostCommChangeNumberConsts.HOST_CHARGESLIP_ID_DOWNLOAD:
			csDisplayMessage += "HOST_CHARGESLIP_ID_DOWNLOAD Sending";
			CUIHandler.log(csDisplayMessage);
			this.addField(IsoFieldsConsts.ISO_FIELD_3, Consts.PC_CHARGE_SLIP_ID_DLD_START, true);
			break;
		case ISO320HostCommChangeNumberConsts.HOST_CHARGESLIP_DOWNLOAD:
			csDisplayMessage += "HOST_CHARGESLIP_DOWNLOAD Sending";
			CUIHandler.log(csDisplayMessage);
			this.addField(IsoFieldsConsts.ISO_FIELD_3, Consts.PC_CHARGE_SLIP_DLD_START, true);
			break;
		case ISO320HostCommChangeNumberConsts.HOST_IMAGE_ID_DOWNLOAD:
			csDisplayMessage += "HOST_IMAGE_ID_DOWNLOAD Sending";
			CUIHandler.log(csDisplayMessage);
			this.addField(IsoFieldsConsts.ISO_FIELD_3, Consts.PC_IMAGE_ID_DOWNLOAD_START, true);
			break;
		case ISO320HostCommChangeNumberConsts.HOST_IMAGE_DOWNLOAD:
			csDisplayMessage += "HOST_IMAGE_DOWNLOAD Sending";
			CUIHandler.log(csDisplayMessage);
			this.addField(IsoFieldsConsts.ISO_FIELD_3, Consts.PC_IMAGE_DOWNLOAD_START, true);
			break;
		case ISO320HostCommChangeNumberConsts.HOST_BATCH_ID:
			csDisplayMessage += "HOST_BATCH_ID Sending";
			CUIHandler.log(csDisplayMessage);
			this.addField(IsoFieldsConsts.ISO_FIELD_3, Consts.PC_BATCH_ID, true);
			break;
		case ISO320HostCommChangeNumberConsts.HOST_CLOCK_SYNC:
			csDisplayMessage += "HOST_CLOCK_SYNC Sending";
			CUIHandler.log(csDisplayMessage);
			this.addField(IsoFieldsConsts.ISO_FIELD_3, Consts.PC_CLOCK_SYNC_START, true);
			break;
		case ISO320HostCommChangeNumberConsts.HOST_MESSAGE_ID_LIST_DOWNLOAD:
			csDisplayMessage += "HOST_MESSAGE_ID_LIST_DOWNLOAD Sending";
			CUIHandler.log(csDisplayMessage);
			this.addField(IsoFieldsConsts.ISO_FIELD_3, Consts.PC_MESSAGE_ID_LIST_DLD_START, true);
			break;
		case ISO320HostCommChangeNumberConsts.HOST_MESSAGE_DOWNLOAD:
			csDisplayMessage += "HOST_MESSAGE_DOWNLOAD Sending";
			CUIHandler.log(csDisplayMessage);
			this.addField(IsoFieldsConsts.ISO_FIELD_3, Consts.PC_MESSAGE_DLD_START, true);
			break;
		case ISO320HostCommChangeNumberConsts.HOST_PARAMETERS_DOWNLOAD:
			csDisplayMessage += "HOST_PARAMETERS_DOWNLOAD Sending";
			CUIHandler.log(csDisplayMessage);
			this.addField(IsoFieldsConsts.ISO_FIELD_3, Consts.PC_PARAMETER_START, true);
			break;
		case ISO320HostCommChangeNumberConsts.EMV_PAR_DWONLOAD:
			csDisplayMessage += "EMV_PAR_DWONLOAD Sending";
			CUIHandler.log(csDisplayMessage);
			this.addField(IsoFieldsConsts.ISO_FIELD_3, Consts.PC_EMV_PARAM_START, true);
			break;
		case ISO320HostCommChangeNumberConsts.HUB_PARM_UPLOAD:
			csDisplayMessage += "HUB_PARM_UPLOAD Sending";
			CUIHandler.log(csDisplayMessage);
			this.addField(IsoFieldsConsts.ISO_FIELD_3, Consts.PC_PARAMETER_UPLOAD_START, true);
			break;
		case ISO320HostCommChangeNumberConsts.HUB_PARM_DOWNLOAD:
			csDisplayMessage += "HUB_PARM_DOWNLOAD Sending";
			CUIHandler.log(csDisplayMessage);
			this.addField(IsoFieldsConsts.ISO_FIELD_3, Consts.PC_PARAMETER_DOWNLOAD_START, true);
			break;
		case ISO320HostCommChangeNumberConsts.HUB_GET_PINE_SESSION_KEY:
			csDisplayMessage += "HUB_GET_PINE_SESSION_KEY Sending";
			CUIHandler.log(csDisplayMessage);
			this.addField(IsoFieldsConsts.ISO_FIELD_3, Consts.PC_PARAMETER_GETPSK_START, true);
			break;
		case ISO320HostCommChangeNumberConsts.HUB_GET_BIN_RANGE:
			csDisplayMessage += "HUB_GET_BIN_RANGE Sending";
			CUIHandler.log(csDisplayMessage);
			this.addField(IsoFieldsConsts.ISO_FIELD_3, Consts.PC_PARAMETER_GETBINRANGE_START, true);
			break;
		case ISO320HostCommChangeNumberConsts.HUB_GET_CACRT:
			csDisplayMessage += "HUB_GET_CACRT Sending";
			CUIHandler.log(csDisplayMessage);
			this.addField(IsoFieldsConsts.ISO_FIELD_3, Consts.PC_PARAMETER_GETCACRT_START, true);
			break;
		case ISO320HostCommChangeNumberConsts.HUB_PINEKEY_EXCHANGE:
			csDisplayMessage += "HUB_PINEKEY_EXCHANGE Sending";
			CUIHandler.log(csDisplayMessage);
			this.addField(IsoFieldsConsts.ISO_FIELD_3, Consts.PC_PARAMETER_PINEKEY_EXCHANGE_START, true);
			break;
		default:
			break;
	}
	if (this.m_iChangeNumber == ISO320HostCommChangeNumberConsts.HOST_PVM_DOWNLOAD) {
		this.SetPVMDownLoadVersion();
	}
	if ((this.m_iChangeNumber == ISO320HostCommChangeNumberConsts.HOST_CHARGESLIP_DOWNLOAD) ||
		(this.m_iChangeNumber == ISO320HostCommChangeNumberConsts.HOST_IMAGE_DOWNLOAD) ||
		(this.m_iChangeNumber == ISO320HostCommChangeNumberConsts.HOST_MESSAGE_DOWNLOAD)) {
		var bArrImageOrChargeSlipRequestBuffer = new Uint8Array(11);
		var iLocalOffset = 0x00;
		var ulVal = 0x00;
		if (this.m_iChangeNumber == ISO320HostCommChangeNumberConsts.HOST_CHARGESLIP_DOWNLOAD) {
			ulVal = this.m_ulArrChargeSlipIdAdd[this.m_ulTotalChargeSlipTemplateAdded];
		}
		else if (this.m_iChangeNumber == ISO320HostCommChangeNumberConsts.HOST_IMAGE_DOWNLOAD) {
			ulVal = this.m_ulArrImageIdAdd[this.m_ulTotalImagesAdded];
			ulVal = 54678;
			this.SetImageDownLoadData(ulVal);
		}
		else if (this.m_iChangeNumber == ISO320HostCommChangeNumberConsts.HOST_MESSAGE_DOWNLOAD) {
			ulVal = this.m_ulArrMessageIdAdd[this.m_ulTotalMessagesAdded];
		}
		if (ulVal) {
			var bArrTemp = new Uint8Array(11);
			bArrImageOrChargeSlipRequestBuffer.set(CUtils.String2Bytes(CUtils.StrLeftPad(ulVal.toString(), 8, '0')), 0);
			iLocalOffset += 8;
			bArrTemp = CUtils.a2bcd(CUtils.Bytes2String(bArrImageOrChargeSlipRequestBuffer).slice(0, iLocalOffset));
			this.addLLLCHARData(IsoFieldsConsts.ISO_FIELD_61, bArrTemp, iLocalOffset / 2);
		}
	}
	if (this.m_bCurrentPacketCount > 0) {
		var bArrbuffer = new Uint8Array(5);
		var iLocalOffset = 0x00;
		bPacketCount = (CUtils.String2Bytes(this.m_bCurrentPacketCount.toString()))[0];
		bArrbuffer.set(bPacketCount, iLocalOffset++);
		bPacketCount = (CUtils.String2Bytes(this.m_bTotalPacketCount.toString()))[0];
		bArrbuffer.set(bPacketCount, iLocalOffset++);
		this.addLLLCHARData(IsoFieldsConsts.ISO_FIELD_53, bArrbuffer, iLocalOffset);
		// CString csLog;
		// csLog.Format("%d packet of %d", m_bCurrentPacketCount,m_bTotalPacketCount);
	}
	// if (this.m_iChangeNumber ==ISO320HostCommChangeNumberConsts.HOST_CHARGESLIP_ID_DOWNLOAD) {
	// 	var logBuffer=new Int8Array(100);
	// 	var  ItemList=new Uint32Array(Consts.SIZEOFITEMLIST);
	// 	//BYTE bLocalBuffer[MAX_COUNT_CHARGE_SLIP_IMAGES * sizeof(unsigned long)];  memset(bLocalBuffer, 0x00, MAX_COUNT_CHARGE_SLIP_IMAGES* sizeof(unsigned long));
	// 	var bLocalBuffer=new Uint8Array(Consts.MAX_COUNT_CHARGE_SLIP_IMAGES);
	// 	var iLocalOffset = 0x00; 
	// 	var numberOfItems = 0;
	// 	  numberOfItems =await this.dbAccessor.ReadChargeSlipTemplateIdFromDB(ItemList);
	// 	console.log("test");
	// for(int i = 0; i<numberOfItems; i++ )
	// {
	// 	unsigned long ulcharegSlipId = 0;
	// 	ulcharegSlipId = ItemList[i+1];
	// 	if(ulcharegSlipId!= 0x0000)
	// 	{
	// 		char PadedChargeSlipId[11] = { 0 }; 	memset(PadedChargeSlipId, 0x00, 11);
	// 		sprintf(PadedChargeSlipId, "%08d",ulcharegSlipId);
	// 		CUtils::a2bcd((char *)bLocalBuffer+iLocalOffset,PadedChargeSlipId);
	// 		memset(logBuffer, 0x00, 100); wsprintf(logBuffer,_T("CT:0x%02x : 0x%02x 0x%02x 0x%2x"),bLocalBuffer[iLocalOffset+0],	bLocalBuffer[iLocalOffset+1],bLocalBuffer[iLocalOffset+2],bLocalBuffer[iLocalOffset+3]); 
	// 		iLocalOffset += sizeof(unsigned long);
	// 	}
	// }
	// if(iLocalOffset != 0){
	// 	addLLLCHARData(ISO_FIELD_61, (char*)bLocalBuffer, iLocalOffset);
	// }
	//	}
	// 	if (m_iChangeNumber == HOST_IMAGE_ID_DOWNLOAD) {
	// 	TCHAR logBuffer[100] = {0};
	// 	memset(logBuffer,0x00,100);
	// 	ULONG ItemList[SIZEOFITEMLIST] = {0};	memset(ItemList,0x00,sizeof(ItemList));
	// 	BYTE bLocalBuffer[MAX_COUNT_CHARGE_SLIP_IMAGES * sizeof(unsigned long)];
	// 	memset(bLocalBuffer, 0x00, MAX_COUNT_CHARGE_SLIP_IMAGES* sizeof(unsigned long));
	// 	int iLocalOffset = 0x00; int numberOfItems = 0;
	// 	numberOfItems = dbAccessor->ReadImageIdFromDB(ItemList);
	// 	for(int i = 0; i<numberOfItems; i++ )
	// 	{
	// 		unsigned long ulImageId = 0;
	// 		ulImageId = ItemList[i+1];
	// 		if(ulImageId!= 0x0000)
	// 		{
	// 			char PadedChargeSlipId[11] = { 0 }; 	memset(PadedChargeSlipId, 0x00, 11);
	// 			sprintf(PadedChargeSlipId, "%08d",ulImageId);
	// 			CUtils::a2bcd((char *)bLocalBuffer+iLocalOffset,PadedChargeSlipId);
	// 			memset(logBuffer, 0x00, 100); wsprintf(logBuffer,_T("IM:0x%02x : 0x%02x 0x%02x 0x%2x"),bLocalBuffer[iLocalOffset+0],	bLocalBuffer[iLocalOffset+1],bLocalBuffer[iLocalOffset+2],bLocalBuffer[iLocalOffset+3]); 
	// 			iLocalOffset += sizeof(unsigned long);
	// 		}
	// 		if(iLocalOffset != 0){
	// 			addLLLCHARData(ISO_FIELD_61, (char*)bLocalBuffer, iLocalOffset);
	// 		}
	// 	}
	// }
	if (this.m_iChangeNumber == ISO320HostCommChangeNumberConsts.HOST_MESSAGE_ID_LIST_DOWNLOAD) {
		var logBuffer = new Int8Array(100);
		bArrItemList = new Uint32Array(Consts.SIZEOFITEMLIST)
		var bLocalBuffer = new Uint8Array(Consts.MAX_COUNT_MESSAGES);
		var iLocalOffset = 0x00; var inumberOfItems = 0;
		inumberOfItems = await this.dbAccessor.ReadMessageIdFromDB(bArrItemList);
		for (var i = 0; i < inumberOfItems; i++) {
			var ulMessageId = 0;
			ulMessageId = bArrItemList[i + 1];
			if (ulMessageId != 0x0000) {
				bLocalBuffer.set(CUtils.a2bcd(CUtils.StrLeftPad(ulMessageId.toString(), 8, '0')), iLocalOffset);
				//wsprintf(logBuffer,_T("MG:0x%02x : 0x%02x 0x%02x 0x%2x"),bLocalBuffer[iLocalOffset+0],	bLocalBuffer[iLocalOffset+1],bLocalBuffer[iLocalOffset+2],bLocalBuffer[iLocalOffset+3]); 
				iLocalOffset += 4;
			}
			if (iLocalOffset != 0) {
				this.addLLLCHARData(IsoFieldsConsts.ISO_FIELD_61, bLocalBuffer, iLocalOffset);
			}
		}
	}
	// 	if(m_iChangeNumber == HOST_PARAMETERS_DOWNLOAD){
	// 	char temp[13];
	// 	memset(temp,0,13);
	// 	dbAccessor->ReadParamsFromDB();
	// 	memcpy(temp,dbAccessor->m_sParamData.chParameterUpdateDate,_tcslen(dbAccessor->m_sParamData.chParameterUpdateDate));
	// 	temp[12] = 0;
	// 	this->addField(43,temp , true);
	// 	if(m_ulLastParameterId > 0 ){
	// 		BYTE bLocalBuffer[50]; memset(bLocalBuffer,0,50);
	// 		int iLocalOffset = 0x00;
	// 		bLocalBuffer[iLocalOffset++] = (BYTE)((m_ulLastParameterId >> 8) & 0x000000FF);
	// 		bLocalBuffer[iLocalOffset++] = (BYTE)(m_ulLastParameterId & 0x000000FF);
	// 		addLLLCHARData(61, (char*)bLocalBuffer, iLocalOffset);
	// 	}
	// }
	if (this.m_iChangeNumber == ISO320HostCommChangeNumberConsts.EMV_PAR_DWONLOAD) {
		await this.SetEMVParDownLoadVersion();
		if (this.m_bCurrentPacketCount > 0) {
			var bArrbuffer = new Uint8Array(5);
			var iLocalOffset = 0x00;
			bArrbuffer[iLocalOffset++] = this.m_bCurrentPacketCount & (255);
			bArrbuffer[iLocalOffset++] = this.m_bTotalPacketCount & (255);
			this.addLLLCHARData(IsoFieldsConsts.ISO_FIELD_53, bArrbuffer, iLocalOffset);
		}
		this.addLLLCHARData(IsoFieldsConsts.ISO_FIELD_61, CUtils.String2Bytes(this.dbAccessor.m_sMasterParamData.m_chArrEMVParVersion), 12);
	}
	// if (m_iChangeNumber == HUB_PARM_UPLOAD)
	// {
	// 	packHostUploadPacket();
	// }
	// if (m_iChangeNumber == HUB_PARM_DOWNLOAD)
	// {
	// 	dbAccessor->ReadParamsFromDB();
	// 	dbAccessor->ReadMasterParamsFromDB();//Deepak
	// 	CString csLog = "";
	// 	csLog.Format("chArrParamDownloadDate =%s",dbAccessor->m_sParamData.chParameterUpdateDate);
	// 	dbAccessor->m_sParamData.chParameterUpdateDate[12] = 0x00;
	// 	char chArrParameterUpdateDate[30];
	// 	memset(chArrParameterUpdateDate,0x00,sizeof(chArrParameterUpdateDate));
	// 	memcpy(chArrParameterUpdateDate,dbAccessor->m_sParamData.chParameterUpdateDate,_tcslen(dbAccessor->m_sParamData.chParameterUpdateDate));
	// 	this->addField(ISO_FIELD_43, chArrParameterUpdateDate/*dbAccessor->m_sParamData.chParameterUpdateDate*/, true);
	// 	if (m_ulLastParameterId > 0) {
	// 		BYTE bLocalBuffer[50];
	// 		memset(bLocalBuffer, 0, 50);
	// 		int iLocalOffset = 0x00;
	// 		bLocalBuffer[iLocalOffset++] = (BYTE)((m_ulLastParameterId >> 8) & 0x000000FF);
	// 		bLocalBuffer[iLocalOffset++] = (BYTE)(m_ulLastParameterId & 0x000000FF);
	// 		addLLLCHARData(ISO_FIELD_61, (char*) bLocalBuffer, iLocalOffset);
	// 	}
	// }
	if (this.m_iChangeNumber == ISO320HostCommChangeNumberConsts.HUB_GET_PINE_SESSION_KEY) {
		var chArrTxnBuffer = new Int8Array(2000);
		var iOffset = this.m_objHSMInterface.iGetPSKRequestForPaymentController(chArrTxnBuffer);
		this.addLLLCHARData(IsoFieldsConsts.ISO_FIELD_61, chArrTxnBuffer, iOffset);
	}
	// if(m_iChangeNumber == HUB_GET_BIN_RANGE)
	// {
	// 	this->addField(ISO_FIELD_43, dbAccessor->m_sMasterParamData.m_chArrBinRangeDownloadDate, true);
	// }
	// if(m_iChangeNumber == HUB_GET_CACRT)
	// {
	// 	SetCACRTDownLoadVersion();
	// }
	if (this.m_iChangeNumber == ISO320HostCommChangeNumberConsts.HUB_PINEKEY_EXCHANGE) {
		this.SetPineKeyExchangeRequest();
	}
	return this.packItHost(bArrsendData);
}
CISO320HostComm.prototype.SetPVMDownLoadVersion = function () {
	var csTemp = "";
	var lastPVMDwndInfo = new Structs.CurrentDownloadingInfo();
	if (1) {
		lastPVMDwndInfo = this.m_lastPVMDwndInfo;
		this.m_ulDownloadingPvmVersion = lastPVMDwndInfo.id;
		this.m_bCurrentPacketCount = lastPVMDwndInfo.currentpacketCount;
		this.m_bTotalPacketCount = lastPVMDwndInfo.totalpacketCount;
		//csTemp.Format("m_ulDownloadingPvmVersion =%d m_bCurrentPacketCount = %d ,m_bTotalPacketCount = %d",m_ulDownloadingPvmVersion,m_bCurrentPacketCount,m_bTotalPacketCount);
		var newbuffer = new Int8Array(50);
		//csTemp.Format("Earlier m_ulDownloadingPvmVersion = %d",m_ulDownloadingPvmVersion);
		newbuffer.set(CUtils.String2Bytes(CUtils.StrRightPad(this.m_ulDownloadingPvmVersion.toString(), 6, ' ')), 0);
		this.addField(IsoFieldsConsts.ISO_FIELD_44, newbuffer.slice(0, 6), false);
		if (lastPVMDwndInfo.chunkSize > 0) {
			var chArrTempChunkSize = new Int8Array(13);
			var ulChunkSize = lastPVMDwndInfo.chunkSize;
			//csTemp.Format("Earlier ulChunkSize = %d",ulChunkSize);
			chArrTempChunkSize.set(CUtils.String2Bytes(CUtils.StrLeftPad(this.ulChunkSize.toString(), 6, '0')), 0);
			this.addField(IsoFieldsConsts.ISO_FIELD_45, chArrTempChunkSize, true);
		}
	}
}
CISO320HostComm.prototype.SetEMVParDownLoadVersion = async function () {
	var csTemp = "";
	var lastEMVParDwndInfo = new Structs.CurrentEMVParDownloadingInfo();
	if (await this.dbAccessor.GetEMVPARDownloadedInfo(lastEMVParDwndInfo)) {   //Get EMV PAR version
		this.m_chDownloadingEMVparVersion = lastEMVParDwndInfo.chVersion;
		this.m_bCurrentPacketCount = lastEMVParDwndInfo.currentpacketCount;
		this.m_bTotalPacketCount = lastEMVParDwndInfo.totalpacketCount;
		// csTemp.Format("Earlier m_chDownloadingEMVparVersion = %s",m_chDownloadingEMVparVersion);
		// csTemp.Format("m_chDownloadingEMVparVersion =%s m_bCurrentPacketCount = %d ,m_bTotalPacketCount = %d",m_chDownloadingEMVparVersion,m_bCurrentPacketCount,m_bTotalPacketCount);
		this.addLLLCHARData(IsoFieldsConsts.ISO_FIELD_54, this.m_chDownloadingEMVparVersion, 12);
		if (lastEMVParDwndInfo.chunkSize > 0) {
			var chArrTempChunkSize = new Int8Array(13);
			var ulChunkSize = lastEMVParDwndInfo.chunkSize;
			this.addField(IsoFieldsConsts.ISO_FIELD_45, CUtils.StrLeftPad(ulChunkSize.toString(), 6, '0'), true);
		}
		else {
			//CLogger::TraceLog(TRACE_DEBUG,"DWNLDEMVPARCHUNKINFO doesnot exist");
			//	CUtilsCommon::LogMessage("DWNLDEMVPARCHUNKINFO file not exist",DelegateUtils::MT_DEBUG);
		}
	} else {
		//CLogger::TraceLog(TRACE_ERROR,"DWNLDEMVPARINFO  file doesnot exits");
		//CUtilsCommon::LogMessage("DWNLDEMVPARINFO file not exist",DelegateUtils::MT_DEBUG);
	}
}
CISO320HostComm.prototype.SetPineKeyExchangeRequest = function () {
	this.m_chArrBuffer.fill(0x00);
	this.m_iOffsetBuffer = 0;
	switch (this.m_iPKExchangePacketNumber) {
		case ISO320PKExchangeChangeNumberConsts.START_SESSION:
			//this.dbAccessor.ReadMasterParamsFromDB();//empty functions in c++
			this.dbAccessor.m_sMasterParamData.bArrIsPKExchangePacket[0] = 0x00;
			//this.dbAccessor.WriteMasterParamFile();//empty functions in c++
			this.m_iOffsetBuffer = this.m_objHSMInterface.iStartSessionRequest(this.m_chArrBuffer);
			break;
		case ISO320PKExchangeChangeNumberConsts.GET_MYTOKEN_REQ:
			this.m_iOffsetBuffer = this.m_objHSMInterface.iGetAuthTokenRequest(this.m_chArrBuffer);
			break;
		case ISO320PKExchangeChangeNumberConsts.GET_PMKDATA_REQ:
			this.m_iOffsetBuffer = this.m_objHSMInterface.iGetPMKDataRequest(this.m_chArrBuffer);
			break;
		case ISO320PKExchangeChangeNumberConsts.RESETKEY_REQ:
			this.m_iOffsetBuffer = this.m_objHSMInterface.iGetPTMKRequest(PTMKRequestTypeConsts.RESET_PTMK, this.m_chArrBuffer);
			break;
		case ISO320PKExchangeChangeNumberConsts.RENEWKEY_REQ:
			this.m_iOffsetBuffer = this.m_objHSMInterface.iGetPTMKRequest(PTMKRequestTypeConsts.RENEW_PTMK, this.m_chArrBuffer);
			break;
		case ISO320PKExchangeChangeNumberConsts.END_SESSION:
			this.m_iOffsetBuffer = this.m_objHSMInterface.iEndSessionRequest(this.m_chArrBuffer);
			break;
		default:
			break;
	}
	this.addLLLCHARData(IsoFieldsConsts.ISO_FIELD_61, this.m_chArrBuffer, this.m_iOffsetBuffer);
}
CISO320HostComm.prototype.ProcessData = async function () {
	var DisplayCount = new Int8Array(20);
	var csDisplayMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "]";
	if (!this.IsOK()) {
		return false;
	}
	// if(bitmap[7 - 1] && (m_iChangeNumber >= HOST_PVM_DOWNLOAD && m_iChangeNumber <= EMV_PAR_DWONLOAD/*HUB_GET_CACRT*/))
	// {
	// 	CString csLog = "";
	// 	csLog.Format("bitmap[7] present in change number[%d]", m_iChangeNumber);
	// 	char* p = data[7 - 1];
	// 	csLog = "";
	// 	csLog.Format("bitmap[7][0x%x]", p[0]);
	// 	if(p[0] == 0x01)
	// 	{
	// 		dbAccessor->ReadMasterParamsFromDB();
	// 		dbAccessor->m_sMasterParamData.bArrIsPKExchangePacket[0] = 0x01;
	// 		dbAccessor->WriteMasterParamFile();
	// 	}
	// }
	//CString csLog = "";
	//csLog.Format("CISO320HostComm::ProcessData m_iChangeNumber[%d]",m_iChangeNumber);
	// var csField58Message = "";
	// if(this.bitmap[58 - 1]){
	// 	csField58Message = "[ "+CString(data[58-1])+" ]";
	// }
	// CString csDisplayMessage = "";
	// csDisplayMessage = "ClientID["+CString(dbAccessor->m_sParamData.m_uchArrClientId)+"] ISO Packet 330 ";
	switch (this.m_iChangeNumber) {
		// case HOST_PVM_DOWNLOAD:
		// 		if ((memcmp(data[3-1], PC_PVM_DLD_START, 6) == 0) ||
		// 				(memcmp(data[3-1], PC_PVM_DLD_END, 6) == 0))
		// 		{
		// 			csDisplayMessage += "HOST_PVM_DOWNLOAD Received " + csField58Message;
		// 			CentralMainDialog::ShowMessageInListBox(csDisplayMessage);
		// 			if (bitmap[61 - 1] && bitmap[53 - 1])
		// 			{
		// 				if(!ProcessPVMData())
		// 				{
		// 					return false;
		// 				}
		// 			}
		// 		}
		// 		if (memcmp(data[3 - 1], PC_PVM_DLD_END, 6) == 0) {
		// 			m_bCurrentPacketCount = 0;
		// 			m_bTotalPacketCount = 0;
		// 			m_iChangeNumber++;
		// 		}
		// 		break;
		// 	case HOST_CHARGESLIP_ID_DOWNLOAD:
		// 		if ((memcmp(data[3 - 1], PC_CHARGE_SLIP_ID_DLD_START, 6) == 0)
		// 				|| (memcmp(data[3 - 1], PC_CHARGE_SLIP_ID_DLD_END, 6) == 0)) {
		// 			csDisplayMessage += "HOST_CHARGESLIP_ID_DOWNLOAD Received " + csField58Message;
		// 			CentralMainDialog::ShowMessageInListBox(csDisplayMessage);
		// 			if (bitmap[61 - 1] && bitmap[53 - 1]) {
		// 				ProcessChargeSlipIdDownload();
		// 			}
		// 		}
		// 		if (memcmp(data[3 - 1], PC_CHARGE_SLIP_ID_DLD_END, 6) == 0) {
		// 			m_bCurrentPacketCount = 0;
		// 			m_bTotalPacketCount = 0;							
		// 			m_iChangeNumber++;
		// 			if (m_ulCountOfChargeSlipIdAdd == 0x00) {
		// 				m_iChangeNumber++; 
		// 			}
		// 		}
		// 		break;
		// 	case HOST_CHARGESLIP_DOWNLOAD:
		// 		if ((memcmp(data[3 - 1], PC_CHARGE_SLIP_DLD_START, 6) == 0) || (memcmp(
		// 				data[3 - 1], PC_CHARGE_SLIP_DLD_END, 6) == 0)) {
		// 					csDisplayMessage += "HOST_CHARGESLIP_DOWNLOAD Received " + csField58Message;
		// 			CentralMainDialog::ShowMessageInListBox(csDisplayMessage);
		// 			if (bitmap[61 - 1] && bitmap[53 - 1]) {
		// 				ProcessChargeSlipDownload();
		// 			}
		// 		}
		// 		if (memcmp(data[3 - 1], PC_CHARGE_SLIP_DLD_END, 6) == 0) {
		// 			m_ulTotalChargeSlipTemplateAdded++;
		// 			if (m_ulTotalChargeSlipTemplateAdded >= m_ulCountOfChargeSlipIdAdd) {
		// 				m_iChangeNumber++;
		// 			}
		// 			m_bCurrentPacketCount = 0;
		// 			m_bTotalPacketCount = 0;
		// 		}
		// 		break;
		// 	case HOST_IMAGE_ID_DOWNLOAD:
		// 		if ((memcmp(data[3 - 1], PC_IMAGE_ID_DOWNLOAD_START, 6) == 0)
		// 				|| (memcmp(data[3 - 1], PC_IMAGE_ID_DOWNLOAD_END, 6) == 0)) {
		// 					csDisplayMessage += "HOST_IMAGE_ID_DOWNLOAD Received " + csField58Message;
		// 			CentralMainDialog::ShowMessageInListBox(csDisplayMessage);
		// 			if (bitmap[61 - 1] && bitmap[53 - 1]) {
		// 				ProcessImageIdDownload();
		// 			}
		// 		}
		// 		if (memcmp(data[3 - 1], PC_IMAGE_ID_DOWNLOAD_END, 6) == 0) {
		// 			m_bCurrentPacketCount = 0;
		// 			m_bTotalPacketCount = 0;
		// 			m_iChangeNumber++;
		// 			if (m_ulCountOfImageIdAdd == 0x00) {
		// 				m_iChangeNumber++; 
		// 			}
		// 		}
		// 		break;
		// 	case HOST_IMAGE_DOWNLOAD:
		// 		if ((memcmp(data[3 - 1], PC_IMAGE_DOWNLOAD_START, 6) == 0) || (memcmp(
		// 				data[3 - 1], PC_IMAGE_DOWNLOAD_END, 6) == 0)) {
		// 					csDisplayMessage += "HOST_IMAGE_DOWNLOAD Received " + csField58Message;
		// 			CentralMainDialog::ShowMessageInListBox(csDisplayMessage);
		// 			if (bitmap[61 - 1] && bitmap[53 - 1]) {
		// 				ProcessImageDownload();
		// 			}
		// 		}
		// 		if (memcmp(data[3 - 1], PC_IMAGE_DOWNLOAD_END, 6) == 0) {
		// 			m_ulTotalImagesAdded++; 
		// 			if (m_ulTotalImagesAdded >= m_ulCountOfImageIdAdd) {
		// 				m_iChangeNumber++;
		// 			}
		// 			m_bCurrentPacketCount = 0;
		// 			m_bTotalPacketCount = 0;
		// 		}
		// 		break;
		case ISO320HostCommChangeNumberConsts.HOST_BATCH_ID:
			if ((CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_BATCH_ID) || (CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_BATCH_ID_END)) {
				csDisplayMessage += " ISO PACKET 330 BATCHID RECEIVED";
				CUIHandler.log(csDisplayMessage);
				await this.ProcessBatchId();
			}
			if (CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_BATCH_ID_END) {
				this.m_iChangeNumber += 1;
			}
			break;
		case ISO320HostCommChangeNumberConsts.HOST_CLOCK_SYNC:
			if ((CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_CLOCK_SYNC_START) ||
				(CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_CLOCK_SYNC_END)) {
				csDisplayMessage += " ISO PACKET 330 HOST_CLOCK_SYNC RECEIVED";
				CUIHandler.log(csDisplayMessage);
				await this.ProcessClockSynchronization();
			}
			if (CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_CLOCK_SYNC_END) {
				this.m_iChangeNumber++;
			}
			break;
		case ISO320HostCommChangeNumberConsts.HOST_MESSAGE_ID_LIST_DOWNLOAD:
			if ((CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_MESSAGE_ID_LIST_DLD_START)
				|| (CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_MESSAGE_ID_LIST_DLD_END)) {
				csDisplayMessage += " HOST_MESSAGE_ID_LIST_DOWNLOAD Received ";
				CUIHandler.log(csDisplayMessage);
				if (this.data[61 - 1] && this.data[53 - 1]) {
					this.ProcessMessageIdDownload();
				}
			}
			if (CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_MESSAGE_ID_LIST_DLD_END) {
				this.m_bCurrentPacketCount = 0;
				this.m_bTotalPacketCount = 0;
				this.m_iChangeNumber++;
				if (this.m_ulCountOfMessageIdAdd == 0x00) {
					this.m_iChangeNumber = 11;
				}
			}
			break;
		// case HOST_MESSAGE_DOWNLOAD:
		// 	if ((memcmp(data[3 - 1], PC_MESSAGE_DLD_START, 6) == 0) || (memcmp(
		// 			data[3 - 1], PC_MESSAGE_DLD_END, 6) == 0)) {
		// 				csDisplayMessage += "HOST_MESSAGE_DOWNLOAD Received " + csField58Message;
		// 		CentralMainDialog::ShowMessageInListBox(csDisplayMessage);
		// 		ProcessMessageDownload();
		// 	}
		// 	if (memcmp(data[3 - 1], PC_MESSAGE_DLD_END, 6) == 0) {
		// 		m_ulTotalMessagesAdded++;
		// 			if(m_ulTotalMessagesAdded >= m_ulCountOfMessageIdAdd){
		// 			m_iChangeNumber++;
		// 		}
		// 		m_bCurrentPacketCount = 0;
		// 		m_bTotalPacketCount = 0;
		// 	}
		// 	break;
		// 	case HOST_PARAMETERS_DOWNLOAD:
		// 		if ((memcmp(data[3 - 1], PC_PARAMETER_START, 6) == 0) || (memcmp(data[3
		// 				- 1], PC_PARAMETER_END, 6) == 0)) {
		// 					csDisplayMessage += "HOST_PARAMETERS_DOWNLOAD Received " + csField58Message;
		// 			CentralMainDialog::ShowMessageInListBox(csDisplayMessage);
		// 			ProcessParameterDownload();
		// 		}
		// 		if (memcmp(data[3 - 1], PC_PARAMETER_END, 6) == 0) {
		// 			m_iChangeNumber++;
		// 			ProcessParameterDownloadDateTime();
		// 		break;
		case ISO320HostCommChangeNumberConsts.EMV_PAR_DWONLOAD:
			if ((CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_EMV_PARAM_START) ||
				(CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_EMV_PARAM_END)) {
				csDisplayMessage += " EMV_PAR_DWONLOAD Received ";
				CUIHandler.log(csDisplayMessage);
				if (this.bitmap[61 - 1] && this.bitmap[53 - 1]) {
					if (!this.ProcessEMVParDownload()) {
						return false;
					}
				}
			} else {
				//CUtilsCommon::LogMessage(_T("CISO320HostComm::ProcessData WRONG PROC CODE"),DelegateUtils::MT_DEBUG);
				//CLogger::TraceLog(TRACE_DEBUG,"CISO320HostComm::ProcessData WRONG PROC CODE");
			}
			if (CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_EMV_PARAM_END) {
				this.m_bCurrentPacketCount = 0;
				this.m_bTotalPacketCount = 0;
				this.m_iChangeNumber += 3;	//Need to Correct back to 3 increment
			}
			break;
		// case HUB_PARM_UPLOAD:
		// 	if ((memcmp(data[3-1], PC_PARAMETER_UPLOAD_START, 6) == 0) ||
		// 					(memcmp(data[3-1], PC_PARAMETER_UPLOAD_END, 6) == 0))
		// 	{
		// 		csDisplayMessage += "HUB_PARM_UPLOAD Received " + csField58Message;
		// 			CentralMainDialog::ShowMessageInListBox(csDisplayMessage);
		// 		if (bitmap[61 - 1] && bitmap[53 - 1])
		// 		{
		// 		}
		// 		// Check for number of Packets upload.
		// 		if (m_iHostUploadPacketNumber < MASTER_PARAM_UPLOAD_PACKET)
		// 		{
		// 			m_iHostUploadPacketNumber++;
		// 		} else
		// 		{
		// 			UpdateUploadDataChangedFlag();
		// 			m_iChangeNumber++;
		// 		}
		// 	}else{
		// 		//CLogger::TraceLog(TRACE_DEBUG,"CISO320HostComm::ProcessData WRONG PROC CODE");
		// 	//	CUtilsCommon::LogMessage(_T("CISO320HostComm::ProcessData WRONG PROC CODE"),DelegateUtils::MT_DEBUG);
		// 	}
		// 	break;
		// case HUB_PARM_DOWNLOAD:
		// 	if ((memcmp(data[3-1], PC_PARAMETER_DOWNLOAD_START, 6) == 0) ||
		// 					(memcmp(data[3-1], PC_PARAMETER_DOWNLOAD_END, 6) == 0))
		// 	{
		// 		csDisplayMessage += "HUB_PARM_DOWNLOAD Received " + csField58Message;
		// 			CentralMainDialog::ShowMessageInListBox(csDisplayMessage);
		// 		ProcessHubParmDownload();
		// 	}else{
		// 	//	CUtilsCommon::LogMessage(_T("CISO320HostComm::ProcessData WRONG PROC CODE"),DelegateUtils::MT_DEBUG);
		// 		//CLogger::TraceLog(TRACE_DEBUG,"CISO320HostComm::ProcessData WRONG PROC CODE");
		// 	}
		// 	if (memcmp(data[3 - 1], PC_PARAMETER_DOWNLOAD_END, 6) == 0) {
		// 		m_iChangeNumber++;
		// 		ProcessHubParmDownloadDateTime();
		// 	}
		// 	break;
		case ISO320HostCommChangeNumberConsts.HUB_PINEKEY_EXCHANGE:
			if ((CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_PARAMETER_PINEKEY_EXCHANGE_START) ||
				(CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_PARAMETER_PINEKEY_EXCHANGE_END)) {
				csDisplayMessage += " HUB_PINEKEY_EXCHANGE Received ";
				CUIHandler.log(csDisplayMessage);
				await this.ProcessPineKeyExchangeResponse();
			}
			break;
		case ISO320HostCommChangeNumberConsts.HUB_GET_PINE_SESSION_KEY:
			if ((CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_PARAMETER_GETPSK_START) ||
				(CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_PARAMETER_GETPSK_END)) {
				csDisplayMessage += " HUB_GET_PINE_SESSION_KEY Received ";
				CUIHandler.log(csDisplayMessage);
				var iret = await this.ProcessPSKDownload();
				if (iret != true) {
					return false;
				}
			} else {
			}
			if (CUtils.Bytes2String(this.data[3 - 1]) == Consts.PC_PARAMETER_GETPSK_END) {
				this.m_iChangeNumber++;
			}
			break;
		// case HUB_GET_BIN_RANGE:
		// 	if ((memcmp(data[3-1], PC_PARAMETER_GETBINRANGE_START, 6) == 0) ||
		// 		(memcmp(data[3-1], PC_PARAMETER_GETBINRANGE_END, 6) == 0))
		// 	{
		// 		csDisplayMessage += "HUB_GET_BIN_RANGE Received " + csField58Message;
		// 			CentralMainDialog::ShowMessageInListBox(csDisplayMessage);
		// 		ProcessBinRangeDownload();
		// 	}else{
		// 	}
		// 	if (memcmp(data[3 - 1], PC_PARAMETER_GETBINRANGE_END, 6) == 0) {
		// 		m_iChangeNumber++;
		// 		ProcessBinRangeDateTime();
		// 	}
		// 	break;
		// default:
	}
	return true;
}
CISO320HostComm.prototype.ProcessBatchId = async function () {
	var chArrTempBatch = new Int8Array(13);
	chArrTempBatch.set(this.data[26 - 1], 0);
	var ulBatchID = parseInt(CUtils.Bytes2String(chArrTempBatch), 10);
	this.dbAccessor.m_sParamData.iCurrentBatchId = ulBatchID;
	await this.dbAccessor.UpdateClientDetails(this.dbAccessor);
}
CISO320HostComm.prototype.ProcessClockSynchronization = async function () {
	var chArrTempDateTime = new Int8Array(12);
	var strDate = CUtils.Bytes2String(this.data[12 - 1]);
	var strDateparse = "20" + strDate.slice(4, 6) + "-" + strDate.slice(2, 4) + "-" + strDate.slice(0, 2) + "T" + strDate.slice(6, 8) + ":" + strDate.slice(8, 10) + ":" + strDate.slice(10, 12);
	var totalHostTimeMillisec = Date.parse(strDateparse);
	var currentDateTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
	var TotalcurrentDateTimeMillisec = Date.parse(currentDateTime.toLocaleString());
	var diff_secs = parseInt((totalHostTimeMillisec - TotalcurrentDateTimeMillisec) / 1000);
	this.dbAccessor.m_sParamData.lTimeDifferential = diff_secs;
	await this.dbAccessor.UpdateClientDetails(this.dbAccessor);
}
CISO320HostComm.prototype.ProcessMessageIdDownload = function () {
	if (!this.bitmap[61 - 1]) {
		return;
	}
	var bArrData = this.data[61 - 1];
	var length = this.len[61 - 1];
	var offset = 0;
	var chArrTemp = new Int8Array(11);
	var iOffset = 0x00;
	//CString csData = _T("");
	if (this.m_bCurrentPacketCount == 0x00) {
		//csData.Format("\n**********Msg Ids*********\n");
	}
	while (length > 0) {
		chArrTemp.fill(0);
		chArrTemp = CUtils.bcd2a(bArrData, 4);
		iOffset += 4;
		if (bArrData[iOffset++] == Consts.ACTION_ADD) {
			if (this.m_ulCountOfMessageId < Consts.MAX_COUNT_MESSAGES) {
				//csData = _T("");
				this.m_ulArrMessageId[this.m_ulCountOfMessageId] = parseInt(CUtils.Bytes2String(chArrTemp), 10);
				//csData.Format("\n Message Id to Add = %d, Count = %d\n",m_ulArrMessageId[m_ulCountOfMessageId],m_ulCountOfMessageId);
				this.m_ulCountOfMessageId++;
			} else {
				//csData = _T("");
				var ulVal = 0x00;
				ulVal = parseInt(CUtils.Bytes2String(chArrTemp), 10);
				//csData.Format("\n Message Id to Add = %d FAILED \n",ulVal);
			}
		} else {
			//csData = _T("");
			var ulVal = 0x00;
			ulVal = parseInt(CUtils.Bytes2String(chArrTemp), 10);
			//csData.Format("Message Id to Delete = %d",ulVal);
		}
		length -= 5;
	}
	var pFieldPVMDef = this.data[53 - 1];
	var ilength = this.len[53 - 1];
	if (ilength >= 2) {
		this.m_bCurrentPacketCount = pFieldPVMDef[0];
		this.m_bTotalPacketCount = pFieldPVMDef[1];
		//csData = _T("");
		//csData.Format("Resposne field 53 in ProcessMessageDownload Current Packet Count = %d,Total Packet count = %d",m_bCurrentPacketCount,m_bTotalPacketCount);
	}
}
CISO320HostComm.prototype.ProcessEMVParDownload = function () {
	var bArrdata = this.data[61 - 1];
	var length = this.len[61 - 1];
	var pFieldEMVparDef = this.data[53 - 1];
	var ilength = this.len[53 - 1];
	if (ilength >= 2) {
		this.m_bCurrentPacketCount = pFieldEMVparDef[0];
		this.m_bTotalPacketCount = pFieldEMVparDef[1];
		//CString l_csLog = "";
		//l_csLog.Format(_T("m_bCurrentPacketCount[%d] m_bTotalPacketCount[%d]"),m_bCurrentPacketCount,m_bTotalPacketCount);
	}
	if (this.m_bCurrentPacketCount == 0x01) {
	}
	else {
		if (this.bitmap[54 - 1]) {
			var currentEMVParDwndInfo = new Structs.CurrentEMVParDownloadingInfo();
			var chEMVparVersion1 = new Int8Array(this.len[53]);
			if (true == this.getEMVParVersion(IsoFieldsConsts.ISO_FIELD_54, chEMVparVersion1)) {
				//CString csTemp;
				if (CUtils.Bytes2String(chEMVparVersion1) != CUtils.Bytes2String(this.m_chDownloadingEMVparVersion).slice(0, 12)) {
					return false;
				}
			} else {
				return false;
			}
		} else {
			return false;
		}
	}
	if (this.m_bCurrentPacketCount == this.m_bTotalPacketCount) {
		//CString csTempEMVPAR;
		var chEMVparVersion2 = new Int8Array(this.len[53]);
		var retValParse = -1;
		if (true == this.getEMVParVersion(IsoFieldsConsts.ISO_FIELD_54, chEMVparVersion2)) {
			if (0 == retValParse) {
				this.dbAccessor.m_sMasterParamData.m_chArrEMVParVersion = CUtils.Bytes2String(chEMVParVersion2);
			}
		}
	}
	else {
		//CString csTemp(p);
		if (!this.SaveEMVParDownloadInfoVersion()) {
			return false;
		}
	}
	return true;
}
CISO320HostComm.prototype.getEMVParVersion = function (isoFeild, chEMVparVersion) {
	var retVal = false;
	if (this.bitmap[isoFeild - 1]) {
		chEMVparVersion.set(this.data[isoFeild - 1], 0);
		//CString l_cslog = "";
		//CString l_temp(*chEMVparVersion);
		//l_cslog.Format("getEMVParVersion [%s]",/**chEMVparVersion*/l_temp);
		retVal = true;
	}
	return retVal;
}
CISO320HostComm.prototype.SaveEMVParDownloadInfoVersion = async function () {
	//CString l_csLog = "";
	var currentEMVParDwndInfo = new Structs.CurrentEMVParDownloadingInfo();
	if (this.bitmap[54 - 1]) {
		var chEMVParVersion = new Int8Array(this.len[53]);
		if (true == this.getEMVParVersion(IsoFieldsConsts.ISO_FIELD_54, chEMVParVersion)) {
			currentEMVParDwndInfo.chVersion = chEMVParVersion;
			currentEMVParDwndInfo.currentpacketCount = this.m_bCurrentPacketCount;
			currentEMVParDwndInfo.totalpacketCount = this.m_bTotalPacketCount;
			// l_csLog = "";
			// l_csLog.Format("Version[%s]",currentEMVParDwndInfo.chVersion);
			// l_csLog = "";
			// l_csLog.Format("CurrPkt[%d]",currentEMVParDwndInfo.currentpacketCount);
			// l_csLog = "";
			// l_csLog.Format("TotPkt [%d]",currentEMVParDwndInfo.totalpacketCount);
		} else {
		}
	} else {
	}
	if (this.bitmap[45 - 1]) {
		var chArrTempChunkSize = new Int8Array(13);
		chArrTempChunkSize = this.data[45 - 1];
		var ulChunkSize = 0;
		ulChunkSize = parseInt(CUtils.Bytes2String(chArrTempChunkSize), 10);
		// l_csLog = "";
		// l_csLog.Format("ulChunkSize = %d",ulChunkSize);
		currentEMVParDwndInfo.chunkSize = ulChunkSize;
	}
	if (currentEMVParDwndInfo.chVersion != "") {
		await this.dbAccessor.DeleteEMVPARInfo();
		if (!await this.dbAccessor.SaveEMVPARInfo(currentEMVParDwndInfo))
			return false;
	}
	return true;
}
CISO320HostComm.prototype.ProcessPSKDownload = async function () {
	if (!this.bitmap[61 - 1]) {
		return false;
	}
	var iOffset = 0;
	var chArrField61Data = this.data[61 - 1];
	var iRetVal = false;
	iRetVal = await this.m_objHSMInterface.iGetPSKResponseForPaymentController(chArrField61Data, chArrField61Data.length);
	return iRetVal;
}
CISO320HostComm.prototype.ProcessPineKeyExchangeResponse = async function () {
	this.m_chArrBuffer.fill(0x00);
	this.m_iOffsetBuffer = 0;
	var bArrdata = this.data[61 - 1];
	var iRetVal = false;
	var length = this.len[61 - 1];
	if (length < 0) {
		this.m_iChangeNumber++;
		return;
	}
	switch (this.m_iPKExchangePacketNumber) {
		case ISO320PKExchangeChangeNumberConsts.START_SESSION:
			iRetVal = this.m_objHSMInterface.iStartSessionResponse(bArrdata, length);
			if (iRetVal != true) {
				this.m_iChangeNumber++;
			}
			else {
				this.m_iPKExchangePacketNumber++;
			}
			break;
		case ISO320PKExchangeChangeNumberConsts.GET_MYTOKEN_REQ:
			iRetVal = this.m_objHSMInterface.iGetAuthTokenResponse(bArrdata, length);
			if (iRetVal != true) {
				this.m_iPKExchangePacketNumber = ISO320PKExchangeChangeNumberConsts.END_SESSION;
			}
			else {
				this.m_iPKExchangePacketNumber++;
			}
			break;
		case ISO320PKExchangeChangeNumberConsts.GET_PMKDATA_REQ:
			iRetVal = await this.m_objHSMInterface.iGetPMKDataResponse(bArrdata, length);
			if (iRetVal != true) {
				this.m_iPKExchangePacketNumber = ISO320PKExchangeChangeNumberConsts.END_SESSION;
			}
			else {
				this.m_iPKExchangePacketNumber++;
			}
			break;
		case ISO320PKExchangeChangeNumberConsts.RESETKEY_REQ:
			iRetVal = await this.m_objHSMInterface.iGetPTMKResponse(PTMKRequestTypeConsts.RESET_PTMK, bArrdata, length);
			if (iRetVal != true) {
				this.m_iPKExchangePacketNumber = ISO320PKExchangeChangeNumberConsts.END_SESSION;
			}
			else {
				this.m_iPKExchangePacketNumber++;
			}
			break;
		case ISO320PKExchangeChangeNumberConsts.RENEWKEY_REQ:
			iRetVal = await this.m_objHSMInterface.iGetPTMKResponse(PTMKRequestTypeConsts.RENEW_PTMK, bArrdata, length);
			if (iRetVal != true) {
				this.m_iPKExchangePacketNumber = ISO320PKExchangeChangeNumberConsts.END_SESSION;
			}
			else {
				this.m_iPKExchangePacketNumber++;
			}
			break;
		case ISO320PKExchangeChangeNumberConsts.END_SESSION:
			iRetVal = this.m_objHSMInterface.iEndSessionResponse(bArrdata, length);
			this.m_iChangeNumber++;
			break;
		default:
			break;
	}
}
CISO320HostComm.prototype.CISO320MsgD = function () {
	this.m_iChangeNumber = ISO320HostCommChangeNumberConsts.HOST_PVM_DOWNLOAD;
	this.m_bCurrentPacketCount = 0x00;
	this.m_uchMessage.fill(0x00);
	this.m_imessageOffset = 0;
	this.m_ulArrChargeSlipIdAdd = new Uint32Array(Consts.MAX_COUNT_CHARGE_SLIP_IMAGES);
	this.m_ulArrChargeSlipIdDelete = new Uint32Array(Consts.MAX_COUNT_CHARGE_SLIP_IMAGES);
	this.m_ulArrImageIdAdd = new Uint32Array(Consts.MAX_COUNT_CHARGE_SLIP_IMAGES);
	this.m_ulArrImageIdDelete = new Uint32Array(Consts.MAX_COUNT_CHARGE_SLIP_IMAGES);
	this.m_ulArrMessageIdAdd = new Uint32Array(Consts.MAX_COUNT_MESSAGES);
	this.m_ulArrMessageIdDelete = new Uint32Array(Consts.MAX_COUNT_MESSAGES);
	this.m_ObjArrParameterData = CUtils.ArrayofObject(Consts.MAX_COUNT_PARAMETERS, Structs.ParameterData);
	this.m_ulCountOfChargeSlipIdAdd = 0x00;
	this.m_ulCountOfChargeSlipIdDelete = 0x00;
	this.m_ulTotalChargeSlipTemplateAdded = 0x00;
	this.m_ulCountOfImageIdAdd = 0x00;
	this.m_ulCountOfImageIdDelete = 0x00;
	this.m_ulTotalImagesAdded = 0x00;
	this.m_ulCountOfMessageIdAdd = 0x00;
	this.m_ulCountOfMessageIdDelete = 0x00;
	this.m_ulTotalMessagesAdded = 0x00;
	this.m_ulParameterIterator = 0x00;
	this.m_ulLastParameterId = 0x00;
	this.m_ulDownloadingPvmVersion = 0;
	this.m_chTempImagefileName.fill(0x00);
	this.m_chTempImageDwnFile.fill(0x00);
	this.m_ulBinRangeIterator = 0x00;
}
module.exports = CISO320HostComm;