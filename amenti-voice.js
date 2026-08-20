{
  "probe": "probe-voice.mjs",
  "version": "1.0.0",
  "generated": "2026-08-20T05:51:19.008Z",
  "root": "work",
  "surfaces": [
    {
      "file": "Page1.html",
      "bytes": 526379,
      "lines": 8483,
      "sha256": "730c0dc26aaa3a06",
      "scripts": [
        {
          "src": "amenti-core.bundle.js",
          "line": 893,
          "loading": "blocking",
          "remote": false
        },
        {
          "src": "amenti-svg-library.js",
          "line": 5605,
          "loading": "defer",
          "remote": false
        },
        {
          "src": "amenti-doctrine.js",
          "line": 5937,
          "loading": "defer",
          "remote": false
        },
        {
          "src": "library.js",
          "line": 7104,
          "loading": "defer",
          "remote": false
        },
        {
          "src": "amenti-canonical.js",
          "line": 7115,
          "loading": "defer",
          "remote": false
        },
        {
          "src": "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
          "line": 8003,
          "loading": "defer",
          "remote": true
        },
        {
          "src": "amenti-auth.js",
          "line": 8004,
          "loading": "defer",
          "remote": false
        },
        {
          "src": "amenti-quiz.js",
          "line": 8011,
          "loading": "defer",
          "remote": false
        },
        {
          "src": "amenti-roster.js",
          "line": 8012,
          "loading": "defer",
          "remote": false
        },
        {
          "src": "amenti-roster-view.js",
          "line": 8013,
          "loading": "defer",
          "remote": false
        },
        {
          "src": "amenti-bay.js",
          "line": 8014,
          "loading": "defer",
          "remote": false
        },
        {
          "src": "amenti-motion.js",
          "line": 8015,
          "loading": "defer",
          "remote": false
        },
        {
          "src": "amenti-art-2.js",
          "line": 8016,
          "loading": "defer",
          "remote": false
        },
        {
          "src": "amenti-leaderboard.js",
          "line": 8017,
          "loading": "defer",
          "remote": false
        },
        {
          "src": "amenti-readaloud.js",
          "line": 8018,
          "loading": "defer",
          "remote": false
        },
        {
          "src": "amenti-vallhalla-signup.js",
          "line": 8021,
          "loading": "defer",
          "remote": false
        },
        {
          "src": "amenti-flourish.js",
          "line": 8022,
          "loading": "defer",
          "remote": false
        },
        {
          "src": "amenti-mascot.js",
          "line": 8023,
          "loading": "defer",
          "remote": false
        },
        {
          "src": "amenti-profile.js",
          "line": 8024,
          "loading": "defer",
          "remote": false
        },
        {
          "src": "amenti-art-photo.js",
          "line": 8032,
          "loading": "defer",
          "remote": false
        },
        {
          "src": "amenti-art-3.js",
          "line": 8046,
          "loading": "defer",
          "remote": false
        },
        {
          "src": "amenti-dispatch-art.js",
          "line": 8480,
          "loading": "defer",
          "remote": false
        }
      ],
      "inlineBlocks": 27,
      "engines": [
        {
          "global": "Amenti.terminal",
          "registered": 6292,
          "registeredIn": "Page1.html",
          "registeredBy": "inline",
          "loading": "inline",
          "availableAt": 6292,
          "role": "tell",
          "methods": [],
          "hasStop": false,
          "delegatesStop": false,
          "reads": 0,
          "firstRead": null,
          "firstReadEvaluation": null,
          "parseTimeReads": [],
          "uncertainReads": [],
          "calls": [],
          "callSites": []
        },
        {
          "global": "AMENTI_VOICE",
          "registered": 7130,
          "registeredIn": "Page1.html",
          "registeredBy": "inline",
          "loading": "inline",
          "availableAt": 7130,
          "role": "facade",
          "methods": [
            "speak",
            "stop",
            "toggle",
            "isSpeaking",
            "styleFor"
          ],
          "hasStop": true,
          "delegatesStop": false,
          "reads": 15,
          "firstRead": 6201,
          "firstReadEvaluation": "deferred",
          "parseTimeReads": [],
          "uncertainReads": [],
          "calls": [
            "speak",
            "stop",
            "toggle"
          ],
          "callSites": [
            {
              "line": 6201,
              "method": "speak",
              "via": "direct",
              "evaluation": "deferred"
            },
            {
              "line": 6208,
              "method": "stop",
              "via": "direct",
              "evaluation": "deferred"
            },
            {
              "line": 6325,
              "method": "speak",
              "via": "direct",
              "evaluation": "deferred"
            },
            {
              "line": 7212,
              "method": "speak",
              "via": "this",
              "evaluation": "deferred"
            },
            {
              "line": 7225,
              "method": "toggle",
              "via": "direct",
              "evaluation": "deferred"
            },
            {
              "line": 7591,
              "method": "stop",
              "via": "direct",
              "evaluation": "deferred"
            }
          ]
        },
        {
          "global": "Amenti.throttle",
          "registered": null,
          "registeredIn": null,
          "registeredBy": null,
          "loading": null,
          "availableAt": null,
          "role": "unresolved",
          "methods": [],
          "hasStop": false,
          "delegatesStop": false,
          "reads": 10,
          "firstRead": 3001,
          "firstReadEvaluation": "deferred",
          "parseTimeReads": [],
          "uncertainReads": [],
          "calls": [
            "speak",
            "stop"
          ],
          "callSites": [
            {
              "line": 3001,
              "method": "speak",
              "via": "direct",
              "evaluation": "deferred"
            },
            {
              "line": 3461,
              "method": "stop",
              "via": "direct",
              "evaluation": "deferred"
            },
            {
              "line": 6659,
              "method": "speak",
              "via": "direct",
              "evaluation": "deferred"
            },
            {
              "line": 6665,
              "method": "stop",
              "via": "direct",
              "evaluation": "deferred"
            },
            {
              "line": 6682,
              "method": "speak",
              "via": "direct",
              "evaluation": "deferred"
            },
            {
              "line": 7919,
              "method": "stop",
              "via": "direct",
              "evaluation": "deferred"
            },
            {
              "line": 7939,
              "method": "speak",
              "via": "direct",
              "evaluation": "deferred"
            }
          ]
        },
        {
          "global": "Amenti.voice",
          "registered": null,
          "registeredIn": null,
          "registeredBy": null,
          "loading": null,
          "availableAt": null,
          "role": "unresolved",
          "methods": [],
          "hasStop": false,
          "delegatesStop": false,
          "reads": 3,
          "firstRead": 7590,
          "firstReadEvaluation": "deferred",
          "parseTimeReads": [],
          "uncertainReads": [],
          "calls": [
            "isSpeaking",
            "stop"
          ],
          "callSites": [
            {
              "line": 7540,
              "method": "isSpeaking",
              "via": "alias",
              "evaluation": "deferred"
            },
            {
              "line": 7590,
              "method": "stop",
              "via": "direct",
              "evaluation": "deferred"
            }
          ]
        },
        {
          "global": "Amenti.chat",
          "registered": null,
          "registeredIn": null,
          "registeredBy": null,
          "loading": null,
          "availableAt": null,
          "role": "unresolved",
          "methods": [],
          "hasStop": false,
          "delegatesStop": false,
          "reads": 2,
          "firstRead": 6096,
          "firstReadEvaluation": "parse-time",
          "parseTimeReads": [
            6096
          ],
          "uncertainReads": [],
          "calls": [],
          "callSites": []
        },
        {
          "global": "Amenti.conversation",
          "registered": null,
          "registeredIn": null,
          "registeredBy": null,
          "loading": null,
          "availableAt": null,
          "role": "unresolved",
          "methods": [],
          "hasStop": false,
          "delegatesStop": false,
          "reads": 6,
          "firstRead": 7160,
          "firstReadEvaluation": "deferred",
          "parseTimeReads": [],
          "uncertainReads": [],
          "calls": [
            "isSpeaking",
            "speak",
            "stop"
          ],
          "callSites": [
            {
              "line": 7181,
              "method": "speak",
              "via": "alias",
              "evaluation": "deferred"
            },
            {
              "line": 7186,
              "method": "stop",
              "via": "alias",
              "evaluation": "deferred"
            },
            {
              "line": 7191,
              "method": "isSpeaking",
              "via": "alias",
              "evaluation": "deferred"
            }
          ]
        },
        {
          "global": "Amenti.listen",
          "registered": null,
          "registeredIn": null,
          "registeredBy": null,
          "loading": null,
          "availableAt": null,
          "role": "unresolved",
          "methods": [],
          "hasStop": false,
          "delegatesStop": false,
          "reads": 5,
          "firstRead": 7526,
          "firstReadEvaluation": "deferred",
          "parseTimeReads": [],
          "uncertainReads": [],
          "calls": [
            "cancel"
          ],
          "callSites": [
            {
              "line": 7592,
              "method": "cancel",
              "via": "direct",
              "evaluation": "deferred"
            }
          ]
        }
      ],
      "chunking": null,
      "styles": [
        {
          "key": "VOICE_STYLE",
          "line": 2917,
          "value": "Read slowly and clearly, in a measured, formal, dignified tone"
        },
        {
          "key": "VOICE_NAME",
          "line": 2918,
          "value": "Kore"
        },
        {
          "key": "VOICE",
          "line": 6608,
          "value": "+c.voice):"
        },
        {
          "key": "VOICE_STYLE",
          "line": 7856,
          "value": "Read this aloud in a clear, engaging, journalistic voice"
        },
        {
          "key": "VOICE_NAME",
          "line": 7857,
          "value": "Kore"
        }
      ],
      "callSites": {
        "total": 19,
        "attributed": 19,
        "unattributed": []
      },
      "synthesis": [],
      "parseHazards": [],
      "speakEndpointsDeclared": [
        "VOICE_WORKER"
      ],
      "speakPosts": [],
      "strips": [
        {
          "line": 2580,
          "pattern": "/[&<>\"]/g"
        },
        {
          "line": 2920,
          "pattern": "/[&<>\"]/g"
        },
        {
          "line": 2922,
          "pattern": "/^#+\\s*/gm"
        },
        {
          "line": 2922,
          "pattern": "/\\*\\*([^*]+)\\*\\*/g"
        },
        {
          "line": 2922,
          "pattern": "/__([^_]+)__/g"
        },
        {
          "line": 2923,
          "pattern": "/\\*([^*]+)\\*/g"
        },
        {
          "line": 2923,
          "pattern": "/_([^_]+)_/g"
        },
        {
          "line": 2923,
          "pattern": "/^\\s*[-*]\\s+/gm"
        },
        {
          "line": 2923,
          "pattern": "/\\s+/g"
        },
        {
          "line": 2925,
          "pattern": "/[*_#>`\\[\\]]/g"
        },
        {
          "line": 2925,
          "pattern": "/\\s+/g"
        },
        {
          "line": 2942,
          "pattern": "/\\*\\*([^*]+)\\*\\*/g"
        },
        {
          "line": 2942,
          "pattern": "/__([^_]+)__/g"
        },
        {
          "line": 2943,
          "pattern": "/\\*([^*]+)\\*/g"
        },
        {
          "line": 2943,
          "pattern": "/(^|\\s)_([^_]+)_/g"
        },
        {
          "line": 2944,
          "pattern": "/`([^`]+)`/g"
        },
        {
          "line": 2946,
          "pattern": "/\\[([^\\]]+)\\]\\((https?:\\/\\/[^\\s)]+)\\)/g"
        },
        {
          "line": 2949,
          "pattern": "/\\r\\n?/g"
        },
        {
          "line": 2951,
          "pattern": "/\\n+$/"
        },
        {
          "line": 2963,
          "pattern": "/^>\\s?/"
        },
        {
          "line": 2971,
          "pattern": "/^\\s*[-*+]\\s+/"
        },
        {
          "line": 2975,
          "pattern": "/^\\s*\\d+[.)]\\s+/"
        },
        {
          "line": 2978,
          "pattern": "/\\n/g"
        },
        {
          "line": 3012,
          "pattern": "/\\b\\w/g"
        }
      ]
    },
    {
      "file": "Page2.html",
      "bytes": 1500265,
      "lines": 17386,
      "sha256": "e28377dd4617b299",
      "scripts": [
        {
          "src": "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
          "line": 9,
          "loading": "blocking",
          "remote": true
        },
        {
          "src": "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js",
          "line": 10,
          "loading": "blocking",
          "remote": true
        },
        {
          "src": "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js",
          "line": 11,
          "loading": "blocking",
          "remote": true
        },
        {
          "src": "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js",
          "line": 12,
          "loading": "blocking",
          "remote": true
        },
        {
          "src": "https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js",
          "line": 13,
          "loading": "blocking",
          "remote": true
        },
        {
          "src": "https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js",
          "line": 14,
          "loading": "blocking",
          "remote": true
        },
        {
          "src": "https://cdn.tailwindcss.com",
          "line": 15,
          "loading": "blocking",
          "remote": true
        },
        {
          "src": "config.js",
          "line": 22,
          "loading": "blocking",
          "remote": false
        }
      ],
      "inlineBlocks": 4,
      "engines": [
        {
          "global": "Sovereign.Atlantica",
          "registered": 15402,
          "registeredIn": "Page2.html",
          "registeredBy": "inline",
          "loading": "inline",
          "availableAt": 15402,
          "role": "facade",
          "methods": [
            "speak"
          ],
          "hasStop": false,
          "delegatesStop": true,
          "reads": 14,
          "firstRead": 15364,
          "firstReadEvaluation": "deferred",
          "parseTimeReads": [
            15585,
            15597
          ],
          "uncertainReads": [],
          "calls": [
            "speak"
          ],
          "callSites": [
            {
              "line": 15548,
              "method": "speak",
              "via": "markup",
              "evaluation": "deferred"
            }
          ]
        },
        {
          "global": "Sovereign.Voice",
          "registered": 16768,
          "registeredIn": "Page2.html",
          "registeredBy": "inline",
          "loading": "inline",
          "availableAt": 16768,
          "role": "engine",
          "methods": [
            "speak",
            "toggle",
            "composeFor"
          ],
          "hasStop": false,
          "delegatesStop": false,
          "reads": 2,
          "firstRead": 9286,
          "firstReadEvaluation": "deferred",
          "parseTimeReads": [
            16833
          ],
          "uncertainReads": [],
          "calls": [
            "speak",
            "toggle"
          ],
          "callSites": [
            {
              "line": 9286,
              "method": "speak",
              "via": "direct",
              "evaluation": "deferred"
            },
            {
              "line": 16821,
              "method": "speak",
              "via": "this",
              "evaluation": "deferred"
            },
            {
              "line": 16833,
              "method": "toggle",
              "via": "direct",
              "evaluation": "parse-time"
            }
          ]
        },
        {
          "global": "AmentiAudio",
          "registered": 17210,
          "registeredIn": "Page2.html",
          "registeredBy": "inline",
          "loading": "inline",
          "availableAt": 17210,
          "role": "engine",
          "methods": [
            "play",
            "stop",
            "isPlaying",
            "isBusy"
          ],
          "hasStop": true,
          "delegatesStop": false,
          "reads": 9,
          "firstRead": 15481,
          "firstReadEvaluation": "deferred",
          "parseTimeReads": [],
          "uncertainReads": [],
          "calls": [
            "isBusy",
            "play",
            "stop"
          ],
          "callSites": [
            {
              "line": 15481,
              "method": "stop",
              "via": "direct",
              "evaluation": "deferred"
            },
            {
              "line": 15559,
              "method": "isBusy",
              "via": "direct",
              "evaluation": "deferred"
            },
            {
              "line": 15559,
              "method": "stop",
              "via": "direct",
              "evaluation": "deferred"
            },
            {
              "line": 15575,
              "method": "play",
              "via": "direct",
              "evaluation": "deferred"
            },
            {
              "line": 16799,
              "method": "play",
              "via": "direct",
              "evaluation": "deferred"
            }
          ]
        }
      ],
      "chunking": {
        "TARGET_CHARS": {
          "value": 700,
          "line": 16914
        },
        "MAX_CHARS": {
          "value": 1100,
          "line": 16915
        },
        "LOOKAHEAD": {
          "value": 3,
          "line": 16916
        },
        "STREAM_THRESHOLD": {
          "value": 700,
          "line": 16793
        }
      },
      "styles": [
        {
          "key": "VOICE_STYLE",
          "line": 15407,
          "value": "Read slowly and clearly, in a measured, formal, dignified tone"
        },
        {
          "key": "VOICE_NAME",
          "line": 15408,
          "value": "Kore"
        },
        {
          "key": "STYLE",
          "line": 16770,
          "value": "Say the following in a clear, natural, conversational voice"
        },
        {
          "key": "VOICE",
          "line": 16771,
          "value": "Kore"
        }
      ],
      "callSites": {
        "total": 11,
        "attributed": 9,
        "unattributed": [
          {
            "line": 16811,
            "method": "play",
            "receiver": "this.current",
            "via": "direct",
            "evaluation": "deferred"
          },
          {
            "line": 17153,
            "method": "play",
            "receiver": "el",
            "via": "direct",
            "evaluation": "deferred"
          }
        ]
      },
      "synthesis": [
        {
          "line": 16802,
          "kind": "posts to /speak",
          "owner": "Sovereign.Voice",
          "attribution": "in body"
        },
        {
          "line": 16810,
          "kind": "builds Audio",
          "owner": "Sovereign.Voice",
          "attribution": "in body"
        },
        {
          "line": 17037,
          "kind": "posts to /speak",
          "owner": "AmentiAudio",
          "attribution": "same script block"
        },
        {
          "line": 17136,
          "kind": "builds Audio",
          "owner": "AmentiAudio",
          "attribution": "same script block"
        }
      ],
      "parseHazards": [],
      "speakEndpointsDeclared": [
        "WORKER"
      ],
      "speakPosts": [
        {
          "line": 16805,
          "keys": [
            "text",
            "style",
            "voice"
          ]
        },
        {
          "line": 17040,
          "keys": [
            "text",
            "style",
            "voice"
          ]
        }
      ],
      "strips": [
        {
          "line": 6455,
          "pattern": "/&/g"
        },
        {
          "line": 6455,
          "pattern": "/</g"
        },
        {
          "line": 6455,
          "pattern": "/>/g"
        },
        {
          "line": 6456,
          "pattern": "/\"/g"
        },
        {
          "line": 6456,
          "pattern": "/'/g"
        },
        {
          "line": 6603,
          "pattern": "/^https?:\\/\\//"
        },
        {
          "line": 6955,
          "pattern": "/[^A-Za-z]/g"
        },
        {
          "line": 8297,
          "pattern": "/\\r\\n/g"
        },
        {
          "line": 8433,
          "pattern": "/^```(?:json)?\\s*/i"
        },
        {
          "line": 8433,
          "pattern": "/\\s*```$/i"
        },
        {
          "line": 9660,
          "pattern": "/^```(?:json)?\\s*/i"
        },
        {
          "line": 9660,
          "pattern": "/\\s*```$/i"
        },
        {
          "line": 11345,
          "pattern": "/<(h2|h3)>([^<]+)<\\/\\1>/g"
        },
        {
          "line": 11346,
          "pattern": "/[^a-z0-9]+/g"
        },
        {
          "line": 11346,
          "pattern": "/^-+|-+$/g"
        },
        {
          "line": 14209,
          "pattern": "/^#/"
        },
        {
          "line": 14216,
          "pattern": "/\\+/g"
        },
        {
          "line": 14243,
          "pattern": "/^#/"
        },
        {
          "line": 14345,
          "pattern": "/[&<>\"']/g"
        },
        {
          "line": 14352,
          "pattern": "/'/g"
        },
        {
          "line": 14353,
          "pattern": "/'/g"
        },
        {
          "line": 15093,
          "pattern": "/\\s+/g"
        },
        {
          "line": 15424,
          "pattern": "/\\b\\w/g"
        },
        {
          "line": 15557,
          "pattern": "/^#+\\s*/gm"
        }
      ]
    }
  ],
  "files": {
    "read": [],
    "unread": [
      {
        "src": "amenti-core.bundle.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 893,
            "loading": "blocking"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "amenti-svg-library.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 5605,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "amenti-doctrine.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 5937,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "library.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 7104,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "amenti-canonical.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 7115,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "amenti-auth.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 8004,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "amenti-quiz.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 8011,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "amenti-roster.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 8012,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "amenti-roster-view.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 8013,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "amenti-bay.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 8014,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "amenti-motion.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 8015,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "amenti-art-2.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 8016,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "amenti-leaderboard.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 8017,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "amenti-readaloud.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 8018,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "amenti-vallhalla-signup.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 8021,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "amenti-flourish.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 8022,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "amenti-mascot.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 8023,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "amenti-profile.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 8024,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "amenti-art-photo.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 8032,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "amenti-art-3.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 8046,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "amenti-dispatch-art.js",
        "requestedBy": [
          {
            "surface": "Page1.html",
            "line": 8480,
            "loading": "defer"
          }
        ],
        "reason": "not on disk at probe time"
      },
      {
        "src": "config.js",
        "requestedBy": [
          {
            "surface": "Page2.html",
            "line": 22,
            "loading": "blocking"
          }
        ],
        "reason": "not on disk at probe time"
      }
    ]
  },
  "unread": [
    {
      "src": "amenti-core.bundle.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 893,
          "loading": "blocking"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "amenti-svg-library.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 5605,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "amenti-doctrine.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 5937,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "library.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 7104,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "amenti-canonical.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 7115,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "amenti-auth.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 8004,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "amenti-quiz.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 8011,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "amenti-roster.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 8012,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "amenti-roster-view.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 8013,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "amenti-bay.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 8014,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "amenti-motion.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 8015,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "amenti-art-2.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 8016,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "amenti-leaderboard.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 8017,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "amenti-readaloud.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 8018,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "amenti-vallhalla-signup.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 8021,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "amenti-flourish.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 8022,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "amenti-mascot.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 8023,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "amenti-profile.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 8024,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "amenti-art-photo.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 8032,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "amenti-art-3.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 8046,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "amenti-dispatch-art.js",
      "requestedBy": [
        {
          "surface": "Page1.html",
          "line": 8480,
          "loading": "defer"
        }
      ],
      "reason": "not on disk at probe time"
    },
    {
      "src": "config.js",
      "requestedBy": [
        {
          "surface": "Page2.html",
          "line": 22,
          "loading": "blocking"
        }
      ],
      "reason": "not on disk at probe time"
    }
  ],
  "cacheKey": {
    "composition": "sha256(TTS_MODEL + voice + STYLE + TEXT)",
    "composedIn": "proxy worker.js — PRIVATE, NOT READ BY THIS PROBE",
    "readFromSource": false,
    "note": "The inputs below are what each surface SENDS. Whether the Worker hashes them in this order is not readable from here and is not claimed.",
    "posts": [
      {
        "surface": "Page1.html",
        "sites": []
      },
      {
        "surface": "Page2.html",
        "sites": [
          {
            "line": 16805,
            "keys": [
              "text",
              "style",
              "voice"
            ]
          },
          {
            "line": 17040,
            "keys": [
              "text",
              "style",
              "voice"
            ]
          }
        ]
      }
    ],
    "chunking": [
      {
        "surface": "Page1.html",
        "constants": null
      },
      {
        "surface": "Page2.html",
        "constants": {
          "TARGET_CHARS": {
            "value": 700,
            "line": 16914
          },
          "MAX_CHARS": {
            "value": 1100,
            "line": 16915
          },
          "LOOKAHEAD": {
            "value": 3,
            "line": 16916
          },
          "STREAM_THRESHOLD": {
            "value": 700,
            "line": 16793
          }
        }
      }
    ]
  },
  "notMeasured": [
    "whether any path produces sound — source order proves a global exists when asked for, nothing more",
    "archive health — that is the ARCHIVE WATCH, six wires, every six hours",
    "the Worker cache key composition — the Worker cannot be read, so it is asked, elsewhere",
    "intent, doctrine, register choice — those are authored and live in the briefs"
  ],
  "accepted": [],
  "findings": [
    {
      "id": "unresolved",
      "severity": "finding",
      "surface": "Page1.html",
      "global": "Amenti.throttle",
      "detail": "called 10x, first at line 3001; no registration found on any surface or readable file. It is registered somewhere the probe cannot see, or it is not registered at all.",
      "test": "reads with no registration"
    },
    {
      "id": "unresolved",
      "severity": "finding",
      "surface": "Page1.html",
      "global": "Amenti.voice",
      "detail": "called 3x, first at line 7590; no registration found on any surface or readable file. It is registered somewhere the probe cannot see, or it is not registered at all.",
      "test": "reads with no registration"
    },
    {
      "id": "unresolved",
      "severity": "finding",
      "surface": "Page1.html",
      "global": "Amenti.chat",
      "detail": "called 2x, first at line 6096; no registration found on any surface or readable file. It is registered somewhere the probe cannot see, or it is not registered at all.",
      "test": "reads with no registration"
    },
    {
      "id": "unresolved",
      "severity": "finding",
      "surface": "Page1.html",
      "global": "Amenti.conversation",
      "detail": "called 6x, first at line 7160; no registration found on any surface or readable file. It is registered somewhere the probe cannot see, or it is not registered at all.",
      "test": "reads with no registration"
    },
    {
      "id": "unresolved",
      "severity": "finding",
      "surface": "Page1.html",
      "global": "Amenti.listen",
      "detail": "called 5x, first at line 7526; no registration found on any surface or readable file. It is registered somewhere the probe cannot see, or it is not registered at all.",
      "test": "reads with no registration"
    },
    {
      "id": "load-order-clear",
      "severity": "confirmed",
      "surface": "Page2.html",
      "global": "Sovereign.Atlantica",
      "detail": "read at PARSE TIME on line 15585; available from line 15402 (Page2.html, inline). 183 lines of margin.",
      "test": "first parse-time read >= availability line"
    },
    {
      "id": "load-order-clear",
      "severity": "confirmed",
      "surface": "Page2.html",
      "global": "Sovereign.Voice",
      "detail": "read at PARSE TIME on line 16833; available from line 16768 (Page2.html, inline). 65 lines of margin.",
      "test": "first parse-time read >= availability line"
    },
    {
      "id": "no-brake",
      "severity": "finding",
      "surface": "Page2.html",
      "global": "Sovereign.Voice",
      "detail": "defines speak() and no stop(). A mouth with no brake orphans an in-flight /speak fetch.",
      "test": "speak without stop"
    },
    {
      "id": "vestigial",
      "severity": "finding",
      "surface": "Page1.html",
      "detail": "declares a /speak endpoint (VOICE_WORKER) and contains no synthesis site — no fetch to /speak, no Audio built. Tackle left on deck after the engine was moved out. Reads as live infrastructure to anyone who greps.",
      "test": "endpoint literal declared, zero synthesis sites on the surface"
    },
    {
      "id": "divergence",
      "severity": "finding",
      "surface": "Page1.html vs Page2.html",
      "detail": "synthesis engines defined inline on one surface and not the other — Page1.html: [none]; Page2.html: [Sovereign.Voice, AmentiAudio]. An engine composes its own style and cuts its own chunks, and chunk boundaries ARE the cache namespace.",
      "test": "inline engines (post to /speak or build Audio), set difference across surfaces"
    },
    {
      "id": "unread",
      "severity": "blocking",
      "detail": "22 referenced file(s) could not be opened: amenti-core.bundle.js, amenti-svg-library.js, amenti-doctrine.js, library.js, amenti-canonical.js, amenti-auth.js, amenti-quiz.js, amenti-roster.js, amenti-roster-view.js, amenti-bay.js, amenti-motion.js, amenti-art-2.js, amenti-leaderboard.js, amenti-readaloud.js, amenti-vallhalla-signup.js, amenti-flourish.js, amenti-mascot.js, amenti-profile.js, amenti-art-photo.js, amenti-art-3.js, amenti-dispatch-art.js, config.js. No verdict above covers them.",
      "test": "existsSync on every local <script src>"
    }
  ],
  "counts": {
    "surfaces": 2,
    "engines": 10,
    "filesRead": 0,
    "filesUnread": 22,
    "faults": 0,
    "confirmed": 2,
    "unproven": 0,
    "findings": 8,
    "blocking": 1,
    "accepted": 0
  }
}
