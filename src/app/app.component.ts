import { Component, inject } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { LoaderService } from './loader/loader.service';
import { AuthService } from './shared/auth/auth.service';
import { BreadcrumbService } from './shared/breadcrumb.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatIconModule, MatButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'elikita2';

  //services
  router = inject(Router);
  loaderService = inject(LoaderService);
  breadCrumbService = inject(BreadcrumbService)
  isDark = false;
  constructor(private auth: AuthService) {

    const saved = localStorage.getItem('color-scheme');
    if (saved) {
      this.isDark = saved === 'dark';
      this.applyTheme();
    }


  }

  toggleTheme() {
    this.isDark = !this.isDark;
    localStorage.setItem('color-scheme', this.isDark ? 'dark' : 'light');
    this.applyTheme();
  }

  applyTheme() {
    document.documentElement.setAttribute('color-scheme', this.isDark ? 'dark' : 'light');
    // Or use a class:
    // document.body.classList.toggle('dark-theme', this.isDark);
  }
  ngOnInit() {
    // Developer mode: set user to doctor and route to a specific patient's summary
    const target = '/app/patients/b47fc122-f4d9-4970-81c7-97badc18e311/summary';
    const current = this.auth.user.getValue();
    if (!current || current.role !== 'doctor') {
      // Ensure login redirects to our target route
      this.auth.triedUrl = target;
      this.auth.login('doctor123', 'doctor123');
    } else {
      // Already a doctor: navigate directly
      this.router.navigateByUrl(target);
    }
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.loaderService.openLoader();
      }
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loaderService.closeLoader();
      }
    });
  }


}
