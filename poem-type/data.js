/* Trait model, statements, and form vectors.

   Ten dimensions, chosen to separate poetic forms rather than to describe a
   personality. That is the difference between this quiz and its sibling: a
   genre vector is a guess about what kind of person likes Horror, but most of
   a form vector is an observable fact about the form. A villanelle really does
   repeat, a haiku really is short, a limerick really does rhyme hard. So the
   axes here are the features that actually vary across the catalog, and a
   reader's answers are read as a preference over those same features. */

const TRAITS = {
  music:       { label: "Music",       blurb: "How much the sound of a line does work of its own, apart from what it says." },
  rhyme:       { label: "Rhyme",       blurb: "Whether the chime is a pleasure or a distraction." },
  repetition:  { label: "Repetition",  blurb: "Appetite for a line that comes back, changed by what happened in between." },
  brevity:     { label: "Brevity",     blurb: "Short and closed, or long enough to spread out in." },
  constraint:  { label: "Constraint",  blurb: "Whether a hard rule feels like a game or a cage." },
  narrative:   { label: "Narrative",   blurb: "Wanting something to happen to somebody, rather than a held moment." },
  image:       { label: "Image",       blurb: "Pull toward one exact object over an argument or an idea." },
  interiority: { label: "Interiority", blurb: "A private voice overheard, against something meant to be spoken aloud to a crowd." },
  wit:         { label: "Wit",         blurb: "How much you want cleverness and comedy in the room." },
  feeling:     { label: "Feeling",     blurb: "Open emotional weather, against cool restraint." }
};

/* One short statement at a time on a five-point agree scale, the same format
   its sibling app settled on after testing showed that forced choice between
   paragraph-length options mostly measured patience.

   Keying is balanced: every trait has exactly one item where agreeing raises
   it and one where agreeing lowers it. Without that, someone who agrees with
   everything scores as maximally everything and the quiz measures
   agreeableness rather than taste. */
const ITEMS = [
  { text: "I catch myself saying a good line out loud, just to hear how it lands.", w: { music: 1 } },
  { text: "A rhyme landing where I did not expect it gives me a small jolt of pleasure.", w: { rhyme: 1 } },
  { text: "I like it when a line comes back, changed by everything that happened in between.", w: { repetition: 1 } },
  { text: "The best things are short enough that I can reread them straight away.", w: { brevity: 1 } },
  { text: "A strict set of rules makes me more inventive, not less.", w: { constraint: 1 } },
  { text: "I want something to happen, to somebody.", w: { narrative: 1 } },
  { text: "Give me one exact object and I will follow you anywhere.", w: { image: 1 } },
  { text: "What reaches me sounds like someone talking quietly to themselves.", w: { interiority: 1 } },
  { text: "Cleverness is a real pleasure, even when the subject is serious.", w: { wit: 1 } },
  { text: "I want to be moved, even if it wrecks me a little.", w: { feeling: 1 } },

  { text: "What something says matters to me much more than how it sounds.", w: { music: -1 } },
  { text: "Rhyme usually makes a serious poem sound like a greeting card.", w: { rhyme: -1 } },
  { text: "Once something has been said well, saying it again only weakens it.", w: { repetition: -1 } },
  { text: "Short pieces leave me unsatisfied. I want room to spread out.", w: { brevity: -1 } },
  { text: "Rules imposed from outside get in the way of what I actually mean.", w: { constraint: -1 } },
  { text: "I am perfectly happy with something that holds still and describes one moment.", w: { narrative: -1 } },
  { text: "I would rather a writer think out loud than point at things.", w: { image: -1 } },
  { text: "I like writing that is built to be spoken aloud to a room.", w: { interiority: -1 } },
  { text: "Wordplay usually undercuts whatever feeling was building.", w: { wit: -1 } },
  { text: "I prefer restraint to open emotion.", w: { feeling: -1 } },

  /* Mood, not disposition. What you want this month and what you like in
     general disagree, and both are worth knowing. Weighted the same as every
     other item so mood is one input among many rather than an override, and
     mirrored in pairs so they do not disturb the keying balance above. */
  { text: "Lately I want something short enough to hold in my head all at once.", w: { brevity: 1, constraint: 1 }, mood: true },
  { text: "Lately I want to sink into something long and unhurried.", w: { brevity: -1, constraint: -1 }, mood: true },
  { text: "Lately I want something that puts a lump in my throat.", w: { feeling: 1, music: 1 }, mood: true },
  { text: "Lately I want something cool and clear-headed.", w: { feeling: -1, music: -1 }, mood: true }
];

const SCALE = [
  { label: "Strongly disagree", value: 1 },
  { label: "Disagree",          value: 2 },
  { label: "Neutral",           value: 3 },
  { label: "Agree",             value: 4 },
  { label: "Strongly agree",    value: 5 }
];

/* Families exist so a result is a door rather than a label. A form is a narrow
   answer, and the useful next question is always "what else is like this",
   so every form names its neighbours through the family it belongs to. */
const FAMILIES = {
  short:      { label: "Short and image-led", blurb: "Forms that fit in one breath and trust a single picture to carry everything." },
  repeating:  { label: "Repetition engines",  blurb: "Forms built on return, where a line changes meaning each time it comes back." },
  puzzle:     { label: "Constraint games",    blurb: "Forms whose rule is arbitrary on purpose, and generative because of it." },
  sung:       { label: "Sung and told",       blurb: "Forms that come from performance and carry a story or a crowd with them." },
  occasion:   { label: "Argument and occasion", blurb: "Forms that make a case, mark a death, or turn on a hinge halfway through." },
  comic:      { label: "Comic",               blurb: "Forms whose whole job is the timing of the joke." },
  open:       { label: "Open field",          blurb: "Forms defined by what they refuse rather than what they require." }
};

