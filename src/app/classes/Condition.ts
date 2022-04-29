import { ConditionGain } from 'src/app/classes/ConditionGain';
import { EffectGain } from 'src/app/classes/EffectGain';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ItemGain } from 'src/app/classes/ItemGain';
import { AttackRestriction } from 'src/app/classes/AttackRestriction';
import { SenseGain } from 'src/app/classes/SenseGain';
import { Hint } from 'src/app/classes/Hint';
import { Character } from 'src/app/classes/Character';
import { ConditionChoice } from 'src/app/classes/ConditionChoice';
import { CharacterService } from 'src/app/services/character.service';
import { Familiar } from 'src/app/classes/Familiar';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { ConditionDuration } from 'src/app/classes/ConditionDuration';
import { Creature } from 'src/app/classes/Creature';
import { HeightenedDesc } from 'src/app/classes/HeightenedDesc';
import { HeightenedDescSet } from 'src/app/classes/HeightenedDescSet';

type ConditionEnd = {
    name: string,
    increaseWounded?: boolean,
    sameCasterOnly?: boolean
}
export type ConditionOverride = {
    name: string,
    conditionChoiceFilter?: string[]
}
export type EndsWithCondition = {
    name: string,
    source?: string
}
export type OtherConditionSelection = {
    title?: string,
    nameFilter: string[]
    typeFilter: string[]
}

