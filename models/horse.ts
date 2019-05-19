import {Human} from "./human";
import {Rank} from "./rank";

export interface RacingHorse extends Horse{
    id: number;
    number: number;
    rank: Rank;
    yearOfBirth: number;
    color: string;
    sex: string;
    breeder: Human;
    owner: Human;
    lineage: Lineage;
    result: Notes[];
}

export interface Horse {
    name: string;
    country: string;
}

export interface Lineage {
    father: Horse;
    mother: Horse;
    mothersFather: Horse;
}

export interface Notes {
    type: number;
    head: number;
    loh: number;
    legs: number;
    movement: number;
}
