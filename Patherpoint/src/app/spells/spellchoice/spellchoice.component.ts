import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SpellChoice } from 'src/app/SpellChoice';
import { SpellsService } from 'src/app/spells.service';
import { CharacterService } from 'src/app/character.service';
import { Spell } from 'src/app/Spell';
import { TraitsService } from 'src/app/traits.service';
import { SortByPipe } from 'src/app/sortBy.pipe';
import { SpellCasting } from 'src/app/SpellCasting';
import { EffectsService } from 'src/app/effects.service';
import { SpellGain } from 'src/app/SpellGain';
import { SpellLearned } from 'src/app/SpellLearned';

@Component({
    selector: 'app-spellchoice',
    templateUrl: './spellchoice.component.html',
    styleUrls: ['./spellchoice.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellchoiceComponent implements OnInit {

    @Input()
    spellCasting: SpellCasting = undefined;
    @Input()
    choice: SpellChoice
    @Input()
    allowHeightened: boolean = false;
    @Input()
    allowBorrow: boolean = false;
    @Input()
    showChoice: string = "";
    @Input()
    showSpell: string = "";
    @Output()
    showChoiceMessage = new EventEmitter<string>();
    @Output()
    showSpellMessage = new EventEmitter<string>();
    @Input()
    level: number;
    @Input()
    itemSpell: boolean = false;
    @Input()
    prepared: boolean = false;
    //Are we choosing character spells from the spellbook/repertoire? If not, some functions will be disabled.
    @Input()
    spellbook: boolean = false;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private spellsService: SpellsService,
        private traitsService: TraitsService,
        private effectsService: EffectsService,
        private sortByPipe: SortByPipe
    ) { }

    toggle_Spell(name: string) {
        if (this.showSpell == name) {
            this.showSpell = "";
        } else {
            this.showSpell = name;
        }
        this.showSpellMessage.emit(this.showSpell)
    }

    toggle_Choice(name: string) {
        if (this.showChoice == name) {
            this.showChoice = "";
        } else {
            this.showChoice = name;
        }
        this.showChoiceMessage.emit(this.showChoice)
    }

    get_ShowSpell() {
        return this.showSpell;
    }

    get_ShowChoice() {
        return this.showChoice;
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Level(number: number) {
        return this.get_Character().class.levels[number];
    }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    get_Spells(name: string = "", type: string = "", tradition: string = "") {
        return this.spellsService.get_Spells(name, type, tradition);
    }

    capitalize(text: string) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    get_SignatureSpellsAllowed() {
        if (this.characterService.get_FeatsAndFeatures()
            .filter(feature => feature.allowSignatureSpells)
            .filter(feature => feature.have(this.get_Character(), this.characterService)).length) {
            return true;
        } else {
            return false;
        }
    }

    is_SignatureSpell(choice: SpellChoice) {
        return this.get_SignatureSpellsAllowed() && choice.signatureSpell;
    }

    have_Feat(name: string) {
        return this.get_Character().get_FeatsTaken(1, this.get_Character().level, name).length;
    }

    get_SpellBlendingAllowed() {
        //You can trade in a spell slot if:
        // - This choice is not a cantrip or focus spell and is above level 2
        // - This choice does not have a dynamic level (because what does that mean for unlocking a bonus spell slot 1 level higher)
        // - This choice is part of prepared wizard spellcasting
        // - This choice is not itself a bonus slot gained by trading in
        // - You have the Spell Blending feat
        return (this.choice.level > 0 && !this.choice.dynamicLevel && this.spellCasting.className == "Wizard" && this.spellCasting.castingType == "Prepared" &&
            !["Spell Blending", "Infinite Possibilities", "Spell Combination", "Spell Mastery"].includes(this.choice.source) &&
            this.have_Feat("Spell Blending"));
    }

    get_SpellBlendingUsed() {
        //Return the amount of spell slots in this choice that have been traded in.
        return (this.choice.spellBlending.reduce((sum, current) => sum + current, 0));
    }

    on_SpellBlending(tradeLevel: number, value: number) {
        this.choice.spellBlending[tradeLevel] += value;
        this.characterService.set_Changed("spellchoices");
        this.characterService.process_ToChange();
    }

    get_SpellBlendingUnlocked(level: number) {
        //This function is used both to unlock the Spell Blending bonus spell slot (choice.source == "Spell Blending")
        //  and to check if the current choice can be traded in for a spell slot at the given level (get_SpellBlendingAllowed()).
        if (this.get_SpellBlendingAllowed() || this.choice.source == "Spell Blending") {
            let highestSpellLevel = this.get_HighestSpellLevel();
            //Check if there are enough spell choices that have been traded in in this spellcasting to unlock this level.
            if (level == 0) {
                return this.spellCasting.spellChoices.filter(choice => choice.level > 0 && choice.spellBlending[0] > 0).length * 2;
            } else if (level > 0 && level <= highestSpellLevel) {
                if (
                    (
                        this.spellCasting.spellChoices
                            .filter(choice => choice.level == level - 1 && choice.spellBlending[1] > 0)
                            .map(choice => choice.spellBlending[1])
                            .reduce((sum, current) => sum + current, 0) >= 2
                    ) ||
                    (
                        this.spellCasting.spellChoices
                            .filter(choice => choice.level == level - 2 && choice.spellBlending[2] > 0)
                            .map(choice => choice.spellBlending[2])
                            .reduce((sum, current) => sum + current, 0) >= 2
                    )
                ) {
                    return 1;
                } else {
                    return 0;
                }
            } else if (level > highestSpellLevel) {
                //If the targeted spell level is not available, return -1 so there is a result, but it does not grant any spells.
                return -1;
            }
        } else {
            return 0;
        }
    }

    get_InfinitePossibilitiesAllowed() {
        //You can trade in a spell slot if:
        // - This choice is not a cantrip or focus spell and is above level 2
        // - This choice does not have a dynamic level (because what does that mean for unlocking a bonus spell slot 2 levels lower)
        // - This choice is part of prepared wizard spellcasting
        // - This choice is not itself a bonus slot gained by trading in
        // - You have the Infinite Possibilities feat
        return (this.choice.level > 2 && !this.choice.dynamicLevel && this.spellCasting.className == "Wizard" && this.spellCasting.castingType == "Prepared" &&
            !["Spell Blending", "Infinite Possibilities", "Spell Combination", "Spell Mastery"].includes(this.choice.source) &&
            this.have_Feat("Infinite Possibilities"));
    }

    get_InfinitePossibilitiesUsed() {
        //Return the amount of spell slots in this choice that have been traded in (so either 0 or 1).
        return (this.choice.infinitePossibilities ? 1 : 0);
    }

    on_InfinitePossibilities() {
        this.characterService.set_Changed("spellchoices");
        this.characterService.set_Changed("spellbook");
        this.characterService.process_ToChange();
    }

    get_InfinitePossibilitiesUnlocked(level: number = 0) {
        //This function is used both to unlock the Infinite Possibilities bonus spell slot (choice.source == "Infinite Possibilities")
        //  and to check if the current choice can be traded in for a spell slot at the given level (get_InfinitePossibilitiesAllowed()).
        if (this.get_InfinitePossibilitiesAllowed() || this.choice.source == "Infinite Possibilities") {
            //Check if any spell slots have been traded in for IP (level == 0) or if the one on this level has been unlocked.
            if (level == 0) {
                return this.spellCasting.spellChoices.find(choice => choice.infinitePossibilities) ? 1 : 0;
            } else {
                return this.spellCasting.spellChoices.find(choice => choice.level == level + 2 && choice.infinitePossibilities) ? 1 : 0;
            }
        } else {
            return 0;
        }
    }

    is_InfinitePossibilitiesSpell(choice: SpellChoice) {
        return choice.source == "Infinite Possibilities";
    }

    on_SpellCombination(choice: SpellChoice) {
        choice.spells.length = 0;
        this.characterService.set_Changed("spellchoices");
        this.characterService.set_Changed("spellbook");
        this.characterService.process_ToChange();
    }

    get_HighestSpellLevel() {
        if (this.spellCasting) {
            //Get the available spell level of this casting. This is the higest spell level of the spell choices that are available at your character level.
            return Math.max(...this.spellCasting.spellChoices.filter(spellChoice => spellChoice.charLevelAvailable <= this.get_Character().level).map(spellChoice => spellChoice.level), 0);
        } else {
            return 1;
        }
    }

    get_DynamicLevel(choice: SpellChoice) {
        //Prepare highest spell level for eval().
        let highestSpellLevel = this.get_HighestSpellLevel();
        let Character = this.get_Character();
        function Skill_Level(name: string) {
            return this.characterService.get_Skills(Character, name)[0]?.level(Character) || 0;
        }
        try {
            return parseInt(eval(choice.dynamicLevel));
        } catch (e) {
            console.log("Error parsing spell level requirement (" + choice.dynamicLevel + "): " + e)
            return 1;
        }
    }

    get_CHA() {
        return this.characterService.get_Abilities("Charisma")[0].mod(this.get_Character(), this.characterService, this.effectsService).result;
    }

    get_Available(choice: SpellChoice) {
        let available: number = 0;
        if (choice.source == "Divine Font") {
            available = Math.max(choice.available + this.get_CHA(), 0);
        } else if (choice.source == "Spell Blending") {
            available = Math.max(choice.available + this.get_SpellBlendingUnlocked(choice.level), 0);
        } else if (choice.source == "Infinite Possibilities") {
            available = Math.max(choice.available + this.get_InfinitePossibilitiesUnlocked(choice.level), 0);
        } else if (["Basic Wizard Spellcasting", "Expert Wizard Spellcasting", "Master Wizard Spellcasting"].includes(choice.source) &&
            choice.level <= this.get_HighestSpellLevel() - 2) {
            available = Math.max(choice.available + this.have_Feat("Arcane Breadth") - this.get_SpellBlendingUsed() - this.get_InfinitePossibilitiesUsed(), 0);
        } else {
            available = Math.max(this.choice.available - this.get_SpellBlendingUsed() - this.get_InfinitePossibilitiesUsed(), 0);
        }
        //If this choice has more spells than it should have (unless they are locked), remove the excess.
        if (choice.spells.length > available) {
            choice.spells.filter(gain => !gain.locked).forEach((gain, index) => {
                if (index >= available) {
                    this.on_SpellTaken(gain.name, false, choice, false);
                }
            })
        }
        return available;
    }

    get_AvailableSpells(choice: SpellChoice) {
        let spellLevel = choice.level;
        if (choice.dynamicLevel) {
            spellLevel = this.get_DynamicLevel(choice);
        }
        let character = this.get_Character()

        let allSpells: Spell[];
        if ((this.spellCasting?.castingType == "Prepared" && this.spellCasting?.className == "Wizard" && !this.allowBorrow) || this.choice.spellBookOnly) {
            allSpells = this.spellsService.get_Spells().filter(spell =>
                this.spellTakenByThis(spell, choice) ||
                this.get_Character().class.spellBook.find((learned: SpellLearned) => learned.name == spell.name)
            );
        } else {
            allSpells = this.spellsService.get_Spells();
        }
        if (choice.filter.length) {
            allSpells = allSpells.filter(spell => choice.filter.map(filter => filter.toLowerCase()).includes(spell.name.toLowerCase()))
        }
        let spells: Spell[] = [];
        if (this.spellCasting) {
            let traditionFilter = choice.tradition || this.spellCasting.tradition || "";
            if (this.spellCasting.castingType == "Focus") {
                spells.push(...allSpells.filter(spell => spell.traits.includes(character.class.name) && spell.traditions.includes("Focus")));
            } else {
                if (traditionFilter) {
                    spells.push(...allSpells.filter(spell => spell.traditions.includes(traditionFilter) && !spell.traditions.includes("Focus")));
                } else {
                    spells.push(...allSpells.filter(spell => !spell.traditions.includes("Focus")));
                }
            }
        } else {
            let traditionFilter = choice.tradition || "";
            if (traditionFilter) {
                spells.push(...allSpells.filter(spell => spell.traditions.includes(traditionFilter) && !spell.traditions.includes("Focus")));
            } else {
                spells.push(...allSpells.filter(spell => !spell.traditions.includes("Focus")));
            }
        }
        switch (choice.target) {
            case "Others":
                spells = spells.filter(spell => spell.target != "self");
                break;
            case "Allies":
                spells = spells.filter(spell => spell.target == "ally");
                break;
            case "Caster":
                spells = spells.filter(spell => spell.target == "self");
                break;
            case "Enemies":
                spells = spells.filter(spell => spell.target == "")
        }
        if (choice.traitFilter.length) {
            //There is no actual Common trait. If a spell choice is limited to common spells,
            //  exclude all uncommon and rare spells, then process the rest of the trait filter.
            if (choice.traitFilter.includes("Common")) {
                let traitFilter = choice.traitFilter.filter(trait => trait != "Common");
                spells = spells.filter(spell =>
                    !spell.traits.includes("Uncommon") &&
                    !spell.traits.includes("Rare") &&
                    (
                        traitFilter.length ?
                            spell.traits.find(trait => traitFilter.includes(trait))
                            : true
                    )
                );
            } else {
                spells = spells.filter(spell => spell.traits.find(trait => choice.traitFilter.includes(trait)));
            }
        }
        if (choice.singleTarget) {
            spells = spells.filter(spell => spell.singleTarget);
        }
        if (spells.length) {
            if (spellLevel == 0) {
                spells = spells.filter(spell => spell.traits.includes("Cantrip") || this.spellTakenByThis(spell, choice));
            } else {
                spells = spells.filter(spell => !spell.traits.includes("Cantrip") || this.spellTakenByThis(spell, choice));
            }

            //Spell combination spell choices have special requirements, but they are also transformed from existing spell choices, so we don't want to change their properties.
            //The requirements are as follows:
            // - Spell Level is up to 2 lower than the spell slot
            // - The spell must be able to target a single creature other than the caster. This is ensured by the "singletarget" property in the spell.
            // - The second spell must have the same method of determining its success as the first - Attack trait, the same saving throw or neither.
            if (choice.spellCombination) {
                spells = spells.filter(spell =>
                    (spell.levelreq <= spellLevel - 2) &&
                    (!this.allowHeightened ? spell.levelreq == spellLevel - 2 : true) &&
                    spell.singleTarget
                )
                if (choice.spells.length) {
                    if (choice.spells[0].name && choice.spells[0].combinationSpellName) {
                        let availableSpells: Spell[] = spells.filter(spell =>
                            this.spellTakenByThis(spell, choice)
                        );
                        return availableSpells.sort(function (a, b) {
                            if (choice.spells[0].name == a.name) {
                                return -1;
                            }
                            if (choice.spells[0].name == b.name) {
                                return 1;
                            }
                            return 0
                        });
                    }
                    let existingSpell = this.get_Spells(choice.spells[0].name)[0];
                    spells = spells.filter(spell =>
                        (existingSpell.traits.includes("Attack") == spell.traits.includes("Attack")) &&
                        (existingSpell.savingThrow.includes("Fortitude") == spell.savingThrow.includes("Fortitude")) &&
                        (existingSpell.savingThrow.includes("Reflex") == spell.savingThrow.includes("Reflex")) &&
                        (existingSpell.savingThrow.includes("Will") == spell.savingThrow.includes("Will"))
                    )
                }
                let availableSpells: Spell[] = spells.filter(spell =>
                    this.cannotTake(spell, choice).length == 0 || this.spellTakenByThis(spell, choice)
                )
                return this.sortByPipe.transform(availableSpells, "asc", "name")
            }
            if (!this.allowHeightened && (spellLevel > 0)) {
                spells = spells.filter(spell => spell.levelreq == spellLevel || this.spellTakenByThis(spell, choice));
            }
            if (choice.spells.length < this.get_Available(choice)) {
                let availableSpells: Spell[] = spells.filter(spell =>
                    this.cannotTake(spell, choice).length == 0 || this.spellTakenByThis(spell, choice)
                )
                return this.sortByPipe.transform(availableSpells, "asc", "name")
            } else {
                let availableSpells: Spell[] = spells.filter(spell =>
                    this.spellTakenByThis(spell, choice)
                )
                return this.sortByPipe.transform(availableSpells, "asc", "name")
            }
        }
    }

    cannotTakeSome(choice: SpellChoice) {
        let anytrue = 0;
        choice.spells.forEach(gain => {
            if (this.cannotTake(this.get_Spells(gain.name)[0], choice).length) {
                if (!gain.locked) {
                    this.get_Character().take_Spell(this.characterService, gain.name, false, choice, gain.locked);
                } else {
                    anytrue += 1;
                }
            }
        });
        this.characterService.process_ToChange();
        return anytrue;
    }

    cannotTake(spell: Spell, choice: SpellChoice, gain: SpellGain = null) {
        if (this.spellTakenByThis(spell, choice) && choice.spells.find(spellGain => spellGain.name == spell.name && spellGain.locked)) {
            return "";
        }
        let spellLevel = choice.level;
        if (choice.dynamicLevel) {
            spellLevel = this.get_DynamicLevel(choice);
        }
        let reasons: string[] = [];
        //Are the basic requirements (so far just level) not met?
        if (!spell.canChoose(this.characterService, spellLevel)) {
            reasons.push("The requirements are not met.")
        }
        //Has it already been taken at this level by this class, and was that not by this SpellChoice? (Only for spontaneous spellcasters.)
        if (this.spellCasting?.castingType == "Spontaneous" && !this.itemSpell && spell.have(this.characterService, this.spellCasting, spellLevel, choice.className) && !this.spellTakenByThis(spell, choice)) {
            reasons.push("You already have this spell with this class.");
        }
        return reasons;
    }

    spellTakenByThis(spell: Spell, choice: SpellChoice) {
        return choice.spells.filter(takenSpell => takenSpell.name == spell.name || takenSpell.combinationSpellName == spell.name).length;
    }

    on_SpellTaken(spellName: string, taken: boolean, choice: SpellChoice, locked: boolean) {
        if (taken && !choice.spellCombination && (choice.spells.length == this.get_Available(choice) - 1)) { this.toggle_Choice("") }
        let prepared: boolean = this.prepared;
        this.get_Character().take_Spell(this.characterService, spellName, taken, choice, locked, prepared);
        this.characterService.set_ToChange("Character", "spells");
        this.characterService.set_ToChange("Character", "spellchoices");
        this.characterService.set_ToChange("Character", "spellbook");
        this.characterService.process_ToChange();
    }

    on_SpellCombinationTaken(spellName: string, taken: boolean, choice: SpellChoice) {
        if (taken) {
            this.toggle_Choice("")
            choice.spells[0].combinationSpellName = spellName;
        } else {
            choice.spells[0].combinationSpellName = "";
        }
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (["spellchoices", "all", "Character"].includes(target)) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (view.creature == "Character" && ["spellchoices", "all"].includes(view.target)) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        if (!this.level) {
            this.level = this.choice.level;
        }
        this.finish_Loading();
    }

}
