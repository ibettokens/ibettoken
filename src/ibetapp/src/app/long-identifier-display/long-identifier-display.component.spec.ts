import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LongIdentifierDisplayComponent } from './long-identifier-display.component';

describe('LongIdentifierDisplayComponent', () => {
  let component: LongIdentifierDisplayComponent;
  let fixture: ComponentFixture<LongIdentifierDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LongIdentifierDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LongIdentifierDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
