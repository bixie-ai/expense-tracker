import { Component, inject, Input, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { User } from '../../core/interfaces/user-model';
import { AuthService } from '../../core/services/auth.service';
import { DatabaseService } from '../../core/services/database.service';
import { UserService } from '../../core/services/user.service';
import { defaultExpenseCategories } from '../../shared/constants/expense-constants';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  imports: [FormsModule, MatFormFieldModule, MatButton, MatProgressSpinner, MatError, MatInput, MatIcon],
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent {
  @Input({ required: true }) needsToRegister!: WritableSignal<boolean>;
  currentUser: User = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  };
  isLoading = false;
  defaultExpenses: string[] = defaultExpenseCategories;

  private authService: AuthService = inject(AuthService);
  private snackBar: MatSnackBar = inject(MatSnackBar);
  private router: Router = inject(Router);
  private db: DatabaseService = inject(DatabaseService);
  private userService: UserService = inject(UserService);

  checkForm(valid: boolean | null) {
    if (valid) {
      this.signUp();
    }
  }

  signUp() {
    this.isLoading = true;
    this.authService
      .signUp(this.currentUser.email ?? '', this.currentUser.password ?? '')
      .then((data) => {
        this.isLoading = false;
        if (data.user) {
          this.userService.setUser(data.user);
          this.userService.setUserId(data.user.uid);
          this.setUserInformation(data.user.uid);
          this.openSnackBarSuccess();
          this.onSuccessfulSignUp();
        }
      })
      .catch((e) => {
        this.isLoading = false;
        const message = e instanceof Error ? e.message : 'Registration failed';
        this.openSnackBarError(message);
      });
  }

  private openSnackBarSuccess() {
    this.snackBar.open('Successful Registration!', '', { duration: 2000 });
  }

  private openSnackBarError(message: string) {
    this.snackBar.open(message, 'ok', { duration: 4000 });
  }

  private onSuccessfulSignUp() {
    this.router.navigate(['/dashboard']).then();
  }

  private setUserInformation(userId: string) {
    this.db
      .updateUserDetails(userId, {
        firstName: this.currentUser.firstName ?? '',
        lastName: this.currentUser.lastName ?? '',
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Failed to save user details';
        this.openSnackBarError(message);
      });
  }
}
