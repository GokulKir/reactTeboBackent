const userData = "/devlacus/hubo";
// var topic = "/user_data";
 var topic = "Devlacus/Tebo/#";
const baseMqttTopic = "Devlacus/Tebo/"
var moveManual = "/move/manual"
// var moveCamera = "/action/deleteMap"
var moveCamera = "move/tilt"
const gotoHome  = "/action/goHome"
const gotoDock = "/info/dock"
const meetingEnd = "/info/meetend"
const batteryLevel = "/info/batteryLevel"
const batteryCharge = "/info/chargingStatus"
const appConnection ="/info/connectTebo";
const obstacle = "/info/obstacle";
const callState = "/info/callState";
const startCall = "/action/start";
const startMapping = "/action/startMapping";
const stopMapping = "/action/stopMapping";
const deleteMap = '/action/deleteMap';
const readyState = "/info/readyState";

const mapState = "/info/mapState"

// const getAllChannel = "https://tebo.domainenroll.com/api/v1"


const baseApiUrl = "https://tebo.domainenroll.com/api/v1"

const apiBatteryUrl = '/battery-details'


module.exports = {
    userData,
    topic,
    baseMqttTopic,
    moveManual,
    moveCamera,
    gotoHome,
    gotoDock,
    meetingEnd,
    batteryLevel,
    baseApiUrl,
    apiBatteryUrl,
    batteryCharge,
    appConnection,
    obstacle,
    callState,
    startCall,
    startMapping,
    stopMapping,
    deleteMap,
    mapState,
    readyState
}