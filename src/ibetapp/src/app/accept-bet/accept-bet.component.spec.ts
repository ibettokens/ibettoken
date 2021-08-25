import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptBetComponent } from './accept-bet.component';

describe('AcceptBetComponent', () => {
  let component: AcceptBetComponent;
  let fixture: ComponentFixture<AcceptBetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcceptBetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptBetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