/* Form vectors, 0 to 1 per trait.

   Most of these are descriptions rather than opinions: `repetition` for the
   villanelle is 1.0 because nineteen lines contain two refrains four times
   over, not because anyone judged it. Where a value is a judgment call it is
   about register (how funny, how private), and those are the softer numbers.

   `poems` carry two tags of their own. `light` is whether the poem consoles,
   and `demand` is how much work it asks, so a form's three poems can be
   ordered to the reader rather than fixed. `note` on a form is where the
   catalog admits what it cannot supply: several of these traditions are oral,
   or live mostly in translation, and pretending otherwise would send someone
   looking for an anthology that does not exist. */
const FORMS = [
  {
    id: "haiku",
    name: "Haiku",
    family: "short",
    tagline: "One image, held still, with the meaning left just outside the frame.",
    why: "You want the picture and not the explanation. A haiku gives you an object, a season, and a cut where the poem turns, then stops before it can tell you what to feel. That restraint is the whole technique, and you already read that way.",
    rules: "Three phrases, traditionally 5-7-5 sound units in Japanese, which English translators mostly abandon because English syllables carry less. A season word, and a cutting word that snaps the poem into two parts that rub against each other.",
    prompt: "Write down one thing you actually saw today, in plain words, then a second thing that has nothing to do with it. Cut between them. Do not explain the join.",
    v: { music: .50, rhyme: .05, repetition: .15, brevity: 1.0, constraint: .70, narrative: .10, image: 1.0, interiority: .60, wit: .30, feeling: .40 },
    poems: [
      { light: .55, demand: .25, title: "The old pond", poet: "Matsuo Bashō, 1686", note: "A frog, water, sound. The most famous seventeen syllables ever written, and still strange." },
      { light: .10, demand: .40, title: "A world of dew", poet: "Kobayashi Issa, 1819", note: "Written after his daughter died. It agrees that the world is fleeting, and then refuses to be consoled by it." },
      { light: .35, demand: .30, title: "Haiku: This Other World", poet: "Richard Wright, written 1959–60", note: "Four thousand haiku written in his last months, in English, about Mississippi as much as Japan." }
    ]
  },
  {
    id: "tanka",
    name: "Tanka",
    family: "short",
    tagline: "A haiku that does not stop, and turns inward for two more lines.",
    why: "You want the image, but you also want a person somewhere behind it. Tanka adds two lines to the haiku's three, and that small extra room is almost always used for longing, regret, or something the speaker would not say aloud.",
    rules: "Five phrases, 5-7-5-7-7 in Japanese. The first three set a scene, then a pivot, then two lines that turn it personal. Older than haiku by about a thousand years.",
    prompt: "Describe a place in three short lines. Then in two more, say the thing about yourself that place makes you think of. Resist tidying the join.",
    v: { music: .55, rhyme: .05, repetition: .20, brevity: .85, constraint: .65, narrative: .25, image: .85, interiority: .80, wit: .20, feeling: .70 },
    poems: [
      { light: .20, demand: .35, title: "Poems of Ono no Komachi", poet: "Ono no Komachi, 9th century", note: "Desire, dreams, and ageing, written by a court poet whose beauty became a legend that flattened her work. Read Hirshfield's translations." },
      { light: .40, demand: .30, title: "Poems of a Mountain Home", poet: "Saigyō, 12th century", note: "A courtier who became a wandering monk. Cherry blossom and loneliness, without a shred of sentimentality." },
      { light: .25, demand: .35, title: "Songs from a Bamboo Village", poet: "Masaoka Shiki, 1898–1902", note: "Written from the bed he never left again. He reformed tanka by insisting it look at ordinary things." }
    ]
  },
  {
    id: "landay",
    name: "Landay",
    family: "short",
    tagline: "Twenty two syllables, anonymous, and frequently furious.",
    why: "You want compression with heat in it. Landays are folk couplets composed and traded aloud by Pashtun women, often about love, war, and the men who arranged their lives, and the brevity is not delicate. It is what you use when saying more would be dangerous.",
    rules: "A couplet, nine syllables then thirteen, ending in ma or na. Anonymous by convention, sung or spoken, and endlessly revised as they pass between people.",
    prompt: "Two lines. The first sets up something you are supposed to accept. The second refuses it. No names.",
    note: "An oral tradition, so there is no canonical single-author book. Eliza Griswold's collection is the way in.",
    v: { music: .60, rhyme: .15, repetition: .20, brevity: .90, constraint: .60, narrative: .30, image: .70, interiority: .50, wit: .55, feeling: .85 },
    poems: [
      { light: .15, demand: .20, title: "I Am the Beggar of the World", poet: "Anonymous, collected by Eliza Griswold, 2014", note: "The standard English gathering, with photographs and the stories of how each one was collected." },
      { light: .20, demand: .35, title: "Songs of Love and War", poet: "Anonymous, collected by Sayd Bahodine Majrouh", note: "Gathered by an Afghan scholar who was assassinated in 1988, partly for this work." },
      { light: .30, demand: .25, title: "Landays in Poetry magazine, June 2013", poet: "Anonymous", note: "The issue that introduced most English readers to the form. Freely readable online." }
    ]
  },
  {
    id: "thanbauk",
    name: "Thanbauk",
    family: "short",
    tagline: "Three lines, twelve syllables, and a rhyme that climbs diagonally up the stanza.",
    why: "You like a rule tight enough to be visible, and a payoff that is a point rather than a mood. The thanbauk is Burmese epigram: four syllables a line, with the rhyme stepping backwards one position each line, ending in something proverbial or barbed.",
    rules: "Three lines of four syllables. The rhyme falls on the fourth syllable of line one, the third of line two, the second of line three. Traditionally witty, aphoristic, or satirical.",
    prompt: "Twelve syllables to land one observation about someone you know. Four, four, four. Make the rhyme walk backwards.",
    note: "Very little exists in English translation, and the climbing rhyme does not survive it. This is a form to write more than a form to read in English.",
    v: { music: .80, rhyme: .95, repetition: .25, brevity: .95, constraint: .95, narrative: .10, image: .55, interiority: .35, wit: .70, feeling: .30 },
    poems: [
      { light: .60, demand: .55, title: "Burmese Classical Poems", poet: "Translated by Friedrich V. Lustig, 1966", note: "One of the few English gatherings of classical Burmese verse, thanbauk included." },
      { light: .50, demand: .70, title: "The Poems of Nawadei", poet: "Nawadei I, 16th century", note: "A soldier-poet of the Toungoo court. Mostly reached through scholarship rather than trade editions." },
      { light: .55, demand: .45, title: "Bones Will Crow", poet: "Edited by ko ko thett and James Byrne, 2012", note: "Modern Burmese poetry rather than classical thanbauk, but it shows what the tradition became." }
    ]
  },

  {
    id: "villanelle",
    name: "Villanelle",
    family: "repeating",
    tagline: "Two lines, said over and over, meaning something different each time.",
    why: "You want a poem that circles rather than argues. The villanelle cannot move forward, and poets keep reaching for it at exactly the moments when moving forward is not possible: grief, obsession, refusal. The repetition is the feeling, not the decoration.",
    rules: "Nineteen lines. Two refrains introduced in the first stanza, alternating as the last line of each tercet, then landing together as a couplet at the end. Two rhymes for the whole poem.",
    prompt: "Write one sentence you cannot stop thinking, and a second that answers it badly. Those are your refrains. Build the rest to make them keep arriving.",
    v: { music: .85, rhyme: .85, repetition: 1.0, brevity: .50, constraint: .90, narrative: .20, image: .45, interiority: .80, wit: .15, feeling: .95 },
    poems: [
      { light: .20, demand: .30, title: "Do not go gentle into that good night", poet: "Dylan Thomas, 1951", note: "Written for his dying father. The form's refusal to progress is doing all the arguing." },
      { light: .30, demand: .40, title: "One Art", poet: "Elizabeth Bishop, 1976", note: "A masterclass in a refrain that lies. \"The art of losing isn't hard to master\" is false, and the poem knows." },
      { light: .55, demand: .45, title: "The Waking", poet: "Theodore Roethke, 1953", note: "The gentlest of the three, and the strangest. \"I wake to sleep, and take my waking slow.\"" }
    ]
  },
  {
    id: "pantoum",
    name: "Pantoum",
    family: "repeating",
    tagline: "Every line said twice, moving forward while dragging the past along.",
    why: "You like the sensation of a thing you cannot leave behind. The pantoum advances two lines and reuses two, so it moves at half speed and every new stanza is half made of the old one. Poets use it for history, for family, for anything that will not stay in the past.",
    rules: "Quatrains. Lines two and four of each stanza become lines one and three of the next. Any length. Traditionally the last stanza closes the circle by reusing the very first lines.",
    prompt: "Write four lines about something that happened once. Carry the second and fourth into the next stanza and let them mean something worse.",
    v: { music: .70, rhyme: .50, repetition: .95, brevity: .35, constraint: .80, narrative: .35, image: .70, interiority: .65, wit: .20, feeling: .70 },
    poems: [
      { light: .20, demand: .35, title: "Pantoum of the Great Depression", poet: "Donald Justice, 1995", note: "Ordinary lives in which nothing happens, said twice. Quietly annihilating." },
      { light: .35, demand: .35, title: "Parents' Pantoum", poet: "Carolyn Kizer, 1984", note: "Old people watching their grown children behave like adults. Funny, then not." },
      { light: .40, demand: .60, title: "Harmonie du soir", poet: "Charles Baudelaire, 1857", note: "Not a strict pantoum, but the poem that carried the Malay form into European hands." }
    ]
  },
  {
    id: "ghazal",
    name: "Ghazal",
    family: "repeating",
    tagline: "Couplets that do not have to agree, held together by a repeated word and a rhyme before it.",
    why: "You want the music and the ache, and you do not need the parts to add up. Each couplet in a ghazal is meant to stand alone, so the poem accumulates rather than argues, and the pleasure is in the return of the refrain across subjects that have no business sitting together.",
    rules: "Five or more couplets. Both lines of the first rhyme; after that only the second line of each, always ending in the same repeated word or phrase. The poet traditionally names themselves in the last couplet.",
    prompt: "Pick a word you would not mind saying eight times. End every second line with it. Let the couplets disagree.",
    v: { music: .90, rhyme: .80, repetition: .90, brevity: .50, constraint: .80, narrative: .10, image: .70, interiority: .75, wit: .35, feeling: .95 },
    poems: [
      { light: .30, demand: .45, title: "Call Me Ishmael Tonight", poet: "Agha Shahid Ali, 2003", note: "The book that made the real ghazal available in English, by a poet who was furious at what English had been calling one." },
      { light: .25, demand: .70, title: "The Ghazals of Ghalib", poet: "Mirza Ghalib, 19th century", note: "The summit of the Urdu tradition. Try the Aijaz Ahmad edition, which prints several translations side by side." },
      { light: .40, demand: .55, title: "Ghazals of Hafez", poet: "Hafez, 14th century", note: "Wine, God, and a beloved who may be either. Persians still open him at random for advice." }
    ]
  },

  {
    id: "sestina",
    name: "Sestina",
    family: "puzzle",
    tagline: "Six words, rotated through thirty nine lines until they stop meaning anything and start meaning everything.",
    why: "You are the person for whom an arbitrary rule is an engine. The sestina has no refrain and no rhyme, only six end words shuffled in a fixed spiral, and the strain of getting back to them is what pushes a poet somewhere they would not have gone on purpose.",
    rules: "Six sestets and a three-line envoi. The six end words repeat in a fixed rotation, each stanza taking the previous stanza's order as 6-1-5-2-4-3. The envoi uses all six, two per line.",
    prompt: "Choose six ordinary nouns, one of which is a verb too. Write thirty nine lines that make you keep arriving at them. Do not choose interesting words; interesting words break it.",
    v: { music: .50, rhyme: .10, repetition: .90, brevity: .05, constraint: 1.0, narrative: .50, image: .75, interiority: .60, wit: .35, feeling: .50 },
    poems: [
      { light: .30, demand: .35, title: "Sestina", poet: "Elizabeth Bishop, 1965", note: "A grandmother, a child, a stove, an almanac. The form's compulsion becomes the grief nobody in the kitchen is naming." },
      { light: .45, demand: .65, title: "Farm Implements and Rutabagas in a Landscape", poet: "John Ashbery, 1970", note: "A sestina about Popeye. Proof the form survives being made ridiculous." },
      { light: .15, demand: .55, title: "Sestina: Altaforte", poet: "Ezra Pound, 1909", note: "A warlord shouting about how much he loves war. Loud, and built to be read aloud." }
    ]
  },
  {
    id: "golden-shovel",
    name: "Golden Shovel",
    family: "puzzle",
    tagline: "Someone else's poem hidden down your right-hand margin.",
    why: "You like a constraint that is also a conversation. Every end word comes from a line by another poet, in order, so their poem runs vertically through yours while yours says its own thing. It is the newest form here and the most explicitly about inheritance.",
    rules: "Take a line, or a whole poem, by someone else. Each of its words becomes the last word of one of your lines, in the original order. The borrowed poet is credited.",
    prompt: "Take one line from a poem that matters to you. Put its words down the right margin. Now write toward each of them.",
    v: { music: .60, rhyme: .30, repetition: .60, brevity: .35, constraint: .95, narrative: .45, image: .60, interiority: .70, wit: .45, feeling: .70 },
    poems: [
      { light: .35, demand: .45, title: "The Golden Shovel", poet: "Terrance Hayes, 2010", note: "The poem that invented the form, built out of Gwendolyn Brooks's \"We Real Cool\"." },
      { light: .50, demand: .20, title: "We Real Cool", poet: "Gwendolyn Brooks, 1959", note: "The source. Eight lines, twenty four words, and you should read it before anything built on it." },
      { light: .55, demand: .40, title: "The Golden Shovel Anthology", poet: "Edited by Peter Kahn and others, 2017", note: "Three hundred poets doing it to Brooks. The best way to see how much room a fixed margin leaves." }
    ]
  },
  {
    id: "acrostic",
    name: "Acrostic",
    family: "puzzle",
    tagline: "A message down the left margin that the poem never mentions.",
    why: "You enjoy a secret held in plain sight. The acrostic has a bad reputation from school, which is a shame, because its serious uses are ancient: alphabetic psalms built as memory aids, dedications smuggled past a censor, a name that only the right reader will notice.",
    rules: "The first letter of each line spells something. The abecedarian variant runs the alphabet instead. A telestich hides it at the line ends, a mesostich down the middle.",
    prompt: "Spell a name you would not say out loud. Write a poem that never once refers to it.",
    v: { music: .35, rhyme: .35, repetition: .40, brevity: .60, constraint: .85, narrative: .30, image: .50, interiority: .45, wit: .80, feeling: .30 },
    poems: [
      { light: .70, demand: .25, title: "A Boat Beneath a Sunny Sky", poet: "Lewis Carroll, 1871", note: "The closing poem of Through the Looking-Glass. It spells Alice Pleasance Liddell, and it is much sadder than the books." },
      { light: .30, demand: .40, title: "Psalm 119", poet: "Anonymous, Hebrew Bible", note: "Twenty two sections, one per Hebrew letter, eight verses each. The constraint is a memory device and a devotion." },
      { light: .45, demand: .50, title: "An Acrostic", poet: "Edgar Allan Poe, 1829", note: "Written for his cousin Elizabeth. Slight, and interesting mostly for who is doing it." }
    ]
  },

  {
    id: "ballad",
    name: "Ballad",
    family: "sung",
    tagline: "A story told fast, in a metre you already know without being taught.",
    why: "You want narrative and you want it sung. The ballad stanza is the common measure of English, the thing hymns and nursery rhymes and half of Dickinson are written in, and it moves by jumping: no explanation, no interiority, just the next terrible thing happening.",
    rules: "Quatrains alternating four and three stresses, rhyming on the second and fourth lines. Refrains are common. Traditional ballads are anonymous, communal, and full of abrupt cuts.",
    prompt: "Tell a story that ends badly, in four-line stanzas, and never once say how anyone felt about it.",
    v: { music: .90, rhyme: .95, repetition: .70, brevity: .25, constraint: .60, narrative: 1.0, image: .60, interiority: .20, wit: .35, feeling: .80 },
    poems: [
      { light: .15, demand: .25, title: "Sir Patrick Spens", poet: "Anonymous, traditional", note: "A king, a doomed voyage, and Scottish lords' hats floating on the water. Nothing is explained and it does not matter." },
      { light: .20, demand: .45, title: "The Rime of the Ancient Mariner", poet: "Samuel Taylor Coleridge, 1798", note: "The ballad taken seriously by a major poet, and made into something hallucinatory." },
      { light: .10, demand: .40, title: "The Ballad of Reading Gaol", poet: "Oscar Wilde, 1898", note: "Written after his imprisonment. The form's plainness is the only way he could say it." }
    ]
  },
  {
    id: "luc-bat",
    name: "Lục bát",
    family: "sung",
    tagline: "Six syllables, then eight, chained by rhyme for as long as the story lasts.",
    why: "You want something that can run for thousands of lines without ever feeling like an epic. The Vietnamese six-eight couplet interlocks: each stanza's rhyme is picked up mid-line by the next, so the poem pulls itself along, which is why the national epic and most folk verse are both written in it.",
    rules: "Alternating lines of six and eight syllables. The sixth syllable of the eight-line rhymes with the end of the six-line, and its eighth syllable sets the rhyme for the next couplet. Tonal rules govern the even syllables.",
    prompt: "Six syllables, then eight. Rhyme the sixth of the long line back, and let its ending hand the rhyme forward. Keep going until the story is over.",
    note: "The tonal rules do not cross into English, so translations keep the shape and lose the machinery.",
    v: { music: .95, rhyme: .95, repetition: .55, brevity: .30, constraint: .85, narrative: .80, image: .60, interiority: .35, wit: .30, feeling: .70 },
    poems: [
      { light: .30, demand: .45, title: "The Tale of Kiều", poet: "Nguyễn Du, early 19th century", note: "3,254 lines of lục bát, and the book Vietnamese readers quote the way English readers quote Shakespeare. Huỳnh Sanh Thông's translation is the standard." },
      { light: .60, demand: .20, title: "Ca dao (Vietnamese folk verse)", poet: "Anonymous, traditional", note: "Proverbs, love songs, and complaints in the same measure. Short, and where the form actually lives." },
      { light: .40, demand: .55, title: "An Anthology of Vietnamese Poems", poet: "Edited and translated by Huỳnh Sanh Thông, 1996", note: "A thousand years in one volume, with the forms explained as they arrive." }
    ]
  },
  {
    id: "zajal",
    name: "Zajal",
    family: "sung",
    tagline: "Improvised, colloquial, and usually an argument with another poet in front of a crowd.",
    why: "You like poetry as a live event. Zajal is performed in the everyday spoken language rather than the literary one, often as a semi-improvised duel between poets with a chorus and a drum, and the wit is competitive. It is the opposite of a poem read alone on a page.",
    rules: "Strophic, heavily rhymed, in vernacular Arabic rather than Classical. Lebanese zajal duels have set roles and a responding chorus. Descended from the Andalusi zajal of the twelfth century.",
    prompt: "Write something meant to be answered. Rhyme hard, use the words you actually say, and leave an opening for the other person.",
    note: "A performance tradition first. Recordings will teach you more than any printed text will.",
    v: { music: .95, rhyme: .90, repetition: .60, brevity: .40, constraint: .55, narrative: .40, image: .50, interiority: .15, wit: .80, feeling: .60 },
    poems: [
      { light: .65, demand: .55, title: "The Diwan of Ibn Quzmān", poet: "Ibn Quzmān, 12th century", note: "The Andalusi master, writing in Cordoban street Arabic and pleased with himself about it." },
      { light: .70, demand: .40, title: "The Zajal duels of Zaghloul al-Damour", poet: "Joseph al-Hashem, 20th century", note: "Lebanon's most famous zajjal. Look for recordings of the jousts rather than transcripts." },
      { light: .55, demand: .60, title: "Hispano-Arabic Poetry", poet: "Edited by James T. Monroe, 1974", note: "Facing-page scholarship on the zajal and muwashshah, and the standard route in for English readers." }
    ]
  },
  {
    id: "izibongo",
    name: "Izibongo",
    family: "sung",
    tagline: "Praise poetry, declaimed at volume, that names a person by piling up what they have done.",
    why: "You want poetry with a public job. The imbongi performs izibongo in front of the person being praised, and praise here includes criticism: the form's authority comes from being allowed to say things to a leader's face. Nothing about it is private.",
    rules: "Accumulating praise-names and epithets rather than metre or rhyme. Delivered at speed and high volume, with heavy parallelism. Composed for and about a specific person, living or dead.",
    prompt: "Name someone by listing what they did, not what they are like. One clause per deed, no connectives, and let it get louder.",
    note: "Oral by nature. The transcriptions are real but they are transcriptions, and the delivery is half the form.",
    v: { music: .85, rhyme: .20, repetition: .80, brevity: .20, constraint: .25, narrative: .70, image: .70, interiority: .05, wit: .40, feeling: .80 },
    poems: [
      { light: .45, demand: .50, title: "Izibongo: Zulu Praise-Poems", poet: "Collected by Trevor Cope, 1968", note: "The standard scholarly collection, including the praises of Shaka." },
      { light: .40, demand: .55, title: "Emperor Shaka the Great", poet: "Mazisi Kunene, 1979", note: "An epic written in Zulu by a poet inside the tradition, then self-translated. Not a transcription." },
      { light: .35, demand: .65, title: "The Nation's Bounty", poet: "Nontsizi Mgqwetho, 1920s", note: "A woman imbongi publishing in Xhosa newspapers, praising and scolding in equal measure." }
    ]
  },

  {
    id: "sonnet",
    name: "Sonnet",
    family: "occasion",
    tagline: "Fourteen lines with a hinge in the middle, and eight hundred years of people testing it.",
    why: "You like a poem that thinks. The sonnet is short enough to hold at once and long enough to change its mind, and the turn is the point: something is proposed, then complicated. That it survived from Sicily to Shakespeare to Terrance Hayes says the shape is doing real work.",
    rules: "Fourteen lines, usually iambic pentameter. Petrarchan: eight then six, turning at line nine. Shakespearean: three quatrains and a couplet, turning at thirteen. The volta matters more than the rhyme scheme.",
    prompt: "Spend eight lines building a case you believe. Spend six taking it apart.",
    v: { music: .75, rhyme: .80, repetition: .30, brevity: .65, constraint: .85, narrative: .35, image: .55, interiority: .70, wit: .50, feeling: .80 },
    poems: [
      { light: .25, demand: .35, title: "Sonnet 73 (That time of year thou mayst in me behold)", poet: "William Shakespeare, 1609", note: "Three images of ageing, each shorter than the last, then a couplet that turns it into a love poem." },
      { light: .60, demand: .55, title: "God's Grandeur", poet: "Gerard Manley Hopkins, 1877", note: "The sonnet at maximum sonic pressure. Read it aloud or you will miss most of it." },
      { light: .25, demand: .55, title: "American Sonnets for My Past and Future Assassin", poet: "Terrance Hayes, 2018", note: "Seventy sonnets written in the year after the 2016 election. Fourteen lines, everything else negotiable." }
    ]
  },
  {
    id: "ode",
    name: "Ode",
    family: "occasion",
    tagline: "Sustained attention to one thing, out loud, at length.",
    why: "You are willing to be serious about admiration. The ode is the form that stays with its subject long past the point where a shorter poem would stop, and its modern life is mostly a joke played straight: Neruda writing three hundred lines to an onion and meaning every one.",
    rules: "No fixed length or scheme in English. Pindaric odes move in strophe, antistrophe, epode. Horatian odes hold one stanza pattern throughout. Irregular odes, including Keats's, invent their own.",
    prompt: "Pick something too ordinary to deserve a poem. Address it directly. Do not become ironic when it gets uncomfortable.",
    v: { music: .70, rhyme: .50, repetition: .35, brevity: .10, constraint: .40, narrative: .25, image: .60, interiority: .50, wit: .30, feeling: .85 },
    poems: [
      { light: .35, demand: .50, title: "Ode to a Nightingale", poet: "John Keats, 1819", note: "Eighty lines of trying to leave his own body by listening to a bird. He does not manage it." },
      { light: .85, demand: .15, title: "Odes to Common Things", poet: "Pablo Neruda, 1954", note: "Odes to a tomato, a pair of socks, an artichoke. Completely unembarrassed, and the better for it." },
      { light: .50, demand: .70, title: "Ode: Intimations of Immortality", poet: "William Wordsworth, 1807", note: "The big one about childhood and what is lost. Slow, and worth the slowness." }
    ]
  },
  {
    id: "elegy",
    name: "Elegy",
    family: "occasion",
    tagline: "A poem that has to say the unsayable thing, and knows it will fail.",
    why: "You want writing that does not flinch and does not perform. The elegy is defined by its occasion rather than its shape, which frees it entirely: whatever form holds the grief is the right one. The best ones refuse consolation until they have earned it, and some never do.",
    rules: "No formal requirement in English beyond the subject. The classical pastoral elegy has a procession of mourners and a turn toward comfort at the end. Modern elegies routinely withhold that turn.",
    prompt: "Write about someone who is gone without once using a word that a sympathy card would use.",
    v: { music: .65, rhyme: .40, repetition: .45, brevity: .35, constraint: .35, narrative: .40, image: .60, interiority: .85, wit: .10, feeling: 1.0 },
    poems: [
      { light: .05, demand: .20, title: "Michiko Dead", poet: "Jack Gilbert, 1994", note: "Grief as a man carrying a box he cannot put down. Fifteen lines, one image, no consolation." },
      { light: .40, demand: .60, title: "In Memoriam A.H.H.", poet: "Alfred Tennyson, 1850", note: "Seventeen years of writing about one dead friend. The doubt in it is what keeps it alive." },
      { light: .45, demand: .55, title: "When Lilacs Last in the Dooryard Bloom'd", poet: "Walt Whitman, 1865", note: "For Lincoln, and for everyone else the war killed. Lilac, star, and a bird that will not stop." }
    ]
  },
  {
    id: "heroic-couplet",
    name: "Heroic Couplet",
    family: "occasion",
    tagline: "Two rhymed lines, closed like a trap, usually with someone's reputation inside.",
    why: "You like a sentence that snaps shut. The heroic couplet is the most quotable machine English has built, because each pair completes a thought and the rhyme confirms it, which makes it perfect for satire: the form itself sounds like it is agreeing with the insult.",
    rules: "Rhymed pairs of iambic pentameter, usually end-stopped so each couplet is a complete unit. Dominant in English verse from Dryden to Pope. Balance, antithesis, and caesura do most of the work.",
    prompt: "Two lines. Set up an expectation in the first, and betray it in the second, at exactly the rhyme.",
    v: { music: .80, rhyme: 1.0, repetition: .30, brevity: .45, constraint: .80, narrative: .55, image: .35, interiority: .20, wit: .95, feeling: .30 },
    poems: [
      { light: .75, demand: .45, title: "The Rape of the Lock", poet: "Alexander Pope, 1712", note: "An epic about a stolen curl of hair. The most sustained comic verse in English." },
      { light: .55, demand: .60, title: "Absalom and Achitophel", poet: "John Dryden, 1681", note: "A political scandal turned into scripture. The character portraits are still lethal." },
      { light: .70, demand: .55, title: "General Prologue to The Canterbury Tales", poet: "Geoffrey Chaucer, c. 1387", note: "The couplet before it went formal, describing thirty people with enormous affection and no illusions." }
    ]
  },
  {
    id: "blank-verse",
    name: "Blank Verse",
    family: "occasion",
    tagline: "Metre without rhyme, which turns out to be how English talks when it is serious.",
    why: "You want the discipline without the chime. Blank verse keeps the pentameter and drops the rhyme, which lets a poem run for thousands of lines while still sounding heightened, and it is why Shakespeare's people sound like people rather than like a song.",
    rules: "Unrhymed iambic pentameter. Sense runs across line ends rather than stopping at them, so the paragraph rather than the line is the unit. The dominant form for English drama and long poems for four centuries.",
    prompt: "Write ten lines of five beats each, no rhyme, and make at least three sentences end somewhere other than the line end.",
    v: { music: .75, rhyme: .05, repetition: .20, brevity: .05, constraint: .50, narrative: .80, image: .50, interiority: .60, wit: .30, feeling: .60 },
    poems: [
      { light: .50, demand: .30, title: "Home Burial", poet: "Robert Frost, 1914", note: "A marriage ending on a staircase. Blank verse used to catch the exact rhythm of people failing to talk." },
      { light: .35, demand: .80, title: "Paradise Lost", poet: "John Milton, 1667", note: "He chose no rhyme on purpose and said so in the preface. Ten thousand lines that never once stop for breath." },
      { light: .60, demand: .50, title: "Tintern Abbey", poet: "William Wordsworth, 1798", note: "A man returning to a place and finding himself changed. The form lets it wander and still hold." }
    ]
  },

  {
    id: "limerick",
    name: "Limerick",
    family: "comic",
    tagline: "Five lines engineered entirely around the arrival of the last one.",
    why: "You read for timing. The limerick is a delivery mechanism, and every part of it, the galloping anapaests, the two short lines that speed you up, the return of the opening rhyme, exists to make the fifth line land. Nothing else in English is so purely about the joke's architecture.",
    rules: "Five lines rhyming AABBA. Lines one, two and five have three stresses; three and four have two. Anapaestic, which is what makes it gallop.",
    prompt: "Write the fifth line first. Build the other four to make it inevitable and still surprising.",
    v: { music: .85, rhyme: 1.0, repetition: .30, brevity: .90, constraint: .85, narrative: .60, image: .35, interiority: .05, wit: 1.0, feeling: .05 },
    poems: [
      { light: .90, demand: .10, title: "A Book of Nonsense", poet: "Edward Lear, 1846", note: "The book that popularised it. Lear usually repeats the first rhyme at the end rather than landing a punchline, which is stranger than what came after." },
      { light: .85, demand: .20, title: "The Penguin Book of Limericks", poet: "Edited by E. O. Parrott, 1983", note: "Where the form went once it stopped being for children. Filthy, ingenious, and technically excellent." },
      { light: .80, demand: .30, title: "Limericks of Isaac Asimov", poet: "Isaac Asimov, 1975 onward", note: "He wrote thousands. Evidence that the constraint is genuinely generative, and that volume is not quality." }
    ]
  },
  {
    id: "clerihew",
    name: "Clerihew",
    family: "comic",
    tagline: "Four lopsided lines about a real person, usually unfair.",
    why: "You like a joke that does not care about being well made. The clerihew's metre is deliberately wrong, the lines are whatever length they need to be, and the first line is always somebody's name. Its whole comic engine is a straight face applied to a biography that will not fit.",
    rules: "Four lines, rhyming AABB. The first line is a person's name, and usually only their name. The metre is irregular on purpose. Invented by E. C. Bentley at sixteen, in a chemistry lesson.",
    prompt: "Write a famous person's name. Rhyme it, badly, with something true about them that they would not want mentioned.",
    v: { music: .40, rhyme: .90, repetition: .15, brevity: .95, constraint: .70, narrative: .35, image: .25, interiority: .05, wit: 1.0, feeling: .05 },
    poems: [
      { light: .90, demand: .10, title: "Biography for Beginners", poet: "E. C. Bentley, 1905", note: "The first collection, and the one with Sir Christopher Wren going to dine with some men." },
      { light: .85, demand: .15, title: "Clerihews Complete", poet: "E. C. Bentley, 1951", note: "Everything he wrote in the form he accidentally invented and then named after himself." },
      { light: .80, demand: .25, title: "The Complete Clerihews", poet: "Edited by Gavin Ewart, 1983", note: "Bentley plus the poets who took it up, including Auden, who was very good at it." }
    ]
  },

  {
    id: "free-verse",
    name: "Free Verse",
    family: "open",
    tagline: "The line break as the only rule, which makes it the hardest one.",
    why: "You want the shape to come from the material rather than be waiting for it. Free verse abandons metre and rhyme and keeps the line, which means every break is a decision with nothing to hide behind. Done badly it is prose with the return key pressed; done well it is the most flexible instrument here.",
    rules: "No metre, no rhyme scheme, no fixed length. Rhythm comes from cadence, repetition, and where the lines end. Not the same as formlessness, which is the misunderstanding that gives it a bad name.",
    prompt: "Write a paragraph. Break it into lines so that the last word of each one is a word you want the reader to sit on. Delete anything that survived only because it sounded poetic.",
    v: { music: .40, rhyme: .05, repetition: .30, brevity: .40, constraint: .05, narrative: .45, image: .70, interiority: .75, wit: .40, feeling: .60 },
    poems: [
      { light: .70, demand: .35, title: "Song of Myself", poet: "Walt Whitman, 1855", note: "Where English free verse starts. Long lines built on the cadence of the King James Bible and a market crier." },
      { light: .60, demand: .15, title: "The Red Wheelbarrow", poet: "William Carlos Williams, 1923", note: "Sixteen words. An argument that the line break alone can carry a poem." },
      { light: .85, demand: .10, title: "Wild Geese", poet: "Mary Oliver, 1986", note: "The most quoted free verse poem of the last forty years, and better than its ubiquity suggests." }
    ]
  },
  {
    id: "prose-poem",
    name: "Prose Poem",
    family: "open",
    tagline: "A block of prose that behaves like a poem and refuses to explain itself.",
    why: "You want the compression and the strangeness without the line. The prose poem gives up the one thing that visibly marks verse, which forces everything else, image, torque, the sentence that arrives sideways, to work harder. It is also where the funniest serious writing tends to hide.",
    rules: "Prose on the page, no line breaks. Length is usually a paragraph or a page. Everything else is borrowed from poetry: compression, image, sound, and an ending that turns rather than concludes.",
    prompt: "Write one paragraph in which something impossible happens and nobody in it is surprised.",
    v: { music: .35, rhyme: .02, repetition: .30, brevity: .55, constraint: .15, narrative: .50, image: .80, interiority: .70, wit: .55, feeling: .55 },
    poems: [
      { light: .40, demand: .45, title: "Paris Spleen", poet: "Charles Baudelaire, 1869", note: "The book that invented it, and said plainly in the preface that he wanted a prose supple enough for the city." },
      { light: .45, demand: .35, title: "The World Doesn't End", poet: "Charles Simic, 1989", note: "Wartime childhood as a series of small absurd scenes. Won the Pulitzer, to some people's annoyance." },
      { light: .15, demand: .40, title: "Citizen: An American Lyric", poet: "Claudia Rankine, 2014", note: "Everyday racism recorded in second person prose. The form's flatness is doing the work." }
    ]
  },
  {
    id: "conversation-poem",
    name: "Conversation Poem",
    family: "open",
    tagline: "Someone thinking aloud in a real room, to a listener who never answers.",
    why: "You want to overhear rather than be addressed. The conversation poem sits a speaker somewhere specific, a cottage at midnight, a garden he cannot leave, and lets the mind wander out and come home changed. It invented the voice most modern poetry still uses.",
    rules: "Blank verse, usually. A named setting and a silent listener. The movement is out from the room into memory or speculation, then back to the room, which is now different. Coleridge wrote eight; the shape outlived him.",
    prompt: "Put yourself in the room you are actually in, with one person who is not listening. Follow one thought as far as it goes, then come back and notice the room again.",
    v: { music: .45, rhyme: .15, repetition: .20, brevity: .15, constraint: .10, narrative: .50, image: .55, interiority: .95, wit: .45, feeling: .65 },
    poems: [
      { light: .70, demand: .35, title: "Frost at Midnight", poet: "Samuel Taylor Coleridge, 1798", note: "Alone at night with a sleeping baby and a guttering fire. The purest example of the shape." },
      { light: .65, demand: .30, title: "This Lime-Tree Bower My Prison", poet: "Samuel Taylor Coleridge, 1797", note: "Stuck in a garden while his friends walk without him, and talking himself out of resentment." },
      { light: .40, demand: .25, title: "The Day Lady Died", poet: "Frank O'Hara, 1959", note: "Not Coleridge's form, but its descendant: an afternoon of errands that stops dead at a newspaper headline." }
    ]
  }
];
