import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { ContractService } from './services/contract.service';

declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'ibetapp';
  isConnected: boolean = false;
  constructor(@Inject(ContractService) private contractService: ContractService){

  }

  ngOnInit(): void {
    this.contractService.accountStatus$.subscribe(account =>{
        this.isConnected = true;
    });
  }

  async connect(){
    this.contractService.connectAccount();
  }

  ngAfterViewInit() {
    $('.sidenav').sidenav();
  }
}
