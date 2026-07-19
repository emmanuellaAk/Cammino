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
