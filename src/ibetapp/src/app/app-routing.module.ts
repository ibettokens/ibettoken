import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AcceptBetMainComponent } from './accept-bet/accept-bet-main.component';
import { AcceptBetComponent } from './accept-bet/accept-bet.component';
import { ArbitrateBetMainComponent } from './arbitrate-bet/arbitrate-bet-main.component';
import { ArbitrateBetComponent } from './arbitrate-bet/arbitrate-bet.component';
import { CreateBetComponent } from './create-bet/create-bet.component';
import { HomepageComponent } from './homepage/homepage.component';
import { IbetCoinsComponent } from './ibet-coins/ibet-coins.component';
import { MyBetsComponent } from './my-bets/my-bets.component';

const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'ibetcoins', component: IbetCoinsComponent },
  { path: 'createbet', component: CreateBetComponent },
  { path: 'acceptbet/:betKey', component: AcceptBetComponent },
  { path: 'acceptbet', component: AcceptBetMainComponent },
  { path: 'arbitratebet/:betKey', component: ArbitrateBetComponent },
  { path: 'arbitratebet', component: ArbitrateBetMainComponent },
  { path: 'mybets', component: MyBetsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
