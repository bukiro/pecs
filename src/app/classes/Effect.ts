export class Effect {
    public ignored = false;
    public creature = '';
    public type = '';
    public target = '';
    public setValue = '';
    public toggle = false;
    public title = '';
    public source = '';
    public penalty = false;
    public apply: boolean = undefined;
    public show: boolean = undefined;
    public duration = 0;
    public maxDuration = 0;
    //If the effect is typed, cumulative lists all effect sources (of the same type) that it is cumulative with.
    public cumulative: Array<string> = [];
    public sourceId = '';
    constructor(
        public value: string = '',
    ) {
        if (value && !isNaN(parseInt(value))) {
            this.value = (parseInt(value) >= 0 ? '+' : '') + parseInt(value);
        }
    }
    recast() {
        return this;
    }
    get_DisplayTitle(signed = false) {
        if (this.title) {
            return (signed ? '= ' : '') + this.title;
        } else {
            if (parseInt(this.value)) {
                return this.value;
            } else if (this.setValue) {
                return (signed ? '= ' : '') + this.setValue;
            } else {
                return '';
            }
        }
    }
}
