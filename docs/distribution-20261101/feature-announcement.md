# Longer quiz and difficulty release announcement

Status: release-gated draft. Current public GitHub Main uses buildDeterministicQuiz(pool,5,quizMode), with no difficulty selector. A fresh Base44 Main export now contains5/10/20question controls andEasy/Standard/Hard levels. Those changes are only in the private builder source, with public deployment and learner-journey verification still pending; nothing has been announced. Marketing work does not take over the separate site-fix task.

## Release gate

Before describing these as available, verify the merged canonical source and actual public /study/ version offer a session longer than5questions and meaningful difficulty choices. Exercise every offered difficulty, complete a longer session, check honest question totals and score/save/reload behavior, and confirm focused element/deck/comparison questions stay scoped. Difficulty must change the question work, not just the label. Check desktop and phone-sized views. Record the source revision, deployed assets, actual lengths and actual level labels. No tutor/native-app or learning-outcome claim.

## X draft after the gate passes

Elementa now has longer chemistry quizzes and difficulty choices. Choose [verified lengths, expected5/10/20] questions and [verified level names, expectedEasy/Standard/Hard], then practise element properties and electron configurations at your pace. Free, no signup.

https://elementalearn.com/study/#/practice

Replace every bracketed field with the public controls that actually passed. Build the tracked URL with UTM parameters BEFORE #/practice, so routing remains correct. Recheck standard X length. Show Michael the final text/account for the public-post approval required by AGENTS.md; don't reuse approval of an earlier availability post.

## Community follow-up

Reply only where a previous authorized post and that community's current update rules allow it. A useful update explains the tested change and asks a specific question about quiz difficulty; don't make a new launch post everywhere. Don't announce in r/chemistry without moderator approval or violate a weekly/monthly promotion thread. Teacher outreach remains individual and authorized.

## Monitor

A quiet daily follow-up will check public Main for this specific release. It must stay silent while the features aren't shipped, avoid editing/building/publishing, and notify Michael once the verified release and final announcement are ready for approval. No recurring directory submissions, blind retries or unsupervised social posts.

## Builder checkpoint

Read-only export main-quiz-update.zip has128paths and new questionCount/difficulty state in Practice.jsx; current source defines5/10/20lengths andEasy/Standard/Hard options. It also renames the private preview toElementaLearn and changes its footer to2026. The latter conflicts with the standing2025SmolkApps credit. Existing deployedMain remains unchanged. Source is backed up privately; no newbuilderprompt, codeimport, merge or deployment was done by this marketing task. The actual source/deployment owner must resolve the copyright conflict and verify the public release.
