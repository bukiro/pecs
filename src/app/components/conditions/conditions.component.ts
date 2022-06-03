/* eslint-disable complexity */
import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { ConditionsService } from 'src/app/services/conditions.service';
import { Condition } from 'src/app/classes/Condition';
import { TimeService } from 'src/app/services/time.service';
import { EffectsService } from 'src/app/services/effects.service';
import { ItemProperty } from 'src/app/classes/ItemProperty';
import { EffectGain } from 'src/app/classes/EffectGain';
import { ItemsService } from 'src/app/services/items.service';
import { Creature } from 'src/app/classes/Creature';
import { Skill } from 'src/app/classes/Skill';
import { Ability } from 'src/app/classes/Ability';
import { Activity } from 'src/app/classes/Activity';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { Equipment } from 'src/app/classes/Equipment';
import { Consumable } from 'src/app/classes/Consumable';
import { EvaluationService } from 'src/app/services/evaluation.service';
import { CustomEffectsService } from 'src/app/services/customEffects.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Trackers } from 'src/libs/shared/util/trackers';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { Character } from 'src/app/classes/Character';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Familiar } from 'src/app/classes/Familiar';
import { MenuState } from 'src/libs/shared/definitions/Types/menuState';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { BonusTypes } from 'src/libs/shared/definitions/bonusTypes';

const itemsPerPage = 40;

interface ConditionType {
    label: string;
    key: string;
}

