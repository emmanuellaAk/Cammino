def resume_analysis_prompt(resume_text: str) -> str:
    return f"""You are a resume reviewer for a job-search platform. Analyse the resume below.

Return:
- skills: a flat list of concrete technical/professional skills actually evidenced in the text (not generic soft skills)
- experience_years: total years of professional experience, your best estimate as a whole number (0 if entry-level/unclear)
- education: the highest degree and field of study found, as a short string (empty string if none found)
- strengths: 3-5 specific, concrete strengths of this resume as a candidate document
- summary: a 2-3 sentence honest assessment of the resume's overall quality and positioning

Be specific — reference what's actually in the text, don't write generic filler.

RESUME:
\"\"\"
{resume_text}
\"\"\"
"""


def job_match_prompt(resume_text: str, job_title: str, company: str, location: str | None, job_description: str | None) -> str:
    jd = job_description.strip() if job_description else "(no job description provided — infer typical requirements from the title)"
    loc = f" ({location})" if location else ""
    return f"""You are scoring how well a candidate's resume fits a specific job opening.

JOB: {job_title} at {company}{loc}
JOB DESCRIPTION:
\"\"\"
{jd}
\"\"\"

CANDIDATE RESUME:
\"\"\"
{resume_text}
\"\"\"

Return:
- match_score: 0-100, how well this resume fits this specific role
- matching_skills: skills/experience from the resume that align with this job
- missing_skills: skills/requirements the job likely needs that the resume doesn't show
- recommendations: 2-4 concrete, specific actions the candidate could take to improve their fit for THIS job
- summary: a 2-3 sentence honest assessment of the fit

Be specific to this resume and this job — don't write generic advice.
"""


RESUME_MDX_SYNTAX_GUIDE = """The resume is written in MDX — Markdown mixed with these specific custom components. Use ONLY these components, exactly as shown (self-closing where shown, JSX attribute syntax). ALWAYS use single quotes (') for attribute values and array strings, NEVER double quotes (") — this document gets embedded inside JSON, and single quotes need no escaping there:

- <ResumeHeader name='...' title='...' email='...' phone='...' location='...' />  — one per document, at the top
- Standard markdown "## Heading" for section titles (e.g. "## Summary", "## Experience", "## Education", "## Skills", or custom ones like "## Projects")
- Plain markdown paragraphs and "- bullet" lists for prose and achievement bullets
- <Job title='...' company='...' dates='...'>bullet list of achievements</Job> — one per role, inside the Experience section
- <EduItem degree='...' school='...' dates='...' /> — one per qualification, inside the Education section
- <SkillList items={['Skill one', 'Skill two']} /> — one per skills section, a JS array literal of single-quoted strings

Never invent other components. Never change this syntax's structure (attribute names, single-quoting, the items={[...]} array syntax). Never use double quotes anywhere in the document."""


def resume_edit_prompt(mdx_content: str, instruction: str, chat_history: list) -> str:
    history_block = ""
    if chat_history:
        lines = [f"{h.role.upper()}: {h.content}" for h in chat_history]
        history_block = "PRIOR CONVERSATION (for context — the user may refer back to it):\n" + "\n".join(lines) + "\n\n"

    return f"""You are a resume-writing assistant embedded in a resume editor. The user is editing
their resume through chat. You edit the document directly based on their instruction.

{RESUME_MDX_SYNTAX_GUIDE}

CURRENT RESUME (MDX):
\"\"\"
{mdx_content}
\"\"\"

{history_block}USER'S NEW INSTRUCTION: "{instruction}"

Apply the instruction to the resume. Keep everything the user didn't ask to change exactly as it
was, character-for-character — copy those sections over unchanged rather than retyping them from
memory. Do not rewrite unrelated sections, do not reformat things that weren't asked about, do not
drop or shorten any section, job, or bullet the user didn't ask you to remove.

Before finishing, double check every component tag you wrote has BOTH its opening and closing tag
(every <Job ...> has a matching </Job>; nothing is left as an orphaned closing tag with no opener,
and nothing opened is left unclosed).

Return:
- reply: a short (1-2 sentence), conversational confirmation of what you changed — talk to the user, not about the document in the abstract
- updated_mdx_content: the FULL resume document after your edit, valid MDX following the syntax guide above, ready to replace the current content entirely
"""
