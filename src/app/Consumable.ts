import { ConditionGain } from './ConditionGain';
import { Item } from './Item';
import { EffectGain } from './EffectGain';

export class Consumable extends Item {
    public readonly _className: string = this.constructor.name;
    //Allow changing of "equippable" by custom item creation
    readonly allowEquippable = false;
    //Consumables can not be equipped.
    readonly equippable = false;
    //How many Actions does it take to use this item?
    //Usually "Free", "Reaction", "1", "2" or "3", but can be something special like "1 hour"
    public actions: string = "1A";
    //What needs to be done to activate? Example: "Command", "Manipulate"
    public activationType: string = "";
    public inputRequired: string = "";
    //List ConditionGain for every condition that you gain from using this item
    public gainConditions: ConditionGain[] = [];
    //List EffectGain for every effect that happens instantly when the item is used
    public onceEffects: EffectGain[] = [];
    //Some Items get bought in stacks. Stack defines how many you buy at once,
    //and how many make up one instance of the items Bulk.
    public stack: number = 1;
}
