# Species art: GPT prompts

One image per species, so each fish can be checked on its own. Paste the shared style line, then the species line.
After each image, check the "must show" features before using it. Redraw anything that's wrong.
Then run `python3 scripts/cutout_species.py <image> <id>` (add `--flip` if it faces right) and add the id to `ART` in `app/page.tsx`.

**Shared style:** Scientific fish identification illustration in the style of an Australian fisheries field guide. Realistic gouache painting, accurate anatomy and colour, every scale and fin ray visible. Full side profile, fish facing LEFT, whole fish in frame with a margin, fins spread. Plain flat off-white background (#F5EFE1). No text, no labels, no shadow, no water, no other objects. Square image.

| id | Species line | Must show |
|---|---|---|
| king-george-whiting | King George whiting (Sillaginodes punctatus) | Long slender body, pointed snout, small downturned mouth, rows of bronze-brown spots and dashes along the back, sandy-silver sides, two dorsal fins |
| snapper | Australian snapper (Chrysophrys auratus), adult | Deep pink-red body, bright small blue spots on upper sides, steep forehead with slight hump, single continuous spiny dorsal fin, forked tail |
| squid | Southern calamari (Sepioteuthis australis), side view, head and arms pointing LEFT | Long mantle with wide fins running almost its full length, eight arms and two longer tentacles, large eye, translucent cream body with reddish-brown chromatophore spots |
| sand-whiting | Sand whiting (Sillago ciliata) | Slender body, pointed snout, plain pale sandy-silver colour, no spots, dark blotch at the base of the pectoral fin, yellowish anal and pelvic fins |
| yellowfin-bream | Yellowfin bream (Acanthopagrus australis) | Deep oval silver body, bright yellow pelvic and anal fins and lower tail lobe, spiny dorsal fin, small dark spot at pectoral fin base |
| mulloway | Mulloway / jewfish (Argyrosomus japonicus), adult | Long bronze-silver body, large mouth, two dorsal fins, row of silvery-white spots along the lateral line, convex (rounded-square) tail, dark eye |
| trevally | Silver trevally (Pseudocaranx georgianus) | Compressed oval silver-blue body, yellow-tinged fins, row of hard scutes along the rear lateral line, small dark spot on the gill cover, deeply forked tail |
| mangrove-jack | Mangrove jack (Lutjanus argentimaculatus) | Deep coppery-red to bronze body, large mouth with visible canine teeth, single spiny dorsal fin, slightly forked tail |
| barramundi | Barramundi (Lates calcarifer) | Silver body with grey-green back, large mouth with protruding lower jaw, concave forehead profile, red-tinted eye, rounded tail fan, spiny then soft dorsal fin |
| australian-herring | Australian herring / tommy ruff (Arripis georgianus) | Small slim silver fish, greenish back with gold-bronze spots and streaks, large eye, yellow tinged tail with black tips |
| sand-flathead | Southern sand flathead (Platycephalus bassensis) | Flattened head, long tapering body, sandy-brown with fine darker spots, white belly, tail with one or two black blotches near the lower edge |
| murray-cod | Murray cod (Maccullochella peelii), adult | Heavy deep body, broad head with large mouth and slightly overhanging upper jaw, cream to green-gold with dark green mottling, rounded dorsal, anal and tail fins with white edges |
| golden-perch | Golden perch / yellowbelly (Macquaria ambigua) | Deep body with high back behind the head, small head, olive-bronze back fading to golden-yellow belly, rounded tail, spiny dorsal fin |
| redfin | Redfin / English perch (Perca fluviatilis) | Olive-green body with five to seven dark vertical bars, bright red-orange pelvic, anal and lower tail fins, two separate dorsal fins with a dark spot on the first |
| trout | Rainbow trout (Oncorhynchus mykiss) | Streamlined body, pink-red stripe along the side, olive back, small black spots over back, dorsal fin and tail, small adipose fin |
