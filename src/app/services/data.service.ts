import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MenuItem } from '../interface/menuItem';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor( private http: HttpClient, ) { }

  getMenuOpts() {
    return this.http.get<MenuItem[]>('/assets/data/menu-opts.json');
  }

  getPersonalData() {
    return this.http.get<any>('/assets/data/personal-data.json');
  }

  uniqueId() {    
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
  }
}
