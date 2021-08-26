import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CreateBetComponent } from './create-bet/create-bet.component';
import { AcceptBetComponent } from './accept-bet/accept-bet.component';
import { ArbitrateBetComponent } from './arbitrate-bet/arbitrate-bet.component';
import { MyBetsComponent } from './my-bets/my-bets.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomepageComponent } from './homepage/homepage.component';
import {CdkAccordionModule} from '@angular/cdk/accordion';
import { ContractService } from './services/contract.service';
import { LongIdentifierDisplayComponent } from './long-identifier-display/long-identifier-display.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMatDatetimePickerModule, NgxMatNativeDateModule } from '@angular-material-components/datetime-picker';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { AcceptBetMainComponent } from './accept-bet/accept-bet-main.component';
import { ArbitrateBetMainComponent } from './arbitrate-bet/arbitrate-bet-main.component';
import { MatExpansionModule } from '@angular/material/expansion';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TransactionDialogComponent } from './transaction-dialog/transaction-dialog.component';
import {MatDialogModule} from '@angular/material/dialog';
import { IbetCoinsComponent } from './ibet-coins/ibet-coins.component';
import {MatListModule} from '@angular/material/list';
import { MatNativeDateModule } from '@angular/material/core';

@NgModule({
  declarations: [
    AppComponent,
    HomepageComponent,
    CreateBetComponent,
    AcceptBetComponent,
    ArbitrateBetComponent,
    MyBetsComponent,
    TransactionsComponent,
    HomepageComponent,
    LongIdentifierDisplayComponent,
    AcceptBetMainComponent,
    ArbitrateBetMainComponent,
    TransactionDialogComponent,
    IbetCoinsComponent
  ],
  exports:[],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    CdkAccordionModule,
    FormsModule,
    NgxMatDatetimePickerModule,
    MatDatepickerModule,
      MatInputModule,
      MatButtonModule,
      NgxMatNativeDateModule,
      MatExpansionModule,
      MatTooltipModule,
      MatSnackBarModule,
      MatProgressSpinnerModule,
      MatDialogModule,
      MatListModule,
      MatNativeDateModule,
      ReactiveFormsModule
  ],
  providers: [ContractService],
  bootstrap: [AppComponent]
})
export class AppModule { }
