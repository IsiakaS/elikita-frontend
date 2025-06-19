import { Component, inject } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { LoaderService } from './loader/loader.service';
import { AuthService } from './shared/auth/auth.service';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'elikita2';

  //services
  router = inject(Router);
  loaderService = inject(LoaderService);

  constructor(private auth: AuthService) {




  }
  ngOnInit() {
    // this.auth.login("lab123", "lab123");
    this.router.events.subscribe((event) => {

      if (event instanceof NavigationStart) {

        this.loaderService.openLoader()
      }
      if (event instanceof NavigationEnd ||
        event instanceof NavigationCancel
        || event instanceof NavigationError) {
        this.loaderService.closeLoader();
      }
    })
  }
}
