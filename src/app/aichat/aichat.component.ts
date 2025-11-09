import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { commonImports } from '../shared/table-interface';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { AichatService } from '../aichat.service';

@Component({
  selector: 'app-aichat',
  imports: [...commonImports, CommonModule, MatSelectModule],
  host: {
    class: "aichat"
  },
  templateUrl: './aichat.component.html',
  styleUrl: './aichat.component.scss'
})
export class AichatComponent {
  aiServ = inject(AichatService);
  opened: boolean = false;

  @ViewChild('chatbox') chatbox!: ElementRef

  ngOnInit() {
    this.aiServ.openAndC.subscribe((e: boolean) => {
      this.opened = e;
    })


  }

  closeAi() {
    this.aiServ.openAndC.next(false);
  }

  responseToInput(event: any) {
    console.log(event);
    event.target.style.height = 'auto';
    const scrollHeight = event.target.scrollHeight;
    event.target.style.height = `${event.target.scrollHeight + 2}px`;
  }
  @ViewChild('stage') stage!: ElementRef

  sendChat(val: any) {
    this.chat_me_resp += `<p></p><p>${val}</p>`
    // this.stage.nativeElement.style.height = 'auto';
    const scrollHeight = this.stage.nativeElement.scrollHeight;
    const hh = this.stage.nativeElement.clientHeight;
    console.log(hh, scrollHeight);
    //scrolltobottom


    this.stage.nativeElement.scroll({ y: scrollHeight - hh })
    // this.stage.nativeElement.style.height = `${this.stage.nativeElement.scrollHeight + 2}px`;

  }

  chat_me_resp = ""
}
