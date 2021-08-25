import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArbitrateBetMainComponent } from './arbitrate-bet-main.component';

import { ArbitrateBetComponent } from './arbitrate-bet.component';

describe('ArbitrateBetComponent', () => {
  let component: ArbitrateBetMainComponent;
  let fixture: ComponentFixture<ArbitrateBetMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArbitrateBetMainComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArbitrateBetMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
