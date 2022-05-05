import { Consumable } from 'src/app/classes/Consumable';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';

export class Talisman extends Consumable {
    //Other Consumables should be type "talismans" to be found in the database
    readonly type = 'talismans';
    public critfailure = '';
    public critsuccess = '';
    public failure = '';
    public success = '';
    public requirements = '';
    public showActivities: Array<string> = [];
    //You can only choose this talisman for an item if its type is in the targets list (with a hardcoded exception for "melee weapons")
    public targets: Array<string> = [];
    public trigger = '';
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);

        return this;
    }
}
