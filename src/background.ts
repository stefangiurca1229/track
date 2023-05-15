console.log("background script is running")

let recording = false

let activeTab: any

let actionNameBackground: string = ""

let startTimeBackground: any = new Date().getTime();

let interval: any

function sendActions(actions: any){
  for(let i=0; i<actions.length; i++){
    const { time } = actions[i]
  setTimeout(() => {
      if(activeTab.id)
      chrome.tabs.sendMessage(activeTab.id, {
          executeAction: actions[i]
      });
  }, time)
}
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if ('receiveRecording' in message) {
    recording = message.receiveRecording.recording
    actionNameBackground = message.receiveRecording.actionName
    startTimeBackground = message.receiveRecording.startTime

}else if('giveRecordingStatus' in message){
  chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
    activeTab = tabs[0] ? tabs[0] : activeTab
    if(activeTab.id)
    chrome.tabs.sendMessage(activeTab.id, {
      recordingStatus:{
        isRecording: recording,
        actionName: actionNameBackground,
        startTime: startTimeBackground
      }
    });
    });
}else if ("execute" in message) {
    activeTab = message.execute.activeTab;
  chrome.storage.sync.get(message.execute.actionName, function (data) {
      let actions = data[message.execute.actionName]["items"]
      let scheduler = data[message.execute.actionName]["scheduler"]
      console.log("scheduler: ", scheduler, data, actions)
      if(interval){
        clearInterval(interval)
      }
      if(scheduler){
       interval = setInterval(()=>{
          sendActions(actions)
         }, scheduler*1000*10) //sec
      }else{
        sendActions(actions)
      }
      
      });
} 
  });
  