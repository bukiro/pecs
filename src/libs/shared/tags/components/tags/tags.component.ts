/* eslint-disable complexity */
import { Component, ChangeDetectionStrategy, OnChanges, Input, SimpleChanges } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { Activity } from 'src/app/classes/activities/activity';
import { Specialization } from 'src/app/classes/attacks/specialization';
import { ConditionGainSet } from 'src/app/classes/conditions/condition-gain-set';
import { AnimalCompanionAncestry } from 'src/app/classes/creatures/animal-companion/animal-companion-ancestry';
import { AnimalCompanionSpecialization } from 'src/app/classes/creatures/animal-companion/animal-companion-specialization';
import { Creature } from 'src/app/classes/creatures/creature';
import { Effect } from 'src/app/classes/effects/effect';
import { Trait } from 'src/app/classes/hints/trait';
import { Feat } from 'src/libs/shared/definitions/models/feat';
import { HintShowingItem } from 'src/libs/shared/definitions/types/hint-showing-item';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { HintShowingObjectsService } from 'src/libs/shared/services/hint-showing-objects/hint-showing-objects.service';
import { DurationsService } from 'src/libs/shared/time/services/durations/durations.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { emptySafeCombineLatest } from 'src/libs/shared/util/observable-utils';
import { sortAlphaNum } from 'src/libs/shared/util/sort-utils';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { HintComponent } from '../hint/hint.component';
import { CommonModule } from '@angular/common';

interface TagCollection {
    conditions: Array<{ setName: string; conditionSets: Array<ConditionGainSet> }>;
}

@Component({
    selector: 'app-tags',
    templateUrl: './tags.component.html',
    styleUrls: ['./tags.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        NgbPopover,

        HintComponent,
    ],
})
export class TagsComponent extends TrackByMixin(BaseClass) implements OnChanges {

    @Input()
    public creature: Creature = CreatureService.character;
    @Input()
    public objectName = '';
    @Input()
    public showTraits = false;
    @Input()
    public showFeats = false;
    @Input()
    public showItems = false;
    @Input()
    public showActivities = false;
    @Input()
    public showConditions = false;
    @Input()
    public showEffects = false;
    @Input()
    public specialNames: Array<string> = [];
    @Input()
    public specialEffects: Array<Effect> = [];

    public activities$?: Observable<Array<{ setName: string; activities: Array<Activity> }>>;
    public effects$?: Observable<Array<Effect>>;
    public feats$?: Observable<Array<{ setName: string; feats: Array<Feat> }>>;
    public companionElements$?: Observable<Array<{
        setName: string;
        elements: Array<AnimalCompanionSpecialization | AnimalCompanionAncestry | Feat>;
    }>>;
    public familiarElements$?: Observable<Array<{ setName: string; feats: Array<Feat> }>>;
    public items$?: Observable<Array<{ setName: string; items: Array<HintShowingItem> }>>;
    public specializations$?: Observable<Array<{ setName: string; specializations: Array<Specialization> }>>;
    public traits$?: Observable<Array<{ setName: string; traits: Array<{ trait: Trait; itemNamesList: string }> }>>;

    constructor(
        private readonly _traitsDataService: TraitsDataService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _durationsService: DurationsService,
        private readonly _hintShowingObjectsService: HintShowingObjectsService,
    ) {
        super();
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes.showEffects || changes.objectName || changes.specialEffects) {
            this.effects$ = this._effectsShowingHintsOnThis$(this.objectName)
                .pipe(
                    map(hintShowingEffects => hintShowingEffects
                        .concat(
                            this.specialEffects
                                .filter(effect => effect.displayed),
                        ),
                    ),
                );
        }

        if (changes.showActivities || changes.objectName || changes.specialNames || changes.creature) {
            this.activities$ = emptySafeCombineLatest(
                [this.objectName]
                    .concat(this.specialNames)
                    .map(name => this._activitiesShowingHintsOnThis$(name)
                        .pipe(
                            map(activities => ({ setName: name, activities }))),
                    ),
            );
        }

        if (changes.showFeats || changes.objectName || changes.specialNames || changes.creature) {
            this.feats$ = emptySafeCombineLatest(
                [this.objectName]
                    .concat(this.specialNames)
                    .map((name, index) => this._featsShowingHintsOnThis$(name, index === 0 ? this.showFeats : true)
                        .pipe(
                            map(feats => ({ setName: name, feats }))),
                    ),
            );

            this.companionElements$ = emptySafeCombineLatest(
                [this.objectName]
                    .concat(this.specialNames)
                    .map((name, index) => this._companionElementsShowingHintsOnThis$(name, index === 0 ? this.showFeats : true)
                        .pipe(
                            map(elements => ({ setName: name, elements })),
                        ),
                    ),
            );

            this.familiarElements$ = emptySafeCombineLatest(
                [this.objectName]
                    .concat(this.specialNames)
                    .map((name, index) => this._familiarElementsShowingHintsOnThis$(name, index === 0 ? this.showFeats : true)
                        .pipe(
                            map(feats => ({ setName: name, feats })),
                        ),
                    ),
            );
        }

