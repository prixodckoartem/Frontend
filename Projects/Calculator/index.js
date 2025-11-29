const input1Node = document.querySelector('.jsinput1');
const input2Node = document.querySelector('.jsinput2');    
const inputOPNode = document.querySelector('.jsinputOP');
const buttonNode = document.querySelector('.jsbutton');
const outputNode = document.querySelector('.jsoutput');

buttonNode.addEventListener('click', function() {
    const a = Number(input1Node.value); 
    const b = Number(input2Node.value);
    const operation = inputOPNode.value;

    const result = calculate({a, b, operation});

    outputNode.innerHTML = result;
})