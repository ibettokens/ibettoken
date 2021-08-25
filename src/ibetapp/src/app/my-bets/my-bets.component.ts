import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ContractService } from '../services/contract.service';
import { TransactionDialogComponent } from '../transaction-dialog/transaction-dialog.component';

@Component({
  selector: 'app-my-bets',
  templateUrl: './my-bets.component.html',
  styleUrls: ['./my-bets.component.scss']
})
export class MyBetsComponent implements OnInit {
  public mybets: any[];
  submitting: boolean = false;
  constructor(@Inject(ContractService) private contractService: ContractService
  , public dialog: MatDialog, private router: Router) { }

  ngOnInit(): void {
    this.contractService.getMyBets()
    .then(bets => {
      console.log(bets);
      this.mybets = bets;
    })
    .catch(error =>{

    });
    
  }

  requestArbitration(betKey: string){

    this.submitting = true;
let self = this;
this.contractService.awakeArbitrationBet(betKey).then(betDetail => {
  this.submitting = false;
  console.log("Request Arbitration response" + betDetail);
        const dialogRef = this.dialog.open(TransactionDialogComponent, {
          width: '400px',
          data: {title: "Success: Request Arbitration", hash: betDetail, message: `Your transaction has been submitted. Please give it some time to be added to the blockchain. It will show under "My Bets" once this transaction has been confirmed.`}
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
    data: {title: "Error : Request Arbitration", hash: null, isError: true, message: displayErrorMessage}
  });

  dialogRef.afterClosed().subscribe(closedResult => {
    console.log('The dialog was closed');
  });
  self.submitting = false;
});
  }

  cancelBet(betKey: string){
    this.contractService.cancelBet(betKey)
    .then(bets => {
      console.log(bets);
    })
    .catch(error =>{

    });
  }

}
