import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { FamiliarsService } from 'src/app/services/familiars.service';
import { RefreshService } from 'src/app/services/refresh.service';

@Component({
    selector: 'app-familiar',
    templateUrl: './familiar.component.html',
    styleUrls: ['./familiar.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FamiliarComponent implements OnInit, OnDestroy {

    private showMode = '';
    public mobile = false;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private refreshService: RefreshService,
        private familiarsService: FamiliarsService,
        private effectsService: EffectsService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.familiarMinimized = !this.characterService.get_Character().settings.familiarMinimized;
        this.set_Changed('Familiar');
    }

    get_Minimized() {
        return this.characterService.get_Character().settings.familiarMinimized;
    }

    still_loading() {
        return (this.characterService.still_loading() || this.familiarsService.still_loading());
    }

    toggleFamiliarMenu() {
        this.characterService.toggle_Menu('familiar');
    }

    get_FamiliarMenuState() {
        return this.characterService.get_FamiliarMenuState();
    }

    trackByIndex(index: number): number {
        return index;
    }

    set_Changed(target: string) {
        this.refreshService.set_Changed(target);
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_FamiliarAvailable() {
        return this.characterService.get_FamiliarAvailable();
    }

    get_Familiar() {
        return this.characterService.get_Familiar();
    }

    toggle_Mode(type: string) {
        if (this.showMode == type) {
            this.showMode = '';
        } else {
            this.showMode = type;
        }
    }

    get_ShowMode() {
        return this.showMode;
    }

    get_FamiliarAbilitiesFinished() {
        const choice = this.get_Familiar().abilities;
        let available = choice.available;
        this.effectsService.get_AbsolutesOnThis(this.get_Character(), 'Familiar Abilities').forEach(effect => {
            available = parseInt(effect.setValue);
        });
        this.effectsService.get_RelativesOnThis(this.get_Character(), 'Familiar Abilities').forEach(effect => {
            available += parseInt(effect.value);
        });
        return choice.feats.length >= available;
    }

    set_Mobile() {
        this.mobile = this.characterService.get_Mobile();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500);
        } else {
            this.changeSubscription = this.refreshService.get_Changed
                .subscribe((target) => {
                    if (['familiar', 'all'].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.get_ViewChanged
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == 'familiar' && ['familiar', 'all'].includes(view.target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        this.set_Mobile();
        this.finish_Loading();
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

    @HostListener('window:resize', ['$event'])
    onResize() {
        this.set_Mobile();
    }

    @HostListener('window:orientationchange', ['$event'])
    onRotate() {
        this.set_Mobile();
    }

}
