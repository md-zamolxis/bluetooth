import { Interval } from "./interval";
import { Configuration } from "./configuration";
import { IDriver } from "./driver";
import { Message } from "./message";

export interface ISequence {

    configuration: Configuration
    driver: IDriver;
    method: string;
    interval: Interval;
    error: Message;
    
}