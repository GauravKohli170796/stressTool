var CBaseNode = require("../Classes/BaseNode").CBaseNode;
var RetVal = require("../Constants/RetVal");
var ExecutionResult = require("../Constants/ExecutionResult");
var Consts=require("../Constants/AppConsts");
var SocketEvents=require("../core/Constants/SocketEvents");
var UIHandler=require("../core/classes/UIHandler");
var CUIHandler=new UIHandler().getInstance();

class CDisplayConfirmation extends CBaseNode {
    constructor(DBAccessor) {
        super(DBAccessor);
        this.KEY__F1;
        this.KEY__F2;
        this.KEY__F3;
        this.KEY__F4;
        this.KEY__ENTER;
        this.KEY__CANCEL;
        this.KeyF1;
        this.KeyF2;
        this.KeyF3;
        this.KeyF4;
        this.DisplayMessage;
        ///////added by gaurav kohli to display complete messages of confirmation dialog in MiniPVM.
        this.DisplayMessageLine2;
        this.DisplayMessageLine3;
        this.DisplayMessageLine4;
        ////////////////////////////////////////////////////////////////////////////////////////////
    }
}
CDisplayConfirmation.prototype.execute=async function () {
    var MessageList=[];
    var Options=[];
    var i=0;
    if(this.DisplayMessage)
    {
        MessageList[i]=this.DisplayMessage;
        i++;
    }
    if(this.DisplayMessageLine2)
    {
        MessageList[i]=this.DisplayMessageLine2;
        i++;
    }
    if(this.DisplayMessageLine3)
    {
        MessageList[i]=this.DisplayMessageLine3;
        i++;
    }
    if(this.DisplayMessageLine4)
    {
        MessageList[i]=this.DisplayMessageLine4;
        i++;
    }
    Options[0]=this.KeyF1;
    Options[1]=this.KeyF4;
    
    CUIHandler.socket.emit(SocketEvents.MiniPVMConfirmationEvent,MessageList,Options);
    var Selectedkey=await CUIHandler.GetMiniPVMUIEnteredData();
    Selectedkey=Selectedkey==Options[0]?"1":"4";
    this.AddTLVDataWithInput(Selectedkey);
	this.AddAmountFromXmlinTlV();
    return ExecutionResult._OK;
}
CDisplayConfirmation.prototype.AddPrivateParameters = function (tagAttribute) {
    this.KEY__F1 = tagAttribute.KEY__F1;
    this.KEY__F2 = tagAttribute.KEY__F2;
    this.KEY__F3 = tagAttribute.KEY__F3;
    this.KEY__F4 = tagAttribute.KEY__F4;
    this.KEY__ENTER = tagAttribute.KEY__ENTER;
    this.KEY__CANCEL = tagAttribute.KEY__CANCEL;
    this.KeyF1 = tagAttribute.KeyF1;
    this.KeyF2 = tagAttribute.KeyF2;
    this.KeyF3 = tagAttribute.KeyF3;
    this.KeyF4 = tagAttribute.KeyF4;
    this.DisplayMessage = tagAttribute.DisplayMessage;
    this.DisplayMessageLine2 = tagAttribute.DisplayMessageLine2;
    this.DisplayMessageLine3 = tagAttribute.DisplayMessageLine3;
    this.DisplayMessageLine4 = tagAttribute.DisplayMessageLine4;
    return RetVal.RET_OK;
}
module.exports = CDisplayConfirmation;