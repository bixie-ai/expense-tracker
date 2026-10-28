import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { LogExpenseComponent } from './log-expense.component';
import { DatabaseService } from '../core/services/database.service';
import { ExpenseDataService } from '../core/services/expense-data.service';
import { UserService } from '../core/services/user.service';
import { defaultExpenseCategories, defaultExpenseTypes } from '../shared/constants/expense-constants';
import { Expense } from '../core/interfaces/expense-model';

describe('LogExpenseComponent', () => {
  let component: LogExpenseComponent;
  let fixture: ComponentFixture<LogExpenseComponent>;
  let mockDatabaseService: jasmine.SpyObj<DatabaseService>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockExpenseDataService: jasmine.SpyObj<ExpenseDataService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(fakeAsync(() => {
    mockDatabaseService = jasmine.createSpyObj('DatabaseService', [
      'saveNewExpense',
      'announceExpenseCreated',
      'getUserDetailsById',
    ]);
    mockDatabaseService.saveNewExpense.and.returnValue(Promise.resolve({} as any));
    mockDatabaseService.announceExpenseCreated.and.returnValue(undefined);
    mockDatabaseService.getUserDetailsById.and.returnValue(Promise.resolve({
      toJSON: () => ({ categories: {}, types: {} }),
    } as any));

    mockUserService = jasmine.createSpyObj('UserService', [], {
      getUser: { uid: 'test-user-123' },
      getUserId: 'test-user-123',
    });

    mockExpenseDataService = jasmine.createSpyObj('ExpenseDataService', [], {
      categoriesSignal: jasmine.createSpy('categoriesSignal').and.returnValue([]),
      expenseSourcesSignal: jasmine.createSpy('expenseSourcesSignal').and.returnValue([]),
    });

    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockSnackBar.open.and.returnValue({
      onAction: () => {},
    } as any);

    TestBed.configureTestingModule({
      imports: [
        LogExpenseComponent,
        FormsModule,
        MatButtonModule,
        MatCardModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatIcon,
        MatInput,
        MatSelectModule,
        MatSnackBarModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: UserService, useValue: mockUserService },
        { provide: ExpenseDataService, useValue: mockExpenseDataService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        provideNativeDateAdapter(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LogExpenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  // T1: Renders all form fields
  it('should render all form fields', () => {
    expect(fixture.nativeElement.querySelector('[name="name"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[name="date"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[name="category"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[name="type"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[name="amount"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[name="comments"]')).toBeTruthy();
  });

  // T2: Renders save and reset buttons
  it('should render save and reset buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const saveButton = Array.from(buttons).find((b) => b.textContent.includes('Save'));
    const resetButton = Array.from(buttons).find((b) => b.textContent.includes('Reset'));
    expect(saveButton).toBeTruthy();
    expect(resetButton).toBeTruthy();
  });

  // T3: Rejects empty name
  it('should reject empty name on submit', fakeAsync(() => {
    component.expenseObj.name = '';
    component.expenseObj.date = '2024-03-15';
    component.expenseObj.category = 'Food';
    component.expenseObj.type = 'Cash';
    component.expenseObj.amount = 10;
    component.expenseObj.comments = 'test';

    const form = fixture.nativeElement.querySelector('form');
    expect(form.valid).toBeFalse();
  }));

  // T4: Rejects empty date
  it('should reject empty date on submit', fakeAsync(() => {
    component.expenseObj.name = 'Test';
    component.expenseObj.date = '';
    component.expenseObj.category = 'Food';
    component.expenseObj.type = 'Cash';
    component.expenseObj.amount = 10;
    component.expenseObj.comments = 'test';

    const form = fixture.nativeElement.querySelector('form');
    expect(form.valid).toBeFalse();
  }));

  // T5: Rejects empty category
  it('should reject empty category on submit', fakeAsync(() => {
    component.expenseObj.name = 'Test';
    component.expenseObj.date = '2024-03-15';
    component.expenseObj.category = '';
    component.expenseObj.type = 'Cash';
    component.expenseObj.amount = 10;
    component.expenseObj.comments = 'test';

    const form = fixture.nativeElement.querySelector('form');
    expect(form.valid).toBeFalse();
  }));

  // T6: Rejects empty type
  it('should reject empty type on submit', fakeAsync(() => {
    component.expenseObj.name = 'Test';
    component.expenseObj.date = '2024-03-15';
    component.expenseObj.category = 'Food';
    component.expenseObj.type = '';
    component.expenseObj.amount = 10;
    component.expenseObj.comments = 'test';

    const form = fixture.nativeElement.querySelector('form');
    expect(form.valid).toBeFalse();
  }));

  // T7: Rejects empty amount
  it('should reject empty amount on submit', fakeAsync(() => {
    component.expenseObj.name = 'Test';
    component.expenseObj.date = '2024-03-15';
    component.expenseObj.category = 'Food';
    component.expenseObj.type = 'Cash';
    component.expenseObj.amount = '';
    component.expenseObj.comments = 'test';

    const form = fixture.nativeElement.querySelector('form');
    expect(form.valid).toBeFalse();
  }));

  // T8: Rejects negative amount
  it('should reject negative amount on submit', fakeAsync(() => {
    component.expenseObj.name = 'Test';
    component.expenseObj.date = '2024-03-15';
    component.expenseObj.category = 'Food';
    component.expenseObj.type = 'Cash';
    component.expenseObj.amount = '-5';
    component.expenseObj.comments = 'test';

    const form = fixture.nativeElement.querySelector('form');
    expect(form.valid).toBeFalse();
  }));

  // T9: Rejects zero amount
  it('should reject zero amount on submit', fakeAsync(() => {
    component.expenseObj.name = 'Test';
    component.expenseObj.date = '2024-03-15';
    component.expenseObj.category = 'Food';
    component.expenseObj.type = 'Cash';
    component.expenseObj.amount = '0';
    component.expenseObj.comments = 'test';

    const form = fixture.nativeElement.querySelector('form');
    expect(form.valid).toBeFalse();
  }));

  // T10: Accepts valid positive amount
  it('should accept valid positive amount', fakeAsync(() => {
    component.expenseObj.name = 'Test';
    component.expenseObj.date = '2024-03-15';
    component.expenseObj.category = 'Food';
    component.expenseObj.type = 'Cash';
    component.expenseObj.amount = '25.50';
    component.expenseObj.comments = 'test';

    const form = fixture.nativeElement.querySelector('form');
    expect(form.valid).toBeTrue();
  }));

  // T11: Rejects future date
  it('should reject future date on submit', fakeAsync(() => {
    component.expenseObj.name = 'Test';
    component.expenseObj.date = '2099-12-31';
    component.expenseObj.category = 'Food';
    component.expenseObj.type = 'Cash';
    component.expenseObj.amount = '10';
    component.expenseObj.comments = 'test';

    const form = fixture.nativeElement.querySelector('form');
    // The date input has max set to today, so future dates are invalid
    expect(form.valid).toBeFalse();
  }));

  // T12: Saves on valid form submission
  it('should save on valid form submission', fakeAsync(() => {
    component.expenseObj.name = 'Lunch';
    component.expenseObj.date = '2024-03-15';
    component.expenseObj.category = 'Food';
    component.expenseObj.type = 'Cash';
    component.expenseObj.amount = '12.50';
    component.expenseObj.comments = 'Team lunch';

    const form = fixture.nativeElement.querySelector('form');
    expect(form.valid).toBeTrue();

    component.saveExpenseEntry(form);
    tick();

    expect(mockDatabaseService.saveNewExpense).toHaveBeenCalled();
    const callArgs = mockDatabaseService.saveNewExpense.calls.first().args;
    expect(callArgs[0].name).toBe('Lunch');
    expect(callArgs[0].amount).toBe('12.50');
    expect(callArgs[1]).toBe('test-user-123');
  }));

  // T13: Resets form after save
  it('should reset form after successful save', fakeAsync(() => {
    component.expenseObj.name = 'Lunch';
    component.expenseObj.date = '2024-03-15';
    component.expenseObj.category = 'Food';
    component.expenseObj.type = 'Cash';
    component.expenseObj.amount = '12.50';
    component.expenseObj.comments = 'Team lunch';

    const form = { resetForm: jasmine.createSpy('resetForm') } as any;
    component.saveExpenseEntry(form);
    tick();

    expect(form.resetForm).toHaveBeenCalled();
  }));

  // T14: Announces expense created
  it('should announce expense created after save', fakeAsync(() => {
    component.expenseObj.name = 'Lunch';
    component.expenseObj.date = '2024-03-15';
    component.expenseObj.category = 'Food';
    component.expenseObj.type = 'Cash';
    component.expenseObj.amount = '12.50';
    component.expenseObj.comments = 'Team lunch';

    const form = { resetForm: jasmine.createSpy('resetForm') } as any;
    component.saveExpenseEntry(form);
    tick();

    expect(mockDatabaseService.announceExpenseCreated).toHaveBeenCalledWith('new expense');
  }));

  // T15: Shows error snackbar on save failure
  it('should show error snackbar on save failure', fakeAsync(() => {
    mockDatabaseService.saveNewExpense.and.returnValue(Promise.reject(new Error('Database error')));

    component.expenseObj.name = 'Lunch';
    component.expenseObj.date = '2024-03-15';
    component.expenseObj.category = 'Food';
    component.expenseObj.type = 'Cash';
    component.expenseObj.amount = '12.50';
    component.expenseObj.comments = 'Team lunch';

    const form = { resetForm: jasmine.createSpy('resetForm') } as any;
    component.saveExpenseEntry(form);
    tick();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Database error',
      '',
      { duration: 2000 }
    );
  }));

  // T16: Does not reset form on save failure
  it('should not reset form on save failure', fakeAsync(() => {
    mockDatabaseService.saveNewExpense.and.returnValue(Promise.reject(new Error('Database error')));

    component.expenseObj.name = 'Lunch';
    component.expenseObj.date = '2024-03-15';
    component.expenseObj.category = 'Food';
    component.expenseObj.type = 'Cash';
    component.expenseObj.amount = '12.50';
    component.expenseObj.comments = 'Team lunch';

    const form = { resetForm: jasmine.createSpy('resetForm') } as any;
    component.saveExpenseEntry(form);
    tick();

    expect(form.resetForm).not.toHaveBeenCalled();
  }));

  // T17: Shows generic error when message missing
  it('should show generic error when save rejects with null', fakeAsync(() => {
    mockDatabaseService.saveNewExpense.and.returnValue(Promise.reject(null));

    component.expenseObj.name = 'Lunch';
    component.expenseObj.date = '2024-03-15';
    component.expenseObj.category = 'Food';
    component.expenseObj.type = 'Cash';
    component.expenseObj.amount = '12.50';
    component.expenseObj.comments = 'Team lunch';

    const form = { resetForm: jasmine.createSpy('resetForm') } as any;
    component.saveExpenseEntry(form);
    tick();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Something went wrong. Please try again.',
      '',
      { duration: 2000 }
    );
  }));

  // T18: Loads categories from user settings
  it('should load categories from user settings when available', fakeAsync(() => {
    mockDatabaseService.getUserDetailsById.and.returnValue(Promise.resolve({
      toJSON: () => ({
        categories: { c1: 'Custom Cat 1', c2: 'Custom Cat 2' },
        types: {},
      }),
    } as any));

    component.ngOnInit();
    tick();

    expect(component.categories).toEqual(['Custom Cat 1', 'Custom Cat 2']);
  }));

  // T19: Falls back to default categories
  it('should fall back to default categories when user has none', fakeAsync(() => {
    mockDatabaseService.getUserDetailsById.and.returnValue(Promise.resolve({
      toJSON: () => ({ categories: {}, types: {} }),
    } as any));

    component.ngOnInit();
    tick();

    expect(component.categories).toEqual(defaultExpenseCategories);
  }));

  // T20: Loads types from user settings
  it('should load types from user settings when available', fakeAsync(() => {
    mockDatabaseService.getUserDetailsById.and.returnValue(Promise.resolve({
      toJSON: () => ({
        categories: {},
        types: { t1: 'Custom Type 1', t2: 'Custom Type 2' },
      }),
    } as any));

    component.ngOnInit();
    tick();

    expect(component.types).toEqual(['Custom Type 1', 'Custom Type 2']);
  }));

  // T21: Falls back to default types
  it('should fall back to default types when user has none', fakeAsync(() => {
    mockDatabaseService.getUserDetailsById.and.returnValue(Promise.resolve({
      toJSON: () => ({ categories: {}, types: {} }),
    } as any));

    component.ngOnInit();
    tick();

    expect(component.types).toEqual(defaultExpenseTypes);
  }));

  // T22: Save button disabled when form invalid
  it('should disable save button when form is invalid', fakeAsync(() => {
    component.expenseObj.name = '';
    component.expenseObj.date = '';
    component.expenseObj.category = '';
    component.expenseObj.type = '';
    component.expenseObj.amount = '';
    component.expenseObj.comments = '';

    fixture.detectChanges();

    const saveButton = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(saveButton.disabled).toBeTrue();
  }));

  // T23: Save button enabled when form valid
  it('should enable save button when form is valid', fakeAsync(() => {
    component.expenseObj.name = 'Test';
    component.expenseObj.date = '2024-03-15';
    component.expenseObj.category = 'Food';
    component.expenseObj.type = 'Cash';
    component.expenseObj.amount = '10';
    component.expenseObj.comments = 'test';

    fixture.detectChanges();

    const saveButton = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(saveButton.disabled).toBeFalse();
  }));

  // T24: clearForm resets the expense object
  it('should clear form and reset expense object', fakeAsync(() => {
    component.expenseObj.name = 'Test';
    component.expenseObj.date = '2024-03-15';
    component.expenseObj.category = 'Food';
    component.expenseObj.type = 'Cash';
    component.expenseObj.amount = '10';
    component.expenseObj.comments = 'test';

    const form = { resetForm: jasmine.createSpy('resetForm') } as any;
    component.clearForm(form);

    expect(form.resetForm).toHaveBeenCalled();
    expect(component.expenseObj.name).toBe('');
    expect(component.expenseObj.date).toBe('');
    expect(component.expenseObj.category).toBe('');
    expect(component.expenseObj.type).toBe('');
    expect(component.expenseObj.amount).toBe('');
    expect(component.expenseObj.comments).toBe('');
  }));

  // T25: showSnackBar shows success message
  it('should show success snackbar on save', fakeAsync(() => {
    component.showSnackBar();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Expense saved!',
      '',
      { duration: 2000 }
    );
  }));

  // T26: formatAmount formats non-string amounts
  it('should format non-string amount values', () => {
    component.expenseObj.amount = 12.567;
    component.formatAmount();
    expect(component.expenseObj.amount).toBe(12.57);
  });
});
