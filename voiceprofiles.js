/* ============================================================================
   AMENTI :: Voice Synthesis Profiles
   ----------------------------------------------------------------------------
   The acoustic layer. Where each figure's existing `voice` field on the card
   (the VOICE PRINT) describes how they TALK — diction, rhythm, what they reach
   for, and drives the LLM persona — this file describes how they SOUND —
   pitch, timbre, accent — and drives the TTS engine. The two complement each
   other; this does not replace the card field.

   PIPELINE (per figure):
     designPrompt  ──▶  Parler-TTS  ──▶  clean ~20–30s reference sample
                                              │
                                              ▼
                                         Chatterbox (clones the sample)
                                              │
                              ┌───────────────┴───────────────┐
                       Tier 1 (hero readings)          Tier 2 (live Gabriel chat)
                       Logic hybrid hand-produced       runtime TTS, automatable DSP only

   The Tier 1 hybrid clip, once produced in Logic, becomes the Chatterbox
   reference for Tier 2 — so the live voice inherits the hand-authored character.

   LANGUAGE CONVENTION: the app answers in English. Every profile is English
   delivery colored by the figure's era and origin — never their native tongue.
   Kept intelligible: accent is flavor, not a barrier.

   GROUNDING (how much fidelity is real vs designed):
     "recording"     — actual audio of the person exists to anchor the design
     "description"   — no/scarce audio, but consistent contemporary accounts
     "reconstructed" — no direct source; built from era + region + role

   KEYS map 1:1 to window.AMENTI_CHARS[].key. Stored separately so the ledger
   and the TTS layer stay decoupled (mirrors how library.js stays out of the
   card data). The ~1000 CSV figures get auto-derived profiles later, from
   Title + dates + Biography; these 20 are hand-authored.

   PARAMS are a structured echo of the prompt for any engine that takes
   discrete controls (or for SSML on a cloud fallback).
   ============================================================================ */

