import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Console } from 'console';
import { ContractService } from '../services/contract.service';
import { Bet } from '../services/shared.model';
import { TransactionDialogComponent } from '../transaction-dialog/transaction-dialog.component';

declare var $: any;

@Component({
  selector: 'app-create-bet',
  templateUrl: './create-bet.component.html',
  styleUrls: ['./create-bet.component.scss']
})
export class CreateBetComponent implements OnInit, AfterViewInit  {
  @ViewChild('input-create-bet-event-date') inputDate: ElementRef;
  @ViewChild('picker') picker: any;
  public bet: any;
  public submitting: boolean = false;
  constructor(@Inject(ContractService) private contractService: ContractService
  , public dialog: MatDialog, private router: Router) {
    this.bet = {
      betKey: "",
    creator:  "",
    eventText:  "",
    eventTime: new Date(),
    betType: 1,
    arbitratorType: 1,
    amount: 10000,
    escrowBalance: 0,
    arbitrator:  "",
    arbitratorName:  "",
    winScenario:  "",
    loseScenario:  "",
    cancelScenario:  "",
    arbitratorCommission: 0.50,
    betAgainstAmount: 10000,
    date:  "",
    time:  "",
    };
   }

  ngOnInit(): void {
    

  }

  closePicker() {
    this.picker.cancel();
  }

  ngAfterViewInit() {
    //new M.Datepicker(this.inputDate.nativeElement, {});
  //   $('#input-create-bet-event-date').datepicker({
  //     format: "mm/dd/yy",
  //     changeMonth: true,
  //     changeYear: true,
  //     numberOfMonths: 1,
  //     yearRange: ":2020",
  //     minDate: new Date(),
  //     defaultDate: new Date(),
  //     setDefaultDate: true
  // });
  // $('#input-create-bet-event-time').val(this.formatAMPM(new Date()));
  // $('#input-create-bet-event-time').timepicker({
  //     default: 'now'
  // });
}

formatAMPM(date: any) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}
  createBet(event: any){
 if(this.bet.betType==1){
   this.bet.arbitrationType=1;
 }
let self = this;
    this.submitting = true;
      this.contractService.createBet(this.bet)
      .then(result => {
        this.submitting = false;
        console.log(result);
        const dialogRef = this.dialog.open(TransactionDialogComponent, {
          width: '400px',
          data: {title: "Create Bet", hash: result, message: `Your transaction has been submitted. Please give it some time to be added to the blockchain. It will show under "My Bets" once this transaction has been confirmed.`}
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
