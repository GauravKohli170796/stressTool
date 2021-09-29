var io=require('socket.io-client');
exports.Socket = io('http://localhost:9000',{'timeout':3600000}, 
);
var StressToolWorker = require("../Classes/StressToolWorker");
require('events').EventEmitter.prototype._maxListeners = 100;
var output=require("../app");
var UIHandler=require("../core/classes/UIHandler");
var CUIHandler=new UIHandler().getInstance();
var SocketEvents=require("../core/Constants/SocketEvents");
  CUIHandler.socket.on(SocketEvents.MainListenEvent,async function(data){
  exports.Clientid=data.Clientid;
  var ClientId =data.Clientid;
  var StartClientId = ClientId;
  var EndClientId = ClientId;
  var OnBnClickedActivation =data.Activation;
  var OnBnClickedInitialisationButton =data.Initialisation;
  var OnBnClickedTransactionButton =data.Transaction;
  var OnBnClickedSettlementButton =data.Settlement;
  exports.StressTestCaseIdinput = (data.StressTestCaseId == "") ? 1 : data.StressTestCaseId;
  exports.iAsyncFlow = (data.IsAsyncOn=="on") ? 1 : 0;
  var iIsSSLOn = (data.IsSSLOn=="on") ? 1 : 0;
  var dwMainThreadID = undefined;
  var iIterationCount = "";
  exports.g_bIsStopTxnButtonClicked = false;
  if (OnBnClickedActivation) {
    if (iIterationCount == "") {
      iIterationCount = 1;
    }
    var m_pStressToolWorker = new StressToolWorker(dwMainThreadID, 1, iIterationCount, StartClientId, EndClientId, iIsSSLOn, exports.iAsyncFlow);
    await m_pStressToolWorker.DoActivation().catch((error) => {
			CUIHandler.log("ClientID[" +ClientId+ "]"+error);
		  });
      CUIHandler.socket.emit(SocketEvents.MainEmitEvent,CUIHandler.strOutputLogs);
    }
  else if (OnBnClickedInitialisationButton) {
    if (iIterationCount == "") {
      iIterationCount = 1;
    }
    var m_pStressToolWorker = new StressToolWorker(dwMainThreadID, 1, iIterationCount, StartClientId, EndClientId, iIsSSLOn, exports.iAsyncFlow);
    await m_pStressToolWorker.DoInitialization().catch((error) => {
			CUIHandler.log("ClientID[" +ClientId+ "]"+error);
		  });
        CUIHandler.socket.emit(SocketEvents.MainEmitEvent,CUIHandler.strOutputLogs);
  }
  else if (OnBnClickedSettlementButton) {
    if (iIterationCount == "") {
      iIterationCount = 1;
    }
    var m_pStressToolWorker = new StressToolWorker(dwMainThreadID, 1, iIterationCount, StartClientId, EndClientId, iIsSSLOn, exports.iAsyncFlow);
    await m_pStressToolWorker.DoSettlement().catch((error) => {
			CUIHandler.log("ClientID[" +ClientId+ "]"+error);
		  });
        CUIHandler.socket.emit(SocketEvents.MainEmitEvent,CUIHandler.strOutputLogs);
    
  }
  else if (OnBnClickedTransactionButton) {
    if (iIterationCount == "") {
      iIterationCount = 1;
    }
    var m_pStressToolWorker = new StressToolWorker(dwMainThreadID, 1, iIterationCount, StartClientId, EndClientId, iIsSSLOn, exports.iAsyncFlow);
          await m_pStressToolWorker.DoTransaction().catch((error) => {
            output.log("ClientID[" +ClientId+ "]"+error);
            });
          // var AppControllers=require("../Classes/AppControllers");
          // await new AppControllers().GetInstance().RunMiniPvm(null);
          CUIHandler.socket.emit(SocketEvents.MainEmitEvent,CUIHandler.strOutputLogs);
       }
  });

  CUIHandler.socket.on(SocketEvents.ClearLogsListenEvent,function(){
    CUIHandler.strOutputLogs="";
});
CUIHandler.socket.on(SocketEvents.StopTransaction,function(){
  exports.g_bIsStopTxnButtonClicked =true;
});
















