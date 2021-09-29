var CBaseNode = require("../Classes/BaseNode").CBaseNode;
var RetVal = require("../Constants/RetVal");
var ExecutionResult = require("../Constants/ExecutionResult");
class CDisplayMessage extends CBaseNode {
    constructor(dbAccessor) {
        super(dbAccessor);
        this.DisplayMessage;
    }
}
CDisplayMessage.prototype.AddPrivateParameters = function (tagAttribute) {
    this.DisplayMessage = tagAttribute.DisplayMessage;
    return RetVal.RET_OK;
}
CDisplayMessage.prototype.execute = function () {
    this.AddAmountFromXmlinTlV();
    return ExecutionResult._OK;
}
module.exports = CDisplayMessage;