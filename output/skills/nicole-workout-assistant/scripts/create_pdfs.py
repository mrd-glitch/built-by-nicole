#!/usr/bin/env python3
"""Create coordinated client/admin PDFs from Nicole's approved coaching JSON.
Requires reportlab and pypdf. Run only after intake, visibility and schema review.
Usage: python create_pdfs.py approved-plan.json output-directory [--no-client]
"""
import argparse, base64, hashlib, json, re, textwrap
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, LongTable, TableStyle, PageBreak
from reportlab.pdfgen import canvas
from pypdf import PdfReader, PdfWriter
PAPER='#FAFAF8'; INK='#0D0D0F'; PINK='#FF1F6B'; DEEP='#C9004E'
ROOT=Path(__file__).resolve().parents[1]
styles={k:ParagraphStyle(k,fontName=f,fontSize=size,leading=lead,textColor=colors.HexColor(INK),spaceAfter=space,keepWithNext=keep) for k,f,size,lead,space,keep in [('body','Helvetica',11,15,8,False),('title','Helvetica-Bold',25,29,14,True),('h1','Helvetica-Bold',19,23,12,True),('h2','Helvetica-Bold',14,18,9,True),('small','Helvetica',9,12,6,False)]}
styles['cue']=ParagraphStyle('cue',parent=styles['body'],keepWithNext=True)
def para(value,style='body'):
    value=str(value)
    try: value.encode('cp1252')
    except UnicodeEncodeError: raise ValueError('This template uses Helvetica. Supply an appropriately licensed Unicode font and adapt the renderer for these characters.')
    return Paragraph(escape(value).replace('\n','<br/>'),styles[style])
def label(v,suffix=''):
    return 'Not specified' if v is None else f'{v}{suffix}'
def public_content(p):
    """Explicit projection: private note fields are never read by this renderer."""
    story=[para(p['name'],'title')]
    if p['client_name']: story.append(para(p['client_name'],'h2'))
    story.append(para(f"Revision {p['revision']} | {p['created_on']}",'small'))
    w=p['workout']
    if w:
        story.extend([para('Your workout plan','h1'),para(w['intro'])])
        for week in w['weeks']:
            if week['number']>1:story.append(PageBreak())
            story.append(para(f"Week {week['number']}",'h1'))
            if week['instructions']:story.append(para(week['instructions']))
            for day in week['days']:
                story.append(para(f"Day {day['number']} | {day['name']}",'h2'))
                if day['instructions']:story.append(para(day['instructions']))
                for ex in day['exercises']:
                    group=f"Superset {ex['superset_group']} | " if ex['superset_group'] else ''
                    story.append(para(group+ex['name']+(' (optional)' if ex['optional'] else ''),'h2'))
                    if ex['instructions']:story.append(para(ex['instructions'],'cue'))
                    rows=[[para(x,'small') for x in ['Set / type','Target reps','Target weight','Rest']]]
                    for st in ex['sets']:
                        rows.append([para(f"Set {st['number']}: {'Warm-up' if st['type']=='warmup' else 'Working set'}",'small'),para(st['target_reps']),para(label(st['target_weight_lb'],' lb'),'small'),para(label(st['rest_seconds'],' sec'),'small')])
                    table=LongTable(rows,colWidths=[145,100,115,108],repeatRows=1,hAlign='LEFT')
                    table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#FFE4EE')),('LINEBELOW',(0,0),(-1,0),1,colors.HexColor(PINK)),('LINEBELOW',(0,1),(-1,-1),.3,colors.HexColor('#DDDDDA')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
                    story.extend([table,Spacer(1,9)])
                    for st in ex['sets']:
                        if st['instructions']:story.append(para(f"Set {st['number']}: {st['instructions']}",'small'))
    m=p['meal']
    if m:
        if w:story.append(PageBreak())
        story.extend([para('Your meal plan','h1'),para(m['name'],'h2'),para(m['intro'])])
        if m['schedule']:story.append(para('Schedule: '+m['schedule']))
        t=m['targets'];targets=[]
        if t['calories'] is not None:targets.append(f"{t['calories']} kcal")
        for field,name in [('protein','Protein'),('carbs','Carbs'),('fat','Fat')]:
            key=field+('_g' if t['mode']=='grams' else '_pct')
            if t[key] is not None:targets.append(f"{name} {t[key]}{'g' if t['mode']=='grams' else '%'}")
        if targets:story.append(para('Daily targets: '+' | '.join(targets)))
        for meal in m['meals']:
            story.append(para(meal['name'],'h2'))
            if meal['note']:story.append(para(meal['note']))
            for item in meal['items']:
                story.append(para(f"{item['name']} | {item['portion']}"))
                nutrition=[f"{name}: {item[key]}{unit}" for key,name,unit in [('calories','Calories',' kcal'),('protein','Protein','g'),('carbs','Carbs','g'),('fats','Fat','g')] if item[key] is not None]
                if nutrition:story.append(para(' | '.join(nutrition),'small'))
            if meal['options']:story.append(para('Choose one complete meal:'))
            for i,opt in enumerate(meal['options'],1):
                tag=' | '+opt['tag'].replace('_',' ').title() if opt['tag'] else ''
                story.append(para(f"{i}. {opt['text']}{tag}"))
                nutrition=[f"{name}: {opt[key]}{unit}" for key,name,unit in [('calories','Calories',' kcal'),('protein','Protein','g'),('carbs','Carbs','g'),('fats','Fat','g')] if opt[key] is not None]
                if nutrition:story.append(para(' | '.join(nutrition),'small'))
    story.extend([Spacer(1,18),para('Nicole','h2'),para('Nothing changes if nothing changes.','small')])
    return story

