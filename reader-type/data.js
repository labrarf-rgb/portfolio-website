/* Trait model, questions, and genre vectors.
   Six dimensions. Five sit close to Big Five factors, the sixth (curiosity) is
   closer to need-for-cognition, which predicts nonfiction appetite better than
   any Big Five factor does. */

const TRAITS = {
  openness:   { label: "Openness",   blurb: "Appetite for the strange, the ambiguous, the not-yet-explained." },
  structure:  { label: "Structure",  blurb: "Preference for order, momentum, and a question that gets answered." },
  sociability:{ label: "Sociability",blurb: "How much you are drawn to people, warmth, and what passes between them." },
  empathy:    { label: "Empathy",    blurb: "How readily you slip into someone else's head and stay there." },
  intensity:  { label: "Intensity",  blurb: "Tolerance for dread, high stakes, and feeling wrung out afterward." },
  curiosity:  { label: "Curiosity",  blurb: "The pull to understand how a thing actually works." },
  ambiguity:  { label: "Ambiguity",  blurb: "Comfort with a thing that is never explained, and does not need to be." },
  hope:       { label: "Hope",       blurb: "How much you need it to come out okay. Separate from how intense you like it." },
  humor:      { label: "Humor",      blurb: "How much you want the book to be funny, whatever else it is doing." },
  factual:    { label: "Factual",    blurb: "Pull toward things that actually happened over things invented." }
};

/* One short statement at a time, answered on a five-point agree scale.

   This replaced a forced choice between four paragraph-length options. That
   format made people compare four unrelated things at once, re-read them, and
   eventually pick something arbitrary just to move on, which fed the model
   noise. A single statement is read once. It is also how real personality
   inventories are built, for the same reason.

   Each item names the trait it loads and the direction.

   Every trait has exactly one item where agreeing raises it and one where
   agreeing lowers it. Without that balance, a person who agrees with
   everything scores as maximally everything, and the quiz measures how
   agreeable someone is rather than what they like. When all twenty items were
   positively keyed, answering "strongly agree" throughout returned Comic
   Novels and answering "strongly disagree" throughout returned Horror, neither
   of which is a taste. */
const ITEMS = [
  { text: "I am drawn to things that are strange or hard to categorise.", w: { openness: 1 } },
  { text: "I like knowing where something is going.", w: { structure: 1 } },
  { text: "I take on other people's moods without meaning to.", w: { empathy: 1 } },
  { text: "I would rather feel calm than gripped.", w: { intensity: -1 } },
  { text: "I want to know how things actually work, in detail.", w: { curiosity: 1 } },
  { text: "I need things to come out okay in the end.", w: { hope: 1 } },
  { text: "I recharge best on my own.", w: { sociability: -1 } },
  { text: "I am fine when something is never explained.", w: { ambiguity: 1 } },
  { text: "If something is not funny at all, I lose interest.", w: { humor: 1 } },
  { text: "I would rather read about something that actually happened.", w: { factual: 1 } },

  { text: "I would rather stick with what I already know I like.", w: { openness: -1 } },
  { text: "I am comfortable improvising, even when plans fall apart.", w: { structure: -1 } },
  { text: "I stay fairly detached from other people's feelings.", w: { empathy: -1 } },
  { text: "I enjoy feeling on edge.", w: { intensity: 1 } },
  { text: "I am happy to use something without knowing how it works.", w: { curiosity: -1 } },
  { text: "I am drawn to sad stories.", w: { hope: -1 } },
  { text: "I think best out loud, with someone else in the room.", w: { sociability: 1 } },
  { text: "Loose ends bother me until they are tied up.", w: { ambiguity: -1 } },
  { text: "Jokes often get in the way of what a story is doing.", w: { humor: -1 } },
  { text: "I would rather read something invented than something that happened.", w: { factual: -1 } },

  /* Mood, not personality. Deliberately about right now, because what you want
     this month and what you like in general disagree. Weighted the same as
     every other item: mood is one input among many, not an override. Mirrored
     in pairs so they do not tip the keying balance the twenty items above
     establish. */
  { text: "Lately I want something comforting more than something challenging.", w: { hope: 1, humor: 1, intensity: -1 }, mood: true },
  { text: "Lately I want something that asks more of me than usual.", w: { hope: -1, humor: -1, intensity: 1 }, mood: true },
  { text: "Lately I want to be taken somewhere completely different.", w: { openness: 1, ambiguity: 1 }, mood: true },
  { text: "Lately I want something familiar and close to home.", w: { openness: -1, ambiguity: -1 }, mood: true }
];

