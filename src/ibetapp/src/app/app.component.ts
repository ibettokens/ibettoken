import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { ContractService } from './services/contract.service';
import { environment } from '../environments/environment';
import { config } from 'rxjs';
declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'ibetapp';
  isConnected: boolean = false;
  connectedAccount: any;
  connectedNetwork: any;
  connectedChain: any;
  isWrongChain: boolean = false;
  constructor(@Inject(ContractService) private contractService: ContractService){

  }

  ngOnInit(): void {
      this.contractService.accountStatus$.subscribe(accountSt =>{
      this.connectedAccount= accountSt.account;
      if( this.connectedNetwork != accountSt.network)
      {
            this.connectedNetwork = accountSt.network;
            this.connectedChain = accountSt.chainId;
            this.isWrongChain = this.connectedChain != null && this.connectedChain != environment.chain;
            console.log("conn:" + this.connectedChain);
            console.log("env:" + environment.chain);
      }
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
