import { Component, ElementRef, inject, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { SidemenuComponent } from '../sidemenu/sidemenu.component';
import { DashboardsWrapperComponent } from '../dashboards-wrapper/dashboards-wrapper.component';
import { TopbreadcrumbComponent } from '../topbreadcrumb/topbreadcrumb.component';
import { TopProfileComponent } from '../top-profile/top-profile.component';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../shared/auth/auth.service';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { BreadcrumbNavigationComponent } from "../breadcrumb-navigation/breadcrumb-navigation.component";
import { map } from 'rxjs';
import { ToggleSideNavService } from '../shared/toggle-side-nav.service';
import { TopActionsService } from './top-actions.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AichatComponent } from '../aichat/aichat.component';
import { AichatService } from '../aichat.service';

@Component({
  selector: 'app-app-wrapper',

  imports: [MatIconModule, AichatComponent,
    NgTemplateOutlet, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDividerModule, AsyncPipe, ReactiveFormsModule,
    SidemenuComponent, MatSidenavModule, DashboardsWrapperComponent, TopbreadcrumbComponent, TopProfileComponent, RouterOutlet, BreadcrumbNavigationComponent],
  templateUrl: './app-wrapper.component.html',
  styleUrl: './app-wrapper.component.scss'
})
export class AppWrapperComponent {
  userChangeForm = new FormControl("");
  breakpointObserver = inject(BreakpointObserver);
  isBigTablet$ = this.breakpointObserver.observe(['(max-width: 992px)']).pipe(
    map(result => result.matches)
  );

  ngOnInit() {
    this.sideNavService.sideNavCollapsed.subscribe((e: boolean) => {
      this.collapseSideNav = e;
    })

    this.userChangeForm.valueChanges.subscribe((value: string | null) => {
      if (value) {
        value = value.toLowerCase();
        switch (value) {
          case 'lab technician':
            this.auth.refreshL("lab123", "lab123");
            break;
          case 'nurse':
            this.auth.refreshL("nurse123", "nurse123");
            break;
          case 'admin':
            this.auth.refreshL("admin123", "admin123");
            break;
          case 'doctor':
            this.auth.refreshL("doctor123", "doctor123");
            break;
          case 'pharmacist':
            this.auth.refreshL("pharmacy123", "pharmacy123");
            break;
          case 'patient':
            this.auth.refreshL("patient123", "patient123");
            break;
          case 'consultant':
            this.auth.refreshL("consultant123", "consultant123");
            break;
          case 'cashier':
            this.auth.refreshL("cashier123", "cashier123");
            break;
          default:
            break;

        }
      }
    })

  }
  sideNavService = inject(ToggleSideNavService)
  auth = inject(AuthService);
  collapseSideNav: boolean = this.sideNavService.sideNavCollapsed.getValue();
  vCRef = inject(ViewContainerRef);
  topactionsService = inject(TopActionsService);
  ngAfterViewInit() {

  }
  aiServ = inject(AichatService);
  openandC() {
    const v = !this.aiServ.openAndC.getValue();
    this.aiServ.openAndC.next(v);
    // this.vCRef.createComponent(AichatComponent);
  }
}
