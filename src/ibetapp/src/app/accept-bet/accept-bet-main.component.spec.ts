import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcceptBetMainComponent } from './accept-bet-main.component';


describe('AcceptBetComponent', () => {
  let component: AcceptBetMainComponent;
  let fixture: ComponentFixture<AcceptBetMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcceptBetMainComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptBetMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