@Component({
    selector: 'app-conditions',
    templateUrl: './conditions.component.html',
    styleUrls: ['./conditions.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionsComponent implements OnInit, OnDestroy {

    public endOn: TimePeriods.NoTurn | TimePeriods.HalfTurn = TimePeriods.HalfTurn;
    public value = 1;
    public heightened = 1;
    public wordFilter = '';
    public permanent = true;
    public untilRest = false;
    public untilRefocus = false;
    public days = 0;
    public hours = 0;
    public minutes = 0;
    public turns = 0;
    public newEffect: EffectGain = new EffectGain();
    public validationError: Array<string> = [];
    public validationResult: Array<string> = [];
    public parseInt = parseInt;
    public range = 0;
    public creatureTypesEnum = CreatureTypes;

    public conditionTypes: Array<ConditionType> = [
        { label: 'Generic', key: 'generic' },
        { label: 'Activities', key: 'activities' },
        { label: 'Afflictions', key: 'afflictions' },
        { label: 'Alchemical Elixirs', key: 'alchemicalelixirs' },
        { label: 'Alchemical Tools', key: 'alchemicaltools' },
        { label: 'Ammunition', key: 'ammunition' },
        { label: 'Blood Magic', key: 'bloodmagic' },
        { label: 'Feats', key: 'feats' },
        { label: 'Other Consumables', key: 'otherconsumables' },
        { label: 'Potions', key: 'potions' },
        { label: 'Spells', key: 'spells' },
        { label: 'Talismans', key: 'talismans' },
        { label: 'Weapons', key: 'weapons' },
        { label: 'Worn Items', key: 'wornitems' },
        { label: 'Held Items', key: 'helditems' },
    ];

    private _showList = '';
    private _showItem = '';
    private _showCreature: CreatureTypes = CreatureTypes.Character;
    private _showPurpose: 'conditions' | 'customeffects' = 'conditions';
    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _activitiesService: ActivitiesDataService,
        private readonly _conditionsService: ConditionsService,
        private readonly _effectsService: EffectsService,
        private readonly _itemsService: ItemsService,
        private readonly _timeService: TimeService,
        private readonly _evaluationService: EvaluationService,
        private readonly _customEffectsService: CustomEffectsService,
        public trackers: Trackers,
    ) { }

    public get isTileMode(): boolean {
        return this.character.settings.conditionsTileMode;
    }

    public get stillLoading(): boolean {
        return this._conditionsService.stillLoading || this._characterService.stillLoading;
    }

    public get character(): Character {
        return this._characterService.character;
    }

    public get companion(): AnimalCompanion {
        return this._characterService.companion;
    }

    public get familiar(): Familiar {
        return this._characterService.familiar;
    }

    private get _isCompanionAvailable(): boolean {
        return this._characterService.isCompanionAvailable();
    }

    private get _isFamiliarAvailable(): boolean {
        return this._characterService.isFamiliarAvailable();
    }

    public incRange(amount: number): void {
        this.range += amount;
    }

    public shownItemRangeDesc(visibleConditions: Array<Condition>, range: number): string {
        const currentFirstItem = (range * itemsPerPage) + 1;
        const currentLastItem =
            (((range + 1) * itemsPerPage) >= visibleConditions.length)
                ? visibleConditions.length
                : ((range + 1) * itemsPerPage);

        return `Showing ${ currentFirstItem }-${ currentLastItem } of ${ visibleConditions.length } `;
    }

    public toggleShownList(type: string): void {
        this._showList = this._showList === type ? '' : type;

        this.range = 0;
    }

    public shownList(): string {
        return this._showList;
    }

    public isConditionShown(visibleConditions: Array<Condition>, conditionIndex: number, range: number): boolean {
        return (
            visibleConditions.length < (itemsPerPage + itemsPerPage) ||
            this.shownList() === 'all' ||
            (
                conditionIndex >= (range * itemsPerPage) &&
                conditionIndex < (range + 1) * itemsPerPage
            )
        );
    }

    public toggleShownItem(name: string): void {
        this._showItem = this._showItem === name ? '' : name;
    }

    public shownItem(): string {
        return this._showItem;
    }

    public toggleShownPurpose(purpose: 'conditions' | 'customeffects'): void {
        this._showPurpose = purpose;
    }

    public shownPurpose(): 'conditions' | 'customeffects' {
        return this._showPurpose;
    }

    public toggleShownCreature(type: CreatureTypes): void {
        this._showCreature = type;
    }

    public shownCreature(): CreatureTypes {
        return this._showCreature;
    }

    public toggleTileMode(): void {
        this.character.settings.conditionsTileMode = !this.character.settings.conditionsTileMode;
        this._refreshService.prepareDetailToChange('Character', 'conditions');
        this._refreshService.processPreparedChanges();
    }

    public validateDurationNumbers(): void {
        const maxHours = 23;
        const maxMinutes = 59;
        const maxTurns = 9;

        this.hours = Math.max(0, Math.min(maxHours, this.hours));
        this.minutes = Math.max(0, Math.min(maxMinutes, this.minutes));
        this.turns = Math.max(0, Math.min(maxTurns, this.turns));
        this.setLinearDuration();
    }

    public closeFilterIfTooShort(): void {
        const minWordFilterLength = 5;

        if (this.wordFilter.length < minWordFilterLength && this._showList) {
            this._showList = '';
        }
    }

    public setFilterForAll(): void {
        if (this.wordFilter) {
            this._showList = 'all';
        }
    }

    public toggleConditionsMenu(): void {
        this._characterService.toggleMenu(MenuNames.ConditionsMenu);
    }

    public conditionsMenuState(): MenuState {
        return this._characterService.conditionsMenuState();
    }

    public allAvailableCreatures(companionAvailable: boolean = undefined, familiarAvailable: boolean = undefined): Array<Creature> {
        return this._characterService.allAvailableCreatures(companionAvailable, familiarAvailable);
    }

    public componentParameters(): { isCompanionAvailable: boolean; isFamiliarAvailable: boolean } {
        return {
            isCompanionAvailable: this._isCompanionAvailable,
            isFamiliarAvailable: this._isFamiliarAvailable,
        };
    }

    public visibleConditionsOfType(type: ConditionType): Array<Condition> {
        return this.conditionsOfType(type.key)
            .filter(condition =>
                !condition.hide &&
                (
                    !this.wordFilter || (
                        condition
                            .name
                            .concat(condition.desc)
                            .concat(condition.sourceBook)
                            .toLowerCase()
                            .includes(this.wordFilter.toLowerCase())
                    )
                ),
            )
            .sort((a, b) => SortAlphaNum(a.name, b.name));

    }

    public conditionsOfType(type: string): Array<Condition> {
        return this._conditionsService.conditions('', type);
    }

    public heightenedConditionDescription(condition: Condition): string {
        return condition.heightenedText(condition.desc, Math.max(this.heightened, condition.minLevel));
    }

    public setSpecialDuration(duration: number): void {
        this.permanent = duration === TimePeriods.Permanent;
        this.untilRest = duration === TimePeriods.UntilRest;
        this.untilRefocus = duration === TimePeriods.UntilRefocus;
        this.days = 0;
        this.hours = 0;
        this.minutes = 0;
        this.turns = 0;
    }

    public incDays(days: number): void {
        this.days = Math.max(this.days + days, 0);
        this.setLinearDuration();
    }

    public setLinearDuration(): void {
        this.permanent = this.untilRest = this.untilRefocus = false;
    }

    public effectiveDuration(includeTurn = true): number {
        if (this.permanent) {
            return TimePeriods.Permanent;
        }

        if (this.untilRest) {
            return TimePeriods.UntilRest;
        }

        if (this.untilRefocus) {
            return TimePeriods.UntilRefocus;
        }

        return (
            this.days * TimePeriods.Day +
            this.hours * TimePeriods.Hour +
            this.minutes * TimePeriods.Minute +
            this.turns * TimePeriods.Turn +
            (
                includeTurn
                    ? (
                        this.endOn === this._timeService.getYourTurn()
                            ? TimePeriods.NoTurn
                            : TimePeriods.HalfTurn
                    )
                    : TimePeriods.NoTurn
            )
        );
    }

    public effectiveConditionChoices(condition: Condition): Array<string> {
        return condition.effectiveChoices(this._characterService, false);
    }

    public durationDescription(duration: number = this.effectiveDuration(), inASentence = false): string {
        return this._timeService.durationDescription(duration, true, inASentence);
    }

    public onAddCondition(
        creature: Creature,
        condition: Condition,
        duration: number = this.effectiveDuration(false),
        includeTurnState = true,
    ): void {
        const newGain = new ConditionGain();

        newGain.name = condition.name;

        if (duration < 0 || duration === 1 || !includeTurnState) {
            newGain.duration = duration;
        } else {
            newGain.duration = duration + (this.endOn === this._timeService.getYourTurn() ? TimePeriods.NoTurn : TimePeriods.HalfTurn);
        }

        newGain.choice = condition.choice;

        if (condition.hasValue) {
            newGain.value = this.value;
        }

        if (condition.type === 'spells') {
            newGain.heightened = this.heightened;
        }

        newGain.source = 'Manual';
        this._characterService.addCondition(creature, newGain);
    }

    public effectiveEffectValue(creature: Creature, effect: EffectGain): { value: string | number; penalty: boolean } {
        //Send the effect's setValue or value to the EvaluationService to get its result.
        let result: string | number = null;
        let isPenalty = false;

        if (effect.setValue) {
            result =
                this._evaluationService.valueFromFormula(
                    effect.setValue,
                    { characterService: this._characterService, effectsService: this._effectsService },
                    { creature, effect },
                );
            isPenalty = false;
        } else if (effect.value) {
            result =
                this._evaluationService.valueFromFormula(
                    effect.value,
                    { characterService: this._characterService, effectsService: this._effectsService },
                    { creature, effect },
                );

            if (!isNaN(result as number)) {
                isPenalty = (result < 0) === (effect.affected !== 'Bulk');
            } else {
                result = null;
            }
        }

        return { value: result, penalty: isPenalty };
    }

    public isValueFormula(value: string): boolean {
        if (value && isNaN(parseInt(value, 10))) {
            if (!value.match('^[0-9-]*$')) {
                return true;
            }
        }

        return false;
    }

    public isEffectInvalid(): string {
        if (!this.newEffect.affected || (!this.newEffect.toggle && !this.newEffect.setValue && this.newEffect.value === '0')) {
            return 'This effect will not do anything.';
        }
    }

    public onAddEffect(creature: Creature): void {
        const duration: number = this.effectiveDuration(false);
        const newLength =
            creature.effects.push(
                Object.assign<EffectGain, EffectGain>(new EffectGain(), JSON.parse(JSON.stringify(this.newEffect))).recast(),
            );
        const newEffect = creature.effects[newLength - 1];

        if (duration < 0) {
            newEffect.maxDuration = newEffect.duration = duration;
        } else {
            newEffect.maxDuration = newEffect.duration =
                duration + (this.endOn === this._timeService.getYourTurn() ? TimePeriods.NoTurn : TimePeriods.HalfTurn);
        }

        this._refreshService.prepareDetailToChange(creature.type, 'effects');
        this._refreshService.prepareDetailToChange(creature.type, 'conditions');
        this._refreshService.processPreparedChanges();
    }

    public onNewCustomEffect(creature: Creature): void {
        creature.effects.push(new EffectGain());
    }

    public onRemoveEffect(creature: Creature, effect: EffectGain): void {
        creature.effects.splice(creature.effects.indexOf(effect), 1);
        this._refreshService.prepareDetailToChange(creature.type, 'effects');
        this._refreshService.prepareDetailToChange(creature.type, 'conditions');
        this._refreshService.processPreparedChanges();
    }

    public refreshEffects(creature: Creature): void {
        this._refreshService.prepareDetailToChange(creature.type, 'effects');
        this._refreshService.prepareDetailToChange(creature.type, 'conditions');
        this._refreshService.processPreparedChanges();
    }

    public validate(creature: Creature, effect: EffectGain): void {
        if (this.isValueFormula(effect.value)) {
            effect.value = '0';
        }

        this.refreshEffects(creature);
    }

    public validateAdvancedEffect(propertyData: ItemProperty, index: number): void {
        this.validationError[index] = '';
        this.validationResult[index] = '';

        const value = this.newEffect[propertyData.key];

        if (propertyData.key === 'value' && propertyData.parent === 'effects') {
            if (value && value !== '0') {
                const validationResult =
                    this._evaluationService.valueFromFormula(
                        value,
                        { characterService: this._characterService, effectsService: this._effectsService },
                        { creature: this.character },
                    )?.toString() || '0';

                if (validationResult && validationResult !== '0' && (parseInt(validationResult, 10) || parseFloat(validationResult))) {
                    if (parseFloat(validationResult) === parseInt(validationResult, 10)) {
                        this.validationError[index] = '';
                        this.validationResult[index] = parseInt(validationResult, 10).toString();
                    } else {
                        this.validationError[index] = 'This may result in a decimal value and be turned into a whole number.';
                        this.validationResult[index] = parseInt(validationResult, 10).toString();
                    }
                } else {
                    this.validationError[index] =
                        'This may result in an invalid value or 0. Invalid values will default to 0, '
                        + 'and untyped effects without a value will not be displayed.';
                    this.validationResult[index] = parseInt(validationResult, 10).toString();
                }
            }
        } else if (propertyData.key === 'setValue' && propertyData.parent === 'effects') {
            if (value && value !== '0') {
                const validationResult =
                    this._evaluationService.valueFromFormula(
                        value,
                        { characterService: this._characterService, effectsService: this._effectsService },
                        { creature: this.character },
                    )?.toString() || null;

                if (
                    validationResult &&
                    (
                        parseInt(validationResult, 10) ||
                        parseFloat(validationResult)
                    ) ||
                    parseInt(validationResult, 10) === 0
                ) {
                    if (parseFloat(validationResult) === parseInt(validationResult, 10)) {
                        this.validationError[index] = '';
                        this.validationResult[index] = parseInt(validationResult, 10).toString();
                    } else {
                        this.validationError[index] = 'This may result in a decimal value and be turned into a whole number.';
                        this.validationResult[index] = parseInt(validationResult, 10).toString();
                    }
                } else {
                    this.validationError[index] =
                        'This may result in an invalid value. Absolute effects with an invalid value will not be applied.';
                    this.validationResult[index] = parseInt(validationResult, 10).toString();
                }
            }
        } else if (propertyData.validation === '1plus') {
            if (parseInt(value, 10) >= 1) {
                //Do nothing if the validation is successful.
            } else {
                this.newEffect[propertyData.key] = 1;
            }
        } else if (propertyData.validation === '0plus') {
            if (parseInt(value, 10) >= 0) {
                //Do nothing if the validation is successful.
            } else {
                this.newEffect[propertyData.key] = 0;
            }
        } else if (propertyData.validation === '=1plus') {
            if (parseInt(value, 10) >= -1) {
                //Do nothing if the validation is successful.
            } else {
                this.newEffect[propertyData.key] = -1;
            }
        } else if (propertyData.validation === '0minus') {
            if (parseInt(value, 10) <= 0) {
                //Do nothing if the validation is successful.
            } else {
                this.newEffect[propertyData.key] = 0;
            }
        }
    }

    public customEffectProperties(): Array<ItemProperty> {
        const propertyData = (key: string): ItemProperty =>
            this._customEffectsService.effectProperties.find(property => property.key === key);

        return Object.keys(this.newEffect)
            .map(key => propertyData(key))
            .filter(property => property !== undefined)
            .sort((a, b) => SortAlphaNum(a.group + a.priority, b.group + b.priority));
    }

    public effectPropertyExamples(propertyData: ItemProperty): Array<string> {
        let examples: Array<string> = [''];

        switch (propertyData.examples) {
            case 'effects affected':
                examples.push(...this._characterService.skills(this.character).map((skill: Skill) => skill.name));
                examples.push(...this._characterService.abilities().map((ability: Ability) => ability.name));
                this._characterService.featsAndFeatures().filter(feat => feat.effects.length)
                    .forEach(feat => {
                        examples.push(...feat.effects.map(effect => effect.affected));
                    });
                this._characterService.conditions().filter(condition => condition.effects.length)
                    .forEach((condition: Condition) => {
                        examples.push(...condition.effects.map(effect => effect.affected));
                    });
                break;
            case 'effects value':
                this._characterService.featsAndFeatures().filter(feat => feat.onceEffects.length)
                    .forEach(feat => {
                        examples.push(...feat.onceEffects.map(effect => effect.value));
                    });
                this._characterService.featsAndFeatures().filter(feat => feat.effects.length)
                    .forEach(feat => {
                        examples.push(...feat.effects.map(effect => effect.value));
                    });
                this._characterService.conditions().filter(condition => condition.onceEffects.length)
                    .forEach((condition: Condition) => {
                        examples.push(...condition.onceEffects.map(effect => effect.value));
                    });
                this._characterService.conditions().filter(condition => condition.effects.length)
                    .forEach((condition: Condition) => {
                        examples.push(...condition.effects.map(effect => effect.value));
                    });
                this._activitiesService.activities().filter(activity => activity.onceEffects.length)
                    .forEach((activity: Activity) => {
                        examples.push(...activity.onceEffects.map(effect => effect.value));
                    });
                this._cleanItems().allEquipment()
                    .concat(...this._characterInventories().map(inventory => inventory.allEquipment()))
                    .filter(item => item.activities.length)
                    .forEach((item: Equipment) => {
                        item.activities.filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                            examples.push(...activity.onceEffects.map(effect => effect.value));
                        });
                    });
                this._cleanItems().allConsumables()
                    .concat(...this._characterInventories().map(inventory => inventory.allConsumables()))
                    .filter(item => item.onceEffects.length)
                    .forEach((item: Consumable) => {
                        examples.push(...item.onceEffects.map(effect => effect.value));
                    });
                examples = examples.filter(example =>
                    typeof example === 'string' &&
                    !example.toLowerCase().includes('object') &&
                    !example.toLowerCase().includes('heightened') &&
                    !example.toLowerCase().includes('value'),
                );
                break;
            case 'effects setvalue':
                this._characterService.featsAndFeatures().filter(feat => feat.onceEffects.length)
                    .forEach(feat => {
                        examples.push(...feat.onceEffects.map(effect => effect.setValue));
                    });
                this._characterService.featsAndFeatures().filter(feat => feat.effects.length)
                    .forEach(feat => {
                        examples.push(...feat.effects.map(effect => effect.setValue));
                    });
                this._characterService.conditions().filter(condition => condition.onceEffects.length)
                    .forEach((condition: Condition) => {
                        examples.push(...condition.onceEffects.map(effect => effect.setValue));
                    });
                this._characterService.conditions().filter(condition => condition.effects.length)
                    .forEach((condition: Condition) => {
                        examples.push(...condition.effects.map(effect => effect.setValue));
                    });
                this._activitiesService.activities().filter(activity => activity.onceEffects.length)
                    .forEach((activity: Activity) => {
                        examples.push(...activity.onceEffects.map(effect => effect.setValue));
                    });
                this._cleanItems().allEquipment()
                    .concat(...this._characterInventories().map(inventory => inventory.allEquipment()))
                    .filter(item => item.activities.length)
                    .forEach((item: Equipment) => {
                        item.activities.filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                            examples.push(...activity.onceEffects.map(effect => effect.setValue));
                        });
                    });
                this._cleanItems().allConsumables()
                    .concat(...this._characterInventories().map(inventory => inventory.allConsumables()))
                    .filter(item => item.onceEffects.length)
                    .forEach((item: Consumable) => {
                        examples.push(...item.onceEffects.map(effect => effect.setValue));
                    });
                examples = examples.filter(example =>
                    typeof example === 'string' &&
                    !example.toLowerCase().includes('object') &&
                    !example.toLowerCase().includes('heightened') &&
                    !example.toLowerCase().includes('value'),
                );
                break;
            case 'effects title':
                this._characterService.featsAndFeatures().filter(feat => feat.effects.length)
                    .forEach(feat => {
                        examples.push(...feat.effects.map(effect => effect.title));
                    });
                this._characterService.conditions().filter(condition => condition.effects.length)
                    .forEach((condition: Condition) => {
                        examples.push(...condition.effects.map(effect => effect.title));
                    });
                examples = examples.filter(example =>
                    typeof example === 'string' &&
                    !example.toLowerCase().includes('object') &&
                    !example.toLowerCase().includes('heightened'),
                );
                break;
            case 'effects type':
                examples = this.bonusTypes();
                break;
            default: break;
        }

        const maxLengthForExample = 90;

        const uniqueExamples = Array.from(new Set(examples.filter(example => example.length <= maxLengthForExample)));

        return uniqueExamples.sort();
    }

    public bonusTypes(): Array<string> {
        return Object.values(BonusTypes).map(type => type === 'untyped' ? '' : type);
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['conditions', 'all'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() === 'character' && ['conditions', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _cleanItems(): ItemCollection {
        return this._itemsService.cleanItems();
    }

    private _characterInventories(): Array<ItemCollection> {
        return this.character.inventories;
    }

}
