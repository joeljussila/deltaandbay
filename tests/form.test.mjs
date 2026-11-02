import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../apply/index.html',import.meta.url),'utf8');
const source=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)][0][1];
function setup(response=()=>Promise.resolve({ok:true,status:201})) {
  const classes=new Set(), errors=new Set();
  const button={disabled:false,textContent:'Submit application'};
  const error={classList:{add:k=>errors.add(k),remove:k=>errors.delete(k)}};
  const first={textContent:''};
  const values={name:'QA Tester',email:'qa@example.com',company:'QA',based:'Test city',linkedin:'linkedin.com/in/qa-tester',x:'@qa_tester',role:'Other',area:'Other',stage:'Prototype',timing:'In 3–6 months',building:'Testing the form safely.',why:'Testing error recovery safely.',teammate:'',dates:'No',heard:''};
  const elements=Object.fromEntries(Object.entries(values).map(([name,value])=>{
    const message={dataset:{},textContent:'Original field error'};
    const field={classList:{toggle(){},contains(){return false;}},querySelector:()=>message};
    const input=html.match(new RegExp('<(?:input|select|textarea)\\b[^>]*\\bname="'+name+'"[^>]*>'))[0];
    return [name,{name,value,required:/\srequired(?:\s|>)/.test(input),minLength:['building','why'].includes(name)?10:-1,checkValidity:()=>true,closest:()=>field,addEventListener(){},focus(){}}];
  }));
  // Tap-to-choose groups behave like RadioNodeLists of checkboxes.
  const group=(name,picks)=>(html.match(new RegExp('name="'+name+'" value="([^"]+)"','g'))||[]).map(m=>{const value=m.match(/value="([^"]+)"/)[1];return {value,checked:picks.includes(value)};});
  elements.wants=group('wants',['Factory visits','The electronics market']);elements.parts=group('parts',[]);
  const groupField={classList:{set:new Set(),toggle(k,on){on?this.set.add(k):this.set.delete(k);}},scrollIntoView(){}};
  let submit,change,requests=0,lastPayload;
  const form={elements,querySelectorAll:()=>Object.values(elements).filter(e=>!Array.isArray(e)),addEventListener:(event,fn)=>{if(event==='submit')submit=fn;if(event==='change')change=fn;},querySelector:selector=>selector==='button'?button:error};
  const sandbox={URL,document:{getElementById:id=>id==='apply'?form:id==='wants-field'?groupField:first,body:{classList:{add:k=>classes.add(k)}}},scrollTo(){},fetch:(url,options)=>{requests++;lastPayload=JSON.parse(options.body);return response();}};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  return {sandbox,groupField,elements,button,error,classes,errors,first,submit:()=>submit({preventDefault(){}}),change:target=>change({target}),requests:()=>requests,payload:()=>lastPayload};
}
test('the personal website field is gone from the form and the payload',()=>{
  assert.equal(/name="website"/.test(html),false);
  assert.equal(/website/.test(html.match(/var FIELDS=\[[^\]]*\]/)[0]),false);
});
test('at least one Shenzhen goal is required before anything is sent',()=>{
  const s=setup();s.elements.wants.forEach(e=>{e.checked=false;});s.submit();
  assert.equal(s.requests(),0);assert.equal(s.groupField.classList.set.has('invalid'),true);
});
test('required and optional lengths match database boundaries with field-specific errors',()=>{
  const {sandbox:s,elements}=setup();
  for(const [name,limit] of Object.entries({name:200,email:320,company:200,based:200,building:4000,why:4000,heard:500})) {
    const field=elements[name]; assert.equal(field.maxLength,limit);
    field.value='a'.repeat(limit);assert.equal(s.check(field),true,name+' boundary');
    field.value+='a';assert.equal(s.check(field),false,name+' overflow');
    assert.match(field.closest().querySelector().textContent,/characters or fewer/);
  }
});
test('trimmed blank and short answers stay invalid',()=>{
  const {sandbox:s,elements}=setup();
  elements.name.value='   ';assert.equal(s.check(elements.name),false);
  elements.building.value='       short       ';assert.equal(s.check(elements.building),false);
});
test('invalid fields prevent network submission',()=>{
  const s=setup();s.elements.heard.value='a'.repeat(501);s.submit();assert.equal(s.requests(),0);
});
test('successful response displays confirmation and sends normalized payload',async()=>{
  const s=setup();s.submit();assert.equal(s.button.disabled,true);
  await new Promise(setImmediate);
  assert.equal(s.requests(),1);assert.equal(s.classes.has('sent'),true);assert.equal(s.first.textContent,'QA');
  assert.deepEqual([...s.payload().wants],['Factory visits','The electronics market']);
  assert.equal(s.payload().parts,null);
  assert.equal(s.payload().teammate,null);
  assert.equal(s.payload().stage,'Prototype');assert.equal('payer' in s.payload(),false);
  assert.equal(s.payload().linkedin,'https://www.linkedin.com/in/qa-tester');
  assert.equal(s.payload().x,'https://x.com/qa_tester');
});
test('HTTP errors preserve answers, show error and allow retry',async()=>{
  const s=setup(()=>Promise.resolve({ok:false,status:503}));s.submit();await new Promise(setImmediate);
  assert.equal(s.classes.has('sent'),false);assert.equal(s.errors.has('show'),true);assert.equal(s.button.disabled,false);assert.equal(s.elements.name.value,'QA Tester');
});

