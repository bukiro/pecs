/* eslint-disable complexity */
import { Component, ChangeDetectionStrategy, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { Character } from 'src/app/classes/creatures/character/character';
import { Equipment } from 'src/app/classes/items/equipment';
import { ItemCollection } from 'src/app/classes/items/item-collection';
import { Talisman } from 'src/app/classes/items/talisman';
import { Weapon } from 'src/app/classes/items/weapon';
import { WornItem } from 'src/app/classes/items/worn-item';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ItemsDataService } from 'src/libs/shared/services/data/items-data.service';
import { InventoryPropertiesService } from 'src/libs/shared/services/inventory-properties/inventory-properties.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { priceTextFromCopper } from 'src/libs/shared/util/currency-utils';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { sortAlphaNum } from 'src/libs/shared/util/sort-utils';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface TalismanOption {
    talisman: Talisman;
    inv?: ItemCollection;
    talismanCordCompatible: boolean;
}

@Component({
    selector: 'app-item-talismans',
    templateUrl: './item-talismans.component.html',
    styleUrls: ['./item-talismans.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
    ],
})
export class ItemTalismansComponent extends TrackByMixin(BaseClass) implements OnInit {

    @Input()
    public item!: Equipment;
    @Input()
    public itemStore?: boolean;

    public newTalisman!: Array<TalismanOption>;

