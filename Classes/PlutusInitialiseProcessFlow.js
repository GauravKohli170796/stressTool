var CIsoProcessor = require("./IsoProcessor");
//var CUIHandler=require("../app");//Added For response of html
var UIHandler=require("../core/classes/UIHandler");
var CUIHandler=new UIHandler().getInstance();
class CPlutusInitialiseProcessFlow {
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
	}
	async run() {
		var bIsMiniPVMPresent = false;
		var objIsoProcessor = new CIsoProcessor(this.dbAccessor);
		var bIsMiniPVMPresent = false;
		var csMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "]";
		csMessage += " Initialising.."
		CUIHandler.log(csMessage);
		var csMessage = "ClientID[" + this.dbAccessor.m_sParamData.m_uchArrClientId + "]";
		var CountStart = Date.now();
		var bReturn = await objIsoProcessor.DoHUBRegistration();
		var TotalCountms= Date.now() -CountStart;
		if (bReturn) {
			if ("" == this.dbAccessor.m_csResponseMssg) {
				this.dbAccessor.m_csResponseMssg = " Initialization Successful";
			}
			csMessage += this.dbAccessor.m_csResponseMssg+"[Time Elapsed=" + TotalCountms.toString() + "]";
			CUIHandler.log(csMessage);
		}
		else {
			if ("" == this.dbAccessor.m_csResponseMssg) {
				this.dbAccessor.m_csResponseMssg = " Initialization Failed";
			}
			csMessage += this.dbAccessor.m_csResponseMssg+"[Time Elapsed=" + TotalCountms.toString() + "]";
			CUIHandler.log(csMessage);
		}
		if (this.dbAccessor) {
			await this.dbAccessor.UpdateClientDetails(this.dbAccessor);
		}
	}
}
module.exports = CPlutusInitialiseProcessFlow;