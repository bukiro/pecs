import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { ToastService } from '../../services/toast/toast.service';
import { Toast } from '../../definitions/interfaces/toast';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/trackers-mixin';

@Component({
    selector: 'app-toast-container',
    templateUrl: './toast-container.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _toastService: ToastService,
    ) {
        super();
    }

    public get toasts(): Array<Toast> {
        return this._toastService.toasts;
    }

    public onClick(toast: Toast): void {
        if (toast.onClickAction) {
            this._refreshService.prepareDetailToChange(toast.onClickCreature || CreatureTypes.Character, toast.onClickAction);
            this._refreshService.processPreparedChanges();
        }

        this._toastService.remove(toast);
    }

    public remove(toast: Toast): void {
        this._toastService.remove(toast);
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['toasts', 'all'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (['toasts', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

}