const SCALE = [
  { label: "Strongly disagree", value: 1 },
  { label: "Disagree",          value: 2 },
  { label: "Neutral",           value: 3 },
  { label: "Agree",             value: 4 },
  { label: "Strongly agree",    value: 5 }
];

/* Hand-authored genre vectors, 0 to 1 per trait. These are judgment calls,
   not fitted to data. See the caveat in README.md. */
const GENRES = [
  {
    id: "literary",
    name: "Literary Fiction",
    tagline: "Sentences worth slowing down for, and people drawn close enough to hurt.",
    why: "You read for interiority. Plot matters less to you than being let all the way into someone's head, and you are patient enough to let a book take its time getting you there.",
    v: { openness: .75, structure: .35, sociability: .50, empathy: 1.0, intensity: .45, curiosity: .50, ambiguity: .70, hope: .35, humor: .30, factual: .25 },
    books: [
      { hope: .15, demand: .45, title: "Never Let Me Go", author: "Kazuo Ishiguro", note: "Quiet, devastating, and withholding in exactly the right way." },
      { hope: .60, demand: .60, title: "Gilead", author: "Marilynne Robinson", note: "A dying man writing to his son. Almost no plot, enormous feeling." },
      { hope: .50, demand: .35, title: "Pachinko", author: "Min Jin Lee", note: "Four generations, told with unusual warmth toward every character." }
    ]
  },
  {
    id: "scifi",
    name: "Science Fiction",
    tagline: "Ideas with consequences, followed all the way out.",
    why: "You like a premise that rearranges something you took for granted, and you would rather a book trust your intelligence than hold your hand.",
    v: { openness: .90, structure: .65, sociability: .35, empathy: .40, intensity: .55, curiosity: .95, ambiguity: .25, hope: .50, humor: .35, factual: .30 },
    books: [
      { hope: .55, demand: .65, title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", note: "A thought experiment about gender that became a classic novel." },
      { hope: .85, demand: .30, title: "Project Hail Mary", author: "Andy Weir", note: "Problem-solving as pure pleasure. Hard to put down." },
      { hope: .10, demand: .90, title: "Blindsight", author: "Peter Watts", note: "First contact, but the real subject is consciousness. Bleak and brilliant." }
    ]
  },
  {
    id: "fantasy",
    name: "Fantasy",
    tagline: "Somewhere built carefully enough to live in.",
    why: "You want immersion. The appeal is a world with its own rules, followed consistently, that you can lose an afternoon inside.",
    v: { openness: .95, structure: .80, sociability: .50, empathy: .68, intensity: .62, curiosity: .42, ambiguity: .45, hope: .70, humor: .40, factual: .10 },
    books: [
      { hope: .70, demand: .40, title: "Piranesi", author: "Susanna Clarke", note: "Short, strange, and entirely its own thing. A house that goes on forever." },
      { hope: .30, demand: .60, title: "The Fifth Season", author: "N. K. Jemisin", note: "A broken world with real geological logic. The structure is the trick." },
      { hope: .60, demand: .30, title: "The Name of the Wind", author: "Patrick Rothfuss", note: "Old-fashioned storytelling pleasure. Be warned, the series is unfinished." }
    ]
  },
  {
    id: "mystery",
    name: "Mystery and Thriller",
    tagline: "A question posed on page one and paid off on the last.",
    why: "You need momentum, and you enjoy the pleasure of a puzzle assembled fairly in front of you. An unresolved ending would feel like being cheated.",
    v: { openness: .45, structure: .95, sociability: .40, empathy: .40, intensity: .85, curiosity: .70, ambiguity: .15, hope: .45, humor: .25, factual: .20 },
    books: [
      { hope: .20, demand: .50, title: "The Secret History", author: "Donna Tartt", note: "You know the crime from page one. The tension is watching it arrive." },
      { hope: .20, demand: .30, title: "Gone Girl", author: "Gillian Flynn", note: "The structural trick still works even if you think you know it." },
      { hope: .80, demand: .15, title: "The Thursday Murder Club", author: "Richard Osman", note: "Gentler company, if you want the puzzle without the dread." }
    ]
  },
  {
    id: "historical",
    name: "Historical Fiction",
    tagline: "The past at eye level, lived rather than summarized.",
    why: "You want to know how it actually felt to be there, which is the part textbooks leave out. Research and feeling matter to you in equal measure.",
    v: { openness: .60, structure: .70, sociability: .50, empathy: .85, intensity: .45, curiosity: .85, ambiguity: .35, hope: .45, humor: .20, factual: .55 },
    books: [
      { hope: .40, demand: .70, title: "Wolf Hall", author: "Hilary Mantel", note: "Thomas Cromwell in close third person. The prose does something new." },
      { hope: .35, demand: .50, title: "The Underground Railroad", author: "Colson Whitehead", note: "History with one deliberate impossibility running through it." },
      { hope: .65, demand: .30, title: "The Book of Longings", author: "Sue Monk Kidd", note: "First-century life rendered in unusual domestic detail." }
    ]
  },
  {
    id: "romance",
    name: "Romance",
    tagline: "Two people, and everything that passes between them.",
    why: "You read for connection and you are not embarrassed about wanting the ending to land well. Warmth is not a lesser thing to want from a book.",
    v: { openness: .45, structure: .55, sociability: .95, empathy: .95, intensity: .50, curiosity: .30, ambiguity: .30, hope: 1.0, humor: .65, factual: .15 },
    books: [
      { hope: .85, demand: .20, title: "Beach Read", author: "Emily Henry", note: "Sharper and sadder than the cover suggests." },
      { hope: .95, demand: .15, title: "Red, White and Royal Blue", author: "Casey McQuiston", note: "Very funny, very warm, entirely unserious in the best way." },
      { hope: .90, demand: .20, title: "The Bride Test", author: "Helen Hoang", note: "Tender, and unusually thoughtful about how different minds work." }
    ]
  },
  {
    id: "horror",
    name: "Horror",
    tagline: "Dread as the point, not the side effect.",
    why: "You lean toward the thing most people look away from. You can sit with unease, and you would rather a book unsettle you than reassure you.",
    v: { openness: .70, structure: .35, sociability: .30, empathy: .50, intensity: 1.0, curiosity: .40, ambiguity: .70, hope: .10, humor: .20, factual: .10 },
    books: [
      { hope: .15, demand: .40, title: "The Haunting of Hill House", author: "Shirley Jackson", note: "The benchmark. Almost nothing happens and it is terrifying." },
      { hope: .35, demand: .30, title: "Mexican Gothic", author: "Silvia Moreno-Garcia", note: "Gothic bones, colonial rot, a genuinely revolting third act." },
      { hope: .15, demand: .40, title: "The Only Good Indians", author: "Stephen Graham Jones", note: "Guilt made literal. It hunts." }
    ]
  },
  {
    id: "memoir",
    name: "Memoir and Biography",
    tagline: "One real life, told closely.",
    why: "You are drawn to people over premises, and the fact that it happened matters to you. You want the texture of a real life, not an invented one.",
    v: { openness: .55, structure: .50, sociability: .70, empathy: .95, intensity: .50, curiosity: .70, ambiguity: .35, hope: .50, humor: .40, factual: 1.0 },
    books: [
      { hope: .55, demand: .30, title: "Educated", author: "Tara Westover", note: "A survivalist childhood and the cost of leaving it." },
      { hope: .60, demand: .30, title: "Just Kids", author: "Patti Smith", note: "New York, youth, and a friendship. Beautifully written." },
      { hope: .25, demand: .40, title: "The Year of Magical Thinking", author: "Joan Didion", note: "Grief examined with unnerving clarity. Short and heavy." }
    ]
  },
  {
    id: "science",
    name: "Popular Science",
    tagline: "How the thing actually works, explained well.",
    why: "Your default question is why. You would rather understand a mechanism than be told a conclusion, and a good explanation gives you the same pleasure others get from plot.",
    v: { openness: .70, structure: .70, sociability: .30, empathy: .35, intensity: .35, curiosity: 1.0, ambiguity: .10, hope: .60, humor: .35, factual: 1.0 },
    books: [
      { hope: .50, demand: .30, title: "The Immortal Life of Henrietta Lacks", author: "Rebecca Skloot", note: "Cell biology and a family's story, held together properly." },
      { hope: .75, demand: .40, title: "Entangled Life", author: "Merlin Sheldrake", note: "Fungi. Far stranger and more consequential than you expect." },
      { hope: .45, demand: .40, title: "Sapiens", author: "Yuval Noah Harari", note: "Big, sweeping, argumentative. Read it with some salt to hand." }
    ]
  },
  {
    id: "ideas",
    name: "Philosophy and Psychology",
    tagline: "Books about the machinery behind how you think.",
    why: "You turn questions over rather than settling them, and you are comfortable with a book that leaves you with more to think about than you started with.",
    v: { openness: .80, structure: .50, sociability: .30, empathy: .60, intensity: .40, curiosity: .95, ambiguity: .75, hope: .45, humor: .25, factual: .85 },
    books: [
      { hope: .50, demand: .75, title: "Thinking, Fast and Slow", author: "Daniel Kahneman", note: "The foundational text on how reasoning goes wrong. Dense but worth it." },
      { hope: .70, demand: .30, title: "Man's Search for Meaning", author: "Viktor Frankl", note: "A psychiatrist on the camps, and on what survives. Very short." },
      { hope: .55, demand: .55, title: "The Body Keeps the Score", author: "Bessel van der Kolk", note: "Trauma and the body. Contested in places, still valuable." }
    ]
  },
  {
    id: "speculative",
    name: "Speculative Fiction",
    tagline: "One thing about the world is changed, and then people are people about it.",
    why: "You want the what-if, but you care more about who has to live inside it than about how the machinery works. The premise is a way into people, not the point in itself.",
    v: { openness: .95, structure: .48, sociability: .35, empathy: .88, intensity: .65, curiosity: .82, ambiguity: .68, hope: .35, humor: .25, factual: .20 },
    books: [
      { hope: .65, demand: .30, title: "Station Eleven", author: "Emily St. John Mandel", note: "After the collapse, a troupe performs Shakespeare. About what is worth keeping." },
      { hope: .55, demand: .40, title: "Exit West", author: "Mohsin Hamid", note: "Doors open between countries. The magic is never explained and never needs to be." },
      { hope: .25, demand: .35, title: "The Power", author: "Naomi Alderman", note: "One change to how bodies work, followed all the way out. Nastier than expected." }
    ]
  },
  {
    id: "magical",
    name: "Magical Realism",
    tagline: "The impossible, treated as ordinary, by people with other things on their minds.",
    why: "You do not need the strange thing accounted for. You would rather a book let the impossible sit in the room unremarked, because that is closer to how memory and grief actually behave than realism is.",
    v: { openness: .98, structure: .25, sociability: .48, empathy: .92, intensity: .42, curiosity: .35, ambiguity: 1.0, hope: .55, humor: .40, factual: .15 },
    books: [
      { hope: .40, demand: .75, title: "One Hundred Years of Solitude", author: "Gabriel Garcia Marquez", note: "The origin point. A family, a town, and a century treated as one weather system." },
      { hope: .55, demand: .45, title: "The House of the Spirits", author: "Isabel Allende", note: "Warmer and more political. Good if Marquez feels too cool to the touch." },
      { hope: .50, demand: .55, title: "Kafka on the Shore", author: "Haruki Murakami", note: "Talking cats, fish from the sky, no explanations offered. Either it works on you or it does not." }
    ]
  },
  {
    id: "comic",
    name: "Comic Novels",
    tagline: "Funny on purpose, and better company than most serious books.",
    why: "You read for pleasure and see no reason to apologise for it. A book that makes you laugh has done something genuinely difficult, and you would take wit over weight most days.",
    v: { openness: .70, structure: .45, sociability: .85, empathy: .65, intensity: .25, curiosity: .45, ambiguity: .55, hope: .90, humor: 1.0, factual: .15 },
    books: [
      { hope: .95, demand: .20, title: "The Code of the Woosters", author: "P. G. Wodehouse", note: "Nothing is at stake and every sentence is perfect. The point is the prose." },
      { hope: .90, demand: .25, title: "Good Omens", author: "Terry Pratchett and Neil Gaiman", note: "The apocalypse, handled badly by everyone involved. Very warm." },
      { hope: .70, demand: .30, title: "Lucky Jim", author: "Kingsley Amis", note: "Academic humiliation as farce. Still the funniest campus novel." }
    ]
  },
  {
    id: "essays",
    name: "Essays and Criticism",
    tagline: "A good mind in motion, thinking out loud at short length.",
    why: "You would rather follow someone thinking than be handed a conclusion, and you like the essay's freedom to be funny, personal, and rigorous in the same paragraph. Short forms suit you.",
    v: { openness: .80, structure: .40, sociability: .35, empathy: .60, intensity: .30, curiosity: .90, ambiguity: .70, hope: .45, humor: .55, factual: .90 },
    books: [
      { hope: .35, demand: .50, title: "Slouching Towards Bethlehem", author: "Joan Didion", note: "The benchmark for the form. Cool, exact, quietly devastating." },
      { hope: .45, demand: .60, title: "Consider the Lobster", author: "David Foster Wallace", note: "Maximalist and very funny. The title essay is about eating an animal alive." },
      { hope: .40, demand: .45, title: "Trick Mirror", author: "Jia Tolentino", note: "The internet, self-delusion, and the scams of the last decade." }
    ]
  },
  {
    id: "history",
    name: "Narrative History",
    tagline: "What actually happened, told with the pacing of a novel.",
    why: "You want the real events, but you want them shaped. A historian who can build tension out of a known outcome is doing the thing you value, and you would rather learn from a story than from an argument.",
    v: { openness: .50, structure: .80, sociability: .40, empathy: .65, intensity: .45, curiosity: .95, ambiguity: .20, hope: .40, humor: .20, factual: 1.0 },
    books: [
      { hope: .55, demand: .45, title: "The Warmth of Other Suns", author: "Isabel Wilkerson", note: "The Great Migration through three lives. Enormous and completely readable." },
      { hope: .55, demand: .50, title: "SPQR", author: "Mary Beard", note: "Rome, told by someone unusually honest about what we cannot know." },
      { hope: .30, demand: .55, title: "The Guns of August", author: "Barbara Tuchman", note: "One month in 1914, paced like a thriller. You know the ending. It still grips." }
    ]
  },
  {
    id: "nature",
    name: "Nature and Travel Writing",
    tagline: "Somewhere real, looked at closely and slowly.",
    why: "You like attention as a mode of reading. Not much needs to happen if the looking is good enough, and you would rather a book restore you than wring you out.",
    v: { openness: .80, structure: .40, sociability: .30, empathy: .70, intensity: .25, curiosity: .80, ambiguity: .65, hope: .75, humor: .35, factual: .90 },
    books: [
      { hope: .55, demand: .40, title: "H is for Hawk", author: "Helen Macdonald", note: "Grief, a goshawk, and training it. Nature writing and memoir at once." },
      { hope: .75, demand: .40, title: "The Old Ways", author: "Robert Macfarlane", note: "Walking ancient paths. The prose is the reason to be there." },
      { hope: .70, demand: .60, title: "Arctic Dreams", author: "Barry Lopez", note: "The far north, taken seriously. Patient and enormous in scope." }
    ]
  }
];
