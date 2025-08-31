import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkExComponent } from './work-ex.component';

describe('WorkExComponent', () => {
  let component: WorkExComponent;
  let fixture: ComponentFixture<WorkExComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkExComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkExComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
