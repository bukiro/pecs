import { SpecializationGain } from 'src/app/classes/attacks/specialization-gain';
import { AbilityChoice } from 'src/app/classes/character-creation/ability-choice';
import { FormulaChoice } from 'src/app/classes/character-creation/formula-choice';
import { LoreChoice } from 'src/app/classes/character-creation/lore-choice';
import { ProficiencyChange } from 'src/app/classes/character-creation/proficiency-change';
import { SkillChoice } from 'src/app/classes/character-creation/skill-choice';
import { SpellChoice } from 'src/app/classes/character-creation/spell-choice';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { HeritageGain } from 'src/app/classes/creatures/character/heritage-gain';
import { LanguageGain } from 'src/app/classes/creatures/character/language-gain';
import { EffectGain } from 'src/app/classes/effects/effect-gain';
import { Hint } from 'src/app/classes/hints/hint';
import { ItemGain } from 'src/app/classes/items/item-gain';
import { BloodMagic } from 'src/app/classes/spells/blood-magic';
import { SignatureSpellGain } from 'src/app/classes/spells/signature-spell-gain';
import { SpellCasting } from 'src/app/classes/spells/spell-casting';
import { setupSerializationWithHelpers } from '../../util/serialization';
import { RecastFns } from '../interfaces/recast-fns';
import { DeepPartial } from '../types/deep-partial';
import { FeatChoice } from './feat-choice';
import { FeatIgnoreRequirements } from './feat-ignore-requirements';
import { FeatRequirements } from './feat-requirements';
import { Serializable } from '../interfaces/serializable';
import { ProficiencyCopyGain } from 'src/app/classes/character-creation/proficiency-copy-gain';


const { assign, forExport, isEqual } = setupSerializationWithHelpers<Feat>({
    primitives: [
        'access',
        'weaponfeatbase',
        'archetype',
        'countAsFeat',
        'generatedLoreFeat',
        'generatedWeaponFeat',
        'canDelete',
        'displayName',
        'desc',
        'heritagereq',
        'gainAnimalCompanion',
        'gainFamiliar',
        'hide',
        'levelreq',
        'limited',
        'lorebase',
        'name',
        'shortdesc',
        'specialdesc',
        'complexreqdesc',
        'subType',
        'subTypes',
        'superType',
        'unlimited',
        'usageNote',
        'sourceBook',
        'PFSnote',
    ],
    primitiveArrays: [
        'anathema',
        'featreq',
        'gainActivities',
        'gainAncestry',
        'gainSpellListSpells',
        'gainDomains',
        'senses',
        'tenets',
        'traits',
    ],
    primitiveObjectArrays: [
        'customData',
        'ignoreRequirements',
        'skillreq',
        'complexreq',
        'abilityreq',
    ],
    serializableArrays: {
        effects:
            () => obj => EffectGain.from(obj),
        changeProficiency:
            () => obj => ProficiencyChange.from(obj),
        copyProficiency:
            () => obj => ProficiencyCopyGain.from(obj),
        bloodMagic:
            () => obj => BloodMagic.from(obj),
        gainAbilityChoice:
            () => obj => AbilityChoice.from(obj),
        gainSpecialization:
            () => obj => SpecializationGain.from(obj),
        gainConditions:
            recastFns => obj => ConditionGain.from(obj, recastFns),
        gainFeatChoice:
            () => obj => FeatChoice.from(obj),
        gainFormulaChoice:
            () => obj => FormulaChoice.from(obj),
        gainHeritage:
            () => obj => HeritageGain.from(obj),
        gainItems:
            () => obj => ItemGain.from(obj),
        gainLanguages:
            () => obj => LanguageGain.from(obj),
        gainLoreChoice:
            () => obj => LoreChoice.from(obj),
        gainSkillChoice:
            () => obj => SkillChoice.from(obj),
        gainSpellCasting:
            recastFns => obj => SpellCasting.from(obj, recastFns),
        gainSpellChoice:
            () => obj => SpellChoice.from(obj),
        hints:
            () => obj => Hint.from(obj),
        onceEffects:
            () => obj => EffectGain.from(obj),
        allowSignatureSpells:
            () => obj => SignatureSpellGain.from(obj),
    },
});

