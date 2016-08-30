(function() {
    'use strict';
    let Stats = (function(){
        let counters = new Map()
        , counterTotals = new Map()
        , accumulators = new Map() // takes running average
        , timer = 0
        ;
        function _clear() {
            // Clear counters and reset timer.
            counters.forEach((value, key) => {
                counters.set(key, 0);
            });
            accumulators.forEach((value, key) => {
                accumulators.set(key, [])
            });
            timer = 0;
        }

        function inc(key, val) {
            if (!val) val = 1;
            let newVal = counters.has(key) ? counters.get(key) + val : val;
            counters.set(key, newVal);

            newVal = counterTotals.has(key) ? counterTotals.get(key) + val : val;
            counterTotals.set(key, newVal);
        }

        function push(key, val) {
            if (!accumulators.has(key)) accumulators.set(key, []);
            accumulators.get(key).push(val);
        }

        function tick(delta) {
            timer += delta;
        }

        // TODO: current assumption is that only one client will use status since this clears.
        function getJsonAndClear() {
            let json = {
                counters: {},
                counterTotals: {},
                accumulators: {},
                delta: timer
            };

            counters.forEach((value, key) => {
                json["counters"][key] = value;                
            });

            counterTotals.forEach((value, key) => {
                json["counterTotals"][key] = value;
            });

            accumulators.forEach((value, key) => {
                let sum = accumulators.get(key).reduce((a, b) => {return a + b});
                json["accumulators"][key] = sum / timer;
            });

            _clear()
            return json;
        }

        return {
            tick: tick,
            inc: inc,
            push: push,
            getJson: getJsonAndClear
        };

    }());
    module.exports = Stats;
}());