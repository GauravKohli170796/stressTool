var CBaseNode = require("./BaseNode");
var Utils = require("./Utils");
var CUtils = new Utils();
var CPVMParser = require("./PVMParser");
var fs=require('fs');
var path=require('path');
class CAppController {
	constructor() {
		this.m_bRunMiniPVm = false;
		this.m_pRootNode = null;
		this.m_pMiniPvmNode = null;
		this.m_Singleton = null;
	}
}
CAppController.prototype.RunMiniPvm =async function (bArrMiniPVMXml, DBAccessor) {
	this.m_bRunMiniPVm = true;
	var objPVMParser = new CPVMParser(DBAccessor);
	var strMiniPVMXml = CUtils.Bytes2String(bArrMiniPVMXml);
	objPVMParser.parseMiniPVMXmlParams(strMiniPVMXml);
	var pMiniPVMNode = this.m_pMiniPvmNode;
	while (pMiniPVMNode) {
		pMiniPVMNode =await pMiniPVMNode.run();
	}
}
// CAppController.prototype.RunMiniPvm =async function (bArrMiniPVMXml, DBAccessor) {
// 	this.m_bRunMiniPVm = true;
// 	var objPVMParser = new CPVMParser(DBAccessor);
// 	//var strMiniPVMXml = CUtils.Bytes2String(bArrMiniPVMXml);
// 	var strMiniPVMXml=fs.readFileSync(path.join(__dirname,'MiniPVM.xml')).toString();
// 	objPVMParser.parseMiniPVMXmlParams(strMiniPVMXml);
// 	var pMiniPVMNode = this.m_pMiniPvmNode;
// 	while (pMiniPVMNode) {
// 		pMiniPVMNode =await pMiniPVMNode.run();
// 	}
// }

// CAppController.prototype.RunMiniPvm =async function(DBAccessor) {
// 	this.m_bRunMiniPVm = true;
// 	var objPVMParser = new CPVMParser(DBAccessor);
//  // var strMiniPVMXml = CUtils.Bytes2String(bArrMiniPVMXml);
//  var strMiniPVMXml=fs.readFileSync(path.join(__dirname,'MiniPVM.xml')).toString();
//  objPVMParser.parseMiniPVMXmlParams(strMiniPVMXml);
//  var pMiniPVMNode = this.m_pMiniPvmNode;
//  while (pMiniPVMNode) {
// 	 pMiniPVMNode =await  pMiniPVMNode.run();
//  }
// }
CAppController.prototype.SetRootNode = function (currentNode) {
	if (this.m_bRunMiniPVm) {
		this.m_pMiniPvmNode = currentNode;
	}
	else {
		this.m_pRootNode = currentNode;
	}
}
CAppController.prototype.IsMiniPVMRunning = function () {
	return this.m_bRunMiniPVm;
}
CAppController.prototype.GetMiniPVMRootNode = function () {
	return this.m_pMiniPvmNode;
}
CAppController.prototype.GetRootNode = function () {
	return this.m_pRootNode;
}
class Singleton {
	constructor() {
		if (!Singleton.instance) {
			Singleton.instance = new CAppController();
		}
	}
	GetInstance() {
		return Singleton.instance;
	}
}
module.exports = Singleton;
