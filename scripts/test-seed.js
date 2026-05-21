#!/usr/bin/env node
/** 自测：加载 demo-seed 并校验全流程数据完整性 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..', 'assets', 'js');
global.window = global;
const ctx = global;

function load(name) {
  require(path.join(root, name));
}

load('guide-constants.js');
load('industry-table.js');
load('candidate-sync.js');
load('demo-seed.js');

const seed = global.MOCK_SEED;
const taskId = 'T2025001';
const errors = [];

function assert(cond, msg) {
  if (!cond) errors.push(msg);
}

assert(seed, 'MOCK_SEED exists');
assert(seed.tasks.length >= 35, 'tasks >= 35, got ' + seed.tasks.length);
assert(seed.candidates.length === 48, 'candidates count 48, got ' + seed.candidates.length);
assert(seed.formalList.filter(f => f.taskId === taskId).length === 32, 'formalList 32');
assert(seed.supplements.filter(s => s.taskId === taskId).length === 32, 'supplements 32');
assert(seed.calculations.filter(c => c.taskId === taskId).length === 32, 'calculations 32');
assert(seed.reports.length >= 20, 'reports >= 20');
assert(seed.approvals.length >= 25, 'approvals >= 25');
assert(seed.industryStats.length >= 15, 'industryStats >= 15');
assert(seed.factors.length >= 25, 'factors >= 25');
assert(seed.mappings.length >= 25, 'mappings >= 25');
assert(seed.branchStats.length >= 25, 'branchStats >= 25');

const task = seed.tasks.find(t => t.id === taskId);
assert(task.syncedFromInterface, 'task synced');
assert(task.dqr && task.dqr.dqr, 'task dqr');
assert(task.milestone.calculationDone, 'milestone calculation');

const doneCalcs = seed.calculations.filter(c => c.taskId === taskId && c.status === 'done');
assert(doneCalcs.length >= 20, 'done calcs >= 20');

const withBoundary = seed.formalList.filter(f => f.boundaryNote);
assert(withBoundary.length >= 3, 'formal with boundaryNote');

const methods = new Set(seed.supplements.map(s => s.methodId));
assert(methods.has('report'), 'has report method');
assert(methods.has('energy'), 'has energy method');
assert(methods.has('product'), 'has product method');
assert(methods.has('economy'), 'has economy method');

if (errors.length) {
  console.error('FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('OK: demo seed validation passed');
console.log('  Task:', task.name);
console.log('  Tasks:', seed.tasks.length, '| Candidates:', seed.candidates.length, '| Formal:', seed.formalList.length);
console.log('  Supplements:', seed.supplements.length, '| Calculations:', seed.calculations.length);
console.log('  Reports:', seed.reports.length, '| DQR:', task.dqr.dqr, task.dqr.level);
console.log('  Total attributed (done):', doneCalcs.reduce((s, c) => s + (c.attributedEmission || 0), 0).toLocaleString(), 'tCO2e');
