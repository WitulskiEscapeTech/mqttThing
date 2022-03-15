const mqtt = require('mqtt')

function getName(defaultName){
  const args = process.argv.slice(2);
  if(args.length > 0){
    return args[0]
  }
  else{
    return defaultName
  }
}

const topics = { 
  initTopic: "init"
}

const defaultName = "thing"

const thingSettings = {
  name: getName(defaultName),
  type: "activator",
}

const connectionOptions = {
  // Clean session
  clean: true,
  connectTimeout: 4000,
  // Auth
  clientId: thingSettings.name,

}
const client  = mqtt.connect('mqtt://localhost:1883', connectionOptions)

function init(){
  client.publish(topics.initTopic, JSON.stringify(thingSettings))
  console.log("Sent Inital Message, Awaiting Instruction")
}

client.on('connect', function () {
  console.log('Connected')

  init()
})

client.on('message', function (topic, message) {
  // message is Buffer
  console.log(message.toString())
})