test('blank or whitespace X profiles submit as null while LinkedIn remains required',async()=>{
  for(const value of ['', '   ']){
    const s=setup();s.elements.x.value=value;s.submit();await new Promise(setImmediate);
    assert.equal(s.requests(),1);assert.equal(s.payload().x,null);assert.equal(s.classes.has('sent'),true);
  }
  const s=setup();s.elements.linkedin.value='';s.elements.x.value='';s.submit();assert.equal(s.requests(),0);
});

test('an optional X profile still rejects malformed input',()=>{
  const s=setup();s.elements.x.value='not a profile';s.submit();assert.equal(s.requests(),0);
});
test('network errors recover the submit button without false success',async()=>{
  const s=setup(()=>Promise.reject(new Error('offline')));s.submit();await new Promise(setImmediate);
  assert.equal(s.classes.has('sent'),false);assert.equal(s.button.disabled,false);assert.equal(s.errors.has('show'),true);
});

test('a 400 preserves full answers and never silently resubmits a reduced application',async()=>{
  const s=setup(()=>Promise.resolve({ok:false,status:400}));
  s.elements.why.value='a'.repeat(4000);
  s.elements.dates.value='Not sure yet';s.submit();
  await new Promise(setImmediate);
  assert.equal(s.requests(),1);assert.equal(s.classes.has('sent'),false);
  const p=s.payload();
  for(const k of ['stage','timing','wants','parts','teammate']) assert.equal(k in p,true,k);
  assert.equal(p.dates,'Not sure yet');assert.equal(p.why.length,4000);
  assert.equal(s.elements.why.value.length,4000);assert.equal(s.button.disabled,false);
});

test('repeated submits while a request is in flight create only one request',async()=>{
  let finish;const s=setup(()=>new Promise(resolve=>{finish=resolve;}));
  s.submit();s.submit();assert.equal(s.requests(),1);
  finish({ok:true,status:201});await new Promise(setImmediate);
  assert.equal(s.classes.has('sent'),true);
});

test('choosing a goal clears its earlier required error immediately',()=>{
 const s=setup();s.elements.wants.forEach(e=>{e.checked=false;});s.submit();
 assert.equal(s.groupField.classList.set.has('invalid'),true);
 s.elements.wants[0].checked=true;s.change({type:'checkbox',name:'wants'});
 assert.equal(s.groupField.classList.set.has('invalid'),false);assert.equal(s.requests(),0);
});
test('other failures are not resent',async()=>{
  const s=setup(()=>Promise.resolve({ok:false,status:503}));s.submit();await new Promise(setImmediate);
  assert.equal(s.requests(),1);assert.equal(s.errors.has('show'),true);
});
