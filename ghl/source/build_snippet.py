import re
css=open('scoped.css').read()+open('extra.css').read()
css=re.sub(r'\n\s*\n','\n',css)
html=open('markup.html').read()
js=open('embed.js').read()
out=f"""<!-- Miguel Egbert Duenas — AI Automation Portfolio · GoHighLevel Custom Code embed
     Paste this whole block into ONE Custom Code / Custom HTML element.
     Assets (images, video frames, 3D model) load from ASSET_BASE in the script below. -->
<style>
{css}</style>
{html}
<script type="module">
{js}</script>
"""
open('ghl-embed.html','w').write(out)
print(len(out.encode()))
