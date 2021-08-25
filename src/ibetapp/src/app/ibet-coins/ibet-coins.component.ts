import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractService } from '../services/contract.service';
import { TransactionDialogComponent } from '../transaction-dialog/transaction-dialog.component';

@Component({
  selector: 'app-ibet-coins',
  templateUrl: './ibet-coins.component.html',
  styleUrls: ['./ibet-coins.component.scss']
})
export class IbetCoinsComponent implements OnInit {
  public requestingFromFaucet: boolean = false;

  constructor(@Inject(ContractService) private contractService: ContractService,
  private route: ActivatedRoute, public dialog: MatDialog, private router: Router) { }

  ngOnInit(): void {

  }

  requestFromFaucet(){
this.requestingFromFaucet = true;
    let self = this;

    this.contractService.requestFromFaucet()
    .then(transactionHash => {
      this.requestingFromFaucet = false;
        console.log("KKK"+ transactionHash);
            const dialogRef = this.dialog.open(TransactionDialogComponent, {
              width: '400px',
              data: {title: "Success: Request Token from faucet", hash: transactionHash, message: `Your transaction has been submitted. Please give it some time to be added to the blockchain. you shold receive some tokens from faucet once this transaction has been confirmed.`}
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
        data: {title: "Error: Request Token from faucet", hash: null, isError: true, message: displayErrorMessage}
      });
    
      dialogRef.afterClosed().subscribe(closedResult => {
        console.log('The dialog was closed');
      });
      self.requestingFromFaucet = false;
    });
  }

}
