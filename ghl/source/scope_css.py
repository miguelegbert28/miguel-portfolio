import re,sys
P='#med-portfolio'
css=open('../../src/style.css').read()
css=re.sub(r'/\*.*?\*/','',css,flags=re.S)
css=css.replace('@keyframes hint','@keyframes med-hint').replace('animation:hint','animation:med-hint')
def scope_sel(sel):
    sel=sel.strip()
    if sel.startswith('html.lenis') or sel.startswith('.lenis'): return sel
    if sel in (':root','html','body'): return P
    if sel.startswith('*'): return P+' '+sel if sel!='*' else P+', '+P+' *'
    return P+' '+sel
out=[]
def process(block, depth=0):
    i=0; res=''
    while i<len(block):
        j=block.find('{',i)
        if j<0: break
        head=block[i:j].strip()
        # find matching brace
        d=1;k=j+1
        while d:
            if block[k]=='{': d+=1
            elif block[k]=='}': d-=1
            k+=1
        body=block[j+1:k-1]
        if head.startswith('@media'):
            res+=head+'{'+process(body,depth+1)+'}\n'
        elif head.startswith('@keyframes'):
            res+=head+'{'+body+'}\n'
        else:
            sels=[scope_sel(s) for s in head.split(',')]
            # '*,*::before,*::after' special
            res+=','.join(sels)+'{'+body.strip()+'}\n'
        i=k
    return res
css=css.replace('body{background:var(--bg);overflow-x:hidden;line-height:1.55}','body{background:var(--bg);line-height:1.55}')
scoped=process(css)
scoped=scoped.replace(P+' *'+','+P+' *::before',P+' *,'+P+' *::before')
open('scoped.css','w').write(scoped)
print(len(scoped))
