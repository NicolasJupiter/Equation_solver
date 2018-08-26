fs = require('fs');
let data = fs.readFileSync('data-complex.json')
data = JSON.parse(data)

op_word_map = {'+':'add','-':'subtract','*':'multiply','/':'divide','=':'equal'}
word_op_map = {'add':'+','subtract':'-','multiply':'*','divide':'/','equal':'='}
word_op_inv = {'add':'subtract','subtract':'add','multiply':'divide','divide':'multiply','equal':'equal'}

function parseJsonEquationToString(data) {
if (!data['op']) return data;
return '('+parseJsonEquationToString(data['lhs'])+word_op_map[data['op']]+parseJsonEquationToString(data['rhs'])+')'
}

function varBlockFunction(b) {
if (!b['op']) {
if (Number(b)) {
return false
} else {
return true } }
return (varBlockFunction(b['lhs']) || varBlockFunction(b['rhs']))
}

function Depth(b,d) {
if (!b['op']) return d;
d++;
return Math.max(Depth(b['rhs'],d),Depth(b['lhs'],d))
}

function inverseStep(E) {
//step0: check if contains op as equal
if (!(E['op'] && E['op']==='equal')) throw "Given term does not have its operator as equal or doesn't have one at all. Please insert a valid equation to be solved.";

L = E['lhs'];
R = E['rhs'];

//step1: check which side variable lies
Rvar = varBlockFunction(R);
Lvar = varBlockFunction(L);
if (Rvar && Lvar) throw "both sides cant have the variable, please merge all variables into one term on the left hand side and try again."
if (!Rvar && !Lvar)  throw "neither side contain a variable, a equation must contain atleast one variable. Please introduce a variable and try again."
if (Rvar && !Lvar) return inverseStep({"lhs":E['rhs'],"op":E['op'],"rhs":E['lhs']})
// if (!Rvar && Lvar) pass;

//step2: check depths
Rdepth = Depth(R,0);
Ldepth = Depth(L,0);
if (Rdepth === 0 && Ldepth === 0) throw "both sides contain only one expression. This is either a solved equation or an assertion, please insert a valid equation to be solved."

//step3: type of transformation
var type = 0;
if (Ldepth > 0) {
if (varBlockFunction(L['lhs'])) {
Xblock = L['lhs']
Xblockpos = 'lhs'
Modblock = L['rhs']
Modblockpos = 'rhs'
} else {
Xblock = L['rhs']
Xblockpos = 'rhs'
Modblock = L['lhs']
Modblockpos = 'lhs'
}
opx = L['op']

if (Xblockpos === 'rhs' && (opx === 'subtract' || opx === 'divide')) {
type = 2;
} else {
type = 1;
}

//step4: make modification and return;
if (type === 1) {
return {"lhs": Xblock , "op": "equal" , "rhs": {"lhs": R, "op":word_op_inv[opx], "rhs":Modblock} }
} else {
return {"lhs": Xblock , "op": "equal" , "rhs": {"lhs": Modblock, "op":opx, "rhs": R} }
}
}
return E; //need to make allowances for ready to solve equation to pass through unchanged
}

function reorgEquationJson(E) {
var step = inverseStep(E)
var depth = Depth(step['lhs'],0)
//console.log("Depth: ", depth)
console.log("Eq: ",parseJsonEquationToString(step))
if (depth > 0) return reorgEquationJson(step);
return step;
}

function eval(lhs,rhs,op) {
if (op === 'add') return Number(lhs)+Number(rhs);
if (op === 'subtract') return Number(lhs)-Number(rhs);
if (op === 'multiply') return Number(lhs)*Number(rhs);
if (op === 'divide') return Number(lhs)/Number(rhs);
throw "invalid evaluation, check params;"
}

function Solve(V) {
//console.log(parseJsonEquationToString(V))
d = Depth(V,0)
if (d <= 0) return V;
if (d=== 1) return eval(V['lhs'],V['rhs'],V['op']);
if (d > 1) return eval(Solve(V['lhs']),Solve(V['rhs']),V['op'])
}

function triggerAll(data){
console.log("we are starting with: ", parseJsonEquationToString(data))
console.log("Solution: ",Solve(reorgEquationJson(data)['rhs']))
}

triggerAll(data);
