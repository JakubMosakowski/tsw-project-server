class APIError {
    location?: string;
    param?: string;
    msg: string;

    constructor(msg: string, param?: string,location?: string) {
        this.msg = msg;
        this.location = location;
        this.param = param;
    }
}
