window.events = events;
window.simpleEventHandlerObjectTest = {};

//#############################################
//Sub Event Handler Class Test
class SubEventHandlerClassExtendTest extends events.SubEventHandler { constructor() { super(['test1', 'test2']); } }
let subEventHandlerClassExtendTest = new SubEventHandlerClassExtendTest();
subEventHandlerClassExtendTest.addEListener('test3', () => {});
subEventHandlerClassExtendTest.addEListener('test1', false);

let lis4 = subEventHandlerClassExtendTest.addEListener('test1', (e) => { console.log('lis9', e); }, { once: true });
let lis1 = subEventHandlerClassExtendTest.addEListener('test1', (e) => {
    console.log('lis1', e);
    subEventHandlerClassExtendTest.removeEListener('test1', lis1);
});
let lis1a = subEventHandlerClassExtendTest.addEListener('test1', (e) => { console.log('lis1a', e); }, { sub: ['a'] });
let lis1ab = subEventHandlerClassExtendTest.addEListener('test1', (e) => { console.log('lis1ab', e); }, { sub: ['a', 'b'] });
let lis5 = subEventHandlerClassExtendTest.addEListener('test1', (e) => { console.log('lis9', e); }, { once: true, sub: ['a', 'b'] });
let lis6 = subEventHandlerClassExtendTest.addEListener('test1', (e) => { console.log('lis9', e); }, { once: true, sub: ['b'] });
let lis1b = subEventHandlerClassExtendTest.addEListener('test1', (e) => { console.log('lis1b', e); }, { sub: ['b'] });
let lis2 = subEventHandlerClassExtendTest.addEListener('test2', (e) => { console.log('lis2', e); });
let lis3 = subEventHandlerClassExtendTest.addEListener(['test1', 'test2'], (e) => { console.log('lis3', e); });
subEventHandlerClassExtendTest.addEListener('test1', lis1);

console.log(subEventHandlerClassExtendTest);
subEventHandlerClassExtendTest.dispatchE('test1', new events.E({ yo: 0 }));
subEventHandlerClassExtendTest.dispatchE('test2', new events.E({ yo: 0 }));

subEventHandlerClassExtendTest.dispatchE('test1', new events.E({ yo: 0 }), { sub: ['a'] });
subEventHandlerClassExtendTest.dispatchE('test1', new events.E({ yo: 0 }), { sub: ['a', 'b'] });
subEventHandlerClassExtendTest.dispatchE('test1', new events.E({ yo: 0 }), { sub: ['b'] });


subEventHandlerClassExtendTest.removeEListener('test1', lis1);
subEventHandlerClassExtendTest.removeEListener('test2', lis2);
subEventHandlerClassExtendTest.removeEListener('test1', lis3);
subEventHandlerClassExtendTest.removeEListener('test1', lis1a, { sub: ['a'] });
console.log(subEventHandlerClassExtendTest);
subEventHandlerClassExtendTest.removeEListener('test1', lis1b, { sub: ['b'] });
console.log(subEventHandlerClassExtendTest);
subEventHandlerClassExtendTest.removeEListener('test1', lis1ab, { sub: ['a', 'b'] });

console.log(subEventHandlerClassExtendTest);
subEventHandlerClassExtendTest.dispatchE('test1', new events.E({ yo: 0 }));
subEventHandlerClassExtendTest.dispatchE('test2', new events.E({ yo: 0 }));
subEventHandlerClassExtendTest.removeEListener('test2', lis3);
console.log(subEventHandlerClassExtendTest);

//#############################################
//Simple Event Handler Class Test
// class SimpleEventHandlerClassExtendTest extends events.SimpleEventHandler { constructor() { super(['test1', 'test2']); } }
// let simpleEventHandlerClassExtendTest = new SimpleEventHandlerClassExtendTest();
// simpleEventHandlerClassExtendTest.addEListener('test3', () => {});
// simpleEventHandlerClassExtendTest.addEListener('test1', false);

// let lis1 = simpleEventHandlerClassExtendTest.addEListener('test1', (e) => { console.log('lis1', e); });
// let lis2 = simpleEventHandlerClassExtendTest.addEListener('test2', (e) => { console.log('lis2', e); });
// let lis3 = simpleEventHandlerClassExtendTest.addEListener(['test1', 'test2'], (e) => { console.log('lis3', e); });
// let lis4 = simpleEventHandlerClassExtendTest.addEListener('test1', (e) => { console.log('lis9', e); }, { once: true });
// simpleEventHandlerClassExtendTest.addEListener('test1', lis1);

// console.log(simpleEventHandlerClassExtendTest);
// simpleEventHandlerClassExtendTest.dispatchE('test1', new events.E({ yo: 0 }));
// simpleEventHandlerClassExtendTest.dispatchE('test2', new events.E({ yo: 0 }));

// simpleEventHandlerClassExtendTest.removeEListener('test1', lis1);
// simpleEventHandlerClassExtendTest.removeEListener('test2', lis2);
// simpleEventHandlerClassExtendTest.removeEListener('test1', lis3);
// console.log(simpleEventHandlerClassExtendTest);
// simpleEventHandlerClassExtendTest.dispatchE('test1', new events.E({ yo: 0 }));
// simpleEventHandlerClassExtendTest.dispatchE('test2', new events.E({ yo: 0 }));
// simpleEventHandlerClassExtendTest.removeEListener('test2', lis3);
// console.log(simpleEventHandlerClassExtendTest);



//#############################################
//Simple Event Handler Attach Test
// events.attachSimpleEventHandler(simpleEventHandlerObjectTest, ['test1', 'test2']);

// simpleEventHandlerObjectTest.addSimpleListener('test3', () => {});
// simpleEventHandlerObjectTest.addSimpleListener('test1', false);

// let lis1 = simpleEventHandlerObjectTest.addSimpleListener('test1', (e) => { console.log('lis1', e); });
// let lis2 = simpleEventHandlerObjectTest.addSimpleListener('test2', (e) => { console.log('lis2', e); });
// let lis3 = simpleEventHandlerObjectTest.addSimpleListener(['test1', 'test2'], (e) => { console.log('lis3', e); });
// console.log(simpleEventHandlerObjectTest);
// simpleEventHandlerObjectTest.dispatchSimpleEvent('test1', new events.E({ yo: 0 }));
// simpleEventHandlerObjectTest.dispatchSimpleEvent('test2', new events.E({ yo: 0 }));

// simpleEventHandlerObjectTest.removeSimpleListener('test1', lis1);
// simpleEventHandlerObjectTest.removeSimpleListener('test2', lis2);
// simpleEventHandlerObjectTest.removeSimpleListener('test1', lis3);
// console.log(simpleEventHandlerObjectTest);
// simpleEventHandlerObjectTest.dispatchSimpleEvent('test1', new events.E({ yo: 0 }));
// simpleEventHandlerObjectTest.dispatchSimpleEvent('test2', new events.E({ yo: 0 }));
// simpleEventHandlerObjectTest.removeSimpleListener('test2', lis3);
// console.log(simpleEventHandlerObjectTest);

// class SimpleEventHandlerClassTest {
//     constructor() {
//         this.initSimpleEventHandler(['tast1', 'tast2']);
//     }
// }
// events.attachSimpleEventHandler(SimpleEventHandlerClassTest.prototype);

// window.simpleEventHandlerClassTest = new SimpleEventHandlerClassTest();

// simpleEventHandlerClassTest.addSimpleListener('test3', () => {});
// simpleEventHandlerClassTest.addSimpleListener('test1', false);