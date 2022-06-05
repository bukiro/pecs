import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { Condition, OtherConditionSelection } from 'src/app/classes/Condition';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { ConditionsService } from 'src/app/services/conditions.service';
import { ItemsService } from 'src/app/services/items.service';
import { TimeService } from 'src/app/services/time.service';
import { TraitsService } from 'src/app/services/traits.service';
import { Creature } from 'src/app/classes/Creature';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Activity } from 'src/app/classes/Activity';
import { EffectsService } from 'src/app/services/effects.service';
import { Trackers } from 'src/libs/shared/util/trackers';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { ItemActivity } from 'src/app/classes/ItemActivity';

interface ActivityParameters {
    gain: ActivityGain | ItemActivity;
    activity: Activity | ItemActivity;
    maxCharges: number;
    canNotActivate: boolean;
    isHostile: boolean;
}

@Component({
    selector: 'app-condition',
    templateUrl: './condition.component.html',
    styleUrls: ['./condition.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionComponent implements OnInit, OnDestroy {

    @Input()
    public conditionGain: ConditionGain;
    @Input()
    public condition: Condition;
    @Input()
    public showItem = '';
    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;
    @Input()
    public fullDisplay = false;
    @Output()
    public readonly showItemMessage = new EventEmitter<string>();

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _characterService: CharacterService,
        private readonly _effectsService: EffectsService,
        private readonly _refreshService: RefreshService,
        private readonly _timeService: TimeService,
        private readonly _itemsService: ItemsService,
        private readonly _conditionsService: ConditionsService,
        private readonly _traitsService: TraitsService,
        private readonly _activitiesService: ActivitiesDataService,
        public trackers: Trackers,
    ) { }

    private get _currentCreature(): Creature {
        return this._characterService.creatureFromType(this.creature);
    }

    public toggleShownItem(name: string): void {
        this.showItem = this.showItem === name ? '' : name;

        this.showItemMessage.emit(this.showItem);
    }

    public shownItem(): string {
        return this.showItem;
    }

    public durationDescription(duration: number): string {
        return this._timeService.durationDescription(duration);
    }

    public isInformationalCondition(): boolean {
        return this.condition.isInformationalCondition(this._currentCreature, this._characterService, this.conditionGain);
    }

    public setConditionDuration(gain: ConditionGain, turns: number): void {
        gain.duration = turns;
        gain.maxDuration = gain.duration;
        this._refreshService.prepareDetailToChange(this.creature, 'effects');
        this._refreshService.processPreparedChanges();
        this._updateCondition();
    }

    public incConditionDuration(gain: ConditionGain, turns: number): void {
        gain.duration += turns;
        gain.maxDuration = gain.duration;
        this._refreshService.prepareDetailToChange(this.creature, 'effects');
        this._refreshService.processPreparedChanges();
        this._updateCondition();
    }

    public setConditionValue(gain: ConditionGain, set: number): void {
        this.incConditionValue(gain, set - gain.value);
    }

    public incConditionValue(gain: ConditionGain, change: number): void {
        gain.value += change;

        if (gain.name === 'Drained' && change < 0) {
            //When you lower your drained value, you regain Max HP, but not the lost HP.
            //Because HP is Max HP - Damage, we increase damage to represent not regaining the HP.
            //We subtract level*change from damage because change is negative.
            this._currentCreature.health.damage =
                Math.max(0, (this._currentCreature.health.damage - (this._currentCreature.level * change)));
        }

        gain.showValue = false;
        this._refreshService.prepareDetailToChange(this.creature, 'effects');
        this._refreshService.processPreparedChanges();
        this._updateCondition();
    }

    public incConditionRadius(gain: ConditionGain, change: number): void {
        gain.radius += change;
    }

    public conditionChoices(gain: ConditionGain, condition: Condition): Array<string> {
        return condition.effectiveChoices(this._characterService, gain.source !== 'Manual', gain.heightened);
    }

    public changeConditionChoice(gain: ConditionGain, condition: Condition, newChoice: string): void {
        const oldChoice = gain.choice;

        gain.choice = newChoice;
        this._conditionsService.changeConditionChoice(
            this._currentCreature,
            gain,
            condition,
            oldChoice,
            this._characterService,
            this._itemsService,
        );
        this._refreshService.processPreparedChanges();
        this._updateCondition();
    }

    public prepareSelectingOtherConditions(gain: ConditionGain, condition: Condition): Array<OtherConditionSelection> {
        condition.selectOtherConditions.forEach((_selection, index) => {
            //Ensure that the condition gain has a place for each selection in its array.
            if (gain.selectedOtherConditions.length <= index) {
                gain.selectedOtherConditions.push('');
            }
        });

        return condition.selectOtherConditions;
    }

    public selectOtherConditionOptions(selection: OtherConditionSelection, gain: ConditionGain, index: number): Array<string> {
        const creature = this._currentCreature;
        const typeFilter = selection.typeFilter.map(filter => filter.toLowerCase());
        const nameFilter = selection.nameFilter.map(filter => filter.toLowerCase());
        const filteredConditions = this._conditionsService.conditions().filter(libraryCondition =>
            (typeFilter.length ? typeFilter.includes(libraryCondition.type.toLowerCase()) : true) &&
            (nameFilter.length ? nameFilter.includes(libraryCondition.name.toLowerCase()) : true),
        )
            .map(libraryCondition => libraryCondition.name.toLowerCase());

        return Array.from(new Set(
            this._conditionsService.currentCreatureConditions(creature, this._characterService, creature.conditions, true)
                .map(conditionGain => conditionGain.name)
                .filter(conditionName =>
                    (conditionName.toLowerCase() !== gain.name.toLowerCase()) &&
                    (
                        (typeFilter.length || nameFilter.length) ? filteredConditions.includes(conditionName.toLowerCase()) : true
                    ),
                )
                .concat('', gain.selectedOtherConditions[index]),
        )).sort();
    }

    public setConditionStage(gain: ConditionGain, condition: Condition, choices: Array<string>, change: number): void {
        this._conditionsService.changeConditionStage(
            this._currentCreature,
            gain,
            condition,
            choices,
            change,
            this._characterService,
            this._itemsService,
        );
        this._refreshService.processPreparedChanges();
        this._updateCondition();
    }

    public changeOtherConditionSelection(): void {
        this._refreshService.prepareDetailToChange(this.creature, 'effects');
        this._refreshService.processPreparedChanges();
        this._updateCondition();
    }

    public heightenedConditionDescription(): string {
        if (this.conditionGain) {
            return this.condition.heightenedText(this.condition.desc, this.conditionGain.heightened);
        } else {
            return this.condition.heightenedText(this.condition.desc, this.condition.minLevel);
        }
    }

    public removeCondition(conditionGain: ConditionGain): void {
        this._characterService.removeCondition(this._currentCreature, conditionGain, true);
        this._refreshService.setComponentChanged('close-popovers');
    }

    public conditionActivitiesParameters(): Array<ActivityParameters> {
        if (this.conditionGain) {
            this.conditionGain.gainActivities.forEach(activityGain => {
                activityGain.heightened = this.conditionGain.heightened;
                activityGain.originalActivity(this._activitiesService)?.effectiveCooldown(
                    { creature: this._currentCreature },
                    { characterService: this._characterService, effectsService: this._effectsService },
                );
            });

            return this.conditionGain.gainActivities.map(gain => {
                const activity = this._activityFromName(gain.name);
                const maxCharges = activity.maxCharges({ creature: this._currentCreature }, { effectsService: this._effectsService });
                const canNotActivate = ((gain.activeCooldown ? (maxCharges === gain.chargesUsed) : false) && !gain.active);
                const isHostile = activity.isHostile();

                return {
                    gain,
                    activity,
                    maxCharges,
                    canNotActivate,
                    isHostile,
                };
            });
        } else {
            return [];
        }
    }

    /* eslint-disable @typescript-eslint/naming-convention */
    public activityClasses(
        activityParameters: ActivityParameters,
    ): { 'fancy-button': boolean; 'inactive-button': boolean; penalty: boolean; bonus: boolean } {
        return {
            'fancy-button': activityParameters.gain.active,
            'inactive-button': activityParameters.canNotActivate,
            penalty: !activityParameters.canNotActivate && activityParameters.isHostile,
            bonus: !activityParameters.canNotActivate && !activityParameters.isHostile,
        };
        /* eslint-enable @typescript-eslint/naming-convention */
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (target === 'effects' || target === 'all' || target === this.creature) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature === this.creature && ['effects', 'all'].includes(view.target)) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _activityFromName(name: string): Activity {
        return this._activitiesService.activityFromName(name);
    }

    private _updateCondition(): void {
        //This updates any gridicon that has this condition gain's id set as its update id.
        if (this.conditionGain.id) {
            this._refreshService.setComponentChanged(this.conditionGain.id);
        }
    }

}
