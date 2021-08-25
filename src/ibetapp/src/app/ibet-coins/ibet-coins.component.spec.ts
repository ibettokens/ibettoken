import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IbetCoinsComponent } from './ibet-coins.component';

describe('IbetCoinsComponent', () => {
  let component: IbetCoinsComponent;
  let fixture: ComponentFixture<IbetCoinsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IbetCoinsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IbetCoinsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
