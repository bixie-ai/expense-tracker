import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LayoutComponent } from './core/components/layout/layout.component';
import { UserService } from './core/services/user.service';

@Component({
  selector: 'app-root',
  imports: [RouterModule, LayoutComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor(
    private router: Router,
    private userService: UserService,
  ) {
    const user = this.userService.getUser();
    if (user) {
      this.router.navigate(['/dashboard']).then();
    } else {
      this.router.navigate(['/login']).then();
    }
  }
}
