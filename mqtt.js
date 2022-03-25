const mqtt = require('mqtt');
const { json } = require('stream/consumers');

const settings = [
  {name: "thing1", type: "activator"},
  {name: "activator1", type: "activator"},
  {name: "listener1", type: "listener"},
  {name: "listener2", type: "listener"},
]

function getSettings(){
  const args = process.argv.slice(2);
  if(args.length > 0){
    return settings[args[0]]
  }
  else{
    return settings[0]
  }
}

const thingSettings = getSettings()

let topics = { 
  initTopic: "init",
  listenTopic: "",
  publishTopics: []
}

const connectionOptions = {
  // Clean session
  clean: true,
  connectTimeout: 4000,
  // Auth
  clientId: thingSettings.name,

}
const client  = mqtt.connect('mqtt://localhost:1883', connectionOptions)

function listenForMessages(topic){
  client.subscribe(topic, function (err) {
    if (!err) {
      console.log("Listening for messages...")
    }
    if(err){
        console.log(err)
    }
  })
}

function init(){
  response = {
    msgType: "init",
    from: thingSettings.name,
    to: "backend",
    content: thingSettings
  }
  listenForMessages(topics.initTopic)
  client.publish(topics.initTopic, JSON.stringify(response))
  console.log("Sent Inital Message, Awaiting Instruction")
}

client.on('connect', function () {
  console.log('Connected')

  init()
})

function changeListenTopic(newTopic){
  console.log("Changing Listen Topic to ".concat(newTopic))

  if(topics.listenTopic != ""){
    client.unsubscribe(topics.listenTopic, function (err) {
      if (!err) {
        console.log("Successfully Unsubed")
      }
      if(err){
          console.log(err)
      }
    })
  }

  client.subscribe(newTopic, function (err) {
    if (!err) {
      console.log("Listening for new events...")
    }
    if(err){
        console.log(err)
    }
  })
  topics.listenTopic = newTopic
}

function handleEvent(){
  console.log("We were notified that the activator was activated!!!!")
}

function activateOnPublishTopics(){
  message = {
    msgType: "event",
    from: thingSettings.name,
    content: "activate"
  }
  console.log(topics.publishTopics.length)
  for(let i=0; i<topics.publishTopics.length; i++){
    console.log(topics.publishTopics[i])
    client.publish(topics.publishTopics[i], JSON.stringify(message))
  }
}

function setPublishTopics(_topics){
  console.log(_topics)
  topics.publishTopics = _topics
}

function handleMessge(topic, message){
  console.log(message)
  if(message.msgType == "newTopic" && thingSettings.type == "listener"){
    changeListenTopic(message.content)
  }
  else if(message.msgType == "newTopic" && thingSettings.type == "activator"){
    setPublishTopics(message.content)
    activateOnPublishTopics() //This is only to test!!!
  }
  else if(message.msgType == "event" && thingSettings.type == "listener"){
    handleEvent()
  }
}


client.on('message', function (topic, message) {
  // message is Buffer
  let jsonMessage = JSON.parse(message)
  if(topic == topics.initTopic){
    if(jsonMessage.to == thingSettings.name){
      handleMessge(topic, jsonMessage)
    }
  }
  else{
    handleMessge(topic, jsonMessage)
  }
  
})

