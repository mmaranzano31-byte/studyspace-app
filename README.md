# Studyspace

A study app that runs in your browser. It includes classes, chapters, file uploads, notes, flashcards, a Test center, and AI features.

## What's inside
- **Classes & chapters.** Pick a custom color and icon for each class, add exam dates, and edit or delete anything.
- **Add material.** Upload PDFs, Word (.docx), PowerPoint (.pptx) files including speaker notes, photos or scanned PDFs (read with OCR), and TXT or Markdown files. The editor supports headings, bold text, lists, highlights, and images. The original files are saved in the chapter's **Files** tab.
- **Chapter tabs.**
  - **Notes**, with a summary and a print/PDF option
  - **Practice**, which remembers where you left off
  - **Learn**, a Quizlet-style mode
  - **Flashcards**, with spaced repetition
  - **Definitions**, with Quizlet import and export
  - **Questions**, your question bank
  - **Files**
- **Question types.** Multiple choice, true/false, fill in the blank, matching, ordering, free response, discussion, and case study.
- **Test center.**
  - Pick a class, then one chapter, several chapters, or all of them.
  - Choose exam mode or practice mode, the length, a timer, the question types, and the difficulty.
  - Questions can come from your bank, from AI, or a mix of both.
  - You can resume an unfinished test.
  - Results include a breakdown and a printable test with an answer key.
- **Weak spots.** Missed questions are saved here. Answer one correctly twice in a row to clear it.
- **AI features.** Summaries, flashcards, and questions from your notes; AI-written tests; AI grading of written answers; an "Explain this answer" button; a tutor chat; and a study guide generator.
- **Planner and progress.** Exam countdowns, a daily plan, streaks, weekly goals, badges, score history charts, a focus timer, reminders, dark mode, search across everything, and backup and restore.

Everything is saved in your browser on this computer. Use **Settings → Download backup** regularly. You can restore that backup file on any computer.

## Files to upload to GitHub
```
index.html
styles.css
app.js
package.json
pnpm-lock.yaml
vercel.json
README.md
.gitignore
api/generate.mjs
```
Don't upload the `src` folder or `node_modules`. (`src` holds the source pieces that make up `app.js`; it's optional.)

## Update GitHub and Vercel
1. In your `studyspace` GitHub repo, click **Add file → Upload files**. Drag in the top-level files listed above, then click **Commit changes**. Files with the same name are replaced.
2. Open the `api` folder in the repo, click **Add file → Upload files**, upload the new `generate.mjs`, and commit.
3. Vercel redeploys automatically within about a minute. Check your project's **Deployments** tab.

## Set up AI for free
In Vercel, open your project, then go to **Settings → Environment Variables**. Add these variables, then **redeploy** (Deployments → ⋯ → Redeploy).

| Name | Value | Needed? |
| --- | --- | --- |
| `STUDY_AI_ACCESS_CODE` | a long private phrase you make up | Required |
| `GEMINI_API_KEY` | free key from https://aistudio.google.com/apikey | Recommended (free) |
| `GEMINI_MODEL` | e.g. `gemini-3.5-flash` (default) or `gemini-3.5-flash-lite` | Optional |
| `VERCEL_AI_MODEL` | an AI Gateway model ID (default `openai/gpt-5-mini`) | Optional |

- **Gemini's free tier** has daily limits. On the free tier, Google may use what you send to improve its products.
- **Vercel AI Gateway** includes a monthly free credit for a limited set of models. If AI stops working near the end of the month, the credit has likely run out. It resets monthly, and you're only charged if you choose to buy credits.
- With **Automatic** selected in Settings, the app tries Gemini first and uses the Vercel credit if Gemini fails.

In the app, open **Settings → AI**, enter your access phrase, and click **Test connection**.

## Notes
- AI only works on your Vercel site. It won't work if you open `index.html` directly from your computer.
- Reminders work while Studyspace is open in a browser tab.
- Photos and scanned PDFs are read with OCR in your browser. Check the recognized text before relying on it.
