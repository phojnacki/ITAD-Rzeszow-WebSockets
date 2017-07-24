
/// <reference path="../../../../typings/globals/socket.io-client/index.d.ts" />

import { Component, OnInit } from '@angular/core';
import * as io from 'socket.io-client';
import {WindowRef} from "../shared/window/window-ref.service";
import {DomSanitizer} from "@angular/platform-browser";

/**
 * This class represents the lazy loaded HomeComponent.
 */
@Component({
  moduleId: module.id,
  selector: 'sd-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.css'],
})

export class HomeComponent implements OnInit {

  private socket;
  private thx = false;
  private nick: string;
  private id: string;
  private points: string;
  private color;
  public safePosition;
  public ax= 0;
  public ay = 0;
  public vx = 0;
  public vy = 0;
  public x = 0;
  public y = 0;

  constructor(private domSanitizer: DomSanitizer, private winRef: WindowRef) {}

  ngOnInit() {

  }
  connect(): boolean {
    this.socket = io();
    let browserWindow = this.winRef.nativeWindow;

    this.socket.onclose(this.socket.disconnect);
    this.socket.on('credentials', (data) => {
      this.id = data.id;
      this.color = data.color;
    });

    this.socket.on('points', (data) => {
      console.log(data);
      this.points = data;
    });

    this.socket.on('thx', (data) => {
      this.thx = true;
    });

    if (browserWindow.DeviceMotionEvent != undefined) {
      this.winRef.nativeWindow.addEventListener('devicemotion',
        (e) => {
        this.ax = browserWindow.event.accelerationIncludingGravity.x * 5;
        this.ay = browserWindow.event.accelerationIncludingGravity.y * 5;

        // document.getElementById("accelerationX").innerHTML = e.accelerationIncludingGravity.x;
        // document.getElementById("accelerationY").innerHTML = e.accelerationIncludingGravity.y;
        // document.getElementById("accelerationZ").innerHTML = e.accelerationIncludingGravity.z;
        //
        // if ( e.rotationRate ) {
        //   document.getElementById("rotationAlpha").innerHTML = e.rotationRate.alpha;
        //   document.getElementById("rotationBeta").innerHTML = e.rotationRate.beta;
        //   document.getElementById("rotationGamma").innerHTML = e.rotationRate.gamma;
        // }
          var landscapeOrientation = innerWidth/innerHeight > 1;
          if ( landscapeOrientation) {

            this.vx = this.vx + this.ay;
            this.vy = this.vy + this.ax;
          } else {
            this.vy = this.vy - this.ay;
            this.vx = this.vx + this.ax;
          }
          this.vx = this.vx * 0.98;
          this.vy = this.vy * 0.98;
          this.y = parseInt(this.y + this.vy / 50);
          this.x = parseInt(this.x + this.vx / 50);

          // bounding box check
          if (this.x<0) { this.x = 0; this.vx = -this.vx; }
          if (this.y<0) { this.y = 0; this.vy = -this.vy; }
          if (this.x>document.documentElement.clientWidth-20) { this.x = document.documentElement.clientWidth-20; this.vx = -this.vx; }
          if (this.y>document.documentElement.clientHeight-20) { this.y = document.documentElement.clientHeight-20; this.vy = -this.vy; }

          this.safePosition = this.domSanitizer.bypassSecurityTrustStyle('translate(' + this.x + 'px, ' + this.y +'px)');
          this.socket.emit('bubble', {nick: this.nick, x:this.x/document.documentElement.clientWidth, y:this.y/document.documentElement.clientHeight});
      });
      //
      // browserWindow.setInterval(() => {
      //
      // }, 25);
    }



    return false;
  }

}
