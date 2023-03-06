import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Spell } from 'src/app/classes/Spell';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { Trait } from 'src/app/classes/Trait';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/trackers-mixin';

@Component({
    selector: 'app-spell-content',
    templateUrl: './spell-content.component.html',
    styleUrls: ['./spell-content.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpellContentComponent extends TrackByMixin(BaseClass) {

    @Input()
    public spell!: Spell;
    @Input()
    public spellLevel!: number;
    @Input()
    public casting?: SpellCasting;

    public spellTraditionsEnum = SpellTraditions;

    constructor(
        private readonly _traitsDataService: TraitsDataService,
        private readonly _spellsDataService: SpellsDataService,
    ) {
        super();
    }

    public traitFromName(name: string): Trait {
        return this._traitsDataService.traitFromName(name);
    }

    public heightenedText(text: string): string {
        return this.spell.heightenedText(text, this.spellLevel);
    }

    public spellFromName(name: string): Spell {
        return this._spellsDataService.spellFromName(name);
    }

}
