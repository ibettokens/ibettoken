import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ContractService } from '../services/contract.service';

@Component({
  selector: 'app-accept-bet-main',
  templateUrl: './accept-bet-main.component.html',
  styleUrls: ['./accept-bet-main.component.scss'],
})
export class AcceptBetMainComponent implements OnInit {
  public searchKey: any;
  public openBets: any[] = [];
  public selectedDateRange: any;
  public startDate: any;
  public endDate: any;

  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl()
  });
  
  constructor(
    @Inject(ContractService) private contractService: ContractService
  ) {}

  async ngOnInit() {
    this.openBets = [];
    let self = this;
    this.startDate = new Date();
    this.endDate = new Date();
    this.endDate = new Date(this.endDate.setDate(this.endDate.getDate() + 15));
    let counter =0;
    await this.contractService
        .getOpenBetsWithTimeStamp(
          this.startDate,
          this.endDate
        )
        .then((bets: any[]) => {
          if (bets && bets.length > 0) {
            bets.forEach(bet => {
              self.openBets.push(Object.assign({},bet));
             
            });
          }
        })
        .catch((error: any) => {
          if(counter==0)
          {
            counter++;
            alert(error);
          }
          console.log(error);
        });
    
    // for (let utcDate = this.contractService.getUTCDate(this.startDate); utcDate < self.endDate; utcDate.setDate(utcDate.getDate() + 1)) {
    //   //alert(utcDate);
     
    //  await this.contractService
    //     .getOpenBets(
    //       utcDate.getUTCFullYear(),
    //       utcDate.getMonth(),
    //       utcDate.getDate()
    //     )
    //     .then((bets) => {
    //       if (bets && bets.length > 0) {
    //         bets.forEach(bet => {
    //           self.openBets.push(Object.assign({},bet));
             
    //         });
    //       }
    //     })
    //     .catch((error) => {
    //       if(counter==0)
    //       {
    //         counter++;
    //         alert(error);
    //       }
    //       console.log(error);
    //     });
    // }
  }

  searchBet() {
    this.openBets = [];
    let self = this;
if(this.searchKey != null && this.searchKey.length > 0)
{
 this.contractService
      .getBetDetails(this.searchKey)
      .then((bet) => {
        console.log(bet);
        this.openBets = [];
        this.openBets.push(bet);
      })
      .catch((error) => {});
}else
{
  let counter = 0;
for (var d = this.startDate; d <= this.endDate; d.setDate(d.getDate() + 1)) {
    let utcDate = this.contractService.getUTCDate(new Date(d));
    this.contractService
    .getOpenBets(
      utcDate.getUTCFullYear(),
      utcDate.getMonth(),
      utcDate.getDate()
    )
    .then((bets) => {
      if (bets && bets.length > 0) {
        bets.forEach(bet => {
          self.openBets.push(Object.assign({},bet));
        });
      }
    })
    .catch((error) => {
      if(counter==0)
          {
            counter++;
            alert(error);
          }
      console.log(error);
    });
}
}
   
  }

  addDays(date: Date, num: number) {
    var value = date.valueOf();
    value += 86400000 * num;
    return new Date(value);
  }
}
