import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { HomeComponent } from './home.component';
import {WindowRef} from "../shared/window/window-ref.service";
import {DomSanitizer} from "@angular/platform-browser";

@NgModule({
  imports: [CommonModule, SharedModule],
  declarations: [HomeComponent],
  exports: [HomeComponent],
  providers: [WindowRef]
})
export class HomeModule { }
