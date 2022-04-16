type FeatDataValue = string | number | boolean | Array<string> | Array<number>;

export class FeatData {
    constructor(public level: number, public featName: string, public sourceId: string, data?: { [key: string]: FeatDataValue }) {
        if (data) {
            this.data = data;
        }
    }
    private data: { [key: string]: FeatDataValue } = {};
    recast() {
        return this;
    }
    public setValue(key: string, value: FeatDataValue | Event) {
        value = value instanceof Event ? (<HTMLInputElement>value.target).value : value;
        this.data[key] = value;
    }
    public getValue(key: string): FeatDataValue {
        return this.data[key];
    }
    public valueAsString(key: string): string {
        return typeof this.data[key] === 'string' ? this.data[key] as string : null;
    }
    public valueAsNumber(key: string): number {
        return typeof this.data[key] === 'number' ? this.data[key] as number : null;
    }
    public valueAsBoolean(key: string): boolean {
        return typeof this.data[key] === 'boolean' ? this.data[key] as boolean : null;
    }
    public valueAsStringArray(key: string): Array<string> {
        if (this.data[key] && Array.isArray(this.data[key])) {
            return this.data[key] as Array<string>;
        } else {
            return null;
        }
    }
    public valueAsNumberArray(key: string): Array<number> {
        if (this.data[key] && Array.isArray(this.data[key])) {
            return this.data[key] as Array<number>;
        } else {
            return null;
        }
    }
}
