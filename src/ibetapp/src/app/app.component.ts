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
  isWrongNetwork: boolean = false;
  constructor(@Inject(ContractService) private contractService: ContractService){

  }

  ngOnInit(): void {
      this.contractService.accountStatus$.subscribe(accountSt =>{
      this.connectedAccount= accountSt.account;
      if( this.connectedNetwork != accountSt.network)
      {
            this.connectedNetwork = accountSt.network;
            this.isWrongNetwork = this.connectedNetwork != null && this.connectedNetwork != environment.chain;
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
