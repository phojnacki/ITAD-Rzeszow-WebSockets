

/// <reference path="../../../../typings/globals/socket.io-client/index.d.ts" />

import {Component, OnInit} from '@angular/core';
import * as io from 'socket.io-client';
import {DomSanitizer} from "@angular/platform-browser";

/**
 * This class represents the lazy loaded AboutComponent.
 */
@Component({
  moduleId: module.id,
  selector: 'sd-about',
  templateUrl: 'about.component.html',
  styleUrls: ['about.component.css']
})
export class AboutComponent implements OnInit {

  private socket;
  private gameStarted = false;
  private hallOfFame;
  public avg = 0;
  public bubbles : any[] = [];
  private currentLeaders;

  constructor(private domSanitizer: DomSanitizer) {}

  ngOnInit() {
    this.socket = io();
    this.socket.onclose(this.socket.disconnect);
    this.socket.on('hallOfFame', (data) => {
      this.hallOfFame = data;
      this.gameStarted = false;
    });

    this.socket.on('update', (data) => {
      var x = data.x * document.documentElement.clientWidth;
      var y = data.y * document.documentElement.clientHeight;
      var bubbleToUpdate = this.bubbles.find(b => b.id == data.id);
      if (bubbleToUpdate) {
        bubbleToUpdate.translation = this.domSanitizer.bypassSecurityTrustStyle('translate(' + x + 'px, ' + y +'px)');
      } else {
        this.bubbles.push({id: data.id, color: data.color, translation: this.domSanitizer.bypassSecurityTrustStyle('translate(' + x + 'px, ' + y +'px)')});
      }

    });

    this.socket.on('currentLeaders', (leaders) => {
       this.currentLeaders = leaders;
    });
  }

  startGame() {
    this.socket.emit('startGame');
    this.gameStarted = true;
  }

  stopGame() {
    this.socket.emit('stopGame');
  }

  thx() {
    this.socket.emit('thx');
  }

}


