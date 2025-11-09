import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, RouterLink, RouterLinkActive, UrlSegment } from '@angular/router';
import { Router } from '@angular/router';
import { BreadcrumbService } from '../shared/breadcrumb.service';

@Component({
  selector: 'app-breadcrumb-navigation',
  imports: [RouterLink, RouterLinkActive, CommonModule, MatIconModule],
  templateUrl: './breadcrumb-navigation.component.html',
  styleUrl: './breadcrumb-navigation.component.scss'
})
export class BreadcrumbNavigationComponent {

  breadCrumbService = inject(BreadcrumbService);

  buildBreadcrumb(currentRoute: ActivatedRouteSnapshot[]) {

    // console.log(this.breadCrumbBuild);

    // if(this.profileEditComponent.showNotice){
    //   this.allNotices.push(this.profileEditComponent.profileEditNotice);
    // }

    // this.noticesWrapper.createEmbeddedView(this.profileEditComponent.profileEditNotice);

  }
}