        if (changes.objectName || changes.specialNames || changes.creature) {
            this.items$ = emptySafeCombineLatest(
                [this.objectName]
                    .concat(this.specialNames)
                    .map(name => this._itemsShowingHintsOnThis$(name)
                        .pipe(
                            map(items => ({ setName: name, items })),
                        ),
                    ),
            );

            this.specializations$ = emptySafeCombineLatest(
                [this.objectName]
                    .concat(this.specialNames)
                    .map(name => this._specializationsShowingHintsOnThis$(name)
                        .pipe(
                            map(specializations => ({ setName: name, specializations })),
                        ),
                    ),
            );

            this.traits$ = emptySafeCombineLatest(
                [this.objectName]
                    .concat(this.specialNames)
                    .map(name => this._traitsShowingHintsOnThis$(name)
                        .pipe(
                            map(traits => ({ setName: name, traits })),
                        ),
                    ),
            );
        }
    }

    public collectAllTags$(): Observable<TagCollection> {
        return emptySafeCombineLatest(
            [this.objectName]
                .concat(this.specialNames)
                .map(setName =>
                    this._conditionsShowingHintsOnThis$(setName)
                        .pipe(
                            map(conditionSets => ({ setName, conditionSets })),
                        ),
                ),
        )
            .pipe(
                map(conditions => ({ conditions })),
            );
    }

    public durationDescription$(duration: number): Observable<string> {
        return this._durationsService.durationDescription$(duration);
    }

    private _traitsShowingHintsOnThis$(name: string): Observable<Array<{ trait: Trait; itemNamesList: string }>> {
        if (this.showTraits && name) {
            return this._traitsDataService.traitsShowingHintsOnThis$(this.creature, name)
                .pipe(
                    map(traitSets => traitSets.map(traitSet => ({ trait: traitSet.trait, itemNamesList: traitSet.itemNames.join(', ') }))),
                    map(traitSets => traitSets.sort((a, b) => sortAlphaNum(a.trait.name, b.trait.name))),
                );
        } else {
            return of([]);
        }
    }

    private _featsShowingHintsOnThis$(name: string, show: boolean): Observable<Array<Feat>> {
        if (show && name && this.creature?.isCharacter()) {
            return this._hintShowingObjectsService.characterFeatsShowingHintsOnThis$(name)
                .pipe(
                    map(feats => feats.sort((a, b) => sortAlphaNum(a.name, b.name))),
                );
        } else {
            return of([]);
        }
    }

    private _companionElementsShowingHintsOnThis$(
        name: string,
        show: boolean,
    ): Observable<Array<AnimalCompanionAncestry | AnimalCompanionSpecialization | Feat>> {
        if (show && name && this.creature?.isAnimalCompanion()) {
            return this._hintShowingObjectsService.companionElementsShowingHintsOnThis$(name)
                .pipe(
                    map(elements => elements.sort((a, b) => sortAlphaNum(a.name, b.name))),
                );
        } else {
            return of([]);
        }
    }

    private _familiarElementsShowingHintsOnThis$(name: string, show: boolean): Observable<Array<Feat>> {
        if (show && name && this.creature?.isFamiliar()) {
            return this._hintShowingObjectsService.familiarElementsShowingHintsOnThis$(name)
                .pipe(
                    map(elements => elements.sort((a, b) => sortAlphaNum(a.name, b.name))),
                );
        } else {
            return of([]);
        }
    }

    private _effectsShowingHintsOnThis$(name: string): Observable<Array<Effect>> {
        if (this.showEffects && name) {
            return this._creatureEffectsService.effectsOnThis$(this.creature, name)
                .pipe(
                    map(effects =>
                        effects
                            .filter(effect => effect.displayed)
                            .sort((a, b) => sortAlphaNum(a.source, b.source)),
                    ),
                );
        } else {
            return of([]);
        }
    }

    private _conditionsShowingHintsOnThis$(name: string): Observable<Array<ConditionGainSet>> {
        if (this.showConditions && name) {
            return this._hintShowingObjectsService.creatureConditionsShowingHintsOnThis$(this.creature, name)
                .pipe(
                    map(conditions =>
                        conditions.sort((a, b) => sortAlphaNum(a.condition.name, b.condition.name)),
                    ),
                );
        } else {
            return of([]);
        }
    }

    private _activitiesShowingHintsOnThis$(name: string): Observable<Array<Activity>> {
        if (this.showActivities && name) {
            return this._hintShowingObjectsService.creatureActivitiesShowingHintsOnThis$(this.creature, name)
                .pipe(
                    map(activities =>
                        activities.sort((a, b) => sortAlphaNum(a.name, b.name)),
                    ),
                );
        } else {
            return of([]);
        }
    }

    private _itemsShowingHintsOnThis$(name: string): Observable<Array<HintShowingItem>> {
        if (this.showItems && name) {
            return this._hintShowingObjectsService.creatureItemsShowingHintsOnThis$(this.creature, name)
                .pipe(
                    map(items => items.sort((a, b) => sortAlphaNum(a.name, b.name))),
                );
        } else {
            return of([]);
        }
    }

    private _specializationsShowingHintsOnThis$(name: string): Observable<Array<Specialization>> {
        if (this.showItems && name) {
            return this._hintShowingObjectsService.creatureArmorSpecializationsShowingHintsOnThis$(this.creature, name)
                .pipe(
                    map(specs => specs.sort((a, b) => sortAlphaNum(a.name, b.name))),
                );
        } else {
            return of([]);
        }
    }

}
