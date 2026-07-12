/* ============================================================================
   AMENTI :: Voice Synthesis Profiles  (v2 - Parler-ready)
   ****************************************************************************
   *  NOT IN PRODUCTION. NOT LOADED BY ANY PAGE. ZERO CALLERS — BY DESIGN.     *
   *                                                                          *
   *  This is a SPEC, not infrastructure. It is the TARGET STATE for the       *
   *  Parler / wave-file voice-mapping work, which is not built yet. The       *
   *  voice profiles are the final polish on a TTS system that does not exist  *
   *  in this form.                                                            *
   *                                                                          *
   *  THE LIVE TTS IS GEMINI. POST /speak { text, style, voice }.              *
   *  Style composition lives in amenti-voice.js (recital + conversational     *
   *  registers). Voice identity comes from the roster CSV, and today it is    *
   *  chosen BY GENDER ALONE — Charon for every male figure, Kore for every    *
   *  female. Caesar, Douglass, Moses, Seneca and Milton are literally the     *
   *  same voice. Closing THAT gap is what this file is for.                   *
   *                                                                          *
   *  WHY THE WARNING IS THIS LOUD: this file was written in the present       *
   *  tense and loaded by a <script> tag, with no callers. A design session     *
   *  read it, reasonably concluded Parler was the engine, and produced two    *
   *  documents proposing a prosody architecture for a TTS system this         *
   *  project does not run. A future spec that reads as current infrastructure  *
   *  is a trap with no sign on it. This is the sign.                          *
   *                                                                          *
   *  BEFORE THE MIGRATION, TWO THINGS ARE ALREADY KNOWN:                      *
   *                                                                          *
   *  1. THE CACHE KEY IS sha256(TTS_MODEL + voice + style + text).            *
   *     Changing engine changes the model AND the voice names, which ORPHANS  *
   *     THE ENTIRE R2 AUDIO ARCHIVE. Budget the re-render; do not discover    *
   *     it. And since you are paying to re-render anyway, THAT is the moment  *
   *     to unify the chunkers too (320 here, 700 on Page2). One migration,    *
   *     one bill — not two.                                                   *
   *                                                                          *
   *  2. THREE SPEAKER-ANCHOR COLLISIONS ALREADY EXIST in the descriptions     *
   *     below, and the header itself warns to "swap it if two figures sound   *
   *     too alike":                                                           *
   *         caesar / frederick-douglass  -> both "a man named James"          *
   *         edward-gibbon / john-milton  -> both "a man named Patrick"        *
   *         marcus-aurelius / akhenaten  -> both "a man named Will"           *
   *     Caesar and Douglass is the loud one: both hero readings, both          *
   *     commanding, both likely to be summoned. Free to fix while it is       *
   *     still a spec.                                                         *
   ****************************************************************************
   window.AMENTI_VOICE_PROFILES[key] -> the acoustic profile a figure WILL have.
   Keys map 1:1 to window.AMENTI_CHARS[].key.

   Each entry:
     parlerDescription - paste this into Parler-TTS (Space or Colab) as the
                         voice DESCRIPTION. The leading speaker name (Jon,
                         James, etc.) is a consistency anchor, not a real
                         person - swap it if two figures sound too alike.
     sampleText        - the figure's own words, for the reference clip.
     params            - human-readable echo of the description.
     grounding         - recording | description | reconstructed.
     heroReading       - true = Tier 1 hand-produced reading candidate.

   Accent terms marked (approx.) are best-effort: Parler reliably delivers
   pitch, pace, timbre, tone and recording quality; precise historical
   accents are approximate. Tune the description, keep the seed fixed.
   ============================================================================ */