window.AMENTI_VOICE_PROFILES = {

  lincoln: {
    name: "Abraham Lincoln",
    language: "English · 1860s Border-South frontier (Kentucky–Indiana)",
    designPrompt: "An elderly American man with an early-1860s Border-South frontier accent. His voice is a high, thin, penetrating tenor — reedy rather than deep — and he speaks slowly and deliberately, gathering momentum as he goes. Folksy yet commanding, warm and earnest with a dry, self-deprecating wit. Recorded close and clean, almost no background noise.",
    params: { pitch: "high (tenor)", range: "moderate", rate: "slow, building", timbre: "thin, reedy, penetrating", accent: "frontier Border-South, 1860s", register: "oratorical-folksy", affect: "warm, earnest, dry wit", cadence: "parable-like, thinks aloud, pauses" },
    grounding: "description",
    groundingNote: "Contemporary accounts are unusually consistent: a high, reedy, carrying tenor — not the deep boom of legend. Well-anchored despite no recording.",
    heroReading: true
  },

  caesar: {
    name: "Gaius Julius Caesar",
    language: "English · Classical-Latin coloring",
    designPrompt: "A patrician Roman man in his early fifties, speaking English with a measured Classical-Latin coloring. A clear, controlled baritone with an imperial, faintly vain cadence; crisp consonants, unhurried authority, every phrase weighted as if for the record. Close, clean recording.",
    params: { pitch: "mid (baritone)", range: "narrow", rate: "measured", timbre: "clear, controlled", accent: "Classical-Latin-colored English", register: "imperial/oratorical", affect: "confident, faintly vain, direct", cadence: "weighted, declarative" },
    grounding: "reconstructed",
    groundingNote: "No source for his actual voice; built from patrician Roman rhetorical style and his known self-assured directness.",
    heroReading: true
  },

  "sun-tzu": {
    name: "Sun Tzu",
    language: "English · calm, lightly tonal Chinese coloring",
    designPrompt: "An older Chinese man of the Warring States era, speaking English with a calm, even, lightly tonal inflection. A low, quiet, unhurried voice; spare and precise, each sentence shaped like a maxim with deliberate pauses. Serene to the point of austerity. Clean, intimate recording.",
    params: { pitch: "low-mid", range: "very narrow", rate: "slow, deliberate", timbre: "quiet, even", accent: "lightly tonal Chinese-colored English", register: "aphoristic/instructional", affect: "serene, austere", cadence: "maxim-shaped, long pauses" },
    grounding: "reconstructed",
    groundingNote: "Fully designed; anchored to the aphoristic, structured voice of The Art of War.",
    heroReading: false
  },

  hannibal: {
    name: "Hannibal Barca",
    language: "English · faint Phoenician-Mediterranean coloring",
    designPrompt: "A hardened Carthaginian commander in his thirties, speaking English with a faint Phoenician-Mediterranean coloring. A cool, controlled, slightly clipped baritone, contemptuous and terse — the cadence of a man giving orders on a battlefield. Close, clean recording.",
    params: { pitch: "mid (baritone)", range: "narrow", rate: "brisk, clipped", timbre: "cool, hard", accent: "faint Phoenician-Mediterranean", register: "military/terse", affect: "contemptuous, controlled", cadence: "aphoristic command" },
    grounding: "reconstructed",
    groundingNote: "Designed; built from his terse military reputation and Carthaginian origin.",
    heroReading: false
  },

  gandhi: {
    name: "Mohandas Gandhi",
    language: "English · Gujarati-inflected Indian English",
    designPrompt: "An elderly Indian man with a soft, high-set, Gujarati-inflected Indian-English accent. A gentle, deliberate, slightly frail voice that stays quiet even when firm; unhurried, with thoughtful pauses, often lifting at the end as if asking a question. Modest, plain delivery. Clean recording with a faint period warmth.",
    params: { pitch: "mid-high", range: "moderate", rate: "slow, deliberate", timbre: "soft, light, slightly frail", accent: "Gujarati-inflected Indian English", register: "intimate/plain", affect: "gentle, firm, questioning", cadence: "answers with questions, soft landings" },
    grounding: "recording",
    groundingNote: "Actual recordings of Gandhi survive — design toward an evocative match, not a clone (consistent with the designed-voice approach).",
    heroReading: true
  },

  tesla: {
    name: "Nikola Tesla",
    language: "English · Serbian accent",
    designPrompt: "A tall, courtly man in his fifties speaking English with a distinct Serbian accent. A precise, formal, slightly high and reedy voice; rapid when excited then carefully self-correcting, fastidious with consonants, faintly archaic phrasing. Close recording, light period hiss.",
    params: { pitch: "mid-high", range: "moderate", rate: "variable — rapid then correcting", timbre: "precise, reedy", accent: "Serbian-accented English", register: "formal/technical", affect: "fastidious, intense", cadence: "jumps ahead, backtracks to explain" },
    grounding: "description",
    groundingNote: "Contemporary accounts describe a high, precise, Serbian-accented voice; any surviving recordings are scarce and disputed, so treat as description-anchored.",
    heroReading: false
  },

  moses: {
    name: "Moses ben Amram",
    language: "English · ancient, mythic register",
    designPrompt: "An ancient patriarch, a very old man with a weathered, resonant voice — thunderous and weary at once. Speaks English in long, rolling, biblical cadences with heavy gravity and long pauses, like one who has argued with God. Spacious, slightly reverberant recording.",
    params: { pitch: "low", range: "wide", rate: "slow, grave", timbre: "weathered, resonant", accent: "neutral ancient/mythic", register: "prophetic", affect: "thunderous yet weary", cadence: "long biblical periods, heavy pauses" },
    grounding: "reconstructed",
    groundingNote: "Pure design; mythic figure, voiced for the prophetic register the persona implies.",
    heroReading: false
  },

  "oliver-cromwell": {
    name: "Oliver Cromwell",
    language: "English · 17th-century East-Anglian / Fenland",
    designPrompt: "A 17th-century English military man in his fifties with a blunt East-Anglian Fenland accent. A plain, forceful, fervent voice shot through with sudden conviction; soldierly and direct, quickening when he speaks of Providence. Close, dry recording.",
    params: { pitch: "mid-low", range: "moderate", rate: "brisk when fervent", timbre: "plain, forceful", accent: "17th-c. East-Anglian", register: "soldierly/sermonic", affect: "blunt, fervent", cadence: "direct, sudden certainty" },
    grounding: "reconstructed",
    groundingNote: "Designed from his Fenland origin and the soldier-Puritan cadence the sources describe.",
    heroReading: false
  },

  "marcus-aurelius": {
    name: "Marcus Aurelius",
    language: "English · faint Classical coloring",
    designPrompt: "A Roman man in his late fifties, measured and inward, speaking English with a faint Classical coloring. A calm, low, contemplative voice that turns every thought toward duty; even-paced, unshowy, weighted with quiet fatigue. Intimate recording, as if spoken to himself.",
    params: { pitch: "low-mid", range: "narrow", rate: "even, measured", timbre: "calm, low", accent: "faint Classical-colored English", register: "contemplative/private", affect: "inward, dutiful, quietly weary", cadence: "maxims, reminders of mortality" },
    grounding: "reconstructed",
    groundingNote: "Designed to the private, self-addressed register of the Meditations.",
    heroReading: true
  },

  tacitus: {
    name: "Tacitus",
    language: "English · dry Classical coloring",
    designPrompt: "A patrician Roman senator in his forties speaking English with a dry, precise Classical coloring. A cool, clipped, epigrammatic voice — withering and economical, each clause landing like a verdict. Restrained, faintly contemptuous. Close, clean recording.",
    params: { pitch: "mid", range: "narrow", rate: "controlled", timbre: "dry, precise", accent: "dry Classical-colored English", register: "senatorial/epigrammatic", affect: "withering, restrained", cadence: "clipped verdict-clauses" },
    grounding: "reconstructed",
    groundingNote: "Designed from his terse, epigrammatic prose and senatorial bearing.",
    heroReading: false
  },

  "david-hume": {
    name: "David Hume",
    language: "English · 18th-century Edinburgh / Lowland Scots",
    designPrompt: "A genial 18th-century Scottish man in his forties with a soft Edinburgh Lowland Scots accent. A warm, lucid, good-humoured voice, unhurried and reasonable, with a faint amused lift even when delivering a devastating point. Clean, intimate recording.",
    params: { pitch: "mid", range: "moderate", rate: "unhurried", timbre: "warm, lucid", accent: "18th-c. Lowland Scots", register: "conversational/genial", affect: "good-humoured, amused", cadence: "reasonable, smiling undercut" },
    grounding: "reconstructed",
    groundingNote: "Designed from his Edinburgh origin and the genial-skeptic temperament the sources stress.",
    heroReading: false
  },

  "charles-martel": {
    name: "Charles Martel",
    language: "English · heavy Germanic-Frankish coloring",
    designPrompt: "An 8th-century Frankish warlord in his forties, speaking English with a heavy Germanic-Frankish coloring. A blunt, gravelly, soldierly voice; grim and plain, short declarative phrases, no ornament. Close, dry recording.",
    params: { pitch: "low", range: "narrow", rate: "slow, blunt", timbre: "gravelly, hard", accent: "Germanic-Frankish-colored English", register: "soldierly", affect: "grim, plain", cadence: "short declaratives" },
    grounding: "reconstructed",
    groundingNote: "Pure design; built from his Frankish origin and blunt soldier persona.",
    heroReading: false
  },

  "edward-gibbon": {
    name: "Edward Gibbon",
    language: "English · polished 18th-century Georgian",
    designPrompt: "A refined 18th-century English gentleman in his forties with a polished Georgian accent. A stately, ironic, slightly mannered voice; elegant and balanced, building a clause then undercutting it with a dry aside. Measured, urbane delivery. Clean recording.",
    params: { pitch: "mid", range: "moderate", rate: "measured, urbane", timbre: "polished, smooth", accent: "polished Georgian English", register: "literary/ironic", affect: "stately, amused", cadence: "balanced clause + dry aside" },
    grounding: "reconstructed",
    groundingNote: "Designed from his refined Georgian milieu and the ironic balance of his prose.",
    heroReading: false
  },

  "bram-stoker": {
    name: "Bram Stoker",
    language: "English · cultivated Victorian Dublin (Anglo-Irish)",
    designPrompt: "A Victorian Anglo-Irish man in his fifties with a cultivated Dublin accent. A warm, theatrical, resonant voice that builds unease detail by detail; measured and atmospheric, fond of a low, confiding hush. Close recording with a faint period warmth.",
    params: { pitch: "mid-low", range: "moderate", rate: "measured, atmospheric", timbre: "warm, resonant", accent: "cultivated Anglo-Irish Dublin", register: "theatrical/narrative", affect: "atmospheric, confiding", cadence: "dread built detail by detail" },
    grounding: "reconstructed",
    groundingNote: "Designed from his Dublin Anglo-Irish origin and Lyceum-theatre milieu.",
    heroReading: false
  },

  plato: {
    name: "Plato",
    language: "English · measured Greek coloring",
    designPrompt: "A Classical Athenian man in his fifties, speaking English with a measured Greek coloring. A probing, patient, resonant voice that answers a question with a sharper question; even and deliberate, building step by step toward an abstraction. Clean, intimate recording.",
    params: { pitch: "mid", range: "moderate", rate: "even, deliberate", timbre: "resonant, patient", accent: "Greek-colored English", register: "dialectical/teaching", affect: "probing, calm", cadence: "question-answers-question, step-built" },
    grounding: "reconstructed",
    groundingNote: "Designed to the dialectical, Socratic voice of the dialogues.",
    heroReading: false
  },

  seneca: {
    name: "Seneca the Younger",
    language: "English · faint Classical (Hispano-Roman) coloring",
    designPrompt: "A Hispano-Roman Stoic philosopher in his sixties, speaking English with a faint Classical coloring. A polished, rhetorical, slightly weary voice; eloquent and aphoristic, composed even when grave, the cadence of a practiced essayist. Close, clean recording.",
    params: { pitch: "mid-low", range: "moderate", rate: "measured", timbre: "polished, slightly weary", accent: "faint Classical-colored English", register: "rhetorical/essayistic", affect: "eloquent, composed", cadence: "aphoristic, balanced" },
    grounding: "reconstructed",
    groundingNote: "Designed from the polished rhetoric of the Moral Letters.",
    heroReading: false
  },

  confucius: {
    name: "Confucius",
    language: "English · calm, courteous, lightly tonal Chinese coloring",
    designPrompt: "An older Chinese sage of the Zhou era, speaking English with a calm, courteous, lightly tonal inflection. A gentle, measured, aphoristic voice; warm and patient, teaching through brief sayings and questions, with unhurried pauses. Clean, intimate recording.",
    params: { pitch: "mid-low", range: "narrow", rate: "slow, measured", timbre: "gentle, warm", accent: "lightly tonal Chinese-colored English", register: "teaching/aphoristic", affect: "courteous, patient", cadence: "brief sayings, pauses" },
    grounding: "reconstructed",
    groundingNote: "Designed to the aphoristic, courteous voice of the Analects.",
    heroReading: false
  },

  "frederick-douglass": {
    name: "Frederick Douglass",
    language: "English · cultivated 19th-c. Eastern-Shore Maryland",
    designPrompt: "A powerful African-American orator in his prime, speaking English with a cultivated 19th-century Eastern-Shore Maryland accent. A deep, resonant, commanding voice with great dynamic range; morally fierce, building from measured gravity to thunderous force. Recorded as if from a hall, with presence and projection.",
    params: { pitch: "low (bass-baritone)", range: "wide", rate: "builds slow to forceful", timbre: "deep, resonant", accent: "cultivated 19th-c. Maryland", register: "grand oratorical", affect: "morally fierce, commanding", cadence: "measured gravity → thunder" },
    grounding: "description",
    groundingNote: "Contemporary accounts of his oratory are vivid and consistent — deep, resonant, commanding. No recording (died 1895), so description-anchored.",
    heroReading: true
  },

  "john-milton": {
    name: "John Milton",
    language: "English · refined 17th-century London",
    designPrompt: "A blind 17th-century English poet in his fifties with a refined London accent. A sonorous, grave, organ-like voice that speaks in long Latinate periods with the cadence of blank verse; he composes aloud, dictating, proud and prophetic. Clean recording with a touch of space.",
    params: { pitch: "mid-low", range: "moderate-wide", rate: "stately", timbre: "sonorous, organ-like", accent: "refined 17th-c. London", register: "epic/prophetic", affect: "proud, absolute", cadence: "long Latinate blank-verse periods" },
    grounding: "reconstructed",
    groundingNote: "Designed to the sonorous, Latinate blank-verse cadence of his work; blind, he dictated — composes aloud.",
    heroReading: false
  },

  akhenaten: {
    name: "Akhenaten",
    language: "English · hushed ceremonial register",
    designPrompt: "A pharaoh, a man in his thirties, exalted and serene, speaking English with a hushed, ceremonial gravity. A clear, hymnic, sun-drenched voice, certain of revelation, addressing the divine; unhurried, a little remote, almost chanting. Spacious, lightly reverberant recording.",
    params: { pitch: "mid", range: "moderate", rate: "slow, chant-like", timbre: "clear, hymnic", accent: "neutral ceremonial English", register: "hymnic/prophetic", affect: "exalted, serene, remote", cadence: "hymn-lines, near-chant" },
    grounding: "reconstructed",
    groundingNote: "Pure design; voiced to the exalted register of the Great Hymn to the Aten.",
    heroReading: false
  }

};
