var server=require("../server");

class CUIHandler{
    constructor()
    {
        this.socket=server.Socket;
        this.strOutputLogs="";
    }
}

CUIHandler.prototype.GetMiniPVMUIEnteredData=function()
{
    var UIResponse=this;
return new Promise((resolve, reject) => {
    UIResponse.socket.on('MiniPVMFormData',function(MiniPVMData)
{
    resolve(MiniPVMData.MiniPVMEnteredData);
});
UIResponse.socket.on('MiniPVM_Set_Menu_UI_Event',function(MiniPVMData)
{
    resolve(MiniPVMData.MiniPVMSelectedPosition);
});
UIResponse.socket.on('MiniPVM_Confirmation_Event',function(MiniPVMData)
{
    resolve(MiniPVMData.MiniPVMSelectedOption);
});
})
} 
CUIHandler.prototype.log=function(strmsg)
{
    var Clientid=server.Clientid;
    var DateTime=new Date().toLocaleString("India", { timeZone: "Asia/Kolkata" });
    var strStart="";
    if(strmsg.length>10 && strmsg.slice(0,9)=="ClientID[")
    {
     var strpart=strmsg.split("]");
     strFinal=strpart[0]+"]"+" "+DateTime+" "+"-"+strpart[1];
     strpart=strFinal.split("Time Elapsed");
     if(strpart[1])
     {
         strFinal+="]";
     }
    }
    else{
        strFinal="ClientID["+Clientid+"]"+" "+DateTime+" "+"- "+strmsg;

    }
    this.strOutputLogs+=strFinal+'<br>';
    console.log(strFinal);

}
class Singleton {
	constructor() {
		if (!Singleton.instance) {
			Singleton.instance =new CUIHandler();
		}
	}
	getInstance() {
		return Singleton.instance;
	}
}
module.exports = Singleton;

