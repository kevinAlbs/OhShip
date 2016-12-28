(function() {
    'use strict';
    const kNumChildren = 100;
    let child_process = require('child_process');
    let childNo = 1;

    // Have each child spawned at a different time period
    for (let i = 0; i < kNumChildren; i++) {
        let delay = Math.random() * kNumChildren * 500;
        setTimeout(() => {
            let child = child_process.spawn('node', ['stupid_ai.js']);
            child.stdout.on('data', (data) => { console.log(`\t ${data}`); });
            console.log("Starting child " + (childNo++));
        }, delay);
    }
    
}());