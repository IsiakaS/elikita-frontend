import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs';

export const appointmentResolver: ResolveFn<any> = (route, state) => {
  const http = inject(HttpClient);
  return http.get("https://server.fire.ly/r5/Appointment?_format=json").pipe(map((e: any) => {
    return e.entry.map((f: any) => f.resource);
  }))
};
