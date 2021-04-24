import { SpellDesc } from './SpellDesc';
import { CharacterService } from './character.service';
import { ConditionGain } from './ConditionGain';
import { ItemGain } from './ItemGain';
import { SpellCasting } from './SpellCasting';
import { SpellCast } from './SpellCast';
import { EffectsService } from './effects.service';
import { Creature } from './Creature';
import { SpellTargetNumber } from './SpellTargetNumber';

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
    public heightened: { variable: string, value: string }[] = [];
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
    //target is used internally to determine whether you can cast this spell on yourself, your companion/familiar or any ally
    //Should be: "ally", "area", "companion", "familiar", "minion", "object", "other" or "self"
    //For "companion", it can only be cast on the companion
    //For "familiar", it can only be cast on the familiar
    //For "self", the spell button will say "Cast", and you are the target
    //For "ally", it can be cast on any in-app creature (depending on targetNumber) or without target
    //For "area", it can be cast on any in-app creature witout target number limit or without target
    //For "object", "minion" or "other", the spell button will just say "Cast" without a target
    public target: string = "";
    //The target description in the spell description.
    public targets: string = "";
    //If cannotTargetCaster is set, you can't cast the spell on yourself, and you can't select yourself as one of the targets of an ally or area spell.
    //This is needed for emanations (where the spell should give the caster the correct condition in the first place)
    // and spells that exclusively target a different creature (in case of "you and [...]", the caster condition should take care of the caster's part.").
    public cannotTargetCaster: boolean = false;
    public singleTarget: boolean = false;
    public traditions: string[] = [];
    public traits: string[] = [];
    public trigger: string = "";
    public targetNumbers: SpellTargetNumber[] = [];
    get_DescriptionSet(levelNumber: number) {
        //This descends from levelnumber downwards and returns the first available description set.
        //A description set contains variable names and the text to replace them with.
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
        //For an arbitrary text (usually the spell description or the heightened descriptions), retrieve the appropriate description set for this level and replace the variables with the included strings.
        this.get_DescriptionSet(levelNumber).forEach((descVar: SpellDesc) => {
            let regex = new RegExp(descVar.variable, "g")
            text = text.replace(regex, (descVar.value || ""));
        })
        return text;
    }
    get_TargetNumber(levelNumber: number) {
        //You can select any number of targets for an area spell.
        if (this.target == "area") {
            return -1;
        }
        //This descends from levelnumber downwards and returns the first available targetNumber. 1 if no targetNumbers are configured, return 1, and if none have a minLevel, return the first.
        if (this.targetNumbers.length) {
            if (this.targetNumbers.some(targetNumber => targetNumber.minLevel)) {
                for (levelNumber; levelNumber > 0; levelNumber--) {
                    if (this.targetNumbers.some(targetNumber => targetNumber.minLevel == levelNumber)) {
                        return this.targetNumbers.find(targetNumber => targetNumber.minLevel == levelNumber).number;
                    }
                }
                return this.targetNumbers[0].number;
            } else {
                return this.targetNumbers[0].number;
            }
        } else {
            return 1;
        }
    }
    get_HeightenedConditions(levelNumber: number = this.levelreq) {
        //This descends through the level numbers, starting with levelNumber and returning the first set of ConditionGains found with a matching heightenedfilter.
        //If a heightenedFilter is found, the unheightened ConditionGains are returned as well.
        //If there are no ConditionGains with a heightenedFilter, return all.
        if (!this.gainConditions.length || !this.gainConditions.find(gain => gain.heightenedFilter)) {
            return this.gainConditions;
        } else if (this.gainConditions.length) {
            switch (levelNumber) {
                case 10:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 10)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 10); }
                case 9:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 9)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 9); }
                case 8:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 8)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 8); }
                case 7:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 7)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 7); }
                case 6:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 6)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 6); }
                case 5:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 5)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 5); }
                case 4:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 4)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 4); }
                case 3:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 3)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 3); }
                case 2:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 2)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 2); }
                case 1:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 1)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 1); }
                default:
                    //The spell level might be too low for any of the existing ConditionGains with a heightenedFilter. Return all those without one in that case.
                    return this.gainConditions.filter(gain => !gain.heightenedFilter);
            }
        }
    }
    meetsLevelReq(characterService: CharacterService, spellLevel: number = Math.ceil(characterService.get_Character().level / 2)) {
        //If the spell has a levelreq, check if the level beats that.
        //Returns [requirement met, requirement description]
        let result: { met: boolean, desc: string };
        if (this.levelreq && !this.traits.includes("Cantrip")) {
            if (spellLevel >= this.levelreq) {
                result = { met: true, desc: "Level " + this.levelreq };
            } else {
                result = { met: false, desc: "Level " + this.levelreq };
            }
        } else {
            result = { met: true, desc: "" };
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
    get_IsHostile() {
        //Return whether a spell is meant to be cast on enemies. This is usually the case if the spell is cast on other, or if the spell is cast on area and has no target conditions.
        return (
            this.target == "other" ||
            (
                this.target == "area" && !this.gainConditions.some(gain => gain.targetFilter != "caster")
            )
        )
    }
    hasTargetConditions() {
        return this.gainConditions.some(gain => gain.targetFilter != "caster");
    }
    have(characterService: CharacterService, casting: SpellCasting = undefined, spellLevel = this.levelreq, className: string = "", locked: boolean = undefined) {
        if (characterService.still_loading()) { return false }
        let character = characterService.get_Character();
        let spellsTaken = character.get_SpellsTaken(characterService, 1, 20, spellLevel, this.name, undefined, className, "", "", "", "", locked);
        return spellsTaken.length;
    }
    get_EffectiveSpellLevel(creature: Creature, baseLevel: number, characterService: CharacterService, effectsService: EffectsService) {
        //Cantrips and Focus spells are automatically heightened to your maximum available spell level.
        if (!baseLevel || baseLevel == -1) {
            baseLevel = characterService.get_Character().get_SpellLevel();
        }

        //Apply all effects that might change the effective spell level of this spell.
        let list = [
            "Spell Levels",
            this.name + " Spell Level"
        ]
        if (this.traditions.includes("Focus")) {
            list.push("Focus Spell Levels");
        }
        if (this.traits.includes("Cantrip")) {
            list.push("Cantrip Spell Levels");
        }
        effectsService.get_AbsolutesOnThese(creature, list).forEach(effect => {
            if (parseInt(effect.setValue)) {
                baseLevel = parseInt(effect.setValue);
            }
        })
        effectsService.get_RelativesOnThese(creature, list).forEach(effect => {
            if (parseInt(effect.value)) {
                baseLevel += parseInt(effect.value);
            }
        })

        //If a spell is cast with a lower level than its minimum, the level is raised to the minimum.
        return Math.max(baseLevel, (this.levelreq || 0))
    }
}