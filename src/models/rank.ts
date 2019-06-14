import {Judge} from "./judge";

export interface Rank {
    id: string;
    number: number;
    category: string;
    committee: Judge[];
    finished: boolean;
}
