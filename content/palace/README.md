# Palace question bank and visual references

The supplied `CultureHunt_NganHangCauHoi_DinhDocLap.docx` was read directly as Word XML. [question-bank.source.json](./question-bank.source.json) retains all 10 source questions, four options, the supplied answer and the supplied story. It is not a claim that every source statement has been independently verified.

Playable bilingual adaptations are in [questions.ts](../../lib/palace/questions.ts). Answer-letter ordering is retained, including when wording has been narrowed. There is no random client-side selection or client-only grading.

| Source | Stage | Handling |
| --- | --- | --- |
| 1.1 | Façade | Bamboo-inspired stone screens; architectural introduction corroborates the subject. |
| 1.2 | Façade | Character Cát (吉); corroborated by the architectural introduction. |
| 2.1 | Reception | About 500 people. Wording omits the source's reference to state banquets, which risks confusing this room with the separate State Banqueting Hall. |
| 2.2 | Reception | Patterned red carpet. The photograph establishes the appearance, not that the carpet is manufactured in one piece or its acoustic performance. |
| 3.1 | Cabinet | Oval table; explanation follows visible furnishings rather than asserting psychological or power effects. |
| 3.2 | Cabinet | **Needs verification; excluded from grading.** The supplied answer allows a screen or bronze drum depending on arrangement. Neither has been corroborated in the reference view. The original is retained, and the diorama does not invent an exhibit. |
| 4.1 | Rooftop | UH-1 (Huey); visible aircraft and official photo caption. |
| 4.2 | Rooftop | Rest/quiet contemplation in the supplied design interpretation. Reworded to distinguish Tứ phương vô sự lầu from the helipad itself. |
| 5.1 | Bunker | Four tactical regions, retained as supplied historical content. The question explicitly concerns the operations room, whereas the recognition reference shows communications equipment. |
| 5.2 | Bunker | Protective function retained from the supplied bank. Explanation avoids the source's absolute claim that corners eliminate blast pressure. No engineering performance claim is made. |

## Sources

- [Official architectural introduction](https://dinhdoclap.gov.vn/kien-truc-dinh-doc-lap/): architectural massing, stone screens, symbols and rooftop context.
- [Official Palace photo article](https://dinhdoclap.gov.vn/anh-dinh-doc-lap-noi-luu-giu-dau-an-sau-50-nam-giai-phong/): the existing local reference photographs, room distinctions, rooftop aircraft and basement context.
- [Vietnam News Agency / Báo Tin tức photo report](https://baotintuc.vn/chung-nhan-dinh-doc-lap-noi-trao-truyen-tiep-noi-mach-nguon-lich-su-post802427.html): Reception Hall capacity and function.
- User-supplied question bank: exact original phrasing and narratives, including items whose wider interpretation needs further curatorial verification.

## Visual treatment

The room illustrations reproduce distinctive visible features rather than presenting a generic office: red-and-gold patterned carpet, red stage curtains, symmetrical upholstered seating and crystal chandeliers; an open-centred oval wooden table, desk microphones, dark leather armchairs and yellow-green curtains; camouflage and tail number 445 on the rooftop UH-1; desk-mounted teletype equipment, reddish wall lining, floral black-and-white floor tiles and a narrow concrete corridor.

The perspective, number of simplified furniture items, dimensions and positions are authored for the game. They are not an inventory, measured survey, or physical navigation plan. Existing photograph credits remain in place.

## Saved-game compatibility

New recognized visits store a versioned question snapshot in SQLite. Attempts record the question ID. Every question must be passed in order before the stage completes and its unique XP is awarded. A replay creates new visits and preserves previous records. Additive schema migration retains old runs and maps pre-bank attempts to their original single legacy question; already recognized legacy visits keep that quiz rather than silently receiving a different answer key.
