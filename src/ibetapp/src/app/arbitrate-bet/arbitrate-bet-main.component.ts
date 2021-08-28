import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractService } from '../services/contract.service';
import { TransactionDialogComponent } from '../transaction-dialog/transaction-dialog.component';

@Component({
  selector: 'app-arbitrate-bet-main',
  templateUrl: './arbitrate-bet-main.component.html',
  styleUrls: ['./arbitrate-bet-main.component.scss']
})
export class ArbitrateBetMainComponent implements OnInit {
  public pendingArbitrations: any[] = [];
  public isRegisteredAsArbitrator: boolean = true;
  public submitting: boolean = false;
  constructor(@Inject(ContractService) private contractService: ContractService,
  private route: ActivatedRoute, public dialog: MatDialog, private router: Router) { }

  ngOnInit(): void {
    this.contractService.getMyPendingArbitrations()
    .then(arbitrations => {
      console.log(arbitrations);
      this.isRegisteredAsArbitrator = true;
      this.pendingArbitrations = arbitrations;
    })
    .catch(error =>{
      if(error != null && error.message=="NOTREGISTERED"){
        this.isRegisteredAsArbitrator = false;
      }else{
        alert(error);
      }
    });
  }

  registerAsArbitrator(){
    let self = this;
    this.contractService.registerAsArbitrator()
    .then(transactionHash => {
      this.submitting = false;
        console.log("KKK"+ transactionHash);
            const dialogRef = this.dialog.open(TransactionDialogComponent, {
              width: '400px',
              data: {title: "Success: Register Arbitrator", hash: transactionHash, message: `Your transaction has been submitted. Please give it some time to be added to the blockchain. Bets will show under "Arbitrate Bet" once this transaction has been confirmed.`}
            });
        
            dialogRef.afterClosed().subscribe(closedResult => {
              console.log('The dialog was closed');
            });
    })
    .catch(function(error: any){
      var errorMessage = error.message ?? error;
      var matches = errorMessage.match('\{.*\:\{.*\:.*\}\}');
      let displayErrorMessage = matches !=null ? JSON.parse(matches[0]).value.data.message: errorMessage;
      const dialogRef = self.dialog.open(TransactionDialogComponent, {
        width: '400px',
        data: {title: "Error: Register Arbitrator", hash: null, isError: true, message: displayErrorMessage}
      });
    
      dialogRef.afterClosed().subscribe(closedResult => {
        console.log('The dialog was closed');
      });
      self.submitting = false;
    });
  }

}
