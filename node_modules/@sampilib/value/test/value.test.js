import { assert, AssertionError } from "chai";
import { describe, it } from "mocha";
import { Value } from "../src/value.js";

describe('Value', function() {

    describe('Initial value', function() {
        it('Should have an initial value of undefined', function() { assert.equal((new Value()).___value, undefined); });
        it('Should have an initial value of true', function() { assert.equal((new Value(true)).___value, true); });
        it('Should have an initial value of 1', function() { assert.equal((new Value(1)).___value, 1); });
        it('Should have an initial value of "test"', function() { assert.equal((new Value('test')).___value, 'test'); });
        it('Should have an initial value type of an object', function() { assert.typeOf((new Value({})).___value, 'object'); });
        it('Should have an initial value type of an array', function() { assert.instanceOf((new Value([])).___value, Array); });
    });

    describe('Initial valueLimiter should not limit initial value', function() {
        it('Should have an initial value of undefined', function() { assert.equal((new Value(undefined, (val) => { return true })).___value, undefined); });
        it('Should have an initial value of true', function() { assert.equal((new Value(true, (val) => { return true })).___value, true); });
        it('Should have an initial value of 1', function() { assert.equal((new Value(1, (val) => { return true })).___value, 1); });
        it('Should have an initial value of "test"', function() { assert.equal((new Value('test', (val) => { return true })).___value, 'test'); });
        it('Should have an initial value type of an object', function() { assert.typeOf((new Value({}, (val) => { return true })).___value, 'object'); });
        it('Should have an initial value type of an array', function() { assert.instanceOf((new Value([], (val) => { return true })).___value, Array); });
    });

    describe('Setting value', function() {
        it('Value cannot be set to undefined', function() {
            let value = new Value(1);
            value.set = undefined;
            assert.equal(value.___value, 1);
        });
        it('Setting value to true', function() {
            let value = new Value();
            value.set = true;
            assert.equal(value.___value, true);
        });
        it('Setting value to 1', function() {
            let value = new Value();
            value.set = 1;
            assert.equal(value.___value, 1);
        });
        it('Setting value to "test"', function() {
            let value = new Value();
            value.set = 'test';
            assert.equal(value.___value, 'test');
        });
        it('Setting value to an object', function() {
            let value = new Value();
            value.set = {};
            assert.typeOf(value.___value, 'object');
        });
        it('Setting value to an array', function() {
            let value = new Value();
            value.set = [];
            assert.instanceOf(value.___value, Array);
        });
    });

    describe('Getting value', function() {
        it('Getting value with undefined value', function() { assert.equal((new Value()).get, undefined); });
        it('Setting value to true', function() { assert.equal((new Value(true)).___value, true); });
        it('Setting value to 1', function() { assert.equal((new Value(1)).___value, 1); });
        it('Setting value to "test"', function() { assert.equal((new Value('test')).___value, 'test'); });
        it('Setting value to an object', function() { assert.typeOf((new Value({})).___value, 'object'); });
        it('Setting value to an array', function() { assert.instanceOf((new Value([])).___value, Array); });
    });

    describe('Adding and removing listener', function() {
        it('Add one listener correctly', function() {
            let value = new Value();
            let listener1 = value.addListener(() => {});
            assert.equal(value.___valueListeners.length, 1);
            assert.equal(value.___valueListeners[0], listener1);
        });
        it('Add two listeners correctly', function() {
            let value = new Value();
            let listener1 = value.addListener(() => {});
            let listener2 = value.addListener(() => {});
            assert.equal(value.___valueListeners.length, 2);
            assert.equal(value.___valueListeners[1], listener2);
        });
        it('Insert two listeners then remove first listners correctly', function() {
            let value = new Value();
            let listener1 = value.addListener(() => {});
            let listener2 = value.addListener(() => {});
            value.removeListener(listener1);
            assert.equal(value.___valueListeners.length, 1);
            assert.equal(value.___valueListeners[0], listener2);
        });
        it('Insert two listeners then removeing both listners correctly', function() {
            let value = new Value();
            let listener1 = value.addListener(() => {});
            let listener2 = value.addListener(() => {});
            value.removeListener(listener1);
            value.removeListener(listener2);
            assert.notExists(value.___valueListeners);
        });
    });

    describe('Value limiter', function() {
        it('Limiter which changes values', function() {
            let value = new Value(1, (val) => { return val * 2 });
            value.set = 10;
            assert.equal(value.___value, 20);
        });
        it('Limiter which denies values', function() {
            let value = new Value(1, (val) => { return (val === 10 ? undefined : val) });
            value.set = 20;
            assert.equal(value.___value, 20);
            value.set = 10;
            assert.equal(value.___value, 20);
        });
    });

    describe('Value change with listeners', function() {
        it('One listener', function(done) {
            let value = new Value();
            value.addListener((val) => { if (val === 10) { done() } else { done(new AssertionError('Unexpected value')) } });
            value.set = 10;
        });
        it('Multiple listener', function() {
            let value = new Value();
            let proms = Promise.all([
                new Promise((a) => { value.addListener((val) => { a() }) }),
                new Promise((a) => { value.addListener((val) => { a() }) }),
                new Promise((a) => { value.addListener((val) => { a() }) }),
            ])
            value.set = 10;
            return proms;
        });
        it('Listener with exception', function() {
            let value = new Value();
            value.addListener((val) => { throw false });
            value.set = 10;
        });
    });

    describe('Adding listeners with initial run', function() {
        it('Add one listener correctly', function(done) {
            let value = new Value(1);
            let listener1 = (val) => { if (val === 1) { done(); } else { done(new AssertionError('Value incorrect')) } };
            value.addListener(listener1, true);
        });
        it('Add multiple listeners correctly', function() {
            let value = new Value(1);
            let proms = Promise.all([
                new Promise((a) => { value.addListener((val) => { if (val === 1) { a(); } }, true) }),
                new Promise((a) => { value.addListener((val) => { if (val === 1) { a(); } }, true) }),
                new Promise((a) => { value.addListener((val) => { if (val === 1) { a(); } }, true) }),
            ])
            return proms;
        });
    });

    describe('Value update', function() {
        it('One listener', function(done) {
            let value = new Value(10);
            value.addListener((val) => { if (val === 10) { done() } else { done(new AssertionError('Unexpected value')) } });
            value.update();
        });
        it('Multiple listener', function() {
            let value = new Value();
            let proms = Promise.all([
                new Promise((a) => { value.addListener((val) => { a() }) }),
                new Promise((a) => { value.addListener((val) => { a() }) }),
                new Promise((a) => { value.addListener((val) => { a() }) }),
            ])
            value.update();
            return proms;
        });
    });

    describe('On listener callback', function() {
        it('Adding listener', function(done) {
            let value = new Value(10);
            value.onListener = function(type, self) {
                if (type === true && self === value && this === value) {
                    done();
                } else {
                    done(new AssertionError(''))
                }
            }
            value.addListener(() => {});
        });
        it('Removing listener', function(done) {
            let value = new Value(10);
            let listner = value.addListener(() => {});
            value.onListener = function(type, self) {
                if (type === false && self === value && this === value) {
                    done();
                } else {
                    done(new AssertionError(''))
                }
            }
            value.removeListener(listner);
        });
    });

    describe('Methods and properties', function() {
        it('hasListener', function() {
            let value = new Value(10);
            assert.equal(value.hasListener, false);
            value.addListener(() => {});
            assert.equal(value.hasListener, true);
        });
        it('Compare same type', function() {
            let value = new Value(10);
            assert.equal(value.compare(10), false);
            assert.equal(value.compare(11), true);
        });
        it('Compare different type', function() {
            let value = new Value(10);
            assert.equal(value.compare('10'), false);
            assert.equal(value.compare('11'), true);
        });
        it('Setter increment number', function() {
            let value = new Value(10);
            value.set++;
            assert.equal(value.___value, 11);
        });
        it('Setter increment string', function() {
            let value = new Value('10');
            value.set += 'test';
            assert.equal(value.___value, '10test');
        });
    });
});