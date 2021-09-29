var ParserWrapper = require("./ParserWrapper");
var DOMParser = require('xmldom').DOMParser;
var nDepeth = 0;
var nIndex = 0;
var iCurrentDepth = 0;
var parser = new DOMParser();
class CPVMParser {
    constructor(DBAccessor) {
        this.m_objPineXMLParser;
        this.m_objPVMParser;
        this.m_pDBAccessor = DBAccessor;
    }
}
CPVMParser.prototype.parseMiniPVMXmlParams = function (strxml) {
    //Add try catch and retrun -1 if exception occurred
    var document = parser.parseFromString(strxml);
    document.documentElement.normalize();
    if (document.hasChildNodes()) {
        var CParserWrapper = new ParserWrapper(this.m_pDBAccessor);
        BuildXMLTree(document.childNodes, this.m_pDBAccessor);
    }
    return 0;
}
module.exports = CPVMParser;
function BuildXMLTree(nodeList, DBAccessor) {
    var ParserWrapperObj = new ParserWrapper(DBAccessor);
    for (var index = 0; index < nodeList.length; index++) {
        var node = nodeList.item(index);
        var type = node.nodeType;
        if (node.nodeType == 1) {
            if (node.hasAttributes) {
                var mapAttributes = node.attributes;
                ParserWrapperObj.AddNewNode(mapAttributes);
                if (iCurrentDepth == 0) {
                    ParserWrapperObj.SaveRootNode();
                }
                iCurrentDepth++;
            }
            if (node.hasChildNodes) {
                BuildXMLTree(node.childNodes, DBAccessor);
            }
            ParserWrapperObj.PopNode();
            iCurrentDepth--;
        }
    }
}
