const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");
// const ZigoClient = require('./modal/Zigo')

const mqtt = require("mqtt");
const {
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
  readyState,
} = require("./globalConfig");
const axios = require("axios");

function getKeyByValue(map, searchValue) {
  for (const [key, value] of map) {
    if (value === searchValue) {
      return key;
    }
  }
  // If the value is not found, you can return null or any other appropriate value.
  return null;
}

//   ------  mqtt configarartion ----------

const host = "sonic.domainenroll.com";
const port = "1883";
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl = `mqtt://${host}:${port}`;
const password = "de120467";
const username = "domainenroll";


// const host = "44.202.67.39";
// const port = "1883";
// const clientId = "tebo333user";
// const connectUrl = `mqtt://${host}:${port}`;
// const password = "tebo333"
// const username = "tebo333user"
// ------- mqtt connection ---------

const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: username,
  password: password,
  reconnectPeriod: 1000,
});
// const userData = "/devlacus/hubo";
// var topic = "/devlacus/tebo";
// var topic = "/user_data";
// const baseMqttTopic = "Devlacus/Tebo/"
// var moveManual = "/move/manual"
// var moveCamera = "/move/camera"

var robotuuId = null;

client.on("connect", () => {
  console.log("Connected");

  client.subscribe([topic], () => {
    console.log(`Subscribe to topic '${topic}'`);
  });
  client.subscribe([userData], () => {
    console.log(`Subscribe to topic '${userData}'`);
  });
});

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Tebo server is Running");
});

// app.post("/zego",
//   ZigoClient
// );
const connectedUsers = new Map();
let peerConnectedUser = new Map();

io.use((socket, next) => {
  if (socket.handshake.query) {
    let callerId = socket.handshake.query.callerId;
    socket.user = callerId;
    next();
  }
});

io.on("connection", (socket) => {
  console.log("==================================== it is connected");
  socket.emit("me", socket.id);

  socket.join(socket.user);
  console.log(socket.user, "Connected");
 console.log(io.sockets.clients(),"io.sockets.clients()")
  socket.on("call", (data) => {
    let calleeId = data.calleeId;
    let rtcMessage = data.rtcMessage;

    console.log(connectedUsers,"🥴");

    socket.to(calleeId).emit("newCall", {
      callerId: socket.user,
      rtcMessage: rtcMessage,
    });
  });



  socket.on("answerCall", (data) => {
    let callerId = data.callerId;
    rtcMessage = data.rtcMessage;

    socket.to(callerId).emit("callAnswered", {
      callee: socket.user,
      rtcMessage: rtcMessage,
    });
  });

  socket.on("ICEcandidate", (data) => {
    console.log("ICEcandidate data.calleeId", data.calleeId);
    let calleeId = data.calleeId;
    let rtcMessage = data.rtcMessage;

    socket.to(calleeId).emit("ICEcandidate", {
      sender: socket.user,
      rtcMessage: rtcMessage,
    });
  });

  socket.on("setuuid", (data) => {
    robotuuId = data;
    // topic = `/devlacus/tebo/${data}`
    console.log(data, "uniqid");
  });

  socket.on("sentUserId", (userId) => {
    console.log("userId:", userId);
    connectedUsers.set(userId, socket.id);

    console.log(connectedUsers);
  });

  socket.on("getSocketId", (userId) => {
    const socketId = connectedUsers.get(userId);
    socket.emit("getSocketId", socketId);
  });

  socket.on("disconnect", () => {
    // socket.broadcast.emit("callEnded");

    connectedUsers.forEach((value, key) => {
      if (value === socket.id) {
        connectedUsers.delete(key);
      }
    });

    // connectedUsers.delete(userId);
  });

  socket.on("callUser", ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit("callUser", { signal: signalData, from, name });
    console.log(connectedUsers, "connected user");
  });

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });

  socket.on("disconnect-user", (userId) => {
    connectedUsers.delete(userId);

    console.log("User disconnected:", userId);
    console.log(connectedUsers);
  });

  // The below code is for Mqtt

  client.on("message", (topic, message) => {
    const payload = message.toString();
    // Emit the custom event to the frontend
    const topicParts = topic.split("/");
    const dynamicPart = `/${topicParts.slice(3).join("/")}`;

    // if (dynamicPart == batteryLevel) {
    //   axios.post(baseApiUrl + apiBatteryUrl, {
    //     robot_uuid: topicParts[2],
    //     charging: payload,
    //     battery_level: "",
    //   });
    // }
    // if (dynamicPart == batteryCharge) {
    //   axios.post(baseApiUrl + apiBatteryUrl, {
    //     robot_uuid: topicParts[2],
    //     charging: false,
    //     battery_level: payload,
    //   });
    // }
    if (dynamicPart == appConnection) {
      let parsePayload = JSON.parse(payload);

      let socketId = connectedUsers.get(parsePayload.robot_uuid);
      io.to(socketId).emit("mqttMessageReceived", payload);
    }
    const key = getKeyByValue(peerConnectedUser, topicParts[2]);
//  console.log(dynamicPart,"dynamicPart");
    if (dynamicPart == obstacle) {
      let socketId = connectedUsers.get(key);      
      io.to(socketId).emit("obstacleDetected", payload);
    }

    
    if (dynamicPart == mapState) {
      let socketId = connectedUsers.get(key);
      io.to(socketId).emit("mapState", payload);
    }

    if (dynamicPart == callState) {
      let socketId = connectedUsers.get(key);
      io.to(socketId).emit("call-state", payload);
    }
    // console.log(dynamicPart, "dynamicPart");

    // console.log(`Received MQTT message from topic '${topic}': ${payload}`);
  });

  socket.on("confirmuser", (payload) => {
    console.log("Received confirmuser event:", payload);
    const data = JSON.stringify(payload);
    client.publish(userData, data, { qos: 0, retain: false }, (error) => {
      if (error) {
        console.error(error);
      }
    });

    // Handle the payload data or perform any necessary operations
  });

  // The below code is for sent the initial connection

  socket.on("sentTo", (data) => {
    // console.log(data);

    client.publish(topic, data, { qos: 0, retain: false }, (error) => {
      if (error) {
        console.error(error);
      }
    });

    // client.subscribe([topic], (data) => {
    //   console.log(`Subscribe to topic '${data}'`);
    // });
    // client.subscribe([userData], () => {
    //   console.log(`Subscribe to topic '${data}'`);
    // });
  });

  // sending movement commands to robot

  socket.on("move-manual", (payload) => {
    const data = payload?.data?.toString();
    const Id = payload?.Id;
    console.log(
      "Received confirmuser event:",
      baseMqttTopic + `${Id}` + moveManual
    );

    client.publish(
      baseMqttTopic + `${Id}` + moveManual,
      data,
      { qos: 0, retain: false },
      (error) => {
        if (error) {
          console.error(error);
        }
      }
    );

    // Handle the payload data or perform any necessary operations
  });

  // tilt camera
  socket.on("tilt-camera", (payload, Id) => {
    const data = payload?.data?.toString();

    console.log(
      "Received confirmuser event:",
      baseMqttTopic + `${payload?.Id}` + moveCamera
    );

    client.publish(
      baseMqttTopic + `${payload?.Id}` + moveCamera,
      data,
      { qos: 0, retain: false },
      (error) => {
        if (error) {
          console.error(error);
        }
      }
    );
  });

  // Start Call

  socket.on("start-call", (payload) => {
    const StartCallData = " ";
    client.publish(
      baseMqttTopic + `${payload?.id}` + startCall,
      StartCallData,
      { qos: 0, retain: false },
      (error) => {
        if (error) {
          console.error(error);
        }
      }
    );
  });

  
