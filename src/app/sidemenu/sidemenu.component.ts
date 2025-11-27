import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from '../shared/auth/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { ToggleSideNavService } from '../shared/toggle-side-nav.service';
import { AsyncPipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';


@Component({
  selector: 'app-sidemenu',

  imports: [RouterLink, RouterOutlet, MatIconModule, AsyncPipe, MatTooltipModule],
  templateUrl: './sidemenu.component.html',
  styleUrl: './sidemenu.component.scss'
})
export class SidemenuComponent {
  auth = inject(AuthService);
  router = inject(Router);
  userRole!: string;
  menuObjects: { [key: string]: any } = {
    'doctor': {
      primary_menu: [{
        title: "Dashboard",
        link: "/app/dashboard",
        icon: "dashboard"
      },
      {
        link: "/app/patients",
        title: "Patients",
        icon: "people"
      },
      //admmitted-patients
      {
        link: "/app/admitted-patients",
        title: "Admitted Patients",
        icon: "local_hospital"
      },
      {
        title: 'Appointments',
        link: "/app/appointments",
        icon: 'date_range'
      },
      {
        title: "Schedule",
        link: "/app/schedule",
        icon: 'access_time'

      },
      {
        link: "/app/tests-requests",
        title: "Tests Request",
        icon: "biotech"
      },
      ],
      grouped_menu: [[
        'Settings', [
          {
            link: "/app/profile",
            title: " Profile",
            icon: 'person'
          },


        ]


      ]]
    },
    'cashier': {
      primary_menu: [
        {
          title: "Dashboard",
          link: "/app/dashboard",
          icon: "dashboard"
        },
        {
          title: "Claims",
          link: "/app/claims",
          icon: "shopping_cart"
        },
        {
          title: "Invoices",
          link: "/app/invoice",
          icon: "shopping_cart"
        },
        {
          title: "Generate Bills",
          link: "/app/patient-bills",
          icon: "shopping_cart"
        },
        {
          title: "Tasks",
          link: "/app/tasks",
          icon: "task"
        },
        {
          title: 'Appointments',
          link: "/app/appointments",
          icon: 'date_range'
        },],
      grouped_menu: [[
        'Billable Services', [
          {
            link: "/app/medicine-requests",
            title: "Medicine Requests",
            icon: "medication"

          },
          {
            link: "/app/tests-requests",
            title: "Tests Request",
            icon: "biotech"
          },
          {
            link: "/app/encounter",
            title: "Encounter",
            icon: "description"
          }


        ]


      ],
      [
        'Settings', [
          {
            link: "/app/profile",
            title: " Profile",
            icon: 'person'
          },


        ]


      ]

      ]

    },

    'nurse': {
      primary_menu: [
        {
          title: "Dashboard",
          link: "/app/dashboard",
          icon: "dashboard"
        },
        {
          link: "/app/patients",
          title: "Patients",
          icon: "people"

        },
        {
          link: "/app/admitted-patients",
          title: "Admitted Patients",
          icon: "local_hospital"
        },
        {
          title: "Schedule",
          link: "/app/schedule",
          icon: 'access_time'

        },
        //tasks
        {
          title: "Tasks",
          link: "/app/tasks",
          icon: "task"
        },
        {
          title: 'Appointments',
          link: "/app/appointments",
          icon: 'date_range'
        },
        {
          link: "/app/tests-requests",
          title: "Observation Request",
          icon: "looks"
        },
        {
          link: "/app/medicine-requests",
          title: "Medicine Requests",
          icon: "medication"

        },
      ],
      grouped_menu: [[
        'Settings', [
          {
            link: "/app/profile",
            title: " Profile",
            icon: 'person'
          },


        ]


      ]]
    },
    'patient': {
      primary_menu: [
        {
          title: "Dashboard",
          link: "/app/patients/100001/summary",
          icon: "dashboard"
        },
        {
          title: 'Appointments',
          link: "/app/appointments",
          icon: 'date_range'
        },
        {
          title: 'Book Appointment',
          link: "/app/appointments/add",
          icon: 'add_circle_outline'
        },
      ],
      grouped_menu: [[
        'Settings', [
          {
            link: "/app/profile",
            title: " Profile",
            icon: 'person'
          },


        ]


      ]]
    },
    'pharmacy': {
      primary_menu: [
        {
          title: "Dashboard",
          link: "/app/dashboard",
          icon: "dashboard"
        },
        {
          link: "/app/patients",
          title: "Patients",
          icon: "people"
        },
        {
          link: "/app/medicine-requests",
          title: "Medicine Requests",
          icon: "local_pharmacy"
        },
        {
          title: "Medication Dispenses",
          link: "/app/medication-dispense",
          icon: "medical_services"
        },
        //medicine stock
        {
          link: "/app/medicine-stock",
          title: "Medicine Stock",
          icon: "inventory"
        },

        {
          link: "/app/patients",
          title: "Patients",
          icon: "people"

        },
        {
          title: "Schedule",
          link: "/app/schedule",
          icon: 'access_time'

        },
      ],
      grouped_menu: [[
        'Settings', [
          {
            link: "/app/profile",
            title: " Profile",
            icon: 'person'
          },


        ]


      ]]
    },


    'admin': {
      primary_menu: [
        {
          title: "Dashboard",
          link: "/app/dashboard",
          icon: "dashboard"
        },
        // {
        //   link: "/app/patients",
        //   title: "Patients",
        //   icon: "people"

        // },
        // {
        //   link: "/app/admitted-patients",
        //   title: "Admitted Patients",
        //   icon: "local_hospital"
        // },
        {
          link: "/app/patient-registration-data",
          title: "Patient Registration",
          icon: "person_add"
        },
        //practitioner management
        {
          link: "/app/practitioners",
          title: "Practitioners",
          icon: "person"
        },
        {
          link: "/app/medicine-stock",
          title: "Medicine Stock",
          icon: "inventory"
        },
        {
          title: "Lab Supplies",
          link: "/app/lab-supplies",
          icon: 'inventory'


        },
        {
          title: 'Appointments',
          link: "/app/appointments",
          icon: 'date_range'
        },
        {
          link: "/app/document",
          title: "Documents",
          icon: "description"
        },
        {
          link: "/app/calendar",
          title: "Calendar",
          icon: "calendar_today"
        },
        // {
        //   link: "/app/medicine-requests",
        //   title: "Medicine Requests",
        //   icon: "local_pharmacy"

        // },
        // {
        //   link: "/app/tests-requests",
        //   title: "Tests Request",
        //   icon: "biotech"
        // },

      ],
      grouped_menu: [[
        'Organization', [
          {
            link: "/app/org",
            title: "Hospital Profile",
            icon: 'work'
          },
          {
            link: "/app/org-reg",
            title: "Hospital Registration",
            icon: 'add_business'
          },
          {
            link: "/app/org-services",
            title: "Services",
            icon: 'medication'

          },

        ]], [




        'Settings', [
          {
            link: "/app/profile",
            title: " Profile",
            icon: 'person'
          },


        ]


      ]
      ]


    },

    //recptionist similar to admin
    'receptionist': {
      primary_menu: [
        {
          title: "Dashboard",
          link: "/app/dashboard",
          icon: "dashboard"
        },
        {
          link: "/app/patients",
          title: "Patients",
          icon: "people"

        },
        {
          link: "/app/patient-registration-data",
          title: "Patient Registration",
          icon: "person_add"
        },

        {
          title: 'Appointments',
          link: "/app/appointments",
          icon: 'date_range'
        },
        {
          title: "Schedule",
          link: "/app/schedule",
          icon: 'access_time'

        },
        // {
        //   link: "/app/medicine-requests",
        //   title: "Medicine Requests",
        //   icon: "local_pharmacy"

        // },
        // {
        //   link: "/app/tests-requests",
        //   title: "Tests Request",
        //   icon: "biotech"
        // },

      ],
      grouped_menu: [[
        'Settings', [
          {
            link: "/app/profile",
            title: " Profile",
            icon: 'person'
          },


        ]


      ]
      ]


    },
    'consultant': {
      primary_menu: [

        {
          title: "Dashboard",
          link: "/app/dashboard",
          icon: 'dashboard'
        },
        {
          title: "Schedule",
          link: "/app/schedule",
          icon: 'access_time'

        },
        {
          link: "/app/patients",
          title: "Patients",
          icon: "people"

        },

      ],
      grouped_menu: [[
        'Settings', [
          {
            link: "/app/profile",
            title: " Profile",
            icon: 'person'
          },


        ]


      ]]

    },
    'lab': {
      primary_menu: [

        {
          title: "Dashboard",
          link: "/app/dashboard",
          icon: 'dashboard'
        },
        {
          link: "/app/patients",
          title: "Patients",
          icon: "people"
        },
        {
          link: "/app/tests-requests",
          title: "Tests Request",
          icon: "biotech"
        },
        {
          title: "Specimens",
          link: "/app/specimens",
          icon: 'science'

        },
        {
          title: "Lab Supplies",
          link: "/app/lab-supplies",
          icon: 'inventory'


        },
        {
          title: "Schedule",
          link: "/app/schedule",
          icon: 'access_time'

        },
        //tasks
        {
          title: "Tasks",
          link: "/app/tasks",
          icon: "task"

        },

      ],
      grouped_menu: [[
        'Settings', [
          {
            link: "/app/profile",
            title: " Profile",
            icon: 'person'
          },


        ]


      ]]


    }


  }

  ngOnInit() {
    const user = this.auth.user.getValue();
    if (!user) {
      this.router.navigate(["login"])
    }
    this.userRole = this.auth.user!.getValue()!.role;
    this.auth.user.subscribe((user) => {
      this.userRole = user!.role;
    });
    this.sideNavService.sideNavCollapsed.subscribe((e: boolean) => {
      this.collapseMenu = e;
    })

  }
  logout() {
    this.auth.logout();
  }

  sideNavService = inject(ToggleSideNavService)
  collapseMenu = this.sideNavService.sideNavCollapsed.getValue();
}
