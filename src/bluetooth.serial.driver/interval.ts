export class Interval {

    public startedOn: Date;
    public endedOn: Date;

    constructor() {
        this.startedOn = new Date();
    }

    public end() {
        this.endedOn = new Date();
    }

    public duration(): number {
        return this.endedOn.getTime() - this.startedOn.getTime();
    }

}