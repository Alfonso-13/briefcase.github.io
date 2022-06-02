import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PersonalData } from '../interface/personal-data';
import { PresentationData } from '../interface/presentation-data';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor( private http: HttpClient, ) { }

  getPersonalData() {
    return this.http.get<PersonalData>('assets/data/personal-data.json');
  }

  getPresentationData() {
    return this.http.get<PresentationData[]>('assets/data/presentation-data.json');
  }

  getEducationData() {
    return this.http.get<any>('assets/data/education-data.json');
  }

  getKnowledgeData() {
    return this.http.get<any>('assets/data/knowledge-data.json');
  }
}
