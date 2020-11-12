import { SpellDesc } from './SpellDesc';
import { CharacterService } from './character.service';
import { SpellGain } from './SpellGain';
import { ConditionGain } from './ConditionGain';
import { ItemGain } from './ItemGain';
import { SpellCasting } from './SpellCasting';
import { SpellChoice } from './SpellChoice';
import { SpellCast } from './SpellCast';

export class Spell {
    public actions: string = "1A";
    public allowReturnFocusPoint: boolean = false;
    public area: string = "";
    public castType: string = "";
    public cost: string = "";
    public critfailure: string = "";
    public critsuccess: string = "";
    public desc10: SpellDesc[] = [];
    public desc1: SpellDesc[] = [];
    public desc2: SpellDesc[] = [];
    public desc3: SpellDesc[] = [];
    public desc4: SpellDesc[] = [];
    public desc5: SpellDesc[] = [];
    public desc6: SpellDesc[] = [];
    public desc7: SpellDesc[] = [];
    public desc8: SpellDesc[] = [];
    public desc9: SpellDesc[] = [];
    public desc: string = "";
    public duration: string = "";
    public failure: string = "";
    public gainConditions: ConditionGain[] = [];
    public gainItems: ItemGain[] = [];
    public heightened: {variable:string, value:string}[] = [];
    public inputRequired: string = "";
    public levelreq: number = 1;
    public name: string = "";
    public PFSnote: string = "";
    public range: string = "";
    public savingThrow: string = "";
    public shortDesc: string = "";
    public showSpells: SpellCast[] = [];
    public sourceBook: string = "";
    public success: string = "";
    //Sustained spells are deactivated after this time (or permanent with -1, or when resting with -2)
    public sustained: number = 0;
    //target is used internally to determine whether you can cast this spell on yourself or your companion/familiar
    //Should be "", "self", "companion" or "ally"
    //For "companion", it can only be cast on the companion, for "self" only on yourself
    //For "ally", it can be cast on companion, self and others
    //For "", the spell button will just say "Cast"
    public target: string = "";
    public targets: string = "";
    public singleTarget: boolean = false;
    public traditions: string[] = [];
    public traits: string[] = [];
    public trigger: string = "";
    get_DescriptionSet(levelNumber: number) {
        //This descends from levelnumber downwards and returns the first available description.
        switch (levelNumber) {
            case 10: 
                if (this.desc10.length) { return this.desc10; }
            case 9: 
                if (this.desc9.length) { return this.desc9; }
            case 8: 
                if (this.desc8.length) { return this.desc8; }
            case 7: 
                if (this.desc7.length) { return this.desc7; }
            case 6: 
                if (this.desc6.length) { return this.desc6; }
            case 5: 
                if (this.desc5.length) { return this.desc5; }
            case 4: 
                if (this.desc4.length) { return this.desc4; }
            case 3: 
                if (this.desc3.length) { return this.desc3; }
            case 2: 
                if (this.desc2.length) { return this.desc2; }
            case 1:
                if (this.desc1.length) { return this.desc1; }
            default:
                return [];
            }
    }
    get_Heightened(text: string, levelNumber: number) {
        this.get_DescriptionSet(levelNumber).forEach((descVar: SpellDesc) => {
            let regex = new RegExp(descVar.variable,"g")
            text = text.replace(regex, (descVar.value || ""));
        })
        return text;
    }
    get_HeightenedConditions(levelNumber: number) {
        if (!this.gainConditions.length || !this.gainConditions.find(gain => gain.heightenedFilter)) {
            return this.gainConditions;
        } else if (this.gainConditions.length) {
            switch (levelNumber) {
                case 10: 
                    if (this.gainConditions.filter(gain => gain.heightenedFilter == 10).length) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 10); }
                case 9: 
                    if (this.gainConditions.filter(gain => gain.heightenedFilter == 9).length) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 9); }
                case 8: 
                    if (this.gainConditions.filter(gain => gain.heightenedFilter == 8).length) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 8); }
                case 7: 
                    if (this.gainConditions.filter(gain => gain.heightenedFilter == 7).length) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 7); }
                case 6: 
                    if (this.gainConditions.filter(gain => gain.heightenedFilter == 6).length) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 6); }
                case 5: 
                    if (this.gainConditions.filter(gain => gain.heightenedFilter == 5).length) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 5); }
                case 4: 
                    if (this.gainConditions.filter(gain => gain.heightenedFilter == 4).length) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 4); }
                case 3: 
                    if (this.gainConditions.filter(gain => gain.heightenedFilter == 3).length) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 3); }
                case 2: 
                    if (this.gainConditions.filter(gain => gain.heightenedFilter == 2).length) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 2); }
                case 1:
                    if (this.gainConditions.filter(gain => gain.heightenedFilter == 1).length) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 1); }
                default:
                    return [];
                }
        }
    }
    get_HeightenedItems(levelNumber: number) {
        if (!this.gainItems.length || this.gainItems.filter(gain => !gain.heightenedFilter).length) {
            return this.gainItems;
        } else if (this.gainItems.length) {
            switch (levelNumber) {
                case 10: 
                    if (this.gainItems.filter(gain => gain.heightenedFilter == 10).length) { return this.gainItems.filter(gain => gain.heightenedFilter == 10); }
                case 9: 
                    if (this.gainItems.filter(gain => gain.heightenedFilter == 9).length) { return this.gainItems.filter(gain => gain.heightenedFilter == 9); }
                case 8: 
                    if (this.gainItems.filter(gain => gain.heightenedFilter == 8).length) { return this.gainItems.filter(gain => gain.heightenedFilter == 8); }
                case 7: 
                    if (this.gainItems.filter(gain => gain.heightenedFilter == 7).length) { return this.gainItems.filter(gain => gain.heightenedFilter == 7); }
                case 6: 
                    if (this.gainItems.filter(gain => gain.heightenedFilter == 6).length) { return this.gainItems.filter(gain => gain.heightenedFilter == 6); }
                case 5: 
                    if (this.gainItems.filter(gain => gain.heightenedFilter == 5).length) { return this.gainItems.filter(gain => gain.heightenedFilter == 5); }
                case 4: 
                    if (this.gainItems.filter(gain => gain.heightenedFilter == 4).length) { return this.gainItems.filter(gain => gain.heightenedFilter == 4); }
                case 3: 
                    if (this.gainItems.filter(gain => gain.heightenedFilter == 3).length) { return this.gainItems.filter(gain => gain.heightenedFilter == 3); }
                case 2: 
                    if (this.gainItems.filter(gain => gain.heightenedFilter == 2).length) { return this.gainItems.filter(gain => gain.heightenedFilter == 2); }
                case 1:
                    if (this.gainItems.filter(gain => gain.heightenedFilter == 1).length) { return this.gainItems.filter(gain => gain.heightenedFilter == 1); }
                default:
                    return [];
                }
        }
    }
    meetsLevelReq(characterService: CharacterService, spellLevel: number = Math.ceil(characterService.get_Character().level / 2)) {
        //If the spell has a levelreq, check if the level beats that.
        //Returns [requirement met, requirement description]
        let result: {met:boolean, desc:string};
        if (this.levelreq && !this.traits.includes("Cantrip")) {
            if (spellLevel >= this.levelreq) {
                result = {met:true, desc:"Level "+this.levelreq};
                } else {
                result = {met:false, desc:"Level "+this.levelreq};
            }
        } else {
            result = {met:true, desc:""};
        }
        return result;
    }
    canChoose(characterService: CharacterService, spellLevel: number = Math.ceil(characterService.get_Character().level / 2)) {
        if (characterService.still_loading()) { return false }
        if (spellLevel == -1) {
            spellLevel = Math.ceil(characterService.get_Character().level / 2);
        }
        let levelreq: boolean = this.meetsLevelReq(characterService, spellLevel).met;
        return levelreq;
    }
    have(characterService: CharacterService, casting: SpellCasting = undefined, spellLevel = this.levelreq, className: string = "") {
        if (characterService.still_loading()) { return false }
        let character = characterService.get_Character();
        let spellsTaken = character.get_SpellsTaken(characterService, 1, 20, spellLevel, this.name, undefined, className)
        return spellsTaken.length;
    }
}