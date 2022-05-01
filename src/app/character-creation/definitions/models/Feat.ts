import { CharacterService } from 'src/app/services/character.service';
import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { FormulaChoice } from 'src/app/classes/FormulaChoice';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { Character } from 'src/app/classes/Character';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Familiar } from 'src/app/classes/Familiar';
import { SpecializationGain } from 'src/app/classes/SpecializationGain';
import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { ItemGain } from 'src/app/classes/ItemGain';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { ProficiencyChange } from 'src/app/classes/ProficiencyChange';
import { HeritageGain } from 'src/app/classes/HeritageGain';
import { Hint } from 'src/app/classes/Hint';
import { BloodMagic } from 'src/app/classes/BloodMagic';
import { Creature } from 'src/app/classes/Creature';
import { ProficiencyCopy } from 'src/app/classes/ProficiencyCopy';
import { LanguageGain } from 'src/app/classes/LanguageGain';
import { SignatureSpellGain } from 'src/app/classes/SignatureSpellGain';
import { EffectGain } from 'src/app/classes/EffectGain';
import { FeatRequirements } from 'src/app/character-creation/definitions/models/featRequirements';
import { FeatIgnoreRequirements } from './featIgnoreRequirements';

export class Feat {
    public abilityreq: FeatRequirements.AbilityRequirement[] = [];
    public access = '';
    //If weaponfeatbase is true, the feat will be copied for every weapon that matches the description in the subtype:
    // Advanced => Advanced Weapons
    // Ancestry => Weapons with a trait that corresponds to an ancestry
    // Uncommon => Weapons with the Uncommon trait
    //These can be combined. Any more filters need to be hardcoded in characterService.create_WeaponFeats().
    public weaponfeatbase = false;
    public anathema: string[] = [];
    public archetype = '';
    public changeProficiency: ProficiencyChange[] = [];
    public copyProficiency: ProficiencyCopy[] = [];
    public bloodMagic: BloodMagic[] = [];
    //Having this feat counts as fulfilling the prerequisite of having the feat named in countAsFeat. This is useful for class feats that allow you to take another of the class type choices.
    public countAsFeat = '';
    //The customData property causes the feat to be copied into a custom feat, and the data property to gain the listed fields.
    // This usually goes hand in hand with feats where you need to make very specific, hardcoded choices that are saved in the data fields.
    public customData: { name: string, type: 'string' | 'number' | 'stringArray' | 'numberArray' }[] = [];
    public generatedLoreFeat = false;
    public generatedWeaponFeat = false;
    //A custom character feat with canDelete: true can be manually deleted by the user.
    public canDelete = false;
    public displayName = '';
    public desc = '';
    public effects: EffectGain[] = [];
    public featreq: string[] = [];
    public heritagereq = '';
    //You can add requirements to the ignore list. These get evaluated as complexreqs and must result in: "levelreq", "abilityreq", "featreq", "skillreq", "heritagereq", "complexreq" or "dedicationlimit" to do anything.
    public ignoreRequirements: FeatIgnoreRequirements.FeatIgnoreRequirement[] = [];
    public gainAbilityChoice: AbilityChoice[] = [];
    public gainActivities: string[] = [];
    public gainAnimalCompanion = '';
    public gainSpecialization: SpecializationGain[] = [];
    public gainFamiliar = false;
    public gainConditions: ConditionGain[] = [];
    public gainFeatChoice: FeatChoice[] = [];
    public gainFormulaChoice: FormulaChoice[] = [];
    public gainAncestry: string[] = [];
    public gainHeritage: HeritageGain[] = [];
    public gainItems: ItemGain[] = [];
    public gainLanguages: LanguageGain[] = [];
    public gainLoreChoice: LoreChoice[] = [];
    public gainSkillChoice: SkillChoice[] = [];
    public gainSpellBookSlots: { spellBookSlots: number[], className: string }[] = [];
    public gainSpellListSpells: string[] = [];
    public gainSpellCasting: SpellCasting[] = [];
    public gainSpellChoice: SpellChoice[] = [];
    public gainDomains: string[] = [];
    public hide = false;
    public hints: Hint[] = [];
    public levelreq = 0;
    public limited = 0;
    public lorebase = '';
    public name = '';
    public onceEffects: EffectGain[] = [];
    public senses: string[] = [];
    public shortdesc = '';
    public skillreq: FeatRequirements.SkillRequirement[] = [];
    public specialdesc = '';
    public complexreq: FeatRequirements.ComplexRequirement[] = [];
    public complexreqdesc = '';
    public subType = '';
    public subTypes = false;
    public superType = '';
    public tenets: string[] = [];
    public traits: string[] = [];
    public unlimited = false;
    public usageNote = '';
    public sourceBook = '';
    public allowSignatureSpells: SignatureSpellGain[] = [];
    public PFSnote = '';
    public recast(): typeof this {
        this.changeProficiency = this.changeProficiency.map(obj => Object.assign(new ProficiencyChange(), obj).recast());
        this.copyProficiency = this.copyProficiency.map(obj => Object.assign(new ProficiencyCopy(), obj).recast());
        this.bloodMagic = this.bloodMagic.map(obj => Object.assign(new BloodMagic(), obj).recast());
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());
        this.gainAbilityChoice = this.gainAbilityChoice.map(obj => Object.assign(new AbilityChoice(), obj).recast());
        this.gainSpecialization = this.gainSpecialization.map(obj => Object.assign(new SpecializationGain(), obj).recast());
        this.gainConditions = this.gainConditions.map(obj => Object.assign(new ConditionGain(), obj).recast());
        this.gainFeatChoice = this.gainFeatChoice.map(obj => Object.assign(new FeatChoice(), obj).recast());
        this.gainFormulaChoice = this.gainFormulaChoice.map(obj => Object.assign(new FormulaChoice(), obj).recast());
        this.gainHeritage = this.gainHeritage.map(obj => Object.assign(new HeritageGain(), obj).recast());
        this.gainHeritage.forEach(gainHeritage => {
            gainHeritage.source = this.name;
        });
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        this.gainLanguages = this.gainLanguages.map(obj => Object.assign(new LanguageGain(), obj).recast());
        this.gainLoreChoice = this.gainLoreChoice.map(obj => Object.assign(new LoreChoice(), obj).recast());
        this.gainSkillChoice = this.gainSkillChoice.map(obj => Object.assign(new SkillChoice(), obj).recast());
        this.gainSpellCasting = this.gainSpellCasting.map(obj => Object.assign(new SpellCasting(obj.castingType), obj).recast());
        this.gainSpellChoice = this.gainSpellChoice.map(obj => Object.assign(new SpellChoice(), obj).recast());
        this.gainSpellChoice.forEach(choice => {
            if (!choice.source) {
                choice.source = `Feat: ${ this.name }`;
                choice.spells.forEach(gain => {
                    gain.source = choice.source;
                });
            }
        });
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());
        this.allowSignatureSpells = this.allowSignatureSpells.map(obj => Object.assign(new SignatureSpellGain(), obj).recast());
        return this;
    }
    public have(
        context: { creature: Creature },
        services: { characterService: CharacterService },
        filter: { charLevel?: number, minLevel?: number } = {},
        options: { excludeTemporary?: boolean, includeCountAs?: boolean } = {}
    ): number {
        if (services.characterService?.still_loading()) { return 0; }
        filter = {
            charLevel: services.characterService.get_Character().level,
            minLevel: 1,
            ...filter,
        };
        if (context.creature instanceof Character) {
            return services.characterService.get_CharacterFeatsTaken(filter.minLevel, filter.charLevel, this.name, '', '', undefined, options.excludeTemporary, options.includeCountAs)?.length || 0;
        } else if (context.creature instanceof Familiar) {
            return context.creature.abilities.feats.filter(gain => gain.name.toLowerCase() == this.name.toLowerCase())?.length || 0;
        } else {
            return 0;
        }
    }
}