    constructor(
        private readonly _itemsDataService: ItemsDataService,
        private readonly _inventoryPropertiesService: InventoryPropertiesService,
        private readonly _inventoryService: InventoryService,
    ) {
        super();
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public availableSlots(): Array<number> {
        //Items can have one talisman.
        //Add as many slots as the item has talismans inserted (should be one, but just in case).
        //If none are inserted, add one slot as long as any talismans are available to insert.
        const indexes: Array<number> = [];

        if (this.item.talismans.length) {
            for (let index = 0; index < this.item.talismans.length; index++) {
                indexes.push(index);
            }
        } else if (this.itemStore || this._character.inventories.some(inv => inv.talismans.length)) {
            indexes.push(0);
        }

        return indexes;
    }

    public inventoriesOrCleanItems(): Array<ItemCollection> {
        if (this.itemStore) {
            return [this._cleanItems()];
        } else {
            return this._character.inventories;
        }
    }

    public inventoryName$(inv: ItemCollection): Observable<string> {
        return this._inventoryPropertiesService.effectiveName$(inv, this._character);
    }

    public initialTalismans(index: number): Array<TalismanOption> {
        const item = this.item;

        const defaultTalisman = {
            talisman: Talisman.from({ name: '' }, RecastService.recastFns),
            inv: undefined,
            talismanCordCompatible: false,
        };

        //Start with one empty talisman to select nothing.
        const allTalismans: Array<TalismanOption> = [defaultTalisman];

        //Add the current choice, if the item has a talisman at that index.
        if (item.talismans[index] && this.newTalisman[index]) {
            allTalismans.push(
                {
                    ... this.newTalisman[index],
                    talismanCordCompatible: this._isTalismanCompatibleWithTalismanCord(this.newTalisman[index].talisman),
                },
            );
        }

        return allTalismans;
    }

    public availableTalismans(inv: ItemCollection): Array<TalismanOption> {
        const twoDigits = 2;

        return inv.talismans.filter(talisman => talisman.targets.length && talisman.amount)
            .map(talisman => ({
                talisman,
                inv: (this.itemStore ? undefined : inv),
                talismanCordCompatible: this._isTalismanCompatibleWithTalismanCord(talisman),
            }))
            .filter(talisman =>
                talisman.talisman.targets.length &&
                (
                    talisman.talisman.targets.includes(this.item.type) ||
                    (
                        //Exception: The jade bauble is affixed to a melee weapon, which is not a weapon type.
                        this.item instanceof Weapon && this.item.melee && talisman.talisman.targets.includes('melee weapons')
                    ) ||
                    (
                        //Exception: Weapon talismans can be affixed to handwraps of mighty blows.
                        this.item instanceof WornItem && this.item.isHandwrapsOfMightyBlows && talisman.talisman.targets.includes('weapons')
                    ) ||
                    (
                        //Exception: Worn items with the bracers of armor functionality can attach armor talismans.
                        this.item instanceof WornItem && this.item.isBracersOfArmor && talisman.talisman.targets.includes('armors')
                    )
                ),
            )
            .sort((a, b) => sortAlphaNum(
                a.talisman.level.toString().padStart(twoDigits, '0') + a.talisman.name,
                b.talisman.level.toString().padStart(twoDigits, '0') + b.talisman.name,
            ));
    }

    public onSelectTalisman(index: number): void {
        const item = this.item;
        const newTalisman = this.newTalisman[index]?.talisman;
        const itemTalismanAtIndex = item.talismans[index];
        const newTalismanInv = this.newTalisman[index]?.inv;

        if (!itemTalismanAtIndex || newTalisman !== itemTalismanAtIndex) {
            // If there is a Talisman in this slot, return the old one to the inventory,
            // unless we are in the item store. Then remove it from the item.
            if (itemTalismanAtIndex) {
                if (!this.itemStore) {
                    this._removeTalisman(index);
                }

                item.talismans.splice(index, 1);
            }

            //Then add the new Talisman to the item and (unless we are in the item store) remove it from the inventory.
            if (newTalisman && newTalisman.name !== '') {
                const addedTalisman = newTalisman.clone(RecastService.recastFns).with({ amount: 1 }, RecastService.recastFns);

                //Add a copy of Talisman to the item
                item.talismans.push(addedTalisman);

                // If we are not in the item store, remove the inserted Talisman from the inventory,
                // either by decreasing the amount or by dropping the item.
                if (!this.itemStore && newTalismanInv) {
                    this._inventoryService.dropInventoryItem(this._character, newTalismanInv, newTalisman, false, false, false, 1);
                }
            }
        }

        this._setTalismanNames();
    }

    public talismanTitle(talisman: Talisman, talismanCordCompatible: boolean): string {
        const parts: Array<string> = [];

        if (this.itemStore && talisman.price) {
            parts.push(`Price ${ this._priceText(talisman) }`);
        }

        if (talismanCordCompatible) {
            parts.push('Compatible with equipped talisman cord');
        }

        return parts.join('; ');
    }

    public ngOnInit(): void {
        this._setTalismanNames();
    }

    private _priceText(talisman: Talisman): string {
        return priceTextFromCopper(talisman.price);
    }

    private _setTalismanNames(): void {
        this.newTalisman = [];

        if (this.item.talismans.length) {
            this.newTalisman =
                this.item.talismans.map(talisman => ({
                    talisman,
                    inv: undefined,
                    talismanCordCompatible: this._isTalismanCompatibleWithTalismanCord(talisman),
                }));
        } else {
            this.newTalisman = [{ talisman: new Talisman(), inv: undefined, talismanCordCompatible: false }];
        }

        this.newTalisman
            .filter(talisman => talisman.talisman.name === 'New Item')
            .forEach(talisman => {
                talisman.talisman.name = '';
            });
    }

    private _cleanItems(): ItemCollection {
        return this._itemsDataService.cleanItems();
    }

    private _isTalismanCompatibleWithTalismanCord(talisman: Talisman): boolean {
        return this.item.talismanCords
            .some(cord =>
                cord.isCompatibleWithTalisman(talisman),
            );
    }

    private _removeTalisman(index: number): void {
        const character = this._character;
        const oldTalisman = this.item.talismans[index];

        if (!oldTalisman) {
            return;
        }

        //Add the extracted stone back to the inventory.
        this._inventoryService.grantInventoryItem(
            oldTalisman,
            { creature: character, inventory: character.mainInventory },
            { resetRunes: false, changeAfter: false, equipAfter: false },
        );
    }

}
