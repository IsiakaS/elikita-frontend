import { Component, inject } from '@angular/core';
import { SidemenuComponent } from '../sidemenu/sidemenu.component';
import { DashboardsWrapperComponent } from '../dashboards-wrapper/dashboards-wrapper.component';
import { TopbreadcrumbComponent } from '../topbreadcrumb/topbreadcrumb.component';
import { TopProfileComponent } from '../top-profile/top-profile.component';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../shared/auth/auth.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-app-wrapper',

  imports: [MatIconModule,
    MatDividerModule, AsyncPipe,
    SidemenuComponent, MatSidenavModule, DashboardsWrapperComponent, TopbreadcrumbComponent, TopProfileComponent, RouterOutlet],
  templateUrl: './app-wrapper.component.html',
  styleUrl: './app-wrapper.component.scss'
})
export class AppWrapperComponent {

  auth = inject(AuthService);

}