export class Condition {
    public name = '';
    public type = '';
    public buff = false;
    public minLevel = 0;
    public hasValue = false;
    public decreasingValue = false;
    public value = 0;
    public automaticStages = false;
    public circularStages = false;
    public heightenedDescs: HeightenedDescSet[] = [];
    public desc = '';
    public hints: Hint[] = [];
    public inputRequired = '';
    public onceEffects: EffectGain[] = [];
    public endEffects: EffectGain[] = [];
    public effects: EffectGain[] = [];
    public gainActivities: ActivityGain[] = [];
    public gainConditions: ConditionGain[] = [];
    public gainItems: ItemGain[] = [];
    public hide = false;
    //Overridden conditions aren't applied, but keep ticking.
    private overrideConditions: ConditionOverride[] = [];
    //Paused conditions don't tick. If you want to stop -and- hide a condition, you need to override it as well.
    private pauseConditions: ConditionOverride[] = [];
    //Each selectCondition offers a select box that can be used to select one other active condition for later use.
    // The selected condition can be referenced in overrideConditions and pauseConditions as "selectedCondition|0" (or other index).
    public selectOtherConditions: { title: string, nameFilter: string[], typeFilter: string[] }[] = [];
    public denyConditions: string[] = [];
    public endConditions: ConditionEnd[] = [];
    //If alwaysApplyCasterCondition is true and this is a caster condition, it is applied even when it is informational and the caster is already getting the target condition.
    public alwaysApplyCasterCondition = false;
    //Remove this condition if any of the endsWithConditions is removed.
    public endsWithConditions: EndsWithCondition[] = [];
    //If the stopTimeChoiceFilter matches the condition choice or is "All", no time elapses for anything other than the condition that causes the time stop.
    public stopTimeChoiceFilter: string[] = [];
    public attackRestrictions: AttackRestriction[] = [];
    public senses: SenseGain[] = [];
    public sourceBook = '';
    public nextCondition: ConditionGain[] = [];
    public defaultDurations: ConditionDuration[] = [];
    public persistent = false;
    //Restricted conditions can be seen, but not taken from the conditions menu.
    public restricted = false;
    public radius = 0;
    public allowRadiusChange = false;
    public traits: string[] = [];
    //If a condition has notes (like the HP of a summoned object), they get copied on the conditionGain.
    public notes = '';
    //List choices you can make for this condition. The first choice must never have a featreq.
    public choices: ConditionChoice[] = [];
    //_choices is a temporary value that stores the filtered name list produced by get_Choices();
    public _choices: string[] = [];
    //This property is only used to select a default choice before adding the condition. It is not read when evaluating the condition.
    public choice = '';
    //All instances of an unlimited condition are shown in the conditions area. Limited conditions only show one instance.
    public unlimited = false;
    recast() {
        this.heightenedDescs = this.heightenedDescs.map(obj => Object.assign(new HeightenedDescSet(), obj).recast());
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());
        this.onceEffects = this.onceEffects.map(obj => Object.assign(new EffectGain(), obj).recast());
        this.endEffects = this.endEffects.map(obj => Object.assign(new EffectGain(), obj).recast());
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());
        this.gainActivities = this.gainActivities.map(obj => Object.assign(new ActivityGain(), obj).recast());
        this.gainActivities.forEach(activityGain => {
            activityGain.source = this.name;
        });
        this.gainConditions = this.gainConditions.map(obj => Object.assign(new ConditionGain(), obj).recast());
        this.gainConditions.forEach(conditionGain => {
            conditionGain.source = this.name;
        });
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        this.attackRestrictions = this.attackRestrictions.map(obj => Object.assign(new AttackRestriction(), obj).recast());
        this.senses = this.senses.map(obj => Object.assign(new SenseGain(), obj).recast());
        this.nextCondition = this.nextCondition.map(obj => Object.assign(new ConditionGain(), obj).recast());
        this.defaultDurations = this.defaultDurations.map(obj => Object.assign(new ConditionDuration(), obj).recast());
        this.choices = this.choices.map(obj => Object.assign(new ConditionChoice(), obj).recast());
        //If choices exist and no default choice is given, take the first one as default.
        if (this.choices.length && !this.choice) {
            this.choice = this.choices[0].name;
        }
        this.selectOtherConditions = this.selectOtherConditions.map(selection =>
            Object.assign({
                title: '',
                nameFilter: [],
                typeFilter: []
            }, selection)
        );
        //endsWithConditions has changed from string to object; this is patched here for existing conditions.
        this.endsWithConditions.forEach((endsWith, index) => {
            if (typeof endsWith === 'string') {
                this.endsWithConditions[index] = { name: endsWith, source: '' };
            }
        });
        return this;
    }
    public get_ConditionOverrides(gain: ConditionGain = null): ConditionOverride[] {
        return this.overrideConditions.map(override => {
            let overrideName = override.name;
            if (gain && override.name.toLowerCase().includes('selectedcondition|')) {
                overrideName = gain.selectedOtherConditions[override.name.toLowerCase().split('|')[1] || 0] || overrideName;
            }
            return { name: overrideName, conditionChoiceFilter: override.conditionChoiceFilter };
        });
    }
    public get_ConditionPauses(gain: ConditionGain = null): ConditionOverride[] {
        return this.pauseConditions.map(pause => {
            let pauseName = pause.name;
            if (gain && pause.name.toLowerCase().includes('selectedcondition|')) {
                pauseName = gain.selectedOtherConditions[pause.name.toLowerCase().split('|')[1] || 0] || pauseName;
            }
            return { name: pauseName, conditionChoiceFilter: pause.conditionChoiceFilter };
        });
    }
    get_HasInstantEffects() {
        //Return whether the condition has any effects that are instantly applied even if the condition has no duration.
        return (this.endConditions.length || this.onceEffects.length);
    }
    get_HasDurationEffects() {
        //Return whether the condition has any effects that persist during its duration.
        return (this.effects?.length || this.hints.some(hint => hint.effects?.length) || this.gainConditions.length || this.nextCondition.length || this.overrideConditions.length || this.denyConditions.length || this.gainItems.length || this.gainActivities.length || this.senses.length || this.endEffects.length);
    }
    get_HasEffects() {
        //Return whether the condition has any effects beyond showing text.
        return this.get_HasInstantEffects() || this.get_HasDurationEffects();
    }
    get_IsChangeable() {
        //Return whether the condition has values that you can change.
        return this.hasValue || this.allowRadiusChange;
    }
    get_HasHints() {
        return this.hints.length;
    }
    get_IsStoppingTime(conditionGain: ConditionGain = null) {
        return this.stopTimeChoiceFilter.some(filter => ['All', (conditionGain?.choice || 'All')].includes(filter));
    }
    get_IsInformationalCondition(creature: Creature, characterService: CharacterService, conditionGain: ConditionGain = null) {
        //Return whether the condition has any effects beyond showing text, and if it causes or overrides any currently existing conditions.
        return !(
            this.effects?.length ||
            this.endConditions.length ||
            this.gainItems.length ||
            this.gainActivities.length ||
            this.senses.length ||
            this.nextCondition.length ||
            this.endEffects.length ||
            this.denyConditions.length ||
            this.get_IsStoppingTime(conditionGain) ||
            (
                this.hints.some(hint =>
                    hint.effects?.length &&
                    (
                        !conditionGain ||
                        !hint.conditionChoiceFilter.length ||
                        hint.conditionChoiceFilter.includes(conditionGain.choice)
                    )
                )
            ) ||
            (
                this.gainConditions.length ?
                    characterService.get_AppliedConditions(creature, '', '', true)
                        .some(existingCondition => !conditionGain || existingCondition.parentID == conditionGain.id) :
                    false
            ) ||
            (
                this.overrideConditions.length ?
                    characterService.get_AppliedConditions(creature, '', '', true)
                        .some(existingCondition =>
                            this.get_ConditionOverrides(conditionGain).some(override =>
                                override.name == existingCondition.name &&
                                (
                                    !override.conditionChoiceFilter?.length ||
                                    override.conditionChoiceFilter.includes(conditionGain?.choice || '')
                                )
                            )
                        ) :
                    false
            ) ||
            (
                this.pauseConditions.length ?
                    characterService.get_AppliedConditions(creature, '', '', true)
                        .some(existingCondition =>
                            this.get_ConditionPauses(conditionGain).some(pause =>
                                pause.name == existingCondition.name &&
                                (
                                    !pause.conditionChoiceFilter?.length ||
                                    pause.conditionChoiceFilter.includes(conditionGain?.choice || '')
                                )
                            )
                        ) :
                    false
            )
        );
    }
    get_Choices(characterService: CharacterService, filtered = false, spellLevel: number = this.minLevel) {
        //If this.choice is not one of the available choices, set it to the first.
        if (this.choices.length && !this.choices.map(choice => choice.name).includes(this.choice)) {
            this.choice == this.choices[0].name;
        }
        if (!filtered) {
            return this.choices.map(choice => choice.name);
        }
        const choices: string[] = [];
        this.choices.forEach(choice => {
            //The default choice is never tested. This ensures a fallback if no choices are available.
            if (choice.name == this.choice) {
                choices.push(choice.name);
            } else {
                const character = characterService.get_Character();
                //If the choice has a featreq, check if you meet that (or a feat that has this supertype).
                //Requirements like "Aggressive Block or Brutish Shove" are split in get_CharacterFeatsAndFeatures().
                if (!choice.spelllevelreq || spellLevel >= choice.spelllevelreq) {
                    if (choice.featreq?.length) {
                        let featNotFound = false;
                        choice.featreq.forEach(featreq => {
                            //Allow to check for the Familiar's feats
                            let requiredFeat: Feat[];
                            let testCreature: Character | Familiar;
                            let testFeat = featreq;
                            if (featreq.includes('Familiar:')) {
                                testCreature = characterService.get_Familiar();
                                testFeat = featreq.split('Familiar:')[1].trim();
                                requiredFeat = characterService.familiarsService.get_FamiliarAbilities(testFeat);
                            } else {
                                testCreature = character;
                                requiredFeat = characterService.get_CharacterFeatsAndFeatures(testFeat, '', true);
                            }
                            if (requiredFeat.length) {
                                if (!requiredFeat.some(feat => feat.have({ creature: testCreature }, { characterService }))) {
                                    featNotFound = true;
                                }
                            } else {
                                featNotFound = true;
                            }
                        });
                        if (!featNotFound) {
                            choices.push(choice.name);
                        }
                    } else {
                        choices.push(choice.name);
                    }
                }
            }
        });
        this._choices = choices;
        return this._choices;
    }
    get_ChoiceNextStage(choiceName: string) {
        return this.choices.find(choice => choice.name == choiceName)?.nextStage || 0;
    }
    get_DefaultDuration(choiceName = '', spellLevel = 0) {
        //Suggest a default duration for a condition in this order:
        // 1. The default duration of the current condition choice, if one exists
        // 2. If the condition has a minLevel (== is a spell), the default duration with the appropriate minLevel value, if one exists
        // 3. The first default duration, if one exists
        // 4. null
        //Returns {duration: number, source: string}
        const choice = this.choices.find(choice => choice.name == choiceName);
        if (choice?.defaultDuration != null) {
            return { duration: choice.defaultDuration, source: choice.name };
        }
        if (this.minLevel) {
            //Levelnumber should not be below minLevel, but might be in the conditions menu.
            let levelNumber = Math.max(this.minLevel, spellLevel);
            if (this.defaultDurations.some(defaultDuration => defaultDuration.minLevel)) {
                // Going down from levelNumber to minLevel, use the first default duration that matches the level.
                for (levelNumber; levelNumber >= this.minLevel; levelNumber--) {
                    const level = this.defaultDurations.find(defaultDuration => defaultDuration.minLevel == levelNumber);
                    if (level?.duration != null) {
                        return { duration: level.duration, source: `Spell level ${ levelNumber }` };
                    }
                }
            }
        }
        if (this.defaultDurations[0]?.duration != null) {
            return { duration: this.defaultDurations[0].duration, source: 'Default' };
        }
        return null;
    }
    get_HeightenedItems(levelNumber: number) {
        //This descends through the level numbers, starting with levelNumber and returning the first set of ItemGains found with a matching heightenedfilter.
        //It also returns all items that have no heightenedFilter.
        //If there are no ItemGains with a heightenedFilter, return all.
        const items: ItemGain[] = [];
        if (!this.gainItems.length) {
            return this.gainItems;
        }
        items.push(...this.gainItems.filter(gain => !gain.heightenedFilter));
        if (this.gainItems.some(gain => gain.heightenedFilter)) {
            switch (levelNumber) {
                case 10:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 10)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 10));
                        break;
                    }
                //If nothing is found, fall through to the next highest level.
                case 9:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 9)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 9));
                        break;
                    }
                //If nothing is found, fall through to the next highest level.
                case 8:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 8)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 8));
                        break;
                    }
                //If nothing is found, fall through to the next highest level.
                case 7:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 7)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 7));
                        break;
                    }
                //If nothing is found, fall through to the next highest level.
                case 6:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 6)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 6));
                        break;
                    }
                //If nothing is found, fall through to the next highest level.
                case 5:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 5)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 5));
                        break;
                    }
                //If nothing is found, fall through to the next highest level.
                case 4:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 4)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 4));
                        break;
                    }
                //If nothing is found, fall through to the next highest level.
                case 3:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 3)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 3));
                        break;
                    }
                //If nothing is found, fall through to the next highest level.
                case 2:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 2)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 2));
                        break;
                    }
                //If nothing is found, fall through to the next highest level.
                case 1:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 1)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 1));
                        break;
                    }
            }
        }
        return items;
    }
    get_DescriptionSet(levelNumber: number) {
        //This descends from levelnumber downwards and returns the first description set with a matching level.
        //A description set contains variable names and the text to replace them with.
        if (this.heightenedDescs.length) {
            for (levelNumber; levelNumber > 0; levelNumber--) {
                if (this.heightenedDescs.some(descSet => descSet.level == levelNumber)) {
                    return this.heightenedDescs.find(descSet => descSet.level == levelNumber);
                }
            }
        }
        return new HeightenedDescSet();
    }
    get_Heightened(text: string, levelNumber: number) {
        //For an arbitrary text (usually the condition description), retrieve the appropriate description set for this level and replace the variables with the included strings.
        this.get_DescriptionSet(levelNumber).descs.forEach((descVar: HeightenedDesc) => {
            const regex = new RegExp(descVar.variable, 'g');
            text = text.replace(regex, (descVar.value || ''));
        });
        return text;
    }
}
