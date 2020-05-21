import { Injectable } from '@angular/core';
import { Class } from './Class';
import { Level } from './Level';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CharacterService } from './character.service';
import { SavegameService } from './savegame.service';

@Injectable({
    providedIn: 'root'
})
export class ClassesService {

    classes: Class[];
    private loader; 
    private loading: boolean = false;
    
    constructor(
        private http: HttpClient,
        private savegameService: SavegameService
    ) { }

    get_Classes(name: string = "") {
        if (!this.still_loading()) {
            return this.classes.filter($class => $class.name == name || name == "")
        } else { return [new Class()] }
    }

    still_loading() {
        return (this.loading);
    }
  
    load_Classes(): Observable<string[]>{
        return this.http.get<string[]>('/assets/classes.json');
    }
  
    initialize() {
        if (!this.classes) {
        this.loading = true;
        this.load_Classes()
            .subscribe((results:string[]) => {
                this.loader = results;
                this.finish_loading()
            });
        }
    }
  
    finish_loading() {
        if (this.loader) {
            this.classes = this.loader.map($class => Object.assign(new Class(), $class));
            this.classes.forEach($class => {
                $class = this.savegameService.reassign($class)
                /*$class.levels = $class.levels.map(level => Object.assign(new Level(), level));
                $class.reassign();*/
            });
  
            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    }

}
