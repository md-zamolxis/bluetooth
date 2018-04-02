import { TremolElicomFPCommand } from "./tremol.elicom.fp.command";
import { ICommand } from "../command";

export class TremolElicomFPSequence {

    commands: Array<TremolElicomFPCommand> = new Array<TremolElicomFPCommand>();
    commandId: number = 0;
    nextCommandId: number = 0;
    STX: number = 2;
    ETX: number = 10;

    constructor(commands: Array<ICommand>) {
        if (commands == null) {
            return;
        }
        for (let index = 0; index < commands.length; index++) {
            let command = new TremolElicomFPCommand(commands[index].request);
            this.commands.push(command);
        }
    }

    handle(command: TremolElicomFPCommand) {
        
    }

}