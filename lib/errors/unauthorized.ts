export class Unauthorized extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'Unauthorized';
    }
}
