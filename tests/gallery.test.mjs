import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../shenzhen/index.html',import.meta.url),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function setup(){
 const node=()=>({events:{},addEventListener(type,fn){this.events[type]=fn;}});
 const slides=Array.from({length:5},()=>({setAttribute(name,value){this[name]=value;}}));
 const track={...node(),children:slides,style:{}},count={},prev=node(),next=node(),viewport=node();
 const items={'.track':track,'.gal-count':count,'.prev':prev,'.next':next,'.gallery-viewport':viewport};
 const gallery={querySelector:s=>items[s]};
 vm.runInNewContext(source,{document:{querySelector:()=>gallery}});
 return {slides,track,count,prev,next,viewport,key(key){track.events.keydown({key,preventDefault(){}});}};
}
test('rapid Next clicks select consecutive photos and stop at the last photo',()=>{
 const g=setup();
 assert.equal(g.prev.disabled,true);
 for(let i=2;i<=5;i++){g.next.events.click();assert.equal(g.count.textContent,i+' / 5');}
 assert.equal(g.next.disabled,true);
 g.next.events.click();assert.equal(g.count.textContent,'5 / 5');
 assert.equal(g.track.style.transform,'translateX(calc(-400% - 64px))');
 g.prev.events.click();assert.equal(g.count.textContent,'4 / 5');
 assert.deepEqual(g.slides.map(s=>s.inert),[true,true,true,false,true]);
});
test('keyboard navigation clamps at both ends and hides inactive captions from assistive technology',()=>{
 const g=setup();
 g.key('End');assert.equal(g.count.textContent,'5 / 5');
 g.key('ArrowLeft');assert.equal(g.count.textContent,'4 / 5');
 g.key('Home');g.key('ArrowLeft');assert.equal(g.count.textContent,'1 / 5');
 g.key('ArrowRight');assert.equal(g.slides[1]['aria-hidden'],'false');
 assert.equal(g.slides[0]['aria-hidden'],'true');
});
test('horizontal swipes change photo while vertical gestures keep the current photo',()=>{
 const g=setup();
 const swipe=(x,y)=>{g.viewport.events.touchstart({touches:[{clientX:200,clientY:100}]});g.viewport.events.touchend({changedTouches:[{clientX:x,clientY:y}]});};
 swipe(100,110);assert.equal(g.count.textContent,'2 / 5');
 swipe(190,250);assert.equal(g.count.textContent,'2 / 5');
 swipe(300,100);assert.equal(g.count.textContent,'1 / 5');
});