// Start Mapping
  socket.on("start-mapping", (payload) => {
    console.log("jjjjj",payload);
    const StartCallData = " ";
    client.publish(
      baseMqttTopic + `${payload?.id}` + startMapping,
      StartCallData,
      { qos: 0, retain: false },
      (error) => {
        if (error) {
          console.error(error);
        }
      }
    );
  });

  
  // stopMapping
  socket.on("stopMapping", (payload) => {
    console.log("stopMapping",payload);
    let StopCallData = " ";
    client.publish(
      baseMqttTopic + `${payload?.id}` + stopMapping,
      StopCallData,
      { qos: 0, retain: false },
      (error) => {
        if (error) {
          console.error(error);
        }
      }
    );
  });


  

  socket.on("deleteMap", (payload) => {
    console.log("stopMapping",payload);
    let StopCallData = " ";
    client.publish(
      baseMqttTopic + `${payload?.id}` + deleteMap,
      StopCallData,
      { qos: 0, retain: false },
      (error) => {
        if (error) {
          console.error(error);
        }
      }
    );
  });
  // socket.on("start-mapping", (payload) => {
  //   console.log("Received start-mapping event");
  //   // Your server-side logic here
  // });



  // start-meeting
  socket.on("start-meeting", (payload) => {
    const callData = "call Started";
    console.log(
      baseMqttTopic + `${payload?.id}` + callState,
      "baseMqttTopic +`${payload?.id}`+ callState,"
    );
    client.publish(
      baseMqttTopic + `${payload?.id}` + callState,
      callData,
      { qos: 0, retain: false },
      (error) => {
        if (error) {
          console.error(error);
        }
      }
    );
  });

  // end-meeting
  socket.on("meeting-ended", (payload) => {
    const callData = "call ended";
    console.log(baseMqttTopic + `${payload?.id}` + callState, "call ended");
    socket.to(payload?.id).emit("callEndInfo", {
      data: callData,
    });
    client.publish(
      baseMqttTopic + `${payload?.id}` + callState,
      callData,
      { qos: 0, retain: false },
      (error) => {
        if (error) {
          console.error(error);
        }
      }
    );
  });

  // Set Map User
  socket.on("setMapUser", (payload) => {
    peerConnectedUser.set(payload.from, payload.toId);
    console.log(peerConnectedUser, "peerConnectedUser");
  });

  // tilt camera
  socket.on("end-meeting", (payload) => {
    const data = payload?.data?.toString();

    console.log(
      "Received confirmuser event:",
      baseMqttTopic + `${payload?.Id}` + moveCamera
    );

    client.publish(
      baseMqttTopic + `${payload?.Id}` + moveCamera,
      data,
      { qos: 0, retain: false },
      (error) => {
        if (error) {
          console.error(error);
        }
      }
    );
  });

  // GoTo Home
  socket.on("goto-home", (payload) => {
    const data = payload?.data?.toString();
    client.publish(
      baseMqttTopic + `${payload?.Id}` + gotoHome,
      data,
      { qos: 0, retain: false },
      (error) => {
        if (error) {
          console.error(error);
        }
      }
    );
  });

  // Goto Dock
  socket.on("goto-Dock", (payload) => {
    const data = payload?.data?.toString();
    client.publish(
      baseMqttTopic + `${payload?.Id}` + gotoDock,
      data,
      { qos: 0, retain: false },
      (error) => {
        if (error) {
          console.error(error);
        }
      }
    );
  });

  // Goto Meeting End
  socket.on("meeting-end", (payload) => {
    const data = payload?.data?.toString();

    client.publish(
      baseMqttTopic + `${payload?.Id}` + meetingEnd,
      data,
      { qos: 0, retain: false },
      (error) => {
        if (error) {
          console.error(error);
        }
      }
    );
  });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
