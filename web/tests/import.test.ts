import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateImport,parseImportText,importDocument,initialMatches,exerciseGroups,type ImportPlan} from '../src/lib/plans/import/format';
import {documentError} from '../src/lib/plans/model';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/workout-import.json',import.meta.url),'utf8'));
const library=[{id:'00000000-0000-4000-8000-000000000004',name:'Goblet squat',youtube_url:null,cue:null},{id:'00000000-0000-4000-8000-000000000005',name:'Dumbbell row',youtube_url:null,cue:null}];
export function envelope(plan:unknown) { const raw=JSON.stringify(plan);const checksum=createHash('sha256').update(raw).digest('hex');return `BBN-WORKOUT-IMPORT-V1\nPlan-ID: ${(plan as ImportPlan).plan_id}\nRevision: ${(plan as ImportPlan).revision}\nSHA256: ${checksum}\nBEGIN-BBN-PAYLOAD\n${Buffer.from(raw).toString('base64').match(/.{1,72}/g)?.join('\n')}\nEND-BBN-PAYLOAD`; }
test('PDF envelope decodes exact targets, week differences, zero vs blank and private notes',async()=>{
  const p=await parseImportText(envelope(fixture)); assert.deepEqual(p.plan,fixture);
  const doc=importDocument(p.plan,initialMatches(p.plan,library),library);assert.equal(documentError(doc),null);
  assert.equal(doc.explicitWeeks,true);assert.deepEqual(doc.days.map(d=>d.week),[1,2]);assert.equal(doc.days[1].blocks[0].exercises.length,2);
  assert.deepEqual(doc.days[0].blocks[0].exercises[0].setTargets?.map(t=>[t.reps,t.weight,t.rest]),[['10','0','60'],['5-7','50','90']]);
  assert.equal(doc.days[1].blocks[0].exercises[0].setTargets?.[0].weight,'');assert.match(doc.coachNotes![0].text,/PRIVATE_COACH_ONLY/);
  assert.ok(!JSON.stringify(doc.days).includes('PRIVATE_COACH_ONLY'));assert.ok(!JSON.stringify(doc.weekNotes).includes('PRIVATE_COACH_ONLY'));
});
test('reject corrupted, duplicate, missing and wrong-revision PDF data',async()=>{
  const valid=envelope(fixture);
  await assert.rejects(parseImportText(valid.replace(/SHA256: ./,'SHA256: f')),/checksum/);
  await assert.rejects(parseImportText(valid+'\nBEGIN-BBN-PAYLOAD'),/unique/);
  await assert.rejects(parseImportText('A client PDF without an envelope'),/admin-upload/);
  await assert.rejects(parseImportText(valid.replace('Revision: 1','Revision: 2')),/different revisions/);
  await assert.rejects(parseImportText(valid.replace('END-BBN-PAYLOAD','')),/unique/);
});
test('strict schema rejects ambiguous units, private targets, labels and unrecognized fields',()=>{
  for(const change of [(p:any)=>p.unit='kg',(p:any)=>p.weeks[0].number=3,(p:any)=>p.weeks[0].days[0].exercises[0].sets[0].type='cooldown',(p:any)=>p.coach_notes[0].scope='public',(p:any)=>p.coach_notes[0].week=2,(p:any)=>p.weeks[0].secret_notes='private',(p:any)=>p.weeks[0].days[0].exercises[0].sets[0].target_weight_lb=-1]){
    const p=structuredClone(fixture);change(p);assert.throws(()=>validateImport(p));
  }
});
test('match only unique library names or verified IDs; retain PDF exercise labels',()=>{
  const p=validateImport(fixture),groups=exerciseGroups(p);assert.equal(groups.length,2);
  const duplicate=[...library,{...library[0],id:'other'}];assert.equal(initialMatches(p,duplicate)[groups[0].key],'');
  assert.throws(()=>importDocument(p,{},library),/Choose a library/);
  const match=initialMatches(p,library);match[groups[0].key]=library[1].id;
  const doc=importDocument(p,match,library);assert.equal(doc.days[0].blocks[0].exercises[0].name,'Goblet squat');assert.equal(doc.days[0].blocks[0].exercises[0].exerciseId,library[1].id);
});

test('coaching package supports meals, workouts or both without guessing nutrition',async()=>{
 const {validateCoaching,parseCoachingText,serverImportText}=await import('../src/lib/plans/import/coaching');
 const p=JSON.parse(readFileSync(new URL('./fixtures/coaching-import.json',import.meta.url),'utf8'));
 const checked=await parseCoachingText(envelope(p).replace('BBN-WORKOUT-IMPORT-V1','BBN-COACHING-IMPORT-V1'));
 assert.deepEqual(checked.plan,p);assert.deepEqual((await parseCoachingText(serverImportText(checked))).plan,p);
 for(const kind of ['meal','workout','both']){const v=structuredClone(p);v.kind=kind;if(kind==='meal')v.workout=null;if(kind==='workout')v.meal=null;assert.equal(validateCoaching(v).kind,kind);}
 for(const change of [(x:any)=>x.meal.meals[0].options=x.meal.meals[1].options,(x:any)=>x.meal.meals[0].items[0].portion='',(x:any)=>x.meal.targets.mode='percent',(x:any)=>x.meal.coach_notes[0].meal=9,(x:any)=>x.kind='meal',(x:any)=>x.workout.revision=2,(x:any)=>x.meal.meals[0].items[0].calories=-1]){const v=structuredClone(p);change(v);assert.throws(()=>validateCoaching(v));}
});
