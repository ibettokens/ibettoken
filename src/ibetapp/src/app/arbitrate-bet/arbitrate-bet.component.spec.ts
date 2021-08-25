import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArbitrateBetComponent } from './arbitrate-bet.component';

describe('ArbitrateBetComponent', () => {
  let component: ArbitrateBetComponent;
  let fixture: ComponentFixture<ArbitrateBetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArbitrateBetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArbitrateBetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
