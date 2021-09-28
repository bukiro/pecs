export class ConditionChoice {
    public name: string = "";
    public defaultDuration: number = null;
    public nextStage: number = 0;
    public featreq: string[] = [];
    public spelllevelreq: number = 0;
    recast() {
        //Blank choices are saved with "name":"-" for easier managing; These need to be blanked here.
        if (this.name == "-") {
            this.name = "";
        }
        //If a choice name has turned into a number, turn it back into a string.
        if (typeof this.name == "number") {
            this.name = parseInt(this.name).toString();
        }
        return this;
    }
}