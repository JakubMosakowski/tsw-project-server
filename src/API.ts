const axios = require('axios');
import {Method} from "axios";

const client = axios.create();

export class API {
    static execute(method: Method, resource: string, data?: any) {
        return client({
            url: "https://tsw-data-generator.herokuapp.com" + resource,
            data: data,
            method: method
        });
    }

    static getHorses() {
        return API.execute(GET, "/horses");
    }

    static getJudges() {
        return API.execute(GET, "/judges");
    }

    static getRanks() {
        return API.execute(GET, "/ranks");
    }
}
export const GET = "get";
