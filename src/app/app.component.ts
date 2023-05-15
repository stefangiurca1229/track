import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{

  title = 'track';
  // actionName: string = "";

  actions: string[] = [];

  editAction: string | null = null;

  sliderValue = 1;

  elementValue: string = "";

  timer: boolean = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
      this.actions = Object.keys(localStorage)
      chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
        var activeTab: chrome.tabs.Tab = tabs[0];
        if(activeTab.id)
        chrome.tabs.sendMessage(activeTab.id, {giveDataToExtension: true});
    });
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if('data' in message){
          this.actions = message.data.actions;
          // this.actionName = message.data.actionName;
          this.cdr.detectChanges()
        }
        if('receiveActions' in message){
          this.actions = message.receiveActions
          this.cdr.detectChanges()
        }
      });
  }

  execute(action: any){
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
    chrome.runtime.sendMessage({
      execute: {
                 actionName: action,
                 activeTab: tabs[0]
              }
  });
});

  }

  edit(editAction: string){
    console.log(editAction)
    this.editAction = editAction;
    this.cdr.detectChanges()
  }

  setTimer(){
    console.log(this.timer)
    this.timer = !this.timer
    this.cdr.detectChanges()
  }

  onSliderEnd() {
    console.log(this.sliderValue, this.editAction);
    console.log("urmeaza data ------------- ")
    chrome.storage.sync.get(this.editAction,  (data) => {
      console.log(data,this.editAction)
      if(this.editAction){
      chrome.storage.sync.set({ [this.editAction]:{ items: data[this.editAction]["items"], scheduler: this.sliderValue }}, function () {
      });
    }
    this.editAction = null;
    this.cdr.detectChanges()
    });
  }

  removeScheduler(){
   this.sliderValue = 0
  }

  onSliderChange(){
    console.log(this.sliderValue)
    this.cdr.detectChanges();
  }
}
