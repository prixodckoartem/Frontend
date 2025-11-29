const ORERATIONS = {
    sum: '+',
    substract: '-',
    multiply: '*',
    divison: '/' 
};

function calculate({ a, b, operation}) {
    let result = null;

    switch (operation) {
        case ORERATIONS.sum:
            result = sum(a, b);
            break;

        case ORERATIONS.substract:
            result = substract(a, b);
            break;

        case ORERATIONS.multiply:
            result = multiply(a, b);
            break;

        case ORERATIONS.divison:
            result = divison(a, b);
            break;

        default:
            break;
    }
    return result;
}