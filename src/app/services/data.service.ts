import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PersonalData } from '../interface/personal-data';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor( private http: HttpClient, ) { }

  getPersonalData() {
    return this.http.get<PersonalData>('assets/data/personal-data.json');
  }

}
