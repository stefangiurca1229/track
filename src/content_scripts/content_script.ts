console.log("--------------- from content.js ---------------------------------", chrome.runtime)

chrome.runtime.sendMessage({
    giveRecordingStatus: {}
})

let isRecording: boolean = false;
let actionName: string = "";
var startTime = new Date().getTime()
let textComparation = false

function identifyUniqueElement(element: Element | null) {
    let unique = false
    let elements: (Element | null)[] | [] = []
    let path: number[] = []

    let elementMap = {
        id: "",
        class: "",
        tag: "",
        path: path
    }

    while (unique == false && element instanceof Element) {
        const tag = element.tagName; // Get the tag name of the element
        const classes = element.classList; // Get the class list of the element
        const id = element.id; // Get the ID of the element
        const attributes = element.attributes;

        elementMap.tag = tag

        if (id) {
            elements = [document.getElementById(id)]
            elementMap.id = id
        }

        let classString = "."
        for (let i = 0; i < classes.length; i++) {
            classString += classes[i] + " ";
        }

        if (elements.length > 1 && classString != ".") {
            elementMap.class = classString
            classes.forEach(cls => {
                elements = elements.filter(element => element?.classList?.contains(cls) && element);
            });
        } else if (elements.length == 0 && classString != ".") {
            elementMap.class = classString
            elements = Array.from(document.querySelectorAll(classString))
        }

        if (elements.length > 1) {
            elements = elements.filter(element => element?.tagName === tag && element);
        } else if (elements.length == 0) {
            elements = Array.from(document.getElementsByTagName(tag));
        }

        if (elements.length != 1) {
            if(element?.parentNode){
            var index = Array.prototype.indexOf.call(element.parentNode.childNodes, element);
            path = [index].concat(path);
            }
            elementMap = {
                id: "",
                class: "",
                tag: "",
                path: path
            }
            element = element.parentElement as HTMLElement
        } else {
            unique = true;
        }

    }
    return elementMap
}

function eventFunction(event: any, action: String) {

    if (isRecording == true) {
        chrome.storage.sync.get(actionName, function (data) {

            let element: Element = event.target;

            let elementMap = identifyUniqueElement(element)
            let elementText = element.textContent;
            let comparationText = null
            if(textComparation){
               while(comparationText == null){
                   comparationText = window.prompt("enter the text to be comparated with " + elementText + ": ");
               }
            }
            textComparation = false
            let newItems = [{
                time: new Date().getTime() - startTime,
                event: action,
                url: window.location.href,
                elementMap: elementMap,
                value: event.data,
                comparationText: comparationText
            }];
            if (data[actionName]["items"]) {
                newItems = data[actionName]["items"].concat(newItems)
            }

            chrome.storage.sync.set({ [actionName]:{ items: newItems, scheduler: data[actionName]["scheduler"]} }, function () {
            });
        })
    }
}

function getElementByMap(elementMap: any) {

    let element: any[] = []
    if (elementMap.id != "") {
        element = [document.getElementById(elementMap.id)]
    }

    if (elementMap.class != "") {
        let cls = elementMap.class.substring(1)
        let classes = cls.split(' ')

        if (element.length > 1) {
            classes.forEach((cl: any) => {
                element = element.filter(el => el?.classList?.contains(cl));
            });
        } else if (element.length == 0) {
            classes.forEach((cl: any) => {
                if (element.length == 0) {
                    element = Array.from(document.getElementsByClassName(cl));
                } else if(cl != '') {
                    element = element.filter(el => el?.classList?.contains(cl))
                }
            });
        }
    }

    if (elementMap.tag != "" && elementMap.tag) {
        if (element.length > 1) {
           element = element.filter( el => el.tagName === elementMap.tag)
        } else if (element.length == 0) {
          element = [document.getElementsByTagName(elementMap.tag)]
        }
    }

        if (elementMap.path.length>0) {

           elementMap.path.forEach((pth: number) => {
            if(element[0].childNodes[pth])
            element[0] = element[0].childNodes[pth]
           });
        }

        return element[0] as HTMLElement
    }

    document.addEventListener("click", (event) => {
        if(isRecording)
        eventFunction(event, "click");
    });

    document.addEventListener("input", (event) => {
        eventFunction(event,"input")
    });

    //alt + c event
    // used for text comparation

    window.addEventListener('keydown', function(event) {
        // Check if the user pressed "Alt + C"
        if (event.altKey && event.key === 'c') {
          textComparation = true;
        }
      });

    document.addEventListener("contextmenu",()=>{
        isRecording  = !isRecording
        // actionName = document.title
        
        if(isRecording){
        let actionNameFromAlert = null;
        while(!actionNameFromAlert){
           actionNameFromAlert = window.prompt("Please enter your input value:");
        }
        actionName = actionNameFromAlert;

        chrome.storage.sync.set({ [actionName]: { items: [] , scheduler: null }}, function () {
        });
        startTime = new Date().getTime()
        }
        else{
        alert("stop recording")
        actionName = ""
        chrome.storage.sync.get(null, function (data) {
            let keys = Object.keys(data);
            chrome.runtime.sendMessage({
                type: 'data', data: {
                    actionName: actionName,
                    actions: keys
                }
            });
        });
        }
        chrome.runtime.sendMessage({
            receiveRecording:{
                recording: isRecording,
                actionName: actionName,
                startTime: startTime
            }
        })
    })

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if ("executeAction" in message) {
                    const { elementMap, event, value, comparationText} = message.executeAction
                        var element: any = getElementByMap(elementMap);
                        console.log("element executed: ", element.textContent, comparationText)
                        if(comparationText){
                        if(comparationText > element.textContent){
                            alert("pret mai mic detectat")
                        }
                    }
                        if (event == "click") {
                                const event = new MouseEvent('click', {
                                    view: window,
                                    bubbles: true,
                                    cancelable: true
                                  });
                                  element.dispatchEvent(event)
                        }else if(event === "input"){
                           element.value += value
                        }
        } 
        else if ('giveDataToExtension' in message) {
            chrome.storage.sync.get(null, function (data) {
                let keys = Object.keys(data);
                chrome.runtime.sendMessage({
                    type: 'data', data: {
                        actionName: actionName,
                        actions: keys,
                        startTime: startTime
                    }
                });
            });
        }else if('recordingStatus' in message){
            isRecording = message.recordingStatus.isRecording
            actionName = message.recordingStatus.actionName
            startTime = message.recordingStatus.startTime
        } 
    });
