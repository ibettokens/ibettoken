import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractService } from '../services/contract.service';
import { TransactionDialogComponent } from '../transaction-dialog/transaction-dialog.component';

@Component({
  selector: 'app-arbitrate-bet',
  templateUrl: './arbitrate-bet.component.html',
  styleUrls: ['./arbitrate-bet.component.scss'],
})
export class ArbitrateBetComponent implements OnInit {
  public betKey: any;
  public outcome: string;
  public bet: any;
  public submitting: boolean;
  constructor(
    @Inject(ContractService) private contractService: ContractService,
    private route: ActivatedRoute, public dialog: MatDialog, private router: Router
  ) {
    this.bet = {};
  }

  ngOnInit(): void {
    this.betKey = this.route.snapshot.paramMap.get('betKey');
    this.contractService
      .getBetDetails(this.betKey)
      .then((betDetail) => {
        console.log(betDetail);
        this.bet = betDetail;
      })
      .catch((error) => {});
  }

  arbitrateBet(): void {
    if(this.outcome == undefined) return;
    this.submitting = true;
    let self = this;

    this.contractService.arbitrateBet(this.betKey, this.outcome)
    .then(transactionHash => {
      this.submitting = false;
        console.log("KKK"+ transactionHash);
            const dialogRef = this.dialog.open(TransactionDialogComponent, {
              width: '400px',
              data: {title: "Success: Arbitrate Bet", hash: transactionHash, message: `Your transaction has been submitted. Please give it some time to be added to the blockchain. It will show under "My Bets" once this transaction has been confirmed.`}
            });
        
            dialogRef.afterClosed().subscribe(closedResult => {
              console.log('The dialog was closed');
              this.router.navigate(['mybets']);
            });
    })
    .catch(function(error: any){
      console.log(error);
      var errorMessage = error.message ?? error;
      var matches = errorMessage.match('\{.*\:\{.*\:.*\}\}');
      let displayErrorMessage = matches !=null ? JSON.parse(matches[0]).value.data.message: errorMessage;
      const dialogRef = self.dialog.open(TransactionDialogComponent, {
        width: '400px',
        data: {title: "Error: Arbitrate Bet", hash: null, isError: true, message: displayErrorMessage}
      });
    
      dialogRef.afterClosed().subscribe(closedResult => {
        console.log('The dialog was closed');
      });
      self.submitting = false;
    });
  }
}
