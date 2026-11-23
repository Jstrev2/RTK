# Runner Toolkit: how guides are written

Jon, November 23, 2026: "All the written materials look like they were
written by AI. So many em dashes all over the place." "It's just endless
reading." "The purpose of the site is to make things easier for the user. Not
harder with insane amount of reading."

So a guide is a quick answer with the numbers behind it, not an essay. A
reader should get what they came for in the first ten seconds and be able to
stop there.

`scripts/rundown/check-guides.mjs` enforces every rule marked **(checked)**
on every guide, old and new. There are no exemptions. If a guide fails, rewrite
the guide; never loosen the check.

## The shape of a guide

1. **The Short answer comes first (checked).** The body opens with one
   paragraph that starts `**Short answer:**` and gives the answer in one or two
   sentences, 50 words at most. The page shows it as a callout under the title.
   It is the answer, with the number if there is one: "Two gels for most half
   marathons: one at 40 minutes, one at 70." Not a teaser.
2. **350 to 900 words (checked).** Most guides land between 450 and 700. If a
   topic needs more, it is two topics.
3. **Short sections whose headings are the answers (checked).** At least three
   `##` sections, none over 230 words. A heading states the point ("A 4:00
   marathon takes 8 gels"), never a label ("Overview", "Why it matters") and
   never a question. Someone who reads only the headings should come away with
   the advice.
4. **Lists where a list helps (checked: at least one).** Options, steps,
   finish-time tables and "who it's wrong for" lines go in `- ` lists. Prose
   is for reasons.
5. **Short paragraphs and sentences (checked).** Four sentences and 90 words
   per paragraph at most; no sentence over 35 words.
6. **Stop when the advice stops (checked).** No closing summary, no "In
   short", no "Ultimately". The last line is the last useful thing: a next
   step, a link, or the one caveat that matters.

## The voice

Dry, specific, plain. Write like a reference card from someone who checked
the numbers, not like a friend trying to be likable.

- **Numbers from our data, stated as facts.** Prices, weights, stack, drop
  and release dates come from `data/shoe-models-authored.json`; gel carbs,
  caffeine and sodium from `data/fuel-gels-live.json`. "The Winflo 12 is $110
  and 9.7 oz." No "around" or "about" on a number we have exactly.
- **Research named, with its limits in one clause.** "A 2014 trial of 927
  beginners found pronation did not raise injury risk (one study, everyone in
  one shoe)." Never invent a study, a percentage or a minute count. If you
  can't name the source, leave the number out.
- **One recommendation, and who it's wrong for.** Pick a default. Then say in
  one line who should ignore it. Long lists of options are what the shoe
  finder and the data pages are for.
- **No narrator (checked).** No "I", "me", "my". No invented experience: an AI
  writing "I've bonked at mile 22" is making up a life. "We" means Runner
  Toolkit only, for our data and tools ("our gel table lists 48 gels").
- **No personality performance.** No jokes for their own sake, no pep talk,
  no "you've got this", no scolding. Friendly means clear.
- **Contractions are fine.** "You'll", "don't", "it's".
- **Medical limits.** Guides cover gear, fueling, music and training. They
  don't diagnose or treat pain or injury; when pain comes up, the line is "see
  a doctor or physical therapist", once, and the guide moves on.

## Punctuation (checked)

- **No em dashes (—) and no en dashes (–).** Not in titles, excerpts or
  bodies. Ranges are written "3 to 5" or "30-60g" with a plain hyphen inside
  the number. A hyphen used as a dash (" - ") also fails. Where a dash wants to
  go, use a period, a comma, a colon or parentheses.
- **No exclamation marks.**
- **No questions in the body.** Answer instead of asking. A quoted search
  ("how many gels for a marathon") is fine. Titles may be the question people
  search for; headings may not.
- **Bold labels ("**Default pick:** ...") twice per guide at most,** besides
  the Short answer.

## Banned: AI tells and filler (checked)

If a draft contains any of these, it isn't done. The full list lives in
`BANNED`, `BANNED_STEMS` and `PATTERNS` in the check script; these are the
families.

- **Throat-clearing and signposts:** "here's the thing / deal / catch / how /
  where / what / why", "here are the", "the short version", "the bottom line",
  "that said", "the truth is", "the reality is", "the honest answer", "the key
  is", "the catch is", "the good news", "pro tip", "fun fact", "spoiler",
  "let's", "honestly", "to be honest", "in a nutshell", "at the end of the
  day", "simply put", "in other words", "think of it as", "believe it or not",
  "needless to say", "when it comes to", "first and foremost".
- **Opinion openers:** "my position", "my take", "my answer", "my advice".
- **Summaries:** "in conclusion", "in summary", "to sum up", "all in all",
  "ultimately", "in the end", "at its core", "the beauty of". No conclusion
  section under any name.
- **Hype verbs and nouns:** "game-changer", "unlock", "unleash", "elevate",
  "level up", "next level", "supercharge", "empower", "navigate", "journey",
  "delve", "dive into", "deep dive", "dial in", "sweet spot", "secret sauce",
  "no-brainer", "must-have", "hack", "embark", "look no further", "testament",
  "realm", "landscape", "myriad", "plethora", "foster", "leverage", "harness",
  "holistic", "in today's", "the world of running", "trust the process",
  "you've got this", "happy running".
- **Inflated words:** "crucial", "essential", "robust", "seamless", "vital",
  "pivotal", "paramount", "comprehensive", "straightforward", "nuanced",
  "incredibly", "absolutely", "definitely", "genuinely", "truly", "really",
  "actually", "basically", "literally", "obviously", "clearly", "of course",
  "amazing", "stunning", "exciting".
- **Hedges and joiners:** "it's important to note", "it's worth noting",
  "keep in mind", "bear in mind", "whether you're" (any whether-you're
  construction), "moreover", "furthermore", "additionally", "notably",
  "importantly", "interestingly", "strike a balance", "may potentially".
- **Framings:** "it's not X, it's Y", "X isn't Y. It's Z", "not just X, but
  Y", "less about X and more about Y", "the answer is simple".
- **Rhetorical-question transitions:** "So what does this mean for your
  training?" (and any question in the body).
- **Triplet adjective stacks:** "light, responsive, and versatile".

## Format the renderer supports

- Paragraphs, `##` and `###` headings, `- ` lists, `[text](url)` links,
  `**bold**`. No tables, no numbered lists, no images, no `#` (the title is
  the h1).
- **Links (checked): 3 to 8 internal links,** each to a page that exists
  (`content/site-paths.txt`, a shoe in the data file, or another guide), on a
  descriptive anchor inside a sentence: "the [GT-1000
  15](/shoes/asics-gt-1000-15) is $100". Never "click here". External links
  must be https.

## Frontmatter

```
---
slug: how-many-gels-for-a-marathon        (matches the file name)
title: How Many Gels for a Marathon? ...   (15-95 characters; contains the search)
excerpt: ...                               (40-240 characters, two sentences at most, no question)
tags: fueling, race-day                    (shoes, gear, music, fueling, training, race-day, beginners, nutrition)
author: Runner Toolkit
published_at: 2026-11-23T17:14:00Z
---
```

The extra tag `news` keeps a dated news piece off the guide index; it still
needs one topic tag.

## Before and after

Before (fails the check):

> The honest answer to "how many gels" is a number of grams, not a number of
> gels. Gels differ, so the useful math starts with carbs per hour and works
> backward to the packet count. ... By the time you feel flat at mile 20,
> you've waited too long, and I've done exactly that.

After:

> **Short answer:** Plan on 60 grams of carbs an hour from 30 minutes in.
> With 25-gram gels that's 7 gels for a 3:30 marathon, 8 for 4:00 and 11 for
> 5:00.

## The last pass

Read the draft top to bottom as a runner who wants the answer and has a run
to get to. Cut every sentence that doesn't change what they'll do. Then run
`node scripts/rundown/check-guides.mjs --write`.
