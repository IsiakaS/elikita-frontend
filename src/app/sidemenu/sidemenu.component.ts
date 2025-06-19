import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from '../shared/auth/auth.service';

@Component({
  selector: 'app-sidemenu',

  imports: [RouterLink, RouterOutlet],
  templateUrl: './sidemenu.component.html',
  styleUrl: './sidemenu.component.scss'
})
export class SidemenuComponent {
  auth = inject(AuthService);
  router = inject(Router);
  userRole!: string;
  menuObjects: { [key: string]: any } = {
    'doctor': [
      {
        title: 'Appointments',
        link: "/app/appointments"
      }, {
        title: "Dashboard",
        link: "/app/dashboard"
      },
      {
        link: "/app/patients",
        title: "Patients"
      },
    ],
    'nurse': [
      {
        title: 'Appointments',
        link: "/app/appointments"
      }, {
        title: "Dashboard",
        link: "/app/dashboard"
      },
      {
        link: "/app/medicine-requests",
        title: "Medicine Requests"
      },
      {
        link: "/app/patients",
        title: "Patients"
      },

    ],
    'admin': [{
      title: 'Patients Registration',
      link: "app/patients-reg"
    }, {
      title: 'Appointments',
      link: "/app/appointments"
    },


    ],
    'lab': [
      {
        title: "Dashboard",
        link: "/app/dashboard"
      },
      {
        link: "/app/tests-requests",
        title: "Tests Request"
      },
      {
        link: "/app/specimens",
        title: "Test Specimens"
      },
      {
        link: "/app/patients",
        title: "Patients"
      },

    ]

  }

  ngOnInit() {
    const user = this.auth.user.getValue();
    if (!user) {
      this.router.navigate(["login"])
    }
    this.userRole = this.auth.user!.getValue()!.role;
  }
  logout() {
    this.auth.logout();
  }
}
