import { Injectable } from '@angular/core';
import { Ancestry } from 'src/app/classes/Ancestry';
import { Character } from 'src/app/classes/Character';
import { LanguageGain } from 'src/app/classes/LanguageGain';
import { CacheService } from 'src/app/services/cache.service';
import { CharacterService } from 'src/app/services/character.service';
import { FeatsService } from 'src/app/services/feats.service';
import { ItemsService } from 'src/app/services/items.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { CharacterHeritageChangeService } from '../character-heritage-change/character-heritage-change.service';

@Injectable({
    providedIn: 'root',
})
export class CharacterAncestryChangeService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _itemsService: ItemsService,
        private readonly _featsService: FeatsService,
        private readonly _cacheService: CacheService,
        private readonly _refreshService: RefreshService,
        private readonly _characterHeritageChangeService: CharacterHeritageChangeService,
    ) { }

    public changeAncestry(newAncestry?: Ancestry): void {
        const character = this._characterService.character;

        this._characterHeritageChangeService.changeHeritage();
        this._processRemovingOldAncestry(character);

        if (newAncestry) {
            character.class.ancestry = Object.assign(new Ancestry(), JSON.parse(JSON.stringify(newAncestry))).recast();

            this._processNewAncestry(character);
        } else {
            character.class.ancestry = new Ancestry();
        }

        this._cacheService.resetCreatureCache(character.typeId);
        this._characterService.updateLanguageList();
    }

    private _processRemovingOldAncestry(character: Character): void {
        const characterClass = character.class;
        const ancestry = characterClass?.ancestry;

        if (ancestry?.name) {
            const level = characterClass.levels[1];

            characterClass.languages = characterClass.languages.filter(language => language.source !== ancestry.name);

            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');

            level.abilityChoices = level.abilityChoices.filter(availableBoost => availableBoost.source !== 'Ancestry');

            //Of each granted Item, find the item with the stored id and drop it.
            ancestry.gainItems.forEach(freeItem => {
                freeItem.dropGrantedItem(character, {}, { characterService: this._characterService });
            });

            //We must specifically un-take the ancestry's feats to undo their effects.
            ancestry.featChoices.filter(choice => choice.available).forEach(choice => {
                choice.feats.forEach(gain => {
                    character.takeFeat(character, this._characterService, undefined, gain.name, false, choice, gain.locked);
                });
            });

            //Remove all Adopted Ancestry feats
            characterClass.levels.forEach(classLevel => {
                classLevel.featChoices.forEach(choice => {
                    choice.feats.filter(gain => gain.name.includes('Adopted Ancestry')).forEach(gain => {
                        this._featsService.processFeat(character, this._characterService, undefined, gain, choice, level, false);
                    });

                    choice.feats = choice.feats.filter(gain => !gain.name.includes('Adopted Ancestry'));
                });
            });
        }
    }

    private _processNewAncestry(character: Character): void {
        const characterClass = character.class;
        const ancestry = characterClass?.ancestry;

        if (characterClass?.ancestry.name) {
            const level = characterClass.levels[1];

            characterClass.languages.push(
                ...ancestry.languages
                    .map(language => Object.assign(new LanguageGain(), { name: language, locked: true, source: ancestry.name })),
            );

            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');

            level.abilityChoices.push(...ancestry.abilityChoices);

            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');

            //Grant all items and save their id in the ItemGain.
            ancestry.gainItems.forEach(freeItem => {
                freeItem.grantGrantedItem(character, {}, { characterService: this._characterService, itemsService: this._itemsService });
            });

            //Many feats get specially processed when taken.
            //We have to explicitly take these feats to process them.
            ancestry.featChoices.forEach(choice => {
                choice.feats.forEach(gain => {
                    character.takeFeat(character, this._characterService, undefined, gain.name, true, choice, gain.locked);
                });
            });
        }
    }

}
