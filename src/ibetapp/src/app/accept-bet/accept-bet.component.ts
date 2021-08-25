import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractService } from '../services/contract.service';
import { TransactionDialogComponent } from '../transaction-dialog/transaction-dialog.component';

@Component({
  selector: 'app-accept-bet',
  templateUrl: './accept-bet.component.html',
  styleUrls: ['./accept-bet.component.scss']
})
export class AcceptBetComponent implements OnInit {
  public betKey: any;
  public bet: any;
  public submitting: boolean;
  constructor(@Inject(ContractService) private contractService: ContractService,   private route: ActivatedRoute, public dialog: MatDialog, private router: Router) { 
    this.bet = {};
  }

  ngOnInit(): void {
    this.betKey = this.route.snapshot.paramMap.get('betKey');
    this.contractService.getBetDetails(this.betKey)
    .then(betDetail => {
      console.log(betDetail);
      this.bet = betDetail;
    })
    .catch(error =>{

    });
  }

  acceptBet(): void {
this.submitting = true;
let self = this;
this.contractService.acceptBet(this.betKey).then(betDetail => {
  this.submitting = false;
  console.log("Accept bet response" + betDetail);
        const dialogRef = this.dialog.open(TransactionDialogComponent, {
          width: '400px',
          data: {title: "Accept Bet", hash: betDetail, message: `Your transaction has been submitted. Please give it some time to be added to the blockchain. It will show under "My Bets" once this transaction has been confirmed.`}
        });
    
        dialogRef.afterClosed().subscribe(closedResult => {
          console.log('The dialog was closed');
          this.router.navigate(['mybets']);
        });
})
.catch(function(error: any){
  var errorMessage = error.message ?? error;
  var matches = errorMessage.match('\{.*\:\{.*\:.*\}\}');
  let displayErrorMessage = matches !=null ? JSON.parse(matches[0]).value.data.message: errorMessage;
  
  const dialogRef = self.dialog.open(TransactionDialogComponent, {
    width: '400px',
    data: {title: "Error : Accept Bet", hash: null, isError: true, message: displayErrorMessage}
  });

  dialogRef.afterClosed().subscribe(closedResult => {
    console.log('The dialog was closed');
  });
  self.submitting = false;
});
  }

}