export class Feat implements Serializable<Feat> {
    public access = '';
    /**
     * If weaponfeatbase is true, the feat will be copied for every weapon that matches the description in the subtype:
     * - Advanced => Advanced Weapons
     * - Ancestry => Weapons with a trait that corresponds to an ancestry
     * - Uncommon => Weapons with the Uncommon trait
     * These can be combined. Any more filters need to be hardcoded in characterService.create_WeaponFeats().
     */
    public weaponfeatbase = false;
    public archetype = '';
    /**
     * Having this feat counts as fulfilling the prerequisite of having the feat named in countAsFeat.
     * This is useful for class feats that allow you to take another of the class type choices.
     */
    public countAsFeat = '';
    public generatedLoreFeat = false;
    public generatedWeaponFeat = false;
    //A custom character feat with canDelete: true can be manually deleted by the user.
    public canDelete = false;
    public displayName = '';
    public desc = '';
    public heritagereq = '';
    public gainAnimalCompanion = '';
    public gainFamiliar = false;
    public hide = false;
    public levelreq = 0;
    public limited = 0;
    public lorebase = '';
    public name = '';
    public shortdesc = '';
    public specialdesc = '';
    public complexreqdesc = '';
    public subType = '';
    public subTypes = false;
    public superType = '';
    public unlimited = false;
    public usageNote = '';
    public sourceBook = '';
    public PFSnote = '';

    public anathema: Array<string> = [];
    public featreq: Array<string> = [];
    public gainActivities: Array<string> = [];
    public gainAncestry: Array<string> = [];
    public gainSpellListSpells: Array<string> = [];
    public gainDomains: Array<string> = [];
    public senses: Array<string> = [];
    public tenets: Array<string> = [];
    public traits: Array<string> = [];

    /**
     * The customData property causes the feat to be copied into a custom feat, and the data property to gain the listed fields.
     * This usually goes hand in hand with feats where you need to make very specific, hardcoded choices that are saved in the data fields.
     */
    public customData: Array<{ name: string; type: 'string' | 'number' | 'stringArray' | 'numberArray' }> = [];
    /**
     * You can add requirements to the ignore list.
     * These get evaluated as complexreqs and must each result in one of the following to disable the requirement:
     * - "levelreq"
     * - "abilityreq"
     * - "featreq"
     * - "skillreq"
     * - "heritagereq"
     * - "complexreq"
     * - "dedicationlimit"
     */
    public ignoreRequirements: Array<FeatIgnoreRequirements.FeatIgnoreRequirement> = [];
    public gainSpellBookSlots: Array<{ spellBookSlots: Array<number>; className: string }> = [];
    public skillreq: Array<FeatRequirements.SkillRequirement> = [];
    public complexreq: Array<FeatRequirements.ComplexRequirement> = [];
    public abilityreq: Array<FeatRequirements.AbilityRequirement> = [];

    public effects: Array<EffectGain> = [];
    public changeProficiency: Array<ProficiencyChange> = [];
    public copyProficiency: Array<ProficiencyCopyGain> = [];
    public bloodMagic: Array<BloodMagic> = [];
    public gainAbilityChoice: Array<AbilityChoice> = [];
    public gainSpecialization: Array<SpecializationGain> = [];
    public gainConditions: Array<ConditionGain> = [];
    public gainFeatChoice: Array<FeatChoice> = [];
    public gainFormulaChoice: Array<FormulaChoice> = [];
    public gainHeritage: Array<HeritageGain> = [];
    public gainItems: Array<ItemGain> = [];
    public gainLanguages: Array<LanguageGain> = [];
    public gainLoreChoice: Array<LoreChoice> = [];
    public gainSkillChoice: Array<SkillChoice> = [];
    public gainSpellCasting: Array<SpellCasting> = [];
    public gainSpellChoice: Array<SpellChoice> = [];
    public hints: Array<Hint> = [];
    public onceEffects: Array<EffectGain> = [];
    public allowSignatureSpells: Array<SignatureSpellGain> = [];

    public static from(values: DeepPartial<Feat>, recastFns: RecastFns): Feat {
        return new Feat().with(values, recastFns);
    }

    public with(values: DeepPartial<Feat>, recastFns: RecastFns): Feat {
        assign(this, values, recastFns);

        this.gainHeritage.forEach(gainHeritage => {
            gainHeritage.source = this.name;
        });

        this.gainSpellChoice.forEach(choice => {
            if (!choice.source) {
                choice.source = `Feat: ${ this.name }`;
                choice.spells.forEach(gain => {
                    gain.source = choice.source;
                });
            }
        });

        return this;
    }

    public forExport(): DeepPartial<Feat> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): Feat {
        return Feat.from(this, recastFns);
    }

    public isEqual(compared: Partial<Feat>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
