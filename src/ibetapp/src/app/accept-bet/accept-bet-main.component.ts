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

  ngOnInit(): void {
    this.openBets = [];
    let self = this;
    let utcDate = this.contractService.getUTCDate(new Date());
    for (let i = 0; i < 30; i++) {
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
          console.log(error);
        });
      utcDate = this.addDays(utcDate, 1);
    }
  }

  searchBet() {
    this.contractService
      .getBetDetails(this.searchKey)
      .then((bet) => {
        console.log(bet);
        this.openBets = [];
        this.openBets.push(bet);
      })
      .catch((error) => {});
  }

  searchByDate(){
    console.log(this.startDate);
    console.log(this.endDate);
  }

  addDays(date: Date, num: number) {
    var value = date.valueOf();
    value += 86400000 * num;
    return new Date(value);
  }
}