def export(p,directory,client=True):
    if p.get('schema')!='bbn.coaching-import.v1':raise ValueError('Use the coaching v1 wrapper from references/import-format.md.')
    if p['kind'] not in ('workout','meal','both') or (p['workout'] is not None)!=(p['kind'] in ('workout','both')) or (p['meal'] is not None)!=(p['kind'] in ('meal','both')):raise ValueError('Plan type and contents differ.')
    raw=json.dumps(p,sort_keys=True,separators=(',',':'),ensure_ascii=True,allow_nan=False).encode()
    if len(raw)>400000:raise ValueError('Payload exceeds 400 KB. Split into smaller plans.')
    digest=hashlib.sha256(raw).hexdigest();slug=re.sub('[^a-z0-9]+','-',p['name'].lower()).strip('-') or 'coaching-plan'
    directory=Path(directory);directory.mkdir(parents=True,exist_ok=True);prefix=directory/f"{slug}-r{p['revision']}"
    logo=ROOT/'assets/ns-lockup-paper-pink-on-ink.png'
    if not logo.exists():raise FileNotFoundError('Keep the supplied assets folder beside SKILL.md.')
    def header(c,doc):
        c.saveState();c.setFillColor(colors.HexColor(INK));c.rect(0,720,612,72,fill=1,stroke=0)
        c.drawImage(str(logo),46,735,width=145,height=42,preserveAspectRatio=True,anchor='c',mask='auto')
        c.setStrokeColor(colors.HexColor(PINK));c.setLineWidth(2);c.line(0,720,612,720)
        c.setFillColor(colors.HexColor(INK));c.setFont('Helvetica',7);c.drawString(46,29,f"{p['plan_id']} | r{p['revision']} | {digest[:12]}");c.restoreState()
    class NumberedCanvas(canvas.Canvas):
        def __init__(self,*args,**kwargs):
            super().__init__(*args,**kwargs);self.saved_pages=[]
        def showPage(self):
            self.saved_pages.append(dict(self.__dict__));self._startPage()
        def save(self):
            total=len(self.saved_pages)
            for state in self.saved_pages:
                self.__dict__.update(state);self.setFillColor(colors.HexColor(INK));self.setFont('Helvetica',7)
                self.drawRightString(566,29,f'Page {self._pageNumber} of {total}');super().showPage()
            super().save()
    def make(path,story):
        SimpleDocTemplate(str(path),pagesize=(612,792),leftMargin=72,rightMargin=72,topMargin=96,bottomMargin=56,title=p['name'],author='NS Coaching').build(story,onFirstPage=header,onLaterPages=header,canvasmaker=NumberedCanvas)
    if client:
        client_path=Path(str(prefix)+'-client.pdf');make(client_path,public_content(p)+[para('Document checksum: '+digest,'small')])
    admin_path=Path(str(prefix)+'-admin-upload.pdf');temp=directory/(slug+'-review.tmp.pdf');payload=directory/(slug+'-payload.tmp.pdf')
    story=[para('Admin copy','title'),para('May contain private coaching notes. Do not send to the client.'),*public_content(p),PageBreak(),para('Private notes for Nicole','h1')]
    if p['workout']:
        for n in p['workout']['coach_notes']:
            scope=n['scope']+(f" | Week {n['week']}" if n['week'] else '')+(f" | Day {n['day']}" if n['day'] else '')+(f" | {n['exercise_key']}" if n['exercise_key'] else '')
            story.append(para(scope+': '+n['text']))
    if p['meal']:
        for n in p['meal']['coach_notes']:story.append(para(('Meal '+str(n['meal']) if n['meal'] else 'Meal plan')+': '+n['text']))
    story.append(para('Structured plan data follows. Review the imported plans before assigning a client.','small'));make(temp,story)
    c=canvas.Canvas(str(payload),pagesize=(612,792));y=748
    lines=['BBN-COACHING-IMPORT-V1',f"Plan-ID: {p['plan_id']}",f"Revision: {p['revision']}",f'SHA256: {digest}','BEGIN-BBN-PAYLOAD',*textwrap.wrap(base64.b64encode(raw).decode(),72),'END-BBN-PAYLOAD']
    for line in lines:
        if y<44:c.showPage();y=748
        c.setFont('Courier',8);c.drawString(46,y,line);y-=11
    c.save();writer=PdfWriter();writer.append(str(temp));writer.append(str(payload))
    with admin_path.open('wb') as out:writer.write(out)
    temp.unlink();payload.unlink()
    reader=PdfReader(admin_path)
    if len(reader.pages)>200:raise ValueError('Admin PDF exceeds 200 pages. Split the plan and regenerate.')
    extracted='\n'.join(page.extract_text() or '' for page in reader.pages)
    if extracted.count('BEGIN-BBN-PAYLOAD')!=1 or extracted.count('END-BBN-PAYLOAD')!=1:raise ValueError('Payload markers did not survive PDF generation.')
    encoded=extracted.split('BEGIN-BBN-PAYLOAD')[1].split('END-BBN-PAYLOAD')[0]
    decoded=base64.b64decode(re.sub(r'\s','',encoded),validate=True)
    assert decoded==raw and hashlib.sha256(decoded).hexdigest()==digest
    if client:
        cr=PdfReader(client_path);ct='\n'.join(page.extract_text() or '' for page in cr.pages)
        assert 'BEGIN-BBN-PAYLOAD' not in ct
        assert not cr.attachments
        private=[n['text'] for n in (p['workout']['coach_notes'] if p['workout'] else [])]+[n['text'] for n in (p['meal']['coach_notes'] if p['meal'] else [])]
        for note in private:
            if note in ct:raise ValueError('A private note also appears in client content. Confirm visibility with Nicole before exporting.')
        print(client_path)
    print(admin_path);print('Extraction/checksum checks passed. Render and inspect every page before delivery. Fonts: Helvetica fallback; typed Nicole sign-off.')
if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('plan');ap.add_argument('output');ap.add_argument('--no-client',action='store_true');args=ap.parse_args()
    export(json.loads(Path(args.plan).read_text(),parse_constant=lambda x:(_ for _ in ()).throw(ValueError(x))),args.output,not args.no_client)
