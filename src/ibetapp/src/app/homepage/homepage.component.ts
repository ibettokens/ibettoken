import { AfterViewInit, Component, OnInit } from '@angular/core';

declare var $: any;

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent implements OnInit, AfterViewInit {
  panelOpenState = false;
  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    // $('.collapsible').collapsible();
  }
}
