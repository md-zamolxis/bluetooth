export class Interval {

    public startedOn: Date;
    public endedOn: Date;

    constructor() {
        this.startedOn = new Date();
    }

    public duration(): number {
        if (this.endedOn == null) {
            this.endedOn = new Date();
        }
        if (this.startedOn == null) {
            this.startedOn = this.endedOn;
        }
        return this.endedOn.getTime() - this.startedOn.getTime();
    }

}