var net = require('net');
var Utils = require("./Utils");
var consts = require("../Constants/AppConsts");
var CUtils = new Utils();
var util = require('util');
const tls = require('tls');
var fs = require('fs');
var pem = require('pem')
var path = require('path');
//var CUIHandler=require("../app");//Added For response of html
var UIHandler=require("../core/classes/UIHandler");
var CUIHandler=new UIHandler().getInstance();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";//Added Because Certificate is Self Signed not signed by CA//
class CConx {
	constructor() {
		this.connType;
		this.m_pTerminalData = undefined;
		this.m_strErrMsg;
		this.m_bConnected = false;
		this.m_TPDU = new Uint8Array(6);
		this.m_iNacChunkSize;
		this.clientsocket;
	}
}
CConx.prototype.requestForDial = function () {
	return true;
}
CConx.prototype.waitForConnect = function (strPassedIP, iPort, bSSLFlag) {
	var conx = this;
	return new Promise((resolve, reject) => {
			if(bSSLFlag)
			{
				pem.createCertificate({selfSigned:true },function (err,keys){
					if (err) {
						CUIHandler.log(err.message);
					    resolve(false);
					}
                const options = {
					key:keys.clientKey,
					ca: keys.certificate
					 };
				conx.clientsocket=tls.connect(iPort,strPassedIP,options, () => {
			    conx.clientsocket.setNoDelay(true);
			    conx.clientsocket.setTimeout(120000);
				conx.m_bConnected = true;
				resolve(true);
			
		});
		conx.clientsocket.on('error', function (err) {
			CUIHandler.log(err.message);
			resolve(false);
		});
	});
	}
	else{
		conx.clientsocket=new net.Socket();
		conx.clientsocket.connect(iPort,strPassedIP, function (data, err) {
			 conx.clientsocket.setNoDelay(true);
			 conx.clientsocket.setTimeout(120000);
				
			if (err) {
				CUIHandler.log('Not able to connect with server');
				conx.m_bConnected = false;
				resolve(false);
			}
			else {
				conx.m_bConnected = true;
				resolve(true);
			}
		});
		conx.clientsocket.on('error', function (err) {
			CUIHandler.log(err.message);
			resolve(false);
		});
}
});
}
CConx.prototype.CConxC = function () {
	if (this.m_bConnected) {
		this.m_bConnected = false;
	}
	this.m_bConnected = false;
}
CConx.prototype.SetTPDU = function (chNII) {
	this.m_TPDU.fill(0x00);
	var csTemp;
	csTemp = "CConx::chNII = ";
	csTemp += util.format("%s", chNII);
	let bcdNII = Buffer.alloc(3);
	bcdNII.fill(0x00);
	bcdNII = CUtils.a2bcd(chNII);
	this.m_TPDU[0] = 0x60
	this.m_TPDU[1] = bcdNII[0];
	this.m_TPDU[2] = bcdNII[1];
	this.m_TPDU[3] = 0x00;
	this.m_TPDU[4] = 0x00;
}
CConx.prototype.send = function (bufferOut) {
	var conx = this;
	return new Promise((resolve, reject) => {
		var buffer = Buffer.from(bufferOut);
		var bIsSend = false;
		if (conx.m_bConnected == true) {
			conx.clientsocket.write(buffer, (err) => {
				if (!err) {
					bIsSend = true;
					resolve(bIsSend);
				}
				else {
					resolve(bIsSend);
				}
			})
		}
		else {
			CUIHandler.log("Connection is not formed");
			resolve(bIsSend);
		}
		conx.clientsocket.on('error', function (err) {
			resolve(false);
		})
	})
}
CConx.prototype.ReceivedCompletePacket = async function () {
	var conx = this;
	var bArrTempData;
	var iLengthToRead;
	var iOffset = 0;
	var iReadDataWaitTime = 2000;
	var bArrTempCompletePacket = new Uint8Array(10000);
	bArrTempData = await conx.receive();
	if (bArrTempData == null || bArrTempData.length <= 7) {
		return null;
	}
	else {
		iLengthToRead = (bArrTempData[5] & 0x000000FF);
		iLengthToRead <<= 8;
		iLengthToRead |= (bArrTempData[6] & 0x000000FF);
	}
	bArrTempCompletePacket.set(bArrTempData, iOffset);
	iOffset += bArrTempData.length;
	var iRetryCount = 0;
	while ((iOffset - 7) < iLengthToRead) {
		bArrTempData = await conx.receive();
		if (bArrTempData == null) {
			return null;
		}
		else {
			bArrTempCompletePacket.set(bArrTempData, iOffset);
			iOffset += bArrTempData.length;
			//TODO later Add Sleep of 20ms.
		}
		iRetryCount++;
		if (iRetryCount > 100) {
			return null;
		}
	}
	return bArrTempCompletePacket.slice(0, iOffset);
}
CConx.prototype.receive = function () {
	var conx = this;
	return new Promise((resolve, reject) => {
		conx.clientsocket.removeAllListeners('data');
		conx.clientsocket.on('data', function (data) {
			if (data) {
				resolve(Buffer.from(data));
			}
			else {
				CUIHandler.log("Receiving Unsuccesfull");
				resolve(null);
			}
			conx.clientsocket.on('error', function (err) {
				CUIHandler.log("Error:" + err);
				resolve(false);
			})
		})
		conx.clientsocket.on('error', function (err) {
			CUIHandler.log("Error:" + err);
			resolve(false);
		});
		conx.clientsocket.on('end', function (err) {
			conx.disconnect();
			resolve(false);
		})
	});
}
CConx.prototype.disconnect = function () {
	var conx=this;
	return new Promise((resolve, reject) => {
		conx.clientsocket.destroy();
		conx.clientsocket.on('close', function () {
		conx.m_bConnected = false;
		resolve(true);
	})
});
}
class Singleton {
	constructor() {
		if (!Singleton.instance) {
			Singleton.instance = new CConx();
		}
	}
	getInstance() {
		return Singleton.instance;
	}
}
module.exports = Singleton;