window.AMENTI_VOICE_PROFILES = {
  "lincoln": {
    "name": "Abraham Lincoln",
    "language": "English (frontier-tinged)",
    "grounding": "description",
    "heroReading": true,
    "parlerDescription": "A man named Jon speaks with a high-pitched, thin, reedy tenor voice. He speaks slowly and deliberately, in a warm, earnest, slightly folksy tone. The recording is very clear and close, with almost no background noise.",
    "sampleText": "Fellow citizens, we cannot escape history. The fiery trial through which we pass will light us down, in honor or dishonor, to the latest generation.",
    "params": {
      "pitch": "high (tenor)",
      "pace": "slow, building",
      "timbre": "thin, reedy",
      "accent": "frontier American (approx.)",
      "tone": "warm, earnest, dry"
    }
  },
  "caesar": {
    "name": "Gaius Julius Caesar",
    "language": "English (Latin-tinged)",
    "grounding": "reconstructed",
    "heroReading": true,
    "parlerDescription": "A man named James speaks with a clear, controlled baritone voice. He speaks at a measured, unhurried pace with calm, commanding authority and a faint touch of vanity. Very clear and close recording, no background noise.",
    "sampleText": "All Gaul is divided into three parts. I came, I saw, I conquered.",
    "params": {
      "pitch": "mid (baritone)",
      "pace": "measured",
      "timbre": "clear, controlled",
      "accent": "neutral/Latin-tinged",
      "tone": "commanding, vain, direct"
    }
  },
  "sun-tzu": {
    "name": "Sun Tzu",
    "language": "English (lightly Chinese-tinged)",
    "grounding": "reconstructed",
    "heroReading": false,
    "parlerDescription": "A man named Tom speaks with a low, quiet, even voice. He speaks slowly and sparingly, each sentence calm and deliberate like a maxim, in an austere, unhurried tone. Very clear, close recording with almost no background noise.",
    "sampleText": "All warfare is based on deception. Supreme excellence is to subdue the enemy without fighting.",
    "params": {
      "pitch": "low-mid",
      "pace": "slow, sparse",
      "timbre": "quiet, even",
      "accent": "lightly Chinese (approx.)",
      "tone": "austere, serene"
    }
  },
  "hannibal": {
    "name": "Hannibal Barca",
    "language": "English (faint Mediterranean)",
    "grounding": "reconstructed",
    "heroReading": false,
    "parlerDescription": "A man named Rick speaks with a cool, hard baritone voice. He speaks at a brisk, clipped pace in a controlled, contemptuous, commanding tone. Very clear and close recording, no background noise.",
    "sampleText": "I will find a way, or I will make one.",
    "params": {
      "pitch": "mid (baritone)",
      "pace": "brisk, clipped",
      "timbre": "cool, hard",
      "accent": "faint Mediterranean (approx.)",
      "tone": "contemptuous, controlled"
    }
  },
  "gandhi": {
    "name": "Mohandas Gandhi",
    "language": "English (Indian accent)",
    "grounding": "recording",
    "heroReading": true,
    "parlerDescription": "An older man named Mike speaks English with an Indian accent in a soft, high, gentle voice. He speaks slowly and deliberately, quiet even when firm, in a modest, earnest tone. Very clear, close recording with little background noise.",
    "sampleText": "Truth and nonviolence are as old as the hills.",
    "params": {
      "pitch": "mid-high",
      "pace": "slow, deliberate",
      "timbre": "soft, light",
      "accent": "Indian English",
      "tone": "gentle, firm, questioning"
    }
  },
  "tesla": {
    "name": "Nikola Tesla",
    "language": "English (Serbian accent)",
    "grounding": "description",
    "heroReading": false,
    "parlerDescription": "A man named David speaks English with a Serbian accent in a precise, formal, slightly high voice. He speaks fairly quickly but carefully, fastidious with each word, in an intense, exacting tone. Very clear, close recording.",
    "sampleText": "The present is theirs; the future, for which I really worked, is mine.",
    "params": {
      "pitch": "mid-high",
      "pace": "quick but careful",
      "timbre": "precise, reedy",
      "accent": "Serbian (approx.)",
      "tone": "fastidious, intense"
    }
  },
  "moses": {
    "name": "Moses ben Amram",
    "language": "English (ancient register)",
    "grounding": "reconstructed",
    "heroReading": false,
    "parlerDescription": "An old man named Bruce speaks with a deep, weathered, resonant voice. He speaks slowly and gravely, with long pauses and great weight, in a solemn, commanding, weary tone. Spacious, clear recording with a little room around the voice.",
    "sampleText": "Let my people go, that they may serve me.",
    "params": {
      "pitch": "low",
      "pace": "slow, grave",
      "timbre": "deep, weathered",
      "accent": "neutral ancient",
      "tone": "thunderous, weary"
    }
  },
  "oliver-cromwell": {
    "name": "Oliver Cromwell",
    "language": "English (17th-c. plain)",
    "grounding": "reconstructed",
    "heroReading": false,
    "parlerDescription": "A man named Gary speaks with a plain, forceful voice. He speaks directly and bluntly, quickening with fervor, in a stern, fervent, conviction-filled tone. Very clear, close, dry recording with no background noise.",
    "sampleText": "I beseech you, in the bowels of Christ, think it possible you may be mistaken.",
    "params": {
      "pitch": "mid-low",
      "pace": "brisk when fervent",
      "timbre": "plain, forceful",
      "accent": "plain English",
      "tone": "blunt, fervent"
    }
  },
  "marcus-aurelius": {
    "name": "Marcus Aurelius",
    "language": "English (Latin-tinged)",
    "grounding": "reconstructed",
    "heroReading": true,
    "parlerDescription": "A man named Will speaks with a calm, low, even voice. He speaks slowly and inwardly, as if to himself, in a measured, contemplative, quietly weary tone. Very clear, close, intimate recording with no background noise.",
    "sampleText": "Waste no more time arguing what a good man should be. Be one.",
    "params": {
      "pitch": "low-mid",
      "pace": "slow, even",
      "timbre": "calm, low",
      "accent": "neutral/Latin-tinged",
      "tone": "inward, dutiful, weary"
    }
  },
  "tacitus": {
    "name": "Tacitus",
    "language": "English (dry, Latin-tinged)",
    "grounding": "reconstructed",
    "heroReading": false,
    "parlerDescription": "A man named Jerry speaks with a dry, precise, controlled voice. He speaks at a measured pace in clipped, economical phrases, in a cool, withering, restrained tone. Very clear, close recording with no background noise.",
    "sampleText": "They make a desolation and call it peace.",
    "params": {
      "pitch": "mid",
      "pace": "measured, clipped",
      "timbre": "dry, precise",
      "accent": "neutral/Latin-tinged",
      "tone": "withering, restrained"
    }
  },
  "david-hume": {
    "name": "David Hume",
    "language": "English (Scottish accent)",
    "grounding": "reconstructed",
    "heroReading": false,
    "parlerDescription": "A man named Bill speaks English with a Scottish accent in a warm, clear voice. He speaks at an unhurried, reasonable pace, good-humoured and lucid, with a faint amused lift. Very clear, close recording with no background noise.",
    "sampleText": "A wise man proportions his belief to the evidence.",
    "params": {
      "pitch": "mid",
      "pace": "unhurried",
      "timbre": "warm, lucid",
      "accent": "Scottish (approx.)",
      "tone": "good-humoured, amused"
    }
  },
  "charles-martel": {
    "name": "Charles Martel",
    "language": "English (Germanic-tinged)",
    "grounding": "reconstructed",
    "heroReading": false,
    "parlerDescription": "A man named Jason speaks with a blunt, gravelly, low voice. He speaks slowly in short, plain, declarative phrases, in a grim, hard, soldierly tone. Very clear, close, dry recording with no background noise.",
    "sampleText": "Hold the line. The wall must not break.",
    "params": {
      "pitch": "low",
      "pace": "slow, blunt",
      "timbre": "gravelly, hard",
      "accent": "Germanic (approx.)",
      "tone": "grim, plain"
    }
  },
  "edward-gibbon": {
    "name": "Edward Gibbon",
    "language": "English (refined British)",
    "grounding": "reconstructed",
    "heroReading": false,
    "parlerDescription": "A man named Patrick speaks English with a refined British accent in a smooth, polished voice. He speaks at a measured, urbane pace, stately and a little ironic, with dry amusement. Very clear, close recording with no background noise.",
    "sampleText": "History is little more than the register of the crimes, follies, and misfortunes of mankind.",
    "params": {
      "pitch": "mid",
      "pace": "measured, urbane",
      "timbre": "smooth, polished",
      "accent": "refined British",
      "tone": "stately, ironic"
    }
  },
  "bram-stoker": {
    "name": "Bram Stoker",
    "language": "English (Irish accent)",
    "grounding": "reconstructed",
    "heroReading": false,
    "parlerDescription": "A man named Eric speaks English with an Irish accent in a warm, resonant voice. He speaks at a measured, atmospheric pace, building unease, fond of a low, confiding hush. Very clear, close recording with a faint warmth.",
    "sampleText": "Listen to them, the children of the night. What music they make.",
    "params": {
      "pitch": "mid-low",
      "pace": "measured, atmospheric",
      "timbre": "warm, resonant",
      "accent": "Irish (approx.)",
      "tone": "atmospheric, confiding"
    }
  },
  "plato": {
    "name": "Plato",
    "language": "English (lightly Greek-tinged)",
    "grounding": "reconstructed",
    "heroReading": false,
    "parlerDescription": "A man named Jordan speaks with a resonant, patient voice. He speaks at an even, deliberate pace, probing and unhurried, building step by step in a calm, searching tone. Very clear, close, intimate recording with no background noise.",
    "sampleText": "Until philosophers are kings, cities will never have rest from their evils.",
    "params": {
      "pitch": "mid",
      "pace": "even, deliberate",
      "timbre": "resonant, patient",
      "accent": "lightly Greek (approx.)",
      "tone": "probing, calm"
    }
  },
  "seneca": {
    "name": "Seneca the Younger",
    "language": "English (Latin-tinged)",
    "grounding": "reconstructed",
    "heroReading": false,
    "parlerDescription": "A man named Aaron speaks with a polished, measured voice carrying a touch of weariness. He speaks at an even, eloquent pace in balanced, aphoristic phrases, composed even when grave. Very clear, close recording with no background noise.",
    "sampleText": "We do not receive a short life, but we make it a short one.",
    "params": {
      "pitch": "mid-low",
      "pace": "even, measured",
      "timbre": "polished, weary",
      "accent": "neutral/Latin-tinged",
      "tone": "eloquent, composed"
    }
  },
  "confucius": {
    "name": "Confucius",
    "language": "English (lightly Chinese-tinged)",
    "grounding": "reconstructed",
    "heroReading": false,
    "parlerDescription": "An older man named Yann speaks English with a slight East-Asian inflection in a gentle, calm voice. He speaks slowly and courteously in brief, measured phrases, warm and patient, with unhurried pauses. Very clear, close, intimate recording.",
    "sampleText": "To learn, and at due times to practise what one has learnt: is that not a pleasure?",
    "params": {
      "pitch": "mid-low",
      "pace": "slow, measured",
      "timbre": "gentle, warm",
      "accent": "lightly Chinese (approx.)",
      "tone": "courteous, patient"
    }
  },
  "frederick-douglass": {
    "name": "Frederick Douglass",
    "language": "English (cultivated 19th-c. American)",
    "grounding": "description",
    "heroReading": true,
    "parlerDescription": "A man named James speaks with a deep, powerful, resonant voice and a wide dynamic range. He builds from a measured, grave pace to thunderous force, in a commanding, morally fierce, impassioned tone. Very clear, close recording with strong presence and projection.",
    "sampleText": "Power concedes nothing without a demand. It never did and it never will.",
    "params": {
      "pitch": "low (bass-baritone)",
      "pace": "builds to forceful",
      "timbre": "deep, resonant",
      "accent": "cultivated American",
      "tone": "fierce, commanding"
    }
  },
  "john-milton": {
    "name": "John Milton",
    "language": "English (refined 17th-c.)",
    "grounding": "reconstructed",
    "heroReading": false,
    "parlerDescription": "A man named Patrick speaks English with a refined British accent in a deep, sonorous, organ-like voice. He speaks slowly and grandly in long, flowing, stately phrases, proud and solemn, almost reciting. Very clear, close recording with a touch of space.",
    "sampleText": "The mind is its own place, and in itself can make a heaven of hell, a hell of heaven.",
    "params": {
      "pitch": "mid-low",
      "pace": "slow, grand",
      "timbre": "sonorous, organ-like",
      "accent": "refined British",
      "tone": "proud, solemn"
    }
  },
  "akhenaten": {
    "name": "Akhenaten",
    "language": "English (ceremonial register)",
    "grounding": "reconstructed",
    "heroReading": false,
    "parlerDescription": "A man named Will speaks with a clear, serene, exalted voice. He speaks slowly, almost chanting, with a hushed, ceremonial gravity and a calm, otherworldly certainty. Spacious, clear recording with a little room around the voice.",
    "sampleText": "Thou appearest beautifully on the horizon of heaven, O living Aten, beginning of life.",
    "params": {
      "pitch": "mid",
      "pace": "slow, chant-like",
      "timbre": "clear, hymnic",
      "accent": "neutral ceremonial",
      "tone": "exalted, serene, remote"
    }
  }
};
