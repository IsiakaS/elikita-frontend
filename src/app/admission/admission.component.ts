import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-admission',
  imports: [],
  templateUrl: './admission.component.html',
  styleUrl: './admission.component.scss'
})
export class AdmissionComponent {

  route = inject(ActivatedRoute);
  ngOnInit() {
    this.route.params.subscribe(params => {
      // alert(params['action']);
    });
  }

}
