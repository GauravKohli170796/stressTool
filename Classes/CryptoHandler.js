var crypto = require('crypto');
var Utils=require("./Utils");
var Consts=require("../Constants/AppConsts");
var CUtils=new Utils();
class CryptoHandler{
    constructor()
    {
    }
}
CryptoHandler.prototype.TripleDesDecrypt=function(bArrDataToDecrypt,bArrKey)
{
    if(bArrDataToDecrypt==null || bArrKey==null)
    {
        return null;
    }
    var iv=null;
    var algoName = 'des-ede3';
    var bIsAutoPad=false;
    var finalkey=new Uint8Array(24);
    finalkey.set(bArrKey.slice(0,16),0);
    finalkey.set(finalkey.slice(0,8),16);
    var BufferDataToDecrypt=Buffer.from(bArrDataToDecrypt); 
    var cryptoDecipher = crypto.createDecipheriv(algoName,finalkey, iv);
    cryptoDecipher.setAutoPadding(bIsAutoPad);
    var bArrDecryptedData = cryptoDecipher.update(BufferDataToDecrypt,'utf8');
    return bArrDecryptedData;
}
CryptoHandler.prototype.GetSHA1=function(InputDataStringOrBytes)
{
    if(InputDataStringOrBytes==null)
    {
        return null;
    }	
    var len=InputDataStringOrBytes.length;									
    var crypto = require('crypto');
    var objHashSHA1 = crypto.createHash('sha1');
    var strHasheddata = objHashSHA1.update(InputDataStringOrBytes, 'utf-8');
       var finalHash= strHasheddata.digest('hex').toUpperCase();
    return finalHash;						
}
CryptoHandler.prototype.XOREncrypt=function(dbAccessor,bArrDataToEncrypt,iEncryptionType)
{
    var bArrKey= this.GetEncyptionKey(dbAccessor,iEncryptionType);
    if(bArrKey==null)
        return null;
    var iKeySize=bArrKey.length;
    var bArrEncryptedData=new Int8Array(bArrDataToEncrypt.length);
    for(var i=0; i<bArrDataToEncrypt.length; i++) {
        bArrEncryptedData[i]=this.CircularLeftRotate(bArrDataToEncrypt[i] ^ 0xFF,(bArrKey[i%iKeySize]) & 0x00FF);
    }
  return bArrEncryptedData;
}
CryptoHandler.prototype.XORDecrypt=function(dbAccessor,bArrDataToDecrypt,iEncryptionType)
{
    var bArrKey= this.GetEncyptionKey(dbAccessor,iEncryptionType);
    if(bArrKey==null)
        return null;
    var iKeySize=bArrKey.length;
    var bArrDecryptedData=new Int8Array(bArrDataToDecrypt.length);
    for(var i=0; i<bArrDataToDecrypt.length; i++) {
        bArrDecryptedData[i]=(this.CircularRightRotate(bArrDataToDecrypt[i],(bArrKey[i%iKeySize]) &0x00FF) ^0xFF) & (0xFF);
    }
  return bArrDecryptedData;
}
CryptoHandler.prototype.CircularLeftRotate=function(byteToRotate,iNumberOfTimes)
{
    while((iNumberOfTimes-- > 0)){
        byteToRotate = (byteToRotate<<1) | ((byteToRotate & 0x80)>>7);
    }
    return byteToRotate;
}
CryptoHandler.prototype.CircularRightRotate=function(byteToRotate, iNumberOfTimes)
{
    while((iNumberOfTimes-- > 0)){
        byteToRotate = (byteToRotate>>1 &0x7F) | ((byteToRotate & 0x01)<<7);
    }
    return byteToRotate;
}
CryptoHandler.prototype.GetEncyptionKey=function(dbAccessor,iEncryptionType)
{
   var key=null;
    switch(iEncryptionType)
    {
        case Consts.SERIAL_LINK_ENCRYPTION:
             key=CUtils.String2Bytes("GODISGREAT");
             break;
        case Consts.USER_DATA_ENCRYPTION: 
             var strSerialNumber=dbAccessor.m_sParamData.HwSerialNumber;
             if(strSerialNumber.length<15){
                key=strSerialNumber.padStart(15,'0');
             }
             else{
                 var iSkipLength=strSerialNumber.length-15;
                 key=strSerialNumber.substr(iSkipLength,strSerialNumber.length);
             }  
             break; 
    }
    return key;
}
CryptoHandler.prototype.GetHashEncKey_PMK_HSM=function(strData1,strData2,strData3)
{
    if(strData1==null || strData2==null || strData3==null)
    {
        return null;
    }
    var bArrHash1=CUtils.a2bcd(this.GetSHA1(strData1));
    var bArrHash2=CUtils.a2bcd(this.GetSHA1(strData2));
    var bArrHash3=CUtils.a2bcd(this.GetSHA1(strData3));
    var bArrtempResult=this.XOR(bArrHash1,bArrHash2,bArrHash1.length);
    var bArrFinalResult=this.XOR(bArrtempResult,bArrHash3,bArrHash3.length);
    return bArrFinalResult;
}
CryptoHandler.prototype.XOR=function(bArrData1,bArrData2,iLength)
{
    if(bArrData1==null || bArrData2==null)
    {
        return null;
    }
    var bArrOutputData = new Int8Array(iLength);
    for(var i = 0; i < iLength ; i++)
    {
        bArrOutputData[i] = (bArrData1[i]) ^ bArrData2[i];
    }
    return bArrOutputData;
}
CryptoHandler.prototype.GetChecksum=function(bArrKey)
{
    if(bArrKey==null){
        return null;
    }
    var bArrencrptioninputtemp=new Uint8Array(8);
    var bArrCheckSum=this.TripleDesEncrypt(bArrencrptioninputtemp,bArrKey,'0');
    return bArrCheckSum;
}
CryptoHandler.prototype.TripleDesEncrypt=function(bArrDataToEncrypt,bArrKey,padChar)
{
    if(bArrDataToEncrypt==null || bArrKey==null)
    {
        return null;
    }
    var iInputLength=bArrDataToEncrypt.length; 
    var iRemainder=iInputLength%8;
    var bArrDataToEncryption=new Uint8Array(iInputLength+iRemainder);
    bArrDataToEncryption.set(bArrDataToEncrypt,0);
    if(iRemainder!=0){
        bArrDataToEncryption.fill(padChar.charCodeAt(0),iInputLength,iInputLength+iRemainder);
    }
    var iv=null;
    var algoName = 'des-ede3';
    var bIsAutoPad=false;
    var finalkey=new Uint8Array(24);
    finalkey.set(bArrKey.slice(0,16),0);
    finalkey.set(finalkey.slice(0,8),16);
    var Bufferfinalkey=Buffer.from(finalkey);
    var BufferDataToEncrypt=Buffer.from(bArrDataToEncryption);
    var cryptoCipher = crypto.createCipheriv(algoName,Bufferfinalkey,iv);
    cryptoCipher.setAutoPadding(bIsAutoPad);  //default true  
    var strEncryptedData = cryptoCipher.update(BufferDataToEncrypt,'utf8');
    return strEncryptedData;
}
module.exports=CryptoHandler;