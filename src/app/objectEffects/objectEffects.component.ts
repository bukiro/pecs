import { Component, Input, OnInit } from '@angular/core';
import { CharacterService } from '../character.service';
import { EffectGain } from '../EffectGain';
import { EffectsService } from '../effects.service';
import { EvaluationService } from '../evaluation.service';
import { RefreshService } from '../refresh.service';

@Component({
    selector: 'app-objectEffects',
    templateUrl: './objectEffects.component.html',
    styleUrls: ['./objectEffects.component.css']
})
export class ObjectEffectsComponent implements OnInit {

    @Input()
    objectName: string = "";
    @Input()
    creature: string = "";

    constructor(
        private characterService: CharacterService,
        private refreshService: RefreshService,
        private effectsService: EffectsService,
        private evaluationService: EvaluationService
    ) { }

    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    numbersOnly(event): boolean {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode != 45 && charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    validate(effect: EffectGain) {
        if (this.get_IsFormula(effect.value)) {
            effect.value = "0";
        }
        this.update_Effects();
    }

    get_CustomEffectsOnThis() {
        return this.get_Creature().effects.filter(effect => effect.affected.toLowerCase() == this.objectName.toLowerCase())
    }

    get_BonusTypes() {
        return this.effectsService.bonusTypes.map(type => type == "untyped" ? "" : type);
    }

    new_CustomEffectOnThis() {
        this.get_Creature().effects.push(Object.assign(new EffectGain(), { affected: this.objectName }));
    }

    remove_CustomEffect(effect: EffectGain) {
        this.get_Creature().effects.splice(this.get_Creature().effects.indexOf(effect), 1);
        this.update_Effects();
    }

    update_Effects() {
        this.refreshService.set_ToChange(this.creature, "effects");
        this.refreshService.process_ToChange();
    }

    get_IsFormula(value: string) {
        if (isNaN(parseInt(value))) {
            if (!value.match("^[0-9-]*$").length) {
                return true;
            }
        }
        return false;
    }

    get_EffectValue(effect: EffectGain) {
        //Send the effect's setValue or value to the EvaluationService to get its result.
        let value = effect.setValue || effect.value || null;
        if (value) {
            let result = this.evaluationService.get_ValueFromFormula(value, { characterService: this.characterService, effectsService: this.effectsService }, { creature: this.get_Creature() });
            if (result) {
                return "= " + result;
            }
        }
        //If the EffectGain did not produce a value, return a zero value instead.
        return "0";
    }

    ngOnInit() {
    }

}
