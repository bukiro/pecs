import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';
import { Creature } from './Creature';

export class Speed {
        constructor(
        public name: string = ""
    ) { };
    public source: string = "";
    recast() {
        return this;
    }
    relatives(creature: Creature, effectsService: EffectsService, name: string, both: boolean = false) {
        if (both && name != "Speed") {
            return effectsService.get_RelativesOnThese(creature, [name, "Speed"]);
        } else {
            return effectsService.get_RelativesOnThis(creature, name);
        }
    }
    absolutes(creature: Creature, effectsService: EffectsService, name: string, both: boolean = false) {
        if (both && name != "Speed") {
            return effectsService.get_AbsolutesOnThese(creature, [name, "Speed"]);
        } else {
            return effectsService.get_AbsolutesOnThis(creature, name);
        }
    }
    bonuses(creature: Creature, effectsService: EffectsService, name: string, both: boolean = false) {
        if (both && name != "Speed") {
            return effectsService.show_BonusesOnThese(creature, [name, "Speed"]);
        } else {
            return effectsService.show_BonusesOnThis(creature, name);
        }
    }
    penalties(creature: Creature, effectsService: EffectsService, name: string, both: boolean = false) {
        if (both && name != "Speed") {
            return effectsService.show_PenaltiesOnThese(creature, [name, "Speed"]);
        } else {
            return effectsService.show_PenaltiesOnThis(creature, name);
        }
    }
    baseValue(creature: Creature, characterService: CharacterService, effectsService: EffectsService) {
        //Gets the basic speed and adds all effects
        if (characterService.still_loading()) { return 0; }
        let sum = 0;
        let explain: string = "";
        //Penalties cannot lower a speed below 5. We need to track if one ever reaches 5, then never let it get lower again.
        let above5 = false;
        //Get the base land speed from the ancestry
        if (creature.type == "Familiar") {
            if (this.name == creature.speeds[1].name) {
                sum = 25;
                explain = "\nBase speed: " + sum;
            }
        } else {
            if ((creature as AnimalCompanion | Character).class.ancestry.name) {
                (creature as AnimalCompanion | Character).class.ancestry.speeds.filter(speed => speed.name == this.name).forEach(speed => {
                    sum = speed.value;
                    explain = "\n" + (creature as AnimalCompanion | Character).class.ancestry.name + " base speed: " + sum;
                });
            }
        }
        //Absolutes completely replace the baseValue. They are sorted so that the highest value counts last.
        let absolutes = this.absolutes(creature, effectsService, this.name).filter(effect => effect.setValue);
        absolutes.forEach(effect => {
            sum = parseInt(effect.setValue)
            explain = effect.source + ": " + effect.setValue;
        });
        let isNull: boolean = (sum == 0)
        this.relatives(creature, effectsService, this.name).forEach(effect => {
            sum += parseInt(effect.value);
            explain += "\n" + effect.source + ": " + effect.value;
        });
        if (!isNull && sum < 5 && this.name != "Speed") {
            sum = 5;
            explain += "\nEffects cannot lower a speed below 5."
        }
        explain = explain.trim();
        return [sum, explain];
    }
    value(creature: Creature, characterService: CharacterService, effectsService: EffectsService): [number, string] {
        //If there is a general speed penalty (or bonus), it applies to all speeds. We apply it to the base speed here so we can still
        // copy the base speed for effects (e.g. "You gain a climb speed equal to your land speed") and not apply the general penalty twice.
        let baseValue = this.baseValue(creature, characterService, effectsService)
        let sum = baseValue[0];
        let explain: string = baseValue[1];
        let isNull: boolean = (sum == 0)
        if (this.name != "Speed") {
            this.relatives(creature, effectsService, "Speed").forEach(effect => {
                sum += parseInt(effect.value);
                explain += "\n" + effect.source + ": " + effect.value;
            });
        }
        if (!isNull && sum < 5 && this.name != "Speed") {
            sum = 5;
            explain += "\nEffects cannot lower a speed below 5."
        }
        explain = explain.trim();
        return [sum, explain];
    }
}